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

function ensurePembelianInvoiceColumns($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;

    $required = [
      "tanggalFaktur" => "ALTER TABLE pembelian ADD COLUMN tanggalFaktur DATE NULL AFTER noFaktur",
      "jatuhTempo" => "ALTER TABLE pembelian ADD COLUMN jatuhTempo DATE NULL AFTER tanggalTerima",
      "ongkir" => "ALTER TABLE pembelian ADD COLUMN ongkir DECIMAL(10,2) NULL DEFAULT 0 AFTER status",
      "ppnPersen" => "ALTER TABLE pembelian ADD COLUMN ppnPersen DECIMAL(5,2) NULL DEFAULT 0 AFTER ongkir",
      "catatan" => "ALTER TABLE pembelian ADD COLUMN catatan TEXT NULL AFTER ppnPersen",
      "metodePembayaran" => "ALTER TABLE pembelian ADD COLUMN metodePembayaran VARCHAR(30) NOT NULL DEFAULT 'Transfer'"
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
    // ignore
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
    // ignore
  }
}

// GET - Ambil laporan pembelian
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    ensurePembelianInvoiceColumns($conn);
    ensureLaporanPembelianColumns($conn);

    $filterType = $_GET['filterType'] ?? 'Harian';
    $filterValue = $_GET['filterValue'] ?? null;
    $sql = "
      SELECT 
        p.pembelianID,
        p.noFaktur,
        p.tanggalFaktur,
        p.tanggalTerima,
        p.jatuhTempo,
        p.status,
        p.ongkir,
        p.ppnPersen,
        p.catatan,
        p.lokasi,
        COALESCE(p.metodePembayaran, '') AS metodePembayaran,
        s.nama AS supplierName,
        COALESCE(lp.totalPembelian, t.total, 0) AS totalPembelian,
        COALESCE(lp.jumlahItem, t.jumlah, 0) AS jumlahItem,
        COALESCE(lp.diskonPembelian, td.totalDiskon, 0) AS diskonPembelian,
        COALESCE(rs.totalQtyRetur, 0) AS totalQtyRetur
      FROM pembelian p
      LEFT JOIN (
        SELECT pembelianID, SUM(jumlah) AS totalQtyRetur
        FROM retursupplier
        GROUP BY pembelianID
      ) rs ON rs.pembelianID = p.pembelianID
      LEFT JOIN supplier s ON p.supplierID = s.supplierID
      LEFT JOIN laporan_pembelian lp ON p.pembelianID = lp.pembelianID
      LEFT JOIN transaksi t ON p.transaksiID = t.transaksiID
      LEFT JOIN (
        SELECT transaksiID, SUM(totalDiskon) AS totalDiskon
        FROM transaksi_diskon
        GROUP BY transaksiID
      ) td ON td.transaksiID = p.transaksiID
    ";

    if ($filterValue) {
      $date = date('Y-m-d', strtotime($filterValue));
      if ($filterType === 'Harian') {
        $sql .= " WHERE DATE(p.tanggalTerima) = '$date'";
      } elseif ($filterType === 'Bulanan') {
        $year = date('Y', strtotime($filterValue));
        $month = date('m', strtotime($filterValue));
        $sql .= " WHERE YEAR(p.tanggalTerima) = $year AND MONTH(p.tanggalTerima) = $month";
      } elseif ($filterType === 'Tahunan') {
        $year = date('Y', strtotime($filterValue));
        $sql .= " WHERE YEAR(p.tanggalTerima) = $year";
      }
    }

    $sql .= " ORDER BY p.pembelianID DESC";

    $result = $conn->query($sql);
    $reports = [];
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
      $reports[] = $row;
    }

    echo json_encode(["success" => true, "data" => $reports]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat laporan pembelian: " . $e->getMessage()]);
  }
  exit();
}
?>

