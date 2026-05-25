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

function ensureReturPenjualanDisposisiColumn($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;
    $stmt = $conn->prepare("
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'returpenjualan' AND COLUMN_NAME = 'disposisiBarang'
    ");
    $stmt->execute([$dbName]);
    if ((int)$stmt->fetchColumn() === 0) {
      $conn->exec("
        ALTER TABLE returpenjualan
        ADD COLUMN disposisiBarang ENUM('KEMBALI_STOK','BARANG_RUSAK') NOT NULL DEFAULT 'KEMBALI_STOK' AFTER alasan
      ");
    }
  } catch (Exception $e) {
    // ignore
  }
}

function ensureReturPenjualanNominalColumn($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;
    $stmt = $conn->prepare("
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'returpenjualan' AND COLUMN_NAME = 'nominalPengembalian'
    ");
    $stmt->execute([$dbName]);
    if ((int)$stmt->fetchColumn() === 0) {
      $conn->exec("
        ALTER TABLE returpenjualan
        ADD COLUMN nominalPengembalian DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER disposisiBarang
      ");
    }
  } catch (Exception $e) {
    // ignore
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);

  $userID = isset($data['userID']) ? intval($data['userID']) : 0;
  $penjualanID = isset($data['penjualanID']) ? intval($data['penjualanID']) : 0;
  $tanggalRetur = trim((string)($data['tanggalRetur'] ?? date('Y-m-d')));
  $lokasi = trim((string)($data['lokasi'] ?? ''));
  $alasan = trim((string)($data['alasan'] ?? ''));
  $disposisiRaw = strtoupper(trim((string)($data['disposisiBarang'] ?? 'KEMBALI_STOK')));
  $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];

  $disposisiBarang = ($disposisiRaw === 'BARANG_RUSAK') ? 'BARANG_RUSAK' : 'KEMBALI_STOK';

  if (!$userID || !$penjualanID || !$tanggalRetur || $alasan === '' || count($items) === 0) {
    echo json_encode(["success" => false, "message" => "userID, penjualanID, tanggalRetur, alasan, dan items wajib diisi"]);
    exit();
  }

  try {
    ensureKaryawanCabangColumn($conn);
    ensureStokJumlahRusakColumn($conn);
    ensureReturPenjualanDisposisiColumn($conn);
    ensureReturPenjualanNominalColumn($conn);

    $stmtK = $conn->prepare("SELECT karyawanID, cabang, status FROM karyawan WHERE userID = ?");
    $stmtK->execute([$userID]);
    $karyawan = $stmtK->fetch(PDO::FETCH_ASSOC);
    if (!$karyawan) {
      throw new Exception("Karyawan tidak ditemukan");
    }
    if (strtolower(trim((string)($karyawan['status'] ?? ''))) === 'tidak aktif') {
      throw new Exception("Karyawan tidak aktif");
    }
    $cabang = $karyawan['cabang'] ?? '';
    if (!$cabang) {
      throw new Exception("Cabang karyawan belum diisi. Silakan isi cabang di Manajemen Akun.");
    }

    $lokasiRetur = $lokasi ?: $cabang;
    if ($lokasiRetur !== $cabang) {
      $lokasiRetur = $cabang;
    }

    $stmtInv = $conn->prepare("SELECT penjualanID, transaksiID, lokasi FROM penjualan WHERE penjualanID = ? AND lokasi = ?");
    $stmtInv->execute([$penjualanID, $cabang]);
    $invoice = $stmtInv->fetch(PDO::FETCH_ASSOC);
    if (!$invoice) {
      throw new Exception("Penjualan tidak ditemukan untuk cabang ini");
    }

    $validatedItems = [];
    $totalRefundNet = 0.0;
    $totalRefundDiskon = 0.0;
    $totalQtyItem = 0;

    foreach ($items as $it) {
      $varianID = isset($it['varianID']) ? intval($it['varianID']) : 0;
      $qtyRetur = isset($it['qty']) ? intval($it['qty']) : 0;
      if (!$varianID || $qtyRetur <= 0) {
        throw new Exception("Item retur tidak valid");
      }

      $stmtPur = $conn->prepare("
        SELECT jumlah, hargaSatuan, subtotal
        FROM detail_transaksi
        WHERE transaksiID = ? AND varianID = ?
      ");
      $stmtPur->execute([$invoice['transaksiID'], $varianID]);
      $det = $stmtPur->fetch(PDO::FETCH_ASSOC);
      if (!$det) {
        throw new Exception("Detail penjualan tidak ditemukan untuk varianID $varianID");
      }

      $lineQty = intval($det['jumlah']);
      $hargaSatuan = floatval($det['hargaSatuan']);
      $subtotalLine = floatval($det['subtotal']);
      if ($lineQty <= 0) {
        throw new Exception("Data qty baris tidak valid untuk varianID $varianID");
      }

      $stmtRet = $conn->prepare("
        SELECT COALESCE(SUM(jumlah), 0)
        FROM returpenjualan
        WHERE penjualanID = ? AND varianID = ?
      ");
      $stmtRet->execute([$penjualanID, $varianID]);
      $returnedQty = intval($stmtRet->fetchColumn() ?? 0);

      $remainingQty = $lineQty - $returnedQty;
      if ($remainingQty < 0) {
        $remainingQty = 0;
      }
      if ($qtyRetur > $remainingQty) {
        throw new Exception("Qty retur melebihi sisa yang boleh diretur untuk varianID $varianID");
      }

      $grossLine = $hargaSatuan * $lineQty;
      $diskonLine = max(0, $grossLine - $subtotalLine);
      $ratio = $qtyRetur / $lineQty;
      $refundNet = round($ratio * $subtotalLine, 2);
      $refundDiskon = round($ratio * $diskonLine, 2);

      $totalRefundNet += $refundNet;
      $totalRefundDiskon += $refundDiskon;
      $totalQtyItem += $qtyRetur;

      $validatedItems[] = [
        "varianID" => $varianID,
        "qtyRetur" => $qtyRetur,
        "nominalPengembalian" => $refundNet,
        "refundDiskon" => $refundDiskon
      ];
    }

    $stmtLP = $conn->prepare("
      SELECT laporanPenjualanID, totalPenjualan, totalDiskon, jumlahItem
      FROM laporan_penjualan
      WHERE penjualanID = ?
      LIMIT 1
    ");
    $stmtLP->execute([$penjualanID]);
    $lpRow = $stmtLP->fetch(PDO::FETCH_ASSOC);
    if (!$lpRow) {
      throw new Exception("Data laporan penjualan tidak ditemukan; tidak dapat mencatat pengembalian dana.");
    }

    $curNet = floatval($lpRow['totalPenjualan']);
    $curDisk = floatval($lpRow['totalDiskon']);
    $curJi = intval($lpRow['jumlahItem']);

    if ($totalRefundNet - $curNet > 0.02) {
      throw new Exception("Nominal pengembalian melebihi sisa total penjualan di laporan.");
    }
    if ($totalRefundDiskon - $curDisk > 0.02) {
      throw new Exception("Koreksi diskon retur tidak valid.");
    }
    if ($totalQtyItem > $curJi) {
      throw new Exception("Qty item retur melebihi jumlah item di laporan.");
    }

    $conn->beginTransaction();

    foreach ($validatedItems as $v) {
      if ($disposisiBarang === 'KEMBALI_STOK') {
        $stmtSt = $conn->prepare("SELECT stokID FROM stok WHERE varianID = ? AND lokasi = ?");
        $stmtSt->execute([$v['varianID'], $lokasiRetur]);
        $stokRow = $stmtSt->fetch(PDO::FETCH_ASSOC);
        if ($stokRow) {
          $stmtUp = $conn->prepare("UPDATE stok SET jumlah = jumlah + ?, tanggalUpdate = ? WHERE varianID = ? AND lokasi = ?");
          $stmtUp->execute([$v['qtyRetur'], date('Y-m-d H:i:s'), $v['varianID'], $lokasiRetur]);
        } else {
          $stmtIns = $conn->prepare("INSERT INTO stok (jumlah, jumlahRusak, tanggalUpdate, lokasi, varianID) VALUES (?, 0, ?, ?, ?)");
          $stmtIns->execute([$v['qtyRetur'], date('Y-m-d H:i:s'), $lokasiRetur, $v['varianID']]);
        }
      } else {
        $stmtSt = $conn->prepare("SELECT stokID FROM stok WHERE varianID = ? AND lokasi = ?");
        $stmtSt->execute([$v['varianID'], $lokasiRetur]);
        $stokRow = $stmtSt->fetch(PDO::FETCH_ASSOC);
        if ($stokRow) {
          $stmtUp = $conn->prepare("
            UPDATE stok SET jumlahRusak = COALESCE(jumlahRusak, 0) + ?, tanggalUpdate = ? WHERE varianID = ? AND lokasi = ?
          ");
          $stmtUp->execute([$v['qtyRetur'], date('Y-m-d H:i:s'), $v['varianID'], $lokasiRetur]);
        } else {
          $stmtIns = $conn->prepare("INSERT INTO stok (jumlah, jumlahRusak, tanggalUpdate, lokasi, varianID) VALUES (0, ?, ?, ?, ?)");
          $stmtIns->execute([$v['qtyRetur'], date('Y-m-d H:i:s'), $lokasiRetur, $v['varianID']]);
        }
      }

      $stmtInsR = $conn->prepare("
        INSERT INTO returpenjualan (jumlah, alasan, disposisiBarang, nominalPengembalian, tanggalRetur, lokasi, varianID, penjualanID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ");
      $stmtInsR->execute([
        $v['qtyRetur'],
        $alasan,
        $disposisiBarang,
        $v['nominalPengembalian'],
        $tanggalRetur,
        $lokasiRetur,
        $v['varianID'],
        $penjualanID
      ]);
    }

    $newTotalPenjualan = max(0, round($curNet - $totalRefundNet, 2));
    $newTotalDiskon = max(0, round($curDisk - $totalRefundDiskon, 2));
    $newJumlahItem = max(0, $curJi - $totalQtyItem);

    $stmtUpLp = $conn->prepare("
      UPDATE laporan_penjualan
      SET totalPenjualan = ?, totalDiskon = ?, jumlahItem = ?
      WHERE laporanPenjualanID = ?
    ");
    $stmtUpLp->execute([
      $newTotalPenjualan,
      $newTotalDiskon,
      $newJumlahItem,
      $lpRow['laporanPenjualanID']
    ]);

    $conn->commit();

    echo json_encode([
      "success" => true,
      "message" => "Retur penjualan berhasil. Pengembalian dana (net) otomatis mengurangi laporan penjualan.",
      "data" => [
        "totalPengembalianDana" => round($totalRefundNet, 2),
        "totalKoreksiDiskon" => round($totalRefundDiskon, 2),
        "qtyItemDikurangi" => $totalQtyItem,
        "laporanSetelahRetur" => [
          "totalPenjualan" => $newTotalPenjualan,
          "totalDiskon" => $newTotalDiskon,
          "jumlahItem" => $newJumlahItem
        ]
      ]
    ]);
  } catch (Exception $e) {
    if ($conn->inTransaction()) {
      $conn->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Gagal menyimpan retur penjualan: " . $e->getMessage()]);
  }
  exit();
}

echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
