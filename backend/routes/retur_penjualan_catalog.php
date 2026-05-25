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
    if (!$userID) {
      echo json_encode(["success" => false, "message" => "userID wajib diisi"]);
      exit();
    }

    $stmt = $conn->prepare("SELECT karyawanID, cabang, status FROM karyawan WHERE userID = ?");
    $stmt->execute([$userID]);
    $karyawan = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$karyawan) {
      echo json_encode(["success" => false, "message" => "Karyawan tidak ditemukan"]);
      exit();
    }

    $status = strtolower(trim((string)($karyawan['status'] ?? '')));
    if ($status === 'tidak aktif') {
      echo json_encode(["success" => false, "message" => "Karyawan tidak aktif"]);
      exit();
    }

    $cabang = $karyawan['cabang'] ?? '';
    if (!$cabang) {
      echo json_encode(["success" => false, "message" => "Cabang karyawan belum diisi. Silakan isi cabang di Manajemen Akun."]);
      exit();
    }

    $sql = "
      SELECT
        p.penjualanID,
        p.namaPembeli,
        p.metodePembayaran,
        p.status,
        t.tanggal AS tanggalPenjualan
      FROM penjualan p
      LEFT JOIN transaksi t ON p.transaksiID = t.transaksiID
      WHERE p.lokasi = ?
      ORDER BY p.penjualanID DESC
    ";
    $stmt2 = $conn->prepare($sql);
    $stmt2->execute([$cabang]);
    $rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
      "success" => true,
      "data" => [
        "cabang" => $cabang,
        "invoices" => $rows
      ]
    ]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat penjualan untuk retur: " . $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
