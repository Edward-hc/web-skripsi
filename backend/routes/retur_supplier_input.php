<?php
require_once '../config/db_connect.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

date_default_timezone_set('Asia/Jakarta');

function ensureKaryawanCabangColumn($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;
    $stmt = $conn->prepare("
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'karyawan' AND COLUMN_NAME = 'cabang'
    ");
    $stmt->execute([$dbName]);
    if ((int)$stmt->fetchColumn() === 0) {
      $conn->exec("ALTER TABLE karyawan ADD COLUMN cabang VARCHAR(50) NULL AFTER status");
    }
  } catch (Exception $e) {
    // ignore
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);

  $userID = isset($data['userID']) ? intval($data['userID']) : 0;
  $pembelianID = isset($data['pembelianID']) ? intval($data['pembelianID']) : 0;
  $tanggalRetur = trim((string)($data['tanggalRetur'] ?? date('Y-m-d')));
  $lokasi = trim((string)($data['lokasi'] ?? ''));
  $keterangan = trim((string)($data['keterangan'] ?? ''));
  $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];

  if (!$userID || !$pembelianID || !$tanggalRetur || count($items) === 0) {
    echo json_encode(["success" => false, "message" => "userID, pembelianID, tanggalRetur, dan items wajib diisi"]);
    exit();
  }

  try {
    ensureKaryawanCabangColumn($conn);

    $stmtK = $conn->prepare("SELECT karyawanID, cabang, status FROM karyawan WHERE userID = ?");
    $stmtK->execute([$userID]);
    $karyawan = $stmtK->fetch(PDO::FETCH_ASSOC);
    if (!$karyawan) {
      throw new Exception("Karyawan tidak ditemukan");
    }
    if (strtolower(trim((string)($karyawan['status'] ?? ''))) === 'tidak aktif') {
      throw new Exception("Karyawan tidak aktif");
    }
    $cabang = $karyawan['cabang'] ?? '';
    if (!$cabang) {
      throw new Exception("Cabang karyawan belum diisi. Silakan isi cabang di Manajemen Akun.");
    }

    // gunakan lokasi cabang karyawan sebagai lokasi retur
    $lokasiRetur = $lokasi ?: $cabang;
    if ($lokasiRetur !== $cabang) {
      // demi keamanan, paksa sesuai cabang karyawan
      $lokasiRetur = $cabang;
    }

    // pastikan pembelian ini milik cabang karyawan
    $stmtInv = $conn->prepare("SELECT pembelianID, transaksiID, lokasi FROM pembelian WHERE pembelianID = ? AND lokasi = ?");
    $stmtInv->execute([$pembelianID, $cabang]);
    $invoice = $stmtInv->fetch(PDO::FETCH_ASSOC);
    if (!$invoice) {
      throw new Exception("Pembelian tidak ditemukan untuk cabang ini");
    }

    // validate semua item dulu sebelum insert
    $validatedItems = [];
    foreach ($items as $it) {
      $varianID = isset($it['varianID']) ? intval($it['varianID']) : 0;
      $qtyRetur = isset($it['qty']) ? intval($it['qty']) : 0;
      if (!$varianID || $qtyRetur <= 0) {
        throw new Exception("Item retur tidak valid");
      }

      // Purchased qty from detail_transaksi
      $stmtPur = $conn->prepare("
        SELECT jumlah
        FROM detail_transaksi
        WHERE transaksiID = ? AND varianID = ?
      ");
      $stmtPur->execute([$invoice['transaksiID'], $varianID]);
      $purchasedQty = intval($stmtPur->fetchColumn() ?? 0);

      // Returned qty from retursupplier
      $stmtRet = $conn->prepare("
        SELECT COALESCE(SUM(jumlah), 0)
        FROM retursupplier
        WHERE pembelianID = ? AND varianID = ?
      ");
      $stmtRet->execute([$pembelianID, $varianID]);
      $returnedQty = intval($stmtRet->fetchColumn() ?? 0);

      $remainingQty = $purchasedQty - $returnedQty;
      if ($remainingQty < 0) $remainingQty = 0;
      if ($qtyRetur > $remainingQty) {
        throw new Exception("Qty retur melebihi sisa retur untuk varianID $varianID");
      }

      // Stock qty validation
      $stmtSt = $conn->prepare("SELECT stokID, jumlah FROM stok WHERE varianID = ? AND lokasi = ?");
      $stmtSt->execute([$varianID, $lokasiRetur]);
      $stok = $stmtSt->fetch(PDO::FETCH_ASSOC);
      $stokQty = $stok ? intval($stok['jumlah']) : 0;
      if ($stokQty < $qtyRetur) {
        throw new Exception("Stok tidak cukup untuk varianID $varianID di cabang ini");
      }

      $validatedItems[] = [
        "varianID" => $varianID,
        "qtyRetur" => $qtyRetur
      ];
    }

    $conn->beginTransaction();

    foreach ($validatedItems as $v) {
      // update stok: kurangi karena barang keluar dari cabang
      $stmtUp = $conn->prepare("UPDATE stok SET jumlah = jumlah - ?, tanggalUpdate = ? WHERE varianID = ? AND lokasi = ?");
      $stmtUp->execute([
        $v['qtyRetur'],
        date('Y-m-d H:i:s'),
        $v['varianID'],
        $lokasiRetur
      ]);

      // insert retur record
      $stmtIns = $conn->prepare("
        INSERT INTO retursupplier (jumlah, keterangan, tanggalRetur, lokasi, pembelianID, varianID)
        VALUES (?, ?, ?, ?, ?, ?)
      ");
      $stmtIns->execute([
        $v['qtyRetur'],
        $keterangan ?: null,
        $tanggalRetur,
        $lokasiRetur,
        $pembelianID,
        $v['varianID']
      ]);
    }

    $conn->commit();

    echo json_encode(["success" => true, "message" => "Retur supplier berhasil disimpan"]);
  } catch (Exception $e) {
    if ($conn->inTransaction()) {
      $conn->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Gagal menyimpan retur supplier: " . $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
?>

