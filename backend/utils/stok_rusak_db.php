<?php
function ensureStokJumlahRusakColumn($conn) {
  try {
    $db = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$db) return;
    $s = $conn->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='stok' AND COLUMN_NAME='jumlahRusak'");
    $s->execute([$db]);
    if (!(int)$s->fetchColumn()) {
      $conn->exec("ALTER TABLE stok ADD COLUMN jumlahRusak INT NOT NULL DEFAULT 0 AFTER jumlah");
    }
  } catch (Exception $e) { /* ignore */ }
}

function ensureStokRusakBuangTable($conn) {
  try {
    $db = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$db) return;
    $s = $conn->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='stok_rusak_buang'");
    $s->execute([$db]);
    if ((int)$s->fetchColumn()) return;
    $conn->exec("CREATE TABLE stok_rusak_buang (
      buangRusakID INT NOT NULL AUTO_INCREMENT, stokID INT NOT NULL, varianID INT NOT NULL,
      lokasi VARCHAR(50) NOT NULL, jumlah INT NOT NULL, keterangan TEXT NOT NULL,
      tanggalBuang DATETIME NOT NULL, userID INT NOT NULL,
      PRIMARY KEY (buangRusakID)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  } catch (Exception $e) { /* ignore */ }
}

function dropStokRusakBuangKaryawanColumn($conn) {
  try {
    $db = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$db) return;
    $fk = $conn->prepare("
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA=? AND TABLE_NAME='stok_rusak_buang' AND CONSTRAINT_NAME='fk_srb_karyawan'
    ");
    $fk->execute([$db]);
    if ((int)$fk->fetchColumn() > 0) {
      $conn->exec("ALTER TABLE stok_rusak_buang DROP FOREIGN KEY fk_srb_karyawan");
    }
    $col = $conn->prepare("
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA=? AND TABLE_NAME='stok_rusak_buang' AND COLUMN_NAME='karyawanID'
    ");
    $col->execute([$db]);
    if ((int)$col->fetchColumn() > 0) {
      $conn->exec("ALTER TABLE stok_rusak_buang DROP COLUMN karyawanID");
    }
  } catch (Exception $e) { /* ignore */ }
}

function ensureStokRusakBuangSchema($conn) {
  ensureStokRusakBuangTable($conn);
  dropStokRusakBuangKaryawanColumn($conn);
}

function isOwnerUser($conn, $userID) {
  try {
    $s = $conn->prepare("SELECT 1 FROM owner WHERE userID=? LIMIT 1");
    $s->execute([$userID]);
    return (bool)$s->fetchColumn();
  } catch (Exception $e) {
    return false;
  }
}

function requireOwnerForRusakManage($conn, $userID) {
  if (!$userID) {
    throw new Exception("userID wajib diisi");
  }
  if (!isOwnerUser($conn, $userID)) {
    throw new Exception("Hanya pemilik yang dapat mengelola barang rusak");
  }
}
