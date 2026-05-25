<?php
/**
 * Helper functions untuk mengelola file JSON sebagai storage
 */

/**
 * Baca data dari file JSON
 */
function readJSON($filename) {
  $filepath = __DIR__ . '/../data/' . $filename;
  
  // Buat direktori jika belum ada
  $dir = dirname($filepath);
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  
  // Jika file belum ada, buat file kosong
  if (!file_exists($filepath)) {
    file_put_contents($filepath, json_encode([]));
    return [];
  }
  
  $content = file_get_contents($filepath);
  $data = json_decode($content, true);
  
  return $data === null ? [] : $data;
}

/**
 * Tulis data ke file JSON
 */
function writeJSON($filename, $data) {
  $filepath = __DIR__ . '/../data/' . $filename;
  
  // Buat direktori jika belum ada
  $dir = dirname($filepath);
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
  return file_put_contents($filepath, $json) !== false;
}

/**
 * Generate CabangID dengan format C001, C002, dst
 */
function generateCabangID($branches) {
  if (empty($branches)) {
    return 'C001';
  }
  
  // Ambil semua cabangID dan extract nomor
  $numbers = [];
  foreach ($branches as $branch) {
    if (isset($branch['cabangID'])) {
      $num = intval(substr($branch['cabangID'], 1));
      $numbers[] = $num;
    }
  }
  
  // Cari nomor terbesar
  $maxNumber = !empty($numbers) ? max($numbers) : 0;
  $newNumber = $maxNumber + 1;
  
  // Format dengan padding 3 digit
  return 'C' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
}
?>

