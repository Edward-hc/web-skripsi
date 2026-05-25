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

function normalizeText($s) {
  return strtolower(trim((string)$s));
}

function calculateItemDiscount($qty, $hargaBeli, $diskonType, $diskonValue) {
  $qtyVal = max(0, intval($qty));
  $hargaVal = max(0, floatval($hargaBeli));
  $gross = $qtyVal * $hargaVal;
  $value = max(0, floatval($diskonValue));
  $type = strtoupper(trim((string)$diskonType));

  if ($type === 'PERCENTAGE') {
    $discount = $gross * min($value, 100) / 100;
  } else {
    $discount = $value;
  }
  return min($discount, $gross);
}

function ensureKaryawanCabangColumn($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;
    $stmt = $conn->prepare("
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'karyawan' AND COLUMN_NAME = 'cabang'
    ");
    $stmt->execute([$dbName]);
    if ((int)$stmt->fetchColumn() === 0) {
      $conn->exec("ALTER TABLE karyawan ADD COLUMN cabang VARCHAR(50) NULL AFTER status");
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

function ensurePembelianInvoiceColumns($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;

    $required = [
      "tanggalFaktur" => "ALTER TABLE pembelian ADD COLUMN tanggalFaktur DATE NULL AFTER noFaktur",
      "jatuhTempo" => "ALTER TABLE pembelian ADD COLUMN jatuhTempo DATE NULL AFTER tanggalTerima",
      "ongkir" => "ALTER TABLE pembelian ADD COLUMN ongkir DECIMAL(10,2) NULL DEFAULT 0 AFTER status",
      "ppnPersen" => "ALTER TABLE pembelian ADD COLUMN ppnPersen DECIMAL(5,2) NULL DEFAULT 0 AFTER ongkir",
      "catatan" => "ALTER TABLE pembelian ADD COLUMN catatan TEXT NULL AFTER ppnPersen"
    ];

    foreach ($required as $col => $alterSql) {
      $stmt = $conn->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pembelian' AND COLUMN_NAME = ?
      ");
      $stmt->execute([$dbName, $col]);
      if ((int)$stmt->fetchColumn() === 0) {
        $conn->exec($alterSql);
      }
    }
  } catch (Exception $e) {
    // ignore for compatibility
  }
}

function ensureLaporanPembelianColumns($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;

    $required = [
      "jumlahItem" => "ALTER TABLE laporan_pembelian ADD COLUMN jumlahItem INT NULL DEFAULT 0 AFTER totalPembelian",
      "diskonPembelian" => "ALTER TABLE laporan_pembelian ADD COLUMN diskonPembelian DECIMAL(10,2) NULL DEFAULT 0 AFTER jumlahItem",
    ];

    foreach ($required as $col => $alterSql) {
      $stmt = $conn->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'laporan_pembelian' AND COLUMN_NAME = ?
      ");
      $stmt->execute([$dbName, $col]);
      if ((int)$stmt->fetchColumn() === 0) {
        $conn->exec($alterSql);
      }
    }
  } catch (Exception $e) {
    // ignore for compatibility
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);

  $userID = isset($data['userID']) ? intval($data['userID']) : 0;
  $supplierID = isset($data['supplierID']) ? intval($data['supplierID']) : 0;
  $noFaktur = trim((string)($data['noFaktur'] ?? ''));
  $status = trim((string)($data['status'] ?? 'Diterima'));
  $tanggalTerima = trim((string)($data['tanggalTerima'] ?? date('Y-m-d')));
  $tanggalFaktur = trim((string)($data['tanggalFaktur'] ?? $tanggalTerima));
  $jatuhTempo = trim((string)($data['jatuhTempo'] ?? ''));
  $ongkir = isset($data['ongkir']) ? floatval($data['ongkir']) : 0.0;
  $ppnPersen = isset($data['ppnPersen']) ? floatval($data['ppnPersen']) : 0.0;
  $catatan = trim((string)($data['catatan'] ?? ''));
  $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];

  if (!$userID || !$supplierID || !$noFaktur || count($items) === 0) {
    echo json_encode(["success" => false, "message" => "userID, supplierID, noFaktur, dan items wajib diisi"]);
    exit();
  }

  try {
    ensureKaryawanCabangColumn($conn);
    ensurePembelianInvoiceColumns($conn);
    ensureLaporanPembelianColumns($conn);
    ensureLaporanTanggalBuatIsDateTime($conn);

    $stmt = $conn->prepare("SELECT karyawanID, cabang, status FROM karyawan WHERE userID = ?");
    $stmt->execute([$userID]);
    $karyawan = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$karyawan) {
      throw new Exception("Karyawan tidak ditemukan");
    }
    if (normalizeText($karyawan['status'] ?? '') === 'tidak aktif') {
      throw new Exception("Karyawan tidak aktif, tidak bisa input pembelian");
    }

    $cabang = $karyawan['cabang'] ?? '';
    if (!$cabang) {
      throw new Exception("Cabang karyawan belum diisi. Silakan isi cabang di Manajemen Akun.");
    }

    $karyawanID = intval($karyawan['karyawanID']);
    $ownerID = getOwnerID($conn);
    if (!$ownerID) {
      throw new Exception("OwnerID tidak ditemukan.");
    }

    $stmt = $conn->prepare("SELECT pembelianID FROM pembelian WHERE noFaktur = ? AND supplierID = ? LIMIT 1");
    $stmt->execute([$noFaktur, $supplierID]);
    if ($stmt->fetch(PDO::FETCH_ASSOC)) {
      throw new Exception("No faktur sudah digunakan untuk supplier ini");
    }

    $totalItems = 0;
    $subTotal = 0.0; // total sebelum diskon item
    $totalDiskonPembelian = 0.0;
    $processedItems = [];

    foreach ($items as $it) {
      $varianID = isset($it['varianID']) ? intval($it['varianID']) : 0;
      $qty = isset($it['qty']) ? intval($it['qty']) : 0;
      $hargaBeli = isset($it['hargaBeli']) ? floatval($it['hargaBeli']) : 0.0;
      $diskonType = isset($it['diskonType']) ? strtoupper(trim((string)$it['diskonType'])) : 'NOMINAL';
      $diskonValue = isset($it['diskonValue']) ? floatval($it['diskonValue']) : 0.0;

      if (!$varianID || $qty <= 0 || $hargaBeli < 0) {
        throw new Exception("Item pembelian tidak valid");
      }
      if ($diskonType !== 'NOMINAL' && $diskonType !== 'PERCENTAGE') {
        $diskonType = 'NOMINAL';
      }

      // pastikan varian ada
      $stmt = $conn->prepare("SELECT varianID FROM produkvarian WHERE varianID = ?");
      $stmt->execute([$varianID]);
      if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        throw new Exception("Varian tidak ditemukan: $varianID");
      }

      $subtotal = $hargaBeli * $qty;
      $diskonItem = calculateItemDiscount($qty, $hargaBeli, $diskonType, $diskonValue);
      $totalItems += $qty;
      $subTotal += $subtotal;
      $totalDiskonPembelian += $diskonItem;
      $processedItems[] = [
        "varianID" => $varianID,
        "qty" => $qty,
        "hargaBeli" => $hargaBeli,
        "subtotal" => $subtotal,
        "diskonType" => $diskonType,
        "diskonValue" => max(0, $diskonValue),
        "diskonItem" => $diskonItem,
        "subtotalNet" => max(0, $subtotal - $diskonItem),
      ];
    }

    $subTotalSetelahDiskon = max(0, $subTotal - $totalDiskonPembelian);
    $ppnValue = $subTotalSetelahDiskon * max(0, $ppnPersen) / 100;
    $grandTotal = $subTotalSetelahDiskon + max(0, $ongkir) + $ppnValue;

    $conn->beginTransaction();

    // transaksi header
    $stmt = $conn->prepare("INSERT INTO transaksi (tanggal, jumlah, hargaSatuan, total, karyawanID, varianID) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
      $tanggalTerima ?: date('Y-m-d'),
      $totalItems,
      0,
      $grandTotal,
      $karyawanID,
      0
    ]);
    $transaksiID = intval($conn->lastInsertId());

    // detail + update stok naik
    foreach ($processedItems as $it) {
      $varianID = intval($it['varianID']);
      $qty = intval($it['qty']);
      $hargaBeli = floatval($it['hargaBeli']);
      $subtotalNet = floatval($it['subtotalNet']);

      $stmt = $conn->prepare("INSERT INTO detail_transaksi (jumlah, hargaSatuan, subtotal, transaksiID, varianID) VALUES (?, ?, ?, ?, ?)");
      $stmt->execute([$qty, $hargaBeli, $subtotalNet, $transaksiID, $varianID]);

      $diskonItem = floatval($it['diskonItem']);
      if ($diskonItem > 0) {
        $diskonNama = "DISKON PB V{$varianID} {$noFaktur}";
        $diskonTipe = $it['diskonType'] === 'PERCENTAGE' ? 'PERCENTAGE' : 'NOMINAL';
        $nilaiDiskon = floatval($it['diskonValue']);
        $keterangan = "Pembelian {$noFaktur} | Varian {$varianID} | Nilai terapkan: {$diskonItem}";

        $stmt = $conn->prepare("INSERT INTO diskon (namaDiskon, tipeDiskon, nilaiDiskon, keterangan) VALUES (?, ?, ?, ?)");
        $stmt->execute([$diskonNama, $diskonTipe, $nilaiDiskon, $keterangan]);
        $diskonID = intval($conn->lastInsertId());

        $stmt = $conn->prepare("INSERT INTO transaksi_diskon (totalDiskon, tanggalTerapkan, transaksiID, diskonID) VALUES (?, ?, ?, ?)");
        $stmt->execute([$diskonItem, date('Y-m-d H:i:s'), $transaksiID, $diskonID]);
      }

      $stmt = $conn->prepare("SELECT stokID, jumlah FROM stok WHERE varianID = ? AND lokasi = ?");
      $stmt->execute([$varianID, $cabang]);
      $stok = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($stok) {
        $stmt = $conn->prepare("UPDATE stok SET jumlah = jumlah + ?, tanggalUpdate = ? WHERE stokID = ?");
        $stmt->execute([$qty, date('Y-m-d H:i:s'), $stok['stokID']]);
      } else {
        $stmt = $conn->prepare("INSERT INTO stok (jumlah, tanggalUpdate, lokasi, varianID) VALUES (?, ?, ?, ?)");
        $stmt->execute([$qty, date('Y-m-d H:i:s'), $cabang, $varianID]);
      }
    }

    // pembelian
    $stmt = $conn->prepare("
      INSERT INTO pembelian (noFaktur, tanggalFaktur, tanggalTerima, jatuhTempo, status, ongkir, ppnPersen, catatan, lokasi, transaksiID, supplierID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
      $noFaktur,
      $tanggalFaktur ?: null,
      $tanggalTerima ?: date('Y-m-d'),
      $jatuhTempo ?: null,
      $status ?: 'Diterima',
      max(0, $ongkir),
      max(0, $ppnPersen),
      $catatan ?: null,
      $cabang,
      $transaksiID,
      $supplierID
    ]);
    $pembelianID = intval($conn->lastInsertId());

    // laporan pembelian
    $stmt = $conn->prepare("INSERT INTO laporan (periode, tanggalBuat, ownerID) VALUES (?, ?, ?)");
    $stmt->execute(['Harian', date('Y-m-d H:i:s'), $ownerID]);
    $laporanID = intval($conn->lastInsertId());

    $stmt = $conn->prepare("
      INSERT INTO laporan_pembelian (totalPembelian, jumlahItem, diskonPembelian, lokasi, laporanID, pembelianID)
      VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
      $grandTotal,
      $totalItems,
      $totalDiskonPembelian,
      $cabang,
      $laporanID,
      $pembelianID
    ]);

    $conn->commit();

    echo json_encode([
      "success" => true,
      "message" => "Input pembelian berhasil disimpan",
      "data" => [
        "transaksiID" => $transaksiID,
        "pembelianID" => $pembelianID,
        "lokasi" => $cabang,
        "subTotal" => $subTotal,
        "subTotalSetelahDiskon" => $subTotalSetelahDiskon,
        "ongkir" => max(0, $ongkir),
        "ppnPersen" => max(0, $ppnPersen),
        "ppnValue" => $ppnValue,
        "diskonPembelian" => $totalDiskonPembelian,
        "totalPembelian" => $grandTotal,
        "jumlahItem" => $totalItems
      ]
    ]);
  } catch (Exception $e) {
    if ($conn->inTransaction()) {
      $conn->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Gagal input pembelian: " . $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
?>

