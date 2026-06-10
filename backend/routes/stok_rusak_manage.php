<?php
/**
 * Stok rusak: GET = riwayat buang, POST action=dispose|restore
 */
require_once '../config/db_connect.php';
require_once '../utils/stok_rusak_db.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

date_default_timezone_set('Asia/Jakarta');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    ensureStokRusakBuangSchema($conn);
    $userID = intval($_GET['userID'] ?? 0);
    requireOwnerForRusakManage($conn, $userID);
    $sql = "SELECT b.buangRusakID, b.stokID, b.varianID, b.lokasi, b.jumlah, b.keterangan, b.tanggalBuang,
      IF(pv.namaVarian IS NULL OR pv.namaVarian='', CONCAT('Varian ID: ', b.varianID),
        CONCAT(pv.namaVarian, IFNULL(CONCAT(' (', p.namaProduk, ')'), ''))) AS namaVarian,
      COALESCE(NULLIF(TRIM(CONCAT(u.fname,' ',u.lname)),''), u.username, '-') AS namaPetugas
      FROM stok_rusak_buang b
      LEFT JOIN produkvarian pv ON b.varianID=pv.varianID
      LEFT JOIN produk p ON pv.produkID=p.produkID
      LEFT JOIN user u ON b.userID=u.userID
      ORDER BY b.tanggalBuang DESC, b.buangRusakID DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
  }
  exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true) ?: [];
  $userID = intval($data['userID'] ?? 0);
  $stokID = intval($data['stokID'] ?? 0);
  $qty = intval($data['qty'] ?? 0);
  $action = strtolower(trim((string)($data['action'] ?? '')));
  $keterangan = trim((string)($data['keterangan'] ?? ''));

  if (!$userID || !$stokID || $qty <= 0) {
    echo json_encode(["success" => false, "message" => "userID, stokID, dan qty wajib diisi"]);
    exit();
  }
  if (!in_array($action, ['dispose', 'restore'], true)) {
    echo json_encode(["success" => false, "message" => "action harus dispose atau restore"]);
    exit();
  }
  if ($action === 'dispose' && $keterangan === '') {
    echo json_encode(["success" => false, "message" => "Keterangan wajib diisi saat membuang barang rusak"]);
    exit();
  }

  try {
    ensureStokJumlahRusakColumn($conn);
    ensureStokRusakBuangSchema($conn);
    requireOwnerForRusakManage($conn, $userID);

    $stmtS = $conn->prepare("SELECT stokID, varianID, lokasi, COALESCE(jumlahRusak,0) AS jumlahRusak FROM stok WHERE stokID=?");
    $stmtS->execute([$stokID]);
    $row = $stmtS->fetch(PDO::FETCH_ASSOC);
    if (!$row) throw new Exception("Stok tidak ditemukan");
    if (intval($row['jumlahRusak']) < $qty) {
      throw new Exception("Qty melebihi stok rusak. Tersedia: " . intval($row['jumlahRusak']));
    }

    $now = date('Y-m-d H:i:s');
    $conn->beginTransaction();
    if ($action === 'dispose') {
      $conn->prepare("UPDATE stok SET jumlahRusak=jumlahRusak-?, tanggalUpdate=? WHERE stokID=?")->execute([$qty, $now, $stokID]);
      $conn->prepare("INSERT INTO stok_rusak_buang (stokID,varianID,lokasi,jumlah,keterangan,tanggalBuang,userID) VALUES (?,?,?,?,?,?,?)")
        ->execute([$stokID, $row['varianID'], $row['lokasi'], $qty, $keterangan, $now, $userID]);
      $msg = "$qty unit barang rusak dibuang dan tercatat.";
    } else {
      $conn->prepare("UPDATE stok SET jumlahRusak=jumlahRusak-?, jumlah=jumlah+?, tanggalUpdate=? WHERE stokID=?")->execute([$qty, $qty, $now, $stokID]);
      $msg = "$qty unit dikembalikan ke stok layak.";
    }
    $conn->commit();
    echo json_encode(["success" => true, "message" => $msg]);
  } catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
