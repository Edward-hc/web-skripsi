<?php
require_once '../config/db_connect.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

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

    $conn->exec("UPDATE produkvarian SET hargaJual = harga WHERE hargaJual IS NULL");
    $conn->exec("UPDATE produkvarian SET hargaReseller = harga WHERE hargaReseller IS NULL");
    $conn->exec("UPDATE produkvarian SET hargaModal = harga WHERE hargaModal IS NULL");
  } catch (Exception $e) {
    // ignore
  }
}

function ensurePenjualanCatatanColumn($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;

    $stmt = $conn->prepare("
      SELECT COUNT(*) 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'penjualan' AND COLUMN_NAME = 'catatan'
    ");
    $stmt->execute([$dbName]);
    $exists = (int)$stmt->fetchColumn() > 0;
    if (!$exists) {
      $conn->exec("ALTER TABLE penjualan ADD COLUMN catatan TEXT NULL AFTER metodePembayaran");
    }
  } catch (Exception $e) {
    // ignore
  }
}

function ensureLaporanTanggalBuatIsDateTime($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;

    $stmt = $conn->prepare("
      SELECT DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'laporan' AND COLUMN_NAME = 'tanggalBuat'
      LIMIT 1
    ");
    $stmt->execute([$dbName]);
    $type = strtolower((string)$stmt->fetchColumn());
    if ($type && $type !== 'datetime' && $type !== 'timestamp') {
      $conn->exec("ALTER TABLE laporan MODIFY COLUMN tanggalBuat DATETIME NULL");
    }
  } catch (Exception $e) {
    // ignore
  }
}

function getOwnerID($conn) {
  $stmt = $conn->query("SELECT ownerID FROM owner ORDER BY ownerID ASC LIMIT 1");
  $ownerID = $stmt->fetchColumn();
  return $ownerID ? intval($ownerID) : 0;
}

function normalizeText($s) {
  return strtolower(trim((string)$s));
}

function calculateItemDiscount($qty, $harga, $diskonType, $diskonValue) {
  $qtyVal = max(0, intval($qty));
  $hargaVal = max(0, floatval($harga));
  $gross = $qtyVal * $hargaVal;
  $type = strtoupper(trim((string)$diskonType));
  $value = max(0, floatval($diskonValue));

  if ($type === 'PERCENTAGE') {
    $discount = $gross * min($value, 100) / 100;
  } else {
    $discount = $value;
  }
  return min($discount, $gross);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);

  $userID = isset($data['userID']) ? intval($data['userID']) : 0;
  $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
  $metodePembayaran = $data['metodePembayaran'] ?? 'Tunai';
  $namaPembeli = $data['namaPembeli'] ?? 'Umum';
  $catatan = $data['catatan'] ?? '';

  if (!$userID || count($items) === 0) {
    echo json_encode(["success" => false, "message" => "userID dan items wajib diisi"]);
    exit();
  }

  try {
    ensureKaryawanCabangColumn($conn);
    ensureVariantPriceColumns($conn);
    ensurePenjualanCatatanColumn($conn);
    ensureLaporanTanggalBuatIsDateTime($conn);

    // Ambil karyawan + cabang
    $stmt = $conn->prepare("SELECT karyawanID, cabang, status FROM karyawan WHERE userID = ?");
    $stmt->execute([$userID]);
    $karyawan = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$karyawan) {
      throw new Exception("Karyawan tidak ditemukan");
    }

    if (normalizeText($karyawan['status'] ?? '') === 'tidak aktif') {
      throw new Exception("Karyawan tidak aktif, tidak bisa melakukan transaksi");
    }

    $cabang = $karyawan['cabang'] ?? '';
    if (!$cabang) {
      throw new Exception("Cabang karyawan belum diisi. Silakan isi cabang di Manajemen Akun.");
    }

    $karyawanID = intval($karyawan['karyawanID']);
    $ownerID = getOwnerID($conn);
    if (!$ownerID) {
      throw new Exception("OwnerID tidak ditemukan. Pastikan ada data owner di database.");
    }

    $isReseller = normalizeText($namaPembeli) === 'reseller';

    // Validasi & hitung total
    $totalItems = 0;
    $grandTotal = 0.0;
    $totalDiskon = 0.0;
    $processedItems = [];

    foreach ($items as $it) {
      $varianID = isset($it['varianID']) ? intval($it['varianID']) : 0;
      $qty = isset($it['qty']) ? intval($it['qty']) : 0;
      $diskonType = isset($it['diskonType']) ? strtoupper(trim((string)$it['diskonType'])) : 'NOMINAL';
      $diskonValue = isset($it['diskonValue']) ? floatval($it['diskonValue']) : 0.0;
      if (!$varianID || $qty <= 0) {
        throw new Exception("Item tidak valid");
      }
      if ($diskonType !== 'NOMINAL' && $diskonType !== 'PERCENTAGE') {
        $diskonType = 'NOMINAL';
      }

      $stmt = $conn->prepare("SELECT harga, hargaJual, hargaReseller FROM produkvarian WHERE varianID = ?");
      $stmt->execute([$varianID]);
      $variant = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$variant) {
        throw new Exception("Varian tidak ditemukan: $varianID");
      }

      $harga = $isReseller
        ? floatval($variant['hargaReseller'] ?? $variant['hargaJual'] ?? $variant['harga'] ?? 0)
        : floatval($variant['hargaJual'] ?? $variant['harga'] ?? 0);

      $subtotal = $harga * $qty;
      $diskonItem = calculateItemDiscount($qty, $harga, $diskonType, $diskonValue);
      $subtotalNet = max(0, $subtotal - $diskonItem);
      $totalItems += $qty;
      $grandTotal += $subtotalNet;
      $totalDiskon += $diskonItem;
      $processedItems[] = [
        "varianID" => $varianID,
        "qty" => $qty,
        "harga" => $harga,
        "diskonType" => $diskonType,
        "diskonValue" => max(0, $diskonValue),
        "diskonItem" => $diskonItem,
        "subtotalNet" => $subtotalNet
      ];
    }

    $conn->beginTransaction();

    // Cek stok tersedia sebelum commit pengurangan
    foreach ($items as $it) {
      $varianID = intval($it['varianID']);
      $qty = intval($it['qty']);

      $stmt = $conn->prepare("SELECT stokID, jumlah FROM stok WHERE varianID = ? AND lokasi = ?");
      $stmt->execute([$varianID, $cabang]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      $stokAda = $row ? intval($row['jumlah']) : 0;

      if ($stokAda < $qty) {
        throw new Exception("Stok tidak cukup untuk varianID $varianID di $cabang. Tersedia: $stokAda, diminta: $qty");
      }
    }

    // Insert transaksi (header)
    // transaksi.tanggal = date, hargaSatuan tidak relevan untuk multi item -> set 0
    // varianID tidak relevan -> set 0
    $stmt = $conn->prepare("INSERT INTO transaksi (tanggal, jumlah, hargaSatuan, total, karyawanID, varianID) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
      date('Y-m-d'),
      $totalItems,
      0,
      $grandTotal,
      $karyawanID,
      0
    ]);
    $transaksiID = intval($conn->lastInsertId());

    // Insert detail_transaksi + kurangi stok
    foreach ($processedItems as $it) {
      $varianID = intval($it['varianID']);
      $qty = intval($it['qty']);
      $harga = floatval($it['harga']);
      $subtotalNet = floatval($it['subtotalNet']);

      $stmt = $conn->prepare("INSERT INTO detail_transaksi (jumlah, hargaSatuan, subtotal, transaksiID, varianID) VALUES (?, ?, ?, ?, ?)");
      $stmt->execute([$qty, $harga, $subtotalNet, $transaksiID, $varianID]);

      $diskonItem = floatval($it['diskonItem']);
      if ($diskonItem > 0) {
        $diskonNama = "DISKON POS V{$varianID} T{$transaksiID}";
        $diskonTipe = $it['diskonType'] === 'PERCENTAGE' ? 'PERCENTAGE' : 'NOMINAL';
        $nilaiDiskon = floatval($it['diskonValue']);
        $keterangan = "POS transaksi {$transaksiID} | Varian {$varianID} | Nilai terapkan: {$diskonItem}";

        $stmt = $conn->prepare("INSERT INTO diskon (namaDiskon, tipeDiskon, nilaiDiskon, keterangan) VALUES (?, ?, ?, ?)");
        $stmt->execute([$diskonNama, $diskonTipe, $nilaiDiskon, $keterangan]);
        $diskonID = intval($conn->lastInsertId());

        $stmt = $conn->prepare("INSERT INTO transaksi_diskon (totalDiskon, tanggalTerapkan, transaksiID, diskonID) VALUES (?, ?, ?, ?)");
        $stmt->execute([$diskonItem, date('Y-m-d H:i:s'), $transaksiID, $diskonID]);
      }

      $stmt = $conn->prepare("UPDATE stok SET jumlah = jumlah - ?, tanggalUpdate = ? WHERE varianID = ? AND lokasi = ?");
      $stmt->execute([$qty, date('Y-m-d H:i:s'), $varianID, $cabang]);
    }

    // Penjualan record
    $stmt = $conn->prepare("
      INSERT INTO penjualan (namaPembeli, jenisPenjualan, metodePembayaran, catatan, status, lokasi, transaksiID)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
      $namaPembeli ?: 'Umum',
      'NORMAL',
      $metodePembayaran ?: 'Tunai',
      $catatan ?: null,
      'Selesai',
      $cabang,
      $transaksiID
    ]);
    $penjualanID = intval($conn->lastInsertId());

    // Laporan + laporan_penjualan (satu baris per transaksi/penjualan)
    $stmt = $conn->prepare("INSERT INTO laporan (periode, tanggalBuat, ownerID) VALUES (?, ?, ?)");
    $stmt->execute([
      'Harian',
      date('Y-m-d H:i:s'),
      $ownerID
    ]);
    $laporanID = intval($conn->lastInsertId());

    $stmt = $conn->prepare("
      INSERT INTO laporan_penjualan (totalPembelian, totalPenjualan, totalDiskon, jumlahItem, lokasi, laporanID, penjualanID)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
      0,
      $grandTotal,
      $totalDiskon,
      $totalItems,
      $cabang,
      $laporanID,
      $penjualanID
    ]);

    $conn->commit();

    echo json_encode([
      "success" => true,
      "message" => "Transaksi berhasil disimpan",
      "data" => [
        "transaksiID" => $transaksiID,
        "penjualanID" => $penjualanID,
        "lokasi" => $cabang,
        "total" => $grandTotal,
        "diskon" => $totalDiskon,
        "jumlahItem" => $totalItems,
        "catatan" => $catatan
      ]
    ]);
  } catch (Exception $e) {
    if ($conn->inTransaction()) {
      $conn->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Gagal proses penjualan: " . $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
?>

