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

// GET - Ambil semua kategori
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    $sql = "SELECT kategoriID, namaKategori, deskripsi FROM kategoriproduk ORDER BY kategoriID DESC";
    $result = $conn->query($sql);
    
    $categories = [];
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
      $categories[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $categories]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat kategori: " . $e->getMessage()]);
  }
  exit();
}

// POST - Tambah kategori baru
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  
  if (empty($data['namaKategori'])) {
    echo json_encode(["success" => false, "message" => "Nama kategori tidak boleh kosong"]);
    exit();
  }
  
  try {
    $stmt = $conn->prepare("INSERT INTO kategoriproduk (namaKategori, deskripsi) VALUES (?, ?)");
    $stmt->execute([
      $data['namaKategori'],
      $data['deskripsi'] ?? null
    ]);
    
    $kategoriID = $conn->lastInsertId();
    echo json_encode([
      "success" => true,
      "message" => "Kategori berhasil ditambahkan",
      "data" => ["kategoriID" => $kategoriID]
    ]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal menambah kategori: " . $e->getMessage()]);
  }
  exit();
}

// PUT - Update kategori
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = json_decode(file_get_contents('php://input'), true);
  $kategoriID = $data['kategoriID'] ?? null;
  
  if (empty($kategoriID) || empty($data['namaKategori'])) {
    echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
    exit();
  }
  
  try {
    $stmt = $conn->prepare("UPDATE kategoriproduk SET namaKategori = ?, deskripsi = ? WHERE kategoriID = ?");
    $stmt->execute([
      $data['namaKategori'],
      $data['deskripsi'] ?? null,
      $kategoriID
    ]);
    
    echo json_encode(["success" => true, "message" => "Kategori berhasil diperbarui"]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memperbarui kategori: " . $e->getMessage()]);
  }
  exit();
}

// DELETE - Hapus kategori
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $data = json_decode(file_get_contents('php://input'), true);
  $kategoriID = $data['kategoriID'] ?? null;
  
  if (empty($kategoriID)) {
    echo json_encode(["success" => false, "message" => "ID kategori tidak ditemukan"]);
    exit();
  }
  
  try {
    $conn->beginTransaction();
    
    // Hapus produk terkait (cascade)
    $stmt = $conn->prepare("DELETE FROM produk WHERE kategoriID = ?");
    $stmt->execute([$kategoriID]);
    
    // Hapus kategori
    $stmt = $conn->prepare("DELETE FROM kategoriproduk WHERE kategoriID = ?");
    $stmt->execute([$kategoriID]);
    
    $conn->commit();
    echo json_encode(["success" => true, "message" => "Kategori berhasil dihapus"]);
  } catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success" => false, "message" => "Gagal menghapus kategori: " . $e->getMessage()]);
  }
  exit();
}
?>

