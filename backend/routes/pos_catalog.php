<?php
require_once '../config/db_connect.php';
require_once '../utils/produkvarian_schema.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

// Pastikan waktu konsisten
date_default_timezone_set('Asia/Jakarta');

function ensureKaryawanCabangColumn($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;

    $stmt = $conn->prepare("
      SELECT COUNT(*) 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'karyawan' AND COLUMN_NAME = 'cabang'
    ");
    $stmt->execute([$dbName]);
    $exists = (int)$stmt->fetchColumn() > 0;
    if (!$exists) {
      $conn->exec("ALTER TABLE karyawan ADD COLUMN cabang VARCHAR(50) NULL AFTER status");
    }
  } catch (Exception $e) {
    // ignore
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    ensureKaryawanCabangColumn($conn);
    ensureProdukvarianPriceSchema($conn);

    $userID = isset($_GET['userID']) ? intval($_GET['userID']) : 0;
    if (!$userID) {
      echo json_encode(["success" => false, "message" => "userID wajib diisi"]);
      exit();
    }

    // Ambil cabang karyawan
    $stmt = $conn->prepare("SELECT karyawanID, cabang, status FROM karyawan WHERE userID = ?");
    $stmt->execute([$userID]);
    $karyawan = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$karyawan) {
      echo json_encode(["success" => false, "message" => "Karyawan tidak ditemukan"]);
      exit();
    }

    $cabang = $karyawan['cabang'] ?? '';
    if (!$cabang) {
      echo json_encode(["success" => false, "message" => "Cabang karyawan belum diisi. Silakan isi cabang di Manajemen Akun."]);
      exit();
    }

    // Katalog varian + produk + stok per lokasi (cabang)
    $sql = "
      SELECT 
        pv.varianID,
        pv.namaVarian,
        pv.hargaJual,
        pv.hargaReseller,
        pv.hargaModal,
        pv.stokMinimum,
        pv.status,
        pv.produkID,
        p.namaProduk,
        COALESCE(s.jumlah, 0) AS stok,
        ? AS lokasi
      FROM produkvarian pv
      LEFT JOIN produk p ON pv.produkID = p.produkID
      LEFT JOIN stok s ON s.varianID = pv.varianID AND s.lokasi = ?
      ORDER BY pv.varianID DESC
    ";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$cabang, $cabang]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
      "success" => true,
      "data" => [
        "cabang" => $cabang,
        "karyawanID" => $karyawan['karyawanID'],
        "karyawanStatus" => $karyawan['status'] ?? null,
        "items" => $rows
      ]
    ]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat katalog POS: " . $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
?>

