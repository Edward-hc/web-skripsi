<?php
require_once '../config/db_connect.php';
require_once '../utils/produkvarian_schema.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json");

// Pastikan timestamp tersimpan dalam WIB
date_default_timezone_set('Asia/Jakarta');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
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

// GET - Ambil semua stok dengan informasi varian dan produk
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    ensureStokJumlahRusakColumn($conn);
    ensureProdukvarianPriceSchema($conn);
    $sql = "
      SELECT s.stokID, s.jumlah, COALESCE(s.jumlahRusak, 0) AS jumlahRusak, s.tanggalUpdate, s.lokasi, s.varianID,
             pv.namaVarian, pv.stokMinimum, pv.produkID, pv.hargaJual, pv.hargaReseller, pv.hargaModal,
             p.namaProduk
      FROM stok s
      LEFT JOIN produkvarian pv ON s.varianID = pv.varianID
      LEFT JOIN produk p ON pv.produkID = p.produkID
      ORDER BY s.stokID DESC
    ";
    $result = $conn->query($sql);
    
    $stocks = [];
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
      // Format nama varian dengan produk
      $row['namaVarian'] = $row['namaVarian'] 
        ? ($row['namaVarian'] . ($row['namaProduk'] ? ' (' . $row['namaProduk'] . ')' : ''))
        : 'Varian ID: ' . $row['varianID'];
      $stocks[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $stocks]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat stok: " . $e->getMessage()]);
  }
  exit();
}

// POST - Tambah stok baru
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  
  if (empty($data['jumlah']) || empty($data['lokasi']) || empty($data['varianID'])) {
    echo json_encode(["success" => false, "message" => "Jumlah, lokasi, dan varianID harus diisi"]);
    exit();
  }
  
  try {
    ensureStokJumlahRusakColumn($conn);
    $tanggalUpdate = date('Y-m-d H:i:s');
    
    // Cek apakah sudah ada stok untuk varian ini di lokasi yang sama
    $stmt = $conn->prepare("SELECT stokID, jumlah FROM stok WHERE varianID = ? AND lokasi = ?");
    $stmt->execute([$data['varianID'], $data['lokasi']]);
    $existingStock = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingStock) {
      // Update stok yang sudah ada (tambah jumlah)
      $newJumlah = $existingStock['jumlah'] + $data['jumlah'];
      $stmt = $conn->prepare("UPDATE stok SET jumlah = ?, tanggalUpdate = ? WHERE stokID = ?");
      $stmt->execute([$newJumlah, $tanggalUpdate, $existingStock['stokID']]);
      
      echo json_encode([
        "success" => true,
        "message" => "Stok berhasil ditambahkan (stok yang sudah ada diupdate)",
        "data" => ["stokID" => $existingStock['stokID']]
      ]);
    } else {
      // Insert stok baru
      $stmt = $conn->prepare("INSERT INTO stok (jumlah, jumlahRusak, tanggalUpdate, lokasi, varianID) VALUES (?, 0, ?, ?, ?)");
      $stmt->execute([
        $data['jumlah'],
        $tanggalUpdate,
        $data['lokasi'],
        $data['varianID']
      ]);
      
      $stokID = $conn->lastInsertId();
      echo json_encode([
        "success" => true,
        "message" => "Stok berhasil ditambahkan",
        "data" => ["stokID" => $stokID]
      ]);
    }
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal menambah stok: " . $e->getMessage()]);
  }
  exit();
}

// PUT - Update stok
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = json_decode(file_get_contents('php://input'), true);
  $stokID = $data['stokID'] ?? null;
  
  if (empty($stokID)) {
    echo json_encode(["success" => false, "message" => "StokID harus diisi"]);
    exit();
  }
  
  try {
    ensureStokJumlahRusakColumn($conn);
    $updates = [];
    $params = [];
    
    if (isset($data['jumlah'])) {
      $updates[] = "jumlah = ?";
      $params[] = $data['jumlah'];
    }
    if (isset($data['jumlahRusak'])) {
      $updates[] = "jumlahRusak = ?";
      $params[] = max(0, intval($data['jumlahRusak']));
    }
    if (isset($data['lokasi'])) {
      $updates[] = "lokasi = ?";
      $params[] = $data['lokasi'];
    }
    if (isset($data['varianID'])) {
      $updates[] = "varianID = ?";
      $params[] = $data['varianID'];
    }
    
    if (empty($updates)) {
      echo json_encode(["success" => false, "message" => "Tidak ada data yang diupdate"]);
      exit();
    }
    
    // Update tanggalUpdate
    $updates[] = "tanggalUpdate = ?";
    $params[] = date('Y-m-d H:i:s');
    $params[] = $stokID;
    
    $sql = "UPDATE stok SET " . implode(", ", $updates) . " WHERE stokID = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(["success" => true, "message" => "Stok berhasil diperbarui"]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memperbarui stok: " . $e->getMessage()]);
  }
  exit();
}

// DELETE - Hapus stok
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $data = json_decode(file_get_contents('php://input'), true);
  $stokID = $data['stokID'] ?? null;
  
  if (empty($stokID)) {
    echo json_encode(["success" => false, "message" => "StokID tidak ditemukan"]);
    exit();
  }
  
  try {
    $stmt = $conn->prepare("DELETE FROM stok WHERE stokID = ?");
    $stmt->execute([$stokID]);
    
    echo json_encode(["success" => true, "message" => "Stok berhasil dihapus"]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal menghapus stok: " . $e->getMessage()]);
  }
  exit();
}
?>

