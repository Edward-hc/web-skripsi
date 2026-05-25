<?php
require_once '../utils/json_storage.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

$jsonFile = 'cabang.json';

// GET - Ambil semua cabang
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    $branches = readJSON($jsonFile);
    
    // Sort by cabangID descending
    usort($branches, function($a, $b) {
      return strcmp($b['cabangID'], $a['cabangID']);
    });
    
    echo json_encode(["success" => true, "data" => $branches]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat cabang: " . $e->getMessage()]);
  }
  exit();
}

// POST - Tambah cabang baru
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  
  if (empty($data['namaCabang']) || empty($data['alamat'])) {
    echo json_encode(["success" => false, "message" => "Nama Cabang dan Alamat harus diisi"]);
    exit();
  }
  
  try {
    // Baca data existing
    $branches = readJSON($jsonFile);
    
    // Generate CabangID otomatis
    $cabangID = generateCabangID($branches);
    
    // Tambah cabang baru
    $newBranch = [
      'cabangID' => $cabangID,
      'namaCabang' => $data['namaCabang'],
      'alamat' => $data['alamat'],
      'noTelepon' => $data['noTelepon'] ?? '',
      'jamOperasional' => $data['jamOperasional'] ?? '',
      'status' => $data['status'] ?? 'Aktif'
    ];
    
    $branches[] = $newBranch;
    
    // Simpan ke file
    if (writeJSON($jsonFile, $branches)) {
      echo json_encode([
        "success" => true,
        "message" => "Cabang berhasil ditambahkan",
        "data" => ["cabangID" => $cabangID]
      ]);
    } else {
      echo json_encode(["success" => false, "message" => "Gagal menyimpan data"]);
    }
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal menambah cabang: " . $e->getMessage()]);
  }
  exit();
}

// PUT - Update cabang
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = json_decode(file_get_contents('php://input'), true);
  $cabangID = $data['cabangID'] ?? null;
  
  if (empty($cabangID)) {
    echo json_encode(["success" => false, "message" => "CabangID harus diisi"]);
    exit();
  }
  
  try {
    // Baca data existing
    $branches = readJSON($jsonFile);
    
    // Cari cabang
    $found = false;
    foreach ($branches as &$branch) {
      if ($branch['cabangID'] === $cabangID) {
        // Update field yang ada di request
        if (isset($data['namaCabang'])) {
          $branch['namaCabang'] = $data['namaCabang'];
        }
        if (isset($data['alamat'])) {
          $branch['alamat'] = $data['alamat'];
        }
        if (isset($data['noTelepon'])) {
          $branch['noTelepon'] = $data['noTelepon'];
        }
        if (isset($data['jamOperasional'])) {
          $branch['jamOperasional'] = $data['jamOperasional'];
        }
        if (isset($data['status'])) {
          $branch['status'] = $data['status'];
        }
        $found = true;
        break;
      }
    }
    
    if (!$found) {
      echo json_encode(["success" => false, "message" => "Cabang tidak ditemukan"]);
      exit();
    }
    
    // Simpan ke file
    if (writeJSON($jsonFile, $branches)) {
      echo json_encode(["success" => true, "message" => "Cabang berhasil diperbarui"]);
    } else {
      echo json_encode(["success" => false, "message" => "Gagal menyimpan data"]);
    }
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memperbarui cabang: " . $e->getMessage()]);
  }
  exit();
}

// DELETE - Hapus cabang
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $data = json_decode(file_get_contents('php://input'), true);
  $cabangID = $data['cabangID'] ?? null;
  
  if (empty($cabangID)) {
    echo json_encode(["success" => false, "message" => "ID cabang tidak ditemukan"]);
    exit();
  }
  
  try {
    // Baca data existing
    $branches = readJSON($jsonFile);
    
    // Hapus cabang
    $branches = array_filter($branches, function($branch) use ($cabangID) {
      return $branch['cabangID'] !== $cabangID;
    });
    
    // Re-index array
    $branches = array_values($branches);
    
    // Simpan ke file
    if (writeJSON($jsonFile, $branches)) {
      echo json_encode(["success" => true, "message" => "Cabang berhasil dihapus"]);
    } else {
      echo json_encode(["success" => false, "message" => "Gagal menyimpan data"]);
    }
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal menghapus cabang: " . $e->getMessage()]);
  }
  exit();
}
?>

