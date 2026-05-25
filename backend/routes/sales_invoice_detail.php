<?php
require_once '../config/db_connect.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
  exit();
}

$penjualanID = isset($_GET['penjualanID']) ? intval($_GET['penjualanID']) : 0;
if (!$penjualanID) {
  echo json_encode(["success" => false, "message" => "penjualanID wajib"]);
  exit();
}

try {
  $stmt = $conn->prepare("
    SELECT
      pj.penjualanID,
      pj.namaPembeli,
      pj.jenisPenjualan,
      pj.metodePembayaran,
      pj.catatan,
      pj.status,
      pj.lokasi,
      pj.transaksiID,
      t.tanggal,
      t.jumlah AS jumlahItemTransaksi,
      t.total AS totalTransaksi
    FROM penjualan pj
    INNER JOIN transaksi t ON pj.transaksiID = t.transaksiID
    WHERE pj.penjualanID = ?
    LIMIT 1
  ");
  $stmt->execute([$penjualanID]);
  $header = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$header) {
    echo json_encode(["success" => false, "message" => "Penjualan tidak ditemukan"]);
    exit();
  }

  $stmt = $conn->prepare("
    SELECT
      lp.laporanPenjualanID,
      lp.totalPenjualan,
      lp.totalDiskon,
      lp.jumlahItem,
      l.tanggalBuat
    FROM laporan_penjualan lp
    LEFT JOIN laporan l ON lp.laporanID = l.laporanID
    WHERE lp.penjualanID = ?
    ORDER BY lp.laporanPenjualanID DESC
    LIMIT 1
  ");
  $stmt->execute([$penjualanID]);
  $lap = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($lap) {
    $header['laporanPenjualanID'] = $lap['laporanPenjualanID'];
    $header['totalPenjualan'] = $lap['totalPenjualan'];
    $header['totalDiskon'] = $lap['totalDiskon'];
    $header['jumlahItem'] = $lap['jumlahItem'];
    $header['tanggalBuat'] = $lap['tanggalBuat'];
    try {
      $stmtRet = $conn->prepare("
        SELECT COALESCE(SUM(nominalPengembalian), 0) AS totalPengembalian
        FROM returpenjualan
        WHERE penjualanID = ?
      ");
      $stmtRet->execute([$penjualanID]);
      $header['totalPengembalianKumulatif'] = floatval($stmtRet->fetchColumn() ?? 0);
    } catch (Exception $e) {
      $header['totalPengembalianKumulatif'] = 0;
    }
  } else {
    $header['totalPenjualan'] = $header['totalTransaksi'];
    $header['totalDiskon'] = 0;
    $header['jumlahItem'] = $header['jumlahItemTransaksi'];
    $header['tanggalBuat'] = $header['tanggal'];
    $header['totalPengembalianKumulatif'] = 0;
  }

  $transaksiID = intval($header['transaksiID'] ?? 0);
  $items = [];

  if ($transaksiID) {
    $stmt = $conn->prepare("
      SELECT
        dt.detailTransaksiID,
        dt.varianID,
        dt.jumlah,
        dt.hargaSatuan,
        dt.subtotal,
        pv.namaVarian,
        pr.namaProduk,
        (
          SELECT COALESCE(SUM(r.jumlah), 0)
          FROM returpenjualan r
          WHERE r.penjualanID = ? AND r.varianID = dt.varianID
        ) AS qtyRetur
      FROM detail_transaksi dt
      LEFT JOIN produkvarian pv ON dt.varianID = pv.varianID
      LEFT JOIN produk pr ON pv.produkID = pr.produkID
      WHERE dt.transaksiID = ?
      ORDER BY dt.detailTransaksiID ASC
    ");
    $stmt->execute([$penjualanID, $transaksiID]);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
      $jumlahAsli = intval($row['jumlah'] ?? 0);
      $qtyRetur = floatval($row['qtyRetur'] ?? 0);
      $jumlahTersisa = max(0, $jumlahAsli - (int)round($qtyRetur));
      $subAsli = floatval($row['subtotal'] ?? 0);
      $row['jumlahTersisa'] = $jumlahTersisa;
      $row['subtotalTersisa'] = $jumlahAsli > 0
        ? round(($jumlahTersisa / $jumlahAsli) * $subAsli, 2)
        : 0.0;
      unset($row['qtyRetur']);
      $items[] = $row;
    }
  }

  echo json_encode([
    "success" => true,
    "data" => [
      "header" => $header,
      "items" => $items
    ]
  ]);
} catch (Exception $e) {
  echo json_encode(["success" => false, "message" => "Gagal memuat detail: " . $e->getMessage()]);
}
