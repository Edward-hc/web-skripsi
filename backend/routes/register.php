<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}
require_once '../config/db_connect.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    try {
        $conn->beginTransaction();

        // 1️⃣ Insert ke tabel user
        $stmt = $conn->prepare("INSERT INTO user (username, password, fname, lname, email, noTelepon)
                                VALUES (?, ?, ?, ?, ?, ?)");
        $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt->execute([
            $data['username'] ?? null,
            $hashed,
            $data['fname'] ?? null,
            $data['lname'] ?? null,
            $data['email'] ?? null,
            $data['noTelepon'] ?? null
        ]);
        $userID = $conn->lastInsertId();

        // 2️⃣ Insert ke tabel sesuai role
        if ($data['role'] === 'pemilik') {
            $stmt = $conn->prepare("INSERT INTO owner (jabatan, noTelepon, userID) VALUES (?, ?, ?)");
            $stmt->execute([
                $data['jabatan'] ?? 'Pemilik',
                $data['noTelepon'] ?? null,
                $userID
            ]);
        } elseif ($data['role'] === 'karyawan') {
            $stmt = $conn->prepare("INSERT INTO karyawan (posisi, shift, tanggalMasuk, status, userID)
                                    VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['posisi'] ?? 'Staff',
                $data['shift'] ?? 'Pagi',
                $data['tanggalMasuk'] ?? date('Y-m-d'),
                $data['status'] ?? 'Aktif',
                $userID
            ]);
        } else {
            throw new Exception("Role tidak valid");
        }

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Registrasi berhasil']);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}
?>
