<?php
function produkvarianColumnExists($conn, $dbName, $col) {
  $s = $conn->prepare("
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'produkvarian' AND COLUMN_NAME = ?
  ");
  $s->execute([$dbName, $col]);
  return (int) $s->fetchColumn() > 0;
}

function dropProdukvarianHargaColumn($conn, $dbName) {
  if (!produkvarianColumnExists($conn, $dbName, 'harga')) {
    return;
  }
  $conn->exec("ALTER TABLE produkvarian DROP COLUMN harga");
}

function ensureProdukvarianPriceSchema($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) {
      return;
    }

    $hasHarga = produkvarianColumnExists($conn, $dbName, 'harga');
    $after = $hasHarga ? 'harga' : 'namaVarian';

    $required = [
      'hargaJual' => "ALTER TABLE produkvarian ADD COLUMN hargaJual DECIMAL(10,2) NULL AFTER {$after}",
      'hargaReseller' => 'ALTER TABLE produkvarian ADD COLUMN hargaReseller DECIMAL(10,2) NULL AFTER hargaJual',
      'hargaModal' => 'ALTER TABLE produkvarian ADD COLUMN hargaModal DECIMAL(10,2) NULL AFTER hargaReseller',
    ];

    foreach ($required as $col => $alterSql) {
      if (!produkvarianColumnExists($conn, $dbName, $col)) {
        $conn->exec($alterSql);
      }
    }

    if ($hasHarga) {
      $conn->exec('UPDATE produkvarian SET hargaJual = harga WHERE hargaJual IS NULL');
      $conn->exec('UPDATE produkvarian SET hargaReseller = harga WHERE hargaReseller IS NULL');
      $conn->exec('UPDATE produkvarian SET hargaModal = harga WHERE hargaModal IS NULL');
      dropProdukvarianHargaColumn($conn, $dbName);
    }
  } catch (Exception $e) {
    // Jangan block endpoint kalau alter gagal
  }
}
