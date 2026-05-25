<?php
/**
 * Kelola qty barang rusak yang sudah ada di jumlahRusak:
 * - dispose: mengurangi jumlahRusak saja (barang dibuang/tidak dipakai lagi)
 * - restore: memindahkan dari jumlahRusak kembali ke jumlah (layak dijual lagi)
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
  $action = strtolower(trim((string)($data['action'] ?? '')));

  if (!$userID || !$stokID || $qty <= 0) {
    echo json_encode(["success" => false, "message" => "userID, stokID, dan qty (positif) wajib diisi"]);
    exit();
  }

  if ($action !== 'dispose' && $action !== 'restore') {
    echo json_encode(["success" => false, "message" => "action harus dispose atau restore"]);
    exit();
  }

  try {
    ensureKaryawanCabangColumn($conn);
    ensureStokJumlahRusakColumn($conn);

    $owner = isOwnerUser($conn, $userID);
    $cabang = '';

    if (!$owner) {
      $stmtK = $conn->prepare("SELECT karyawanID, cabang, status FROM karyawan WHERE userID = ?");
      $stmtK->execute([$userID]);
      $karyawan = $stmtK->fetch(PDO::FETCH_ASSOC);
      if (!$karyawan) {
        throw new Exception("Hanya akun pemilik atau karyawan yang dapat mengelola barang rusak");
      }
      if (strtolower(trim((string)($karyawan['status'] ?? ''))) === 'tidak aktif') {
        throw new Exception("Karyawan tidak aktif");
      }
      $cabang = trim((string)($karyawan['cabang'] ?? ''));
      if ($cabang === '') {
        throw new Exception("Cabang karyawan belum diisi.");
      }
    }

    $stmtS = $conn->prepare("SELECT stokID, lokasi, jumlah, COALESCE(jumlahRusak, 0) AS jumlahRusak FROM stok WHERE stokID = ?");
    $stmtS->execute([$stokID]);
    $row = $stmtS->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
      throw new Exception("Stok tidak ditemukan");
    }
    if (!$owner && trim((string)$row['lokasi']) !== $cabang) {
      throw new Exception("Stok tidak berada di cabang Anda");
    }

    $jumlahRusak = intval($row['jumlahRusak']);
    if ($jumlahRusak < $qty) {
      throw new Exception("Qty melebihi stok rusak. Tersedia: $jumlahRusak");
    }

    $conn->beginTransaction();
    if ($action === 'dispose') {
      $stmtUp = $conn->prepare("
        UPDATE stok SET jumlahRusak = jumlahRusak - ?, tanggalUpdate = ? WHERE stokID = ?
      ");
      $stmtUp->execute([$qty, date('Y-m-d H:i:s'), $stokID]);
      $msg = "$qty unit barang rusak dihapus dari catatan (dibuang / tidak dipakai lagi).";
    } else {
      $stmtUp = $conn->prepare("
        UPDATE stok
        SET jumlahRusak = jumlahRusak - ?,
            jumlah = jumlah + ?,
            tanggalUpdate = ?
        WHERE stokID = ?
      ");
      $stmtUp->execute([$qty, $qty, date('Y-m-d H:i:s'), $stokID]);
      $msg = "$qty unit dikembalikan dari barang rusak ke stok layak (bisa dijual).";
    }
    $conn->commit();

    echo json_encode(["success" => true, "message" => $msg]);
  } catch (Exception $e) {
    if ($conn->inTransaction()) {
      $conn->rollBack();
    }
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
