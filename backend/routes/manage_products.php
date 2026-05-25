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

// GET - Ambil semua produk dengan nama kategori
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    $sql = "
      SELECT p.produkID, p.namaProduk, p.deskripsi, p.kategoriID, 
             k.namaKategori
      FROM produk p
      LEFT JOIN kategoriproduk k ON p.kategoriID = k.kategoriID
      ORDER BY p.produkID DESC
    ";
    $result = $conn->query($sql);
    
    $products = [];
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
      $products[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $products]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat produk: " . $e->getMessage()]);
  }
  exit();
}

// POST - Tambah produk baru
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  
  if (empty($data['namaProduk']) || empty($data['kategoriID'])) {
    echo json_encode(["success" => false, "message" => "Nama produk dan kategori harus diisi"]);
    exit();
  }
  
  try {
    $stmt = $conn->prepare("INSERT INTO produk (namaProduk, deskripsi, kategoriID) VALUES (?, ?, ?)");
    $stmt->execute([
      $data['namaProduk'],
      $data['deskripsi'] ?? '',
      $data['kategoriID']
    ]);
    
    $produkID = $conn->lastInsertId();
    echo json_encode([
      "success" => true,
      "message" => "Produk berhasil ditambahkan",
      "data" => ["produkID" => $produkID]
    ]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal menambah produk: " . $e->getMessage()]);
  }
  exit();
}

// PUT - Update produk
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = json_decode(file_get_contents('php://input'), true);
  $produkID = $data['produkID'] ?? null;
  
  if (empty($produkID) || empty($data['namaProduk']) || empty($data['kategoriID'])) {
    echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
    exit();
  }
  
  try {
    $stmt = $conn->prepare("UPDATE produk SET namaProduk = ?, deskripsi = ?, kategoriID = ? WHERE produkID = ?");
    $stmt->execute([
      $data['namaProduk'],
      $data['deskripsi'] ?? '',
      $data['kategoriID'],
      $produkID
    ]);
    
    echo json_encode(["success" => true, "message" => "Produk berhasil diperbarui"]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memperbarui produk: " . $e->getMessage()]);
  }
  exit();
}

// DELETE - Hapus produk
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $data = json_decode(file_get_contents('php://input'), true);
  $produkID = $data['produkID'] ?? null;
  
  if (empty($produkID)) {
    echo json_encode(["success" => false, "message" => "ID produk tidak ditemukan"]);
    exit();
  }
  
  try {
    $conn->beginTransaction();
    
    // Hapus varian terkait (cascade)
    $stmt = $conn->prepare("DELETE FROM produkvarian WHERE produkID = ?");
    $stmt->execute([$produkID]);
    
    // Hapus produk
    $stmt = $conn->prepare("DELETE FROM produk WHERE produkID = ?");
    $stmt->execute([$produkID]);
    
    $conn->commit();
    echo json_encode(["success" => true, "message" => "Produk berhasil dihapus"]);
  } catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success" => false, "message" => "Gagal menghapus produk: " . $e->getMessage()]);
  }
  exit();
}
?>

