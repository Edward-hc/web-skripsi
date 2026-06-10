<?php
/**
 * Memindahkan qty dari stok layak (jumlah) ke barang rusak (jumlahRusak).
 * Untuk kerusakan di gudang/toko tanpa melewati retur penjualan.
 */
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

function ensureStokJumlahRusakColumn($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;
    $stmt = $conn->prepare("
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'stok' AND COLUMN_NAME = 'jumlahRusak'
    ");
    $stmt->execute([$dbName]);
    if ((int)$stmt->fetchColumn() === 0) {
      $conn->exec("ALTER TABLE stok ADD COLUMN jumlahRusak INT NOT NULL DEFAULT 0 AFTER jumlah");
    }
  } catch (Exception $e) {
    // ignore
  }
}

function isOwnerUser($conn, $userID) {
  try {
    $stmt = $conn->prepare("SELECT ownerID FROM owner WHERE userID = ? LIMIT 1");
    $stmt->execute([$userID]);
    return (bool)$stmt->fetchColumn();
  } catch (Exception $e) {
    return false;
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  $userID = isset($data['userID']) ? intval($data['userID']) : 0;
  $stokID = isset($data['stokID']) ? intval($data['stokID']) : 0;
  $qty = isset($data['qty']) ? intval($data['qty']) : 0;

  if (!$userID || !$stokID || $qty <= 0) {
    echo json_encode(["success" => false, "message" => "userID, stokID, dan qty (positif) wajib diisi"]);
    exit();
  }

  try {
    ensureStokJumlahRusakColumn($conn);

    if (!isOwnerUser($conn, $userID)) {
      throw new Exception("Hanya pemilik yang dapat mencatat barang rusak dari monitoring stok");
    }

    $stmtS = $conn->prepare("SELECT stokID, varianID, lokasi, jumlah, COALESCE(jumlahRusak, 0) AS jumlahRusak FROM stok WHERE stokID = ?");
    $stmtS->execute([$stokID]);
    $row = $stmtS->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
      throw new Exception("Stok tidak ditemukan");
    }

    $jumlah = intval($row['jumlah']);
    if ($jumlah < $qty) {
      throw new Exception("Stok layak tidak cukup. Tersedia: $jumlah");
    }

    $conn->beginTransaction();
    $stmtUp = $conn->prepare("
      UPDATE stok
      SET jumlah = jumlah - ?,
          jumlahRusak = COALESCE(jumlahRusak, 0) + ?,
          tanggalUpdate = ?
      WHERE stokID = ?
    ");
    $stmtUp->execute([$qty, $qty, date('Y-m-d H:i:s'), $stokID]);
    $conn->commit();

    echo json_encode([
      "success" => true,
      "message" => "Barang rusak tercatat: $qty unit dipindah dari stok layak ke barang rusak (tidak dijual)."
    ]);
  } catch (Exception $e) {
    if ($conn->inTransaction()) {
      $conn->rollBack();
    }
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
