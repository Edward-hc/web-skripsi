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
      // tambah kolom cabang untuk menyimpan nama cabang
      $conn->exec("ALTER TABLE karyawan ADD COLUMN cabang VARCHAR(50) NULL AFTER status");
    }
  } catch (Exception $e) {
    // jangan block endpoint kalau gagal (mis. permission), biar tetap jalan untuk instalasi lama
  }
}

// Ambil semua akun (Owner + Karyawan)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  ensureKaryawanCabangColumn($conn);
  $sql = "
    SELECT u.userID, u.username, u.fname, u.lname, u.email, u.noTelepon,
           CASE 
             WHEN o.ownerID IS NOT NULL THEN 'Pemilik'
             WHEN k.karyawanID IS NOT NULL THEN 'Karyawan'
             ELSE 'Tidak Dikenal'
           END AS role,
           COALESCE(o.jabatan, k.posisi) AS jabatan_posisi,
           k.posisi, k.shift, k.tanggalMasuk, k.status, k.cabang
    FROM user u
    LEFT JOIN owner o ON u.userID = o.userID
    LEFT JOIN karyawan k ON u.userID = k.userID
    ORDER BY u.userID DESC
  ";
  $result = $conn->query($sql);

  $accounts = [];
  while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $accounts[] = $row;
  }

  echo json_encode(["success" => true, "data" => $accounts]);
  exit();
}

// Tambah akun baru
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);

  // Validasi data
  if (empty($data['username']) || empty($data['password']) || empty($data['fname']) || empty($data['role'])) {
    echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
    exit();
  }

  try {
    $conn->beginTransaction();
    ensureKaryawanCabangColumn($conn);

    // Insert ke tabel user
    $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO user (username, password, fname, lname, email, noTelepon) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
      $data['username'], 
      $hashed, 
      $data['fname'], 
      $data['lname'] ?? '', 
      $data['email'] ?? '', 
      $data['noTelepon'] ?? ''
    ]);
    $userID = $conn->lastInsertId();

    // Insert ke tabel owner atau karyawan
    if ($data['role'] === 'Pemilik') {
      $stmt = $conn->prepare("INSERT INTO owner (jabatan, noTelepon, userID) VALUES (?, ?, ?)");
      $stmt->execute([
        $data['jabatan'] ?? '', 
        $data['noTelepon'] ?? '', 
        $userID
      ]);
    } elseif ($data['role'] === 'Karyawan') {
      $stmt = $conn->prepare("INSERT INTO karyawan (posisi, shift, tanggalMasuk, status, cabang, userID) VALUES (?, ?, ?, ?, ?, ?)");
      $stmt->execute([
        $data['posisi'] ?? '', 
        $data['shift'] ?? '', 
        $data['tanggalMasuk'] ?? date('Y-m-d'), 
        $data['status'] ?? 'Aktif', 
        $data['cabang'] ?? null,
        $userID
      ]);
    }

    $conn->commit();
    echo json_encode([
      "success" => true, 
      "message" => "Akun berhasil ditambahkan.",
      "userID" => $userID,
      "debug" => $data // Untuk debugging
    ]);
  } catch (Exception $e) {
    $conn->rollBack();
    echo json_encode([
      "success" => false, 
      "message" => "Gagal menambah akun: " . $e->getMessage(),
      "debug" => $data // Untuk debugging
    ]);
  }
  exit();
}

// Hapus akun
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $data = json_decode(file_get_contents('php://input'), true);
  $userID = $data['userID'];

  try {
    $conn->beginTransaction();

    $conn->prepare("DELETE FROM owner WHERE userID = ?")->execute([$userID]);
    $conn->prepare("DELETE FROM karyawan WHERE userID = ?")->execute([$userID]);
    $conn->prepare("DELETE FROM user WHERE userID = ?")->execute([$userID]);

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Akun berhasil dihapus."]);
  } catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success" => false, "message" => "Gagal menghapus akun: " . $e->getMessage()]);
  }
  exit();
}

// Update akun
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = json_decode(file_get_contents('php://input'), true);
  $userID = $data['userID'];

  try {
    $conn->beginTransaction();
    ensureKaryawanCabangColumn($conn);

    // Update user
    $stmt = $conn->prepare("UPDATE user SET fname = ?, lname = ?, email = ?, noTelepon = ? WHERE userID = ?");
    $stmt->execute([
      $data['fname'], 
      $data['lname'] ?? '', 
      $data['email'] ?? '', 
      $data['noTelepon'] ?? '', 
      $userID
    ]);

    // Update password jika diisi
    if (!empty($data['password'])) {
      $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
      $stmt = $conn->prepare("UPDATE user SET password = ? WHERE userID = ?");
      $stmt->execute([$hashed, $userID]);
    }

    // Update role-specific data
    if ($data['role'] === 'Pemilik') {
      $stmt = $conn->prepare("UPDATE owner SET jabatan = ?, noTelepon = ? WHERE userID = ?");
      $stmt->execute([
        $data['jabatan'] ?? '', 
        $data['noTelepon'] ?? '', 
        $userID
      ]);
    } elseif ($data['role'] === 'Karyawan') {
      $stmt = $conn->prepare("UPDATE karyawan SET posisi = ?, shift = ?, tanggalMasuk = ?, status = ?, cabang = ? WHERE userID = ?");
      $stmt->execute([
        $data['posisi'] ?? '', 
        $data['shift'] ?? '', 
        $data['tanggalMasuk'] ?? date('Y-m-d'), 
        $data['status'] ?? 'Aktif', 
        $data['cabang'] ?? null,
        $userID
      ]);
    }

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Akun berhasil diperbarui."]);
  } catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success" => false, "message" => "Gagal memperbarui akun: " . $e->getMessage()]);
  }
  exit();
}
?>