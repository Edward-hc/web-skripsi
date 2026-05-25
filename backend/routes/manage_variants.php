<?php
require_once '../config/db_connect.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

function ensureVariantPriceColumns($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;

    $required = [
      "hargaJual" => "ALTER TABLE produkvarian ADD COLUMN hargaJual DECIMAL(10,2) NULL AFTER harga",
      "hargaReseller" => "ALTER TABLE produkvarian ADD COLUMN hargaReseller DECIMAL(10,2) NULL AFTER hargaJual",
      "hargaModal" => "ALTER TABLE produkvarian ADD COLUMN hargaModal DECIMAL(10,2) NULL AFTER hargaReseller"
    ];

    foreach ($required as $col => $alterSql) {
      $stmt = $conn->prepare("
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'produkvarian' AND COLUMN_NAME = ?
      ");
      $stmt->execute([$dbName, $col]);
      $exists = (int)$stmt->fetchColumn() > 0;
      if (!$exists) {
        $conn->exec($alterSql);
      }
    }

    // Backfill nilai null agar konsisten dari harga lama
    $conn->exec("UPDATE produkvarian SET hargaJual = harga WHERE hargaJual IS NULL");
    $conn->exec("UPDATE produkvarian SET hargaReseller = harga WHERE hargaReseller IS NULL");
    $conn->exec("UPDATE produkvarian SET hargaModal = harga WHERE hargaModal IS NULL");
  } catch (Exception $e) {
    // Jangan block endpoint kalau alter gagal
  }
}

// GET - Ambil semua varian dengan nama produk
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    ensureVariantPriceColumns($conn);
    $sql = "
      SELECT v.varianID, v.namaVarian, v.harga, v.hargaJual, v.hargaReseller, v.hargaModal, v.stokMinimum, v.status, v.produkID,
             p.namaProduk
      FROM produkvarian v
      LEFT JOIN produk p ON v.produkID = p.produkID
      ORDER BY v.varianID DESC
    ";
    $result = $conn->query($sql);
    
    $variants = [];
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
      $variants[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $variants]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat varian: " . $e->getMessage()]);
  }
  exit();
}

// POST - Tambah varian baru
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  
  $hargaJual = isset($data['hargaJual']) ? $data['hargaJual'] : ($data['harga'] ?? null);
  $hargaReseller = isset($data['hargaReseller']) ? $data['hargaReseller'] : $hargaJual;
  $hargaModal = isset($data['hargaModal']) ? $data['hargaModal'] : $hargaJual;

  if (empty($data['namaVarian']) || empty($data['produkID']) || $hargaJual === null || $hargaJual === '') {
    echo json_encode(["success" => false, "message" => "Nama varian, produk, dan harga jual harus diisi"]);
    exit();
  }
  
  try {
    ensureVariantPriceColumns($conn);
    $stmt = $conn->prepare("INSERT INTO produkvarian (namaVarian, harga, hargaJual, hargaReseller, hargaModal, stokMinimum, status, produkID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
      $data['namaVarian'],
      $hargaJual, // harga lama tetap diisi untuk kompatibilitas
      $hargaJual,
      $hargaReseller,
      $hargaModal,
      $data['stokMinimum'] ?? 0,
      $data['status'] ?? 'Tersedia',
      $data['produkID']
    ]);
    
    $varianID = $conn->lastInsertId();
    echo json_encode([
      "success" => true,
      "message" => "Varian berhasil ditambahkan",
      "data" => ["varianID" => $varianID]
    ]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal menambah varian: " . $e->getMessage()]);
  }
  exit();
}

// PUT - Update varian
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = json_decode(file_get_contents('php://input'), true);
  $varianID = $data['varianID'] ?? null;
  $hargaJual = isset($data['hargaJual']) ? $data['hargaJual'] : ($data['harga'] ?? null);
  $hargaReseller = isset($data['hargaReseller']) ? $data['hargaReseller'] : $hargaJual;
  $hargaModal = isset($data['hargaModal']) ? $data['hargaModal'] : $hargaJual;
  
  if (empty($varianID) || empty($data['namaVarian']) || empty($data['produkID']) || $hargaJual === null || $hargaJual === '') {
    echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
    exit();
  }
  
  try {
    ensureVariantPriceColumns($conn);
    $stmt = $conn->prepare("UPDATE produkvarian SET namaVarian = ?, harga = ?, hargaJual = ?, hargaReseller = ?, hargaModal = ?, stokMinimum = ?, status = ?, produkID = ? WHERE varianID = ?");
    $stmt->execute([
      $data['namaVarian'],
      $hargaJual, // harga lama tetap sinkron dengan harga jual
      $hargaJual,
      $hargaReseller,
      $hargaModal,
      $data['stokMinimum'] ?? 0,
      $data['status'] ?? 'Tersedia',
      $data['produkID'],
      $varianID
    ]);
    
    echo json_encode(["success" => true, "message" => "Varian berhasil diperbarui"]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memperbarui varian: " . $e->getMessage()]);
  }
  exit();
}

// DELETE - Hapus varian
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $data = json_decode(file_get_contents('php://input'), true);
  $varianID = $data['varianID'] ?? null;
  
  if (empty($varianID)) {
    echo json_encode(["success" => false, "message" => "ID varian tidak ditemukan"]);
    exit();
  }
  
  try {
    $stmt = $conn->prepare("DELETE FROM produkvarian WHERE varianID = ?");
    $stmt->execute([$varianID]);
    
    echo json_encode(["success" => true, "message" => "Varian berhasil dihapus"]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal menghapus varian: " . $e->getMessage()]);
  }
  exit();
}
?>

