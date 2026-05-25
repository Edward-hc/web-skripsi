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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    $sql = "SELECT supplierID, nama, alamat, noTelepon, email, kontakPerson FROM supplier ORDER BY supplierID DESC";
    $rows = $conn->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => $rows]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat supplier: " . $e->getMessage()]);
  }
  exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  $nama = trim((string)($data['nama'] ?? ''));
  $alamat = trim((string)($data['alamat'] ?? ''));
  $noTelepon = trim((string)($data['noTelepon'] ?? ''));
  $email = trim((string)($data['email'] ?? ''));
  $kontakPerson = trim((string)($data['kontakPerson'] ?? ''));

  if ($nama === '' || $alamat === '' || $noTelepon === '') {
    echo json_encode(["success" => false, "message" => "Nama, alamat, dan no telepon wajib diisi"]);
    exit();
  }

  try {
    $stmt = $conn->prepare("INSERT INTO supplier (nama, alamat, noTelepon, email, kontakPerson) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$nama, $alamat, $noTelepon, $email ?: null, $kontakPerson ?: null]);
    echo json_encode(["success" => true, "message" => "Supplier berhasil ditambahkan", "data" => ["supplierID" => (int)$conn->lastInsertId()]]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal menambah supplier: " . $e->getMessage()]);
  }
  exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = json_decode(file_get_contents('php://input'), true);
  $supplierID = isset($data['supplierID']) ? intval($data['supplierID']) : 0;
  if (!$supplierID) {
    echo json_encode(["success" => false, "message" => "supplierID wajib diisi"]);
    exit();
  }

  $nama = trim((string)($data['nama'] ?? ''));
  $alamat = trim((string)($data['alamat'] ?? ''));
  $noTelepon = trim((string)($data['noTelepon'] ?? ''));
  $email = trim((string)($data['email'] ?? ''));
  $kontakPerson = trim((string)($data['kontakPerson'] ?? ''));

  try {
    $stmt = $conn->prepare("
      UPDATE supplier
      SET nama = ?, alamat = ?, noTelepon = ?, email = ?, kontakPerson = ?
      WHERE supplierID = ?
    ");
    $stmt->execute([$nama, $alamat, $noTelepon, $email ?: null, $kontakPerson ?: null, $supplierID]);
    echo json_encode(["success" => true, "message" => "Supplier berhasil diperbarui"]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memperbarui supplier: " . $e->getMessage()]);
  }
  exit();
}

// DELETE - Hapus supplier
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $data = json_decode(file_get_contents('php://input'), true);
  $supplierID = isset($data['supplierID']) ? intval($data['supplierID']) : 0;

  if (!$supplierID) {
    echo json_encode(["success" => false, "message" => "supplierID wajib diisi"]);
    exit();
  }

  try {
    $stmt = $conn->prepare("DELETE FROM supplier WHERE supplierID = ?");
    $stmt->execute([$supplierID]);

    if ($stmt->rowCount() === 0) {
      echo json_encode(["success" => false, "message" => "Supplier tidak ditemukan"]);
      exit();
    }

    echo json_encode(["success" => true, "message" => "Supplier berhasil dihapus"]);
  } catch (Exception $e) {
    echo json_encode([
      "success" => false,
      "message" => "Gagal menghapus supplier: " . $e->getMessage()
    ]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
?>

