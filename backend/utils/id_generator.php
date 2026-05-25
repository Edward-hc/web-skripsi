<?php
/**
 * Helper functions untuk generate ID otomatis
 */

/**
 * Generate CabangID dengan format C001, C002, dst
 */
function generateCabangID($conn) {
  try {
    // Ambil ID terakhir
    $stmt = $conn->query("SELECT cabangID FROM cabang ORDER BY cabangID DESC LIMIT 1");
    $lastID = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($lastID) {
      // Extract number dari ID terakhir (misal: C001 -> 001)
      $lastNumber = intval(substr($lastID['cabangID'], 1));
      $newNumber = $lastNumber + 1;
    } else {
      // Jika belum ada data, mulai dari 1
      $newNumber = 1;
    }
    
    // Format dengan padding 3 digit: C001, C002, dst
    return 'C' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
  } catch (Exception $e) {
    // Fallback: generate berdasarkan timestamp jika error
    return 'C' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
  }
}

/**
 * Generate ID dengan format custom
 * @param string $prefix Prefix untuk ID (misal: 'C', 'P', 'V')
 * @param string $tableName Nama tabel
 * @param string $idColumn Nama kolom ID
 * @param int $padding Jumlah digit padding (default: 3)
 */
function generateCustomID($conn, $prefix, $tableName, $idColumn, $padding = 3) {
  try {
    // Ambil ID terakhir
    $stmt = $conn->query("SELECT $idColumn FROM $tableName ORDER BY $idColumn DESC LIMIT 1");
    $lastID = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($lastID) {
      // Extract number dari ID terakhir
      $lastNumber = intval(substr($lastID[$idColumn], strlen($prefix)));
      $newNumber = $lastNumber + 1;
    } else {
      // Jika belum ada data, mulai dari 1
      $newNumber = 1;
    }
    
    // Format dengan padding
    return $prefix . str_pad($newNumber, $padding, '0', STR_PAD_LEFT);
  } catch (Exception $e) {
    // Fallback: generate berdasarkan timestamp jika error
    return $prefix . str_pad(rand(1, pow(10, $padding) - 1), $padding, '0', STR_PAD_LEFT);
  }
}
?>

