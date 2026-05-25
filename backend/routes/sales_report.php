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

// GET - Ambil laporan penjualan
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    $periode = $_GET['periode'] ?? null;
    $filterValue = $_GET['filterValue'] ?? null;
    
    // Query dasar dengan JOIN ke tabel laporan untuk mendapatkan periode
    $sql = "
      SELECT 
        lp.laporanPenjualanID,
        lp.totalPembelian,
        lp.totalPenjualan,
        lp.totalDiskon,
        lp.jumlahItem,
        lp.lokasi,
        l.periode,
        l.tanggalBuat,
        DATE_FORMAT(l.tanggalBuat, '%H:%i:%s') AS waktu,
        pj.penjualanID,
        pj.transaksiID,
        pj.namaPembeli,
        pj.jenisPenjualan,
        pj.metodePembayaran,
        t.karyawanID,
        CONCAT(COALESCE(u.fname, ''), ' ', COALESCE(u.lname, '')) AS namaKasir
      FROM laporan_penjualan lp
      LEFT JOIN laporan l ON lp.laporanID = l.laporanID
      LEFT JOIN penjualan pj ON lp.penjualanID = pj.penjualanID
      LEFT JOIN transaksi t ON pj.transaksiID = t.transaksiID
      LEFT JOIN karyawan k ON t.karyawanID = k.karyawanID
      LEFT JOIN user u ON k.userID = u.userID
    ";
    
    // Filter berdasarkan periode jika ada
    if ($filterValue) {
      if ($periode === 'Harian') {
        $formatted = date('Y-m-d', strtotime($filterValue));
        $sql .= " WHERE DATE(l.tanggalBuat) = '$formatted'";
      } elseif ($periode === 'Bulanan') {
        // Format: YYYY-MM
        $year = date('Y', strtotime($filterValue . '-01'));
        $month = date('m', strtotime($filterValue . '-01'));
        $sql .= " WHERE YEAR(l.tanggalBuat) = $year AND MONTH(l.tanggalBuat) = $month";
      } elseif ($periode === 'Tahunan') {
        // Format: YYYY
        $year = intval($filterValue);
        $sql .= " WHERE YEAR(l.tanggalBuat) = $year";
      }
    } elseif ($periode) {
      if ($periode === 'Harian') {
        $sql .= " WHERE DATE(l.tanggalBuat) = CURDATE()";
      } elseif ($periode === 'Bulanan') {
        $sql .= " WHERE YEAR(l.tanggalBuat) = YEAR(CURDATE()) AND MONTH(l.tanggalBuat) = MONTH(CURDATE())";
      } elseif ($periode === 'Tahunan') {
        $sql .= " WHERE YEAR(l.tanggalBuat) = YEAR(CURDATE())";
      }
    }
    
    $sql .= " ORDER BY lp.laporanPenjualanID DESC";
    
    $result = $conn->query($sql);
    
    $reports = [];
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
      // Format periode: selalu tampilkan tanggal lengkap (konsisten).
      $tanggalBuat = $row['tanggalBuat'] ?? date('Y-m-d');
      $row['periode'] = date('Y-m-d', strtotime($tanggalBuat));
      
      $row['namaKasir'] = trim($row['namaKasir'] ?? '') ?: '-';
      $reports[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $reports]);
  } catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Gagal memuat laporan penjualan: " . $e->getMessage()]);
  }
  exit();
}
?>

