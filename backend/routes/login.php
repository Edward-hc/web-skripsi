<?php
require_once("../config/db_connect.php");
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

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
    if ((int)$stmt->fetchColumn() === 0) {
      $conn->exec("ALTER TABLE karyawan ADD COLUMN cabang VARCHAR(50) NULL AFTER status");
    }
  } catch (Exception $e) {
    // biarkan login tetap berjalan pada instalasi lama
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents("php://input"), true);
  $email = $data['email'];
  $password = $data['password'];
  $role = $data['role']; // 'pemilik' atau 'karyawan'
  ensureKaryawanCabangColumn($conn);

  // Ambil data user berdasarkan email
  $stmt = $conn->prepare("SELECT * FROM user WHERE email = ?");
  $stmt->execute([$email]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user) {
    echo json_encode(["success" => false, "message" => "Email tidak ditemukan"]);
    exit;
  }

  // Cek password
  if (!password_verify($password, $user['password'])) {
    echo json_encode(["success" => false, "message" => "Password salah"]);
    exit;
  }

  // Cek role sesuai tabel relasi
  if ($role === 'pemilik') {
    $roleStmt = $conn->prepare("SELECT * FROM owner WHERE userID = ?");
  } else {
    $roleStmt = $conn->prepare("SELECT * FROM karyawan WHERE userID = ?");
  }
  $roleStmt->execute([$user['userID']]);
  $roleData = $roleStmt->fetch(PDO::FETCH_ASSOC);

  if (!$roleData) {
    echo json_encode(["success" => false, "message" => "Role tidak sesuai"]);
    exit;
  }

  // Login sukses
  echo json_encode([
    "success" => true,
    "message" => "Login berhasil",
    "data" => [
      "userID" => $user['userID'],
      "fname" => $user['fname'],
      "lname" => $user['lname'],
      "email" => $user['email'],
      "role" => ucfirst($role),
      "namaCabang" => $role === 'karyawan' ? ($roleData['cabang'] ?? null) : null
    ]
  ]);
}
?>
