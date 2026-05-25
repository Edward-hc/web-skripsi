<?php
require_once '../config/db_connect.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    ensureKaryawanCabangColumn($conn);

    $userID = isset($_GET['userID']) ? intval($_GET['userID']) : 0;
    $penjualanID = isset($_GET['penjualanID']) ? intval($_GET['penjualanID']) : 0;
    if (!$userID || !$penjualanID) {
      echo json_encode(["success" => false, "message" => "userID dan penjualanID wajib diisi"]);
      exit();
    }

    $stmt = $conn->prepare("SELECT cabang, status FROM karyawan WHERE userID = ?");
    $stmt->execute([$userID]);
    $karyawan = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$karyawan) {
      echo json_encode(["success" => false, "message" => "Karyawan tidak ditemukan"]);
      exit();
    }
    if (strtolower(trim((string)($karyawan['status'] ?? ''))) === 'tidak aktif') {
      echo json_encode(["success" => false, "message" => "Karyawan tidak aktif"]);
      exit();
    }

    $cabang = $karyawan['cabang'] ?? '';
    if (!$cabang) {
      echo json_encode(["success" => false, "message" => "Cabang karyawan belum diisi. Silakan isi cabang di Manajemen Akun."]);
      exit();
    }

    $stmtInv = $conn->prepare("
      SELECT p.penjualanID, p.namaPembeli, p.metodePembayaran, p.status, p.lokasi, p.transaksiID, t.tanggal AS tanggalPenjualan
      FROM penjualan p
      LEFT JOIN transaksi t ON p.transaksiID = t.transaksiID
      WHERE p.penjualanID = ? AND p.lokasi = ?
    ");
    $stmtInv->execute([$penjualanID, $cabang]);
    $invoice = $stmtInv->fetch(PDO::FETCH_ASSOC);
    if (!$invoice) {
      echo json_encode(["success" => false, "message" => "Penjualan tidak ditemukan untuk cabang ini."]);
      exit();
    }

    $sql = "
      SELECT
        pv.varianID,
        pv.namaVarian,
        p.namaProduk,
        d.jumlah AS purchasedQty,
        COALESCE(SUM(r.jumlah), 0) AS returnedQty
      FROM detail_transaksi d
      JOIN produkvarian pv ON pv.varianID = d.varianID
      LEFT JOIN produk p ON pv.produkID = p.produkID
      LEFT JOIN returpenjualan r ON r.penjualanID = ? AND r.varianID = pv.varianID
      WHERE d.transaksiID = ?
      GROUP BY pv.varianID, pv.namaVarian, p.namaProduk, d.jumlah
      ORDER BY pv.varianID DESC
    ";

    $stmt2 = $conn->prepare($sql);
    $stmt2->execute([$penjualanID, $invoice['transaksiID']]);
    $items = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as &$it) {
      $purchasedQty = intval($it['purchasedQty'] ?? 0);
      $returnedQty = intval($it['returnedQty'] ?? 0);
      $remainingQty = $purchasedQty - $returnedQty;
      if ($remainingQty < 0) {
        $remainingQty = 0;
      }
      $it['remainingQty'] = $remainingQty;
      $it['maxReturnQty'] = $remainingQty;
    }
    unset($it);

    echo json_encode([
      "success" => true,
      "data" => [
        "invoice" => $invoice,
        "items" => $items
      ]
    ]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat item retur penjualan: " . $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
