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

function purchaseAmountBreakdown($grandTotal, $ongkir, $ppnPersen) {
  $grand = floatval($grandTotal);
  $ong = max(0, floatval($ongkir));
  $ppnP = max(0, floatval($ppnPersen));
  $totalBarangTermasukPpn = max(0, $grand - $ong);
  $divisor = 1 + $ppnP / 100;
  $subtotalSetelahDiskon = $divisor > 0 ? $totalBarangTermasukPpn / $divisor : $totalBarangTermasukPpn;
  $ppnNominal = max(0, $totalBarangTermasukPpn - $subtotalSetelahDiskon);
  return [
    'subtotalSetelahDiskon' => round($subtotalSetelahDiskon, 2),
    'totalBarangTermasukPpn' => round($totalBarangTermasukPpn, 2),
    'ppnNominal' => round($ppnNominal, 2),
  ];
}

$pembelianID = isset($_GET['pembelianID']) ? intval($_GET['pembelianID']) : 0;
if (!$pembelianID) {
  echo json_encode(["success" => false, "message" => "pembelianID wajib"]);
  exit();
}

try {
  $stmt = $conn->prepare("
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
      p.transaksiID,
      p.supplierID,
      s.nama AS supplierName,
      COALESCE(lp.totalPembelian, t.total, 0) AS totalPembelian,
      COALESCE(lp.jumlahItem, t.jumlah, 0) AS jumlahItem,
      COALESCE(lp.diskonPembelian, td.totalDiskon, 0) AS diskonPembelian
    FROM pembelian p
    LEFT JOIN supplier s ON p.supplierID = s.supplierID
    LEFT JOIN laporan_pembelian lp ON p.pembelianID = lp.pembelianID
    LEFT JOIN transaksi t ON p.transaksiID = t.transaksiID
    LEFT JOIN (
      SELECT transaksiID, SUM(totalDiskon) AS totalDiskon
      FROM transaksi_diskon
      GROUP BY transaksiID
    ) td ON td.transaksiID = p.transaksiID
    WHERE p.pembelianID = ?
    LIMIT 1
  ");
  $stmt->execute([$pembelianID]);
  $header = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$header) {
    echo json_encode(["success" => false, "message" => "Pembelian tidak ditemukan"]);
    exit();
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
        COALESCE((
          SELECT SUM(r.jumlah)
          FROM retursupplier r
          WHERE r.pembelianID = ? AND r.varianID = dt.varianID
        ), 0) AS qtyRetur
      FROM detail_transaksi dt
      LEFT JOIN produkvarian pv ON dt.varianID = pv.varianID
      LEFT JOIN produk pr ON pv.produkID = pr.produkID
      WHERE dt.transaksiID = ?
      ORDER BY dt.detailTransaksiID ASC
    ");
    $stmt->execute([$pembelianID, $transaksiID]);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
      $jumlah = intval($row['jumlah'] ?? 0);
      $qtyRetur = intval($row['qtyRetur'] ?? 0);
      $row['qtySisa'] = max(0, $jumlah - $qtyRetur);
      $items[] = $row;
    }
  }

  $totalQtyRetur = 0;
  foreach ($items as $it) {
    $totalQtyRetur += intval($it['qtyRetur'] ?? 0);
  }
  $header['totalQtyRetur'] = $totalQtyRetur;

  $bd = purchaseAmountBreakdown(
    $header['totalPembelian'] ?? 0,
    $header['ongkir'] ?? 0,
    $header['ppnPersen'] ?? 0
  );
  $header['subtotalSetelahDiskon'] = $bd['subtotalSetelahDiskon'];
  $header['totalBarangTermasukPpn'] = $bd['totalBarangTermasukPpn'];
  $header['ppnNominal'] = $bd['ppnNominal'];

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
