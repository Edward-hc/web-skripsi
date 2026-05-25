<?php
require_once '../config/db_connect.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json");

// Pastikan timestamp tersimpan dalam WIB
date_default_timezone_set('Asia/Jakarta');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

function ensureVariantPriceColumns($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;

    $required = [
      "hargaJual" => "ALTER TABLE produkvarian ADD COLUMN hargaJual DECIMAL(10,2) NULL AFTER harga",
      "hargaReseller" => "ALTER TABLE produkvarian ADD COLUMN hargaReseller DECIMAL(10,2) NULL AFTER hargaJual",
      "hargaModal" => "ALTER TABLE produkvarian ADD COLUMN hargaModal DECIMAL(10,2) NULL AFTER hargaReseller"
    ];

    foreach ($required as $col => $alterSql) {
      $stmt = $conn->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'produkvarian' AND COLUMN_NAME = ?
      ");
      $stmt->execute([$dbName, $col]);
      if ((int)$stmt->fetchColumn() === 0) {
        $conn->exec($alterSql);
      }
    }

    $conn->exec("UPDATE produkvarian SET hargaJual = harga WHERE hargaJual IS NULL");
    $conn->exec("UPDATE produkvarian SET hargaReseller = harga WHERE hargaReseller IS NULL");
    $conn->exec("UPDATE produkvarian SET hargaModal = harga WHERE hargaModal IS NULL");
  } catch (Exception $e) {
    // ignore
  }
}

function ensureMutationColumns($conn) {
  try {
    $dbName = $conn->query("SELECT DATABASE()")->fetchColumn();
    if (!$dbName) return;

    $required = [
      "noFakturMutasi" => "ALTER TABLE mutasistok ADD COLUMN noFakturMutasi VARCHAR(60) NULL AFTER mutasiID",
      "hargaSatuan" => "ALTER TABLE mutasistok ADD COLUMN hargaSatuan DECIMAL(10,2) NULL DEFAULT 0 AFTER jumlah",
      "totalMutasi" => "ALTER TABLE mutasistok ADD COLUMN totalMutasi DECIMAL(12,2) NULL DEFAULT 0 AFTER hargaSatuan",
      "ongkir" => "ALTER TABLE mutasistok ADD COLUMN ongkir DECIMAL(12,2) NULL DEFAULT 0 AFTER totalMutasi",
      "dasarHarga" => "ALTER TABLE mutasistok ADD COLUMN dasarHarga VARCHAR(30) NULL AFTER totalMutasi"
    ];

    foreach ($required as $col => $alterSql) {
      $stmt = $conn->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'mutasistok' AND COLUMN_NAME = ?
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

function generateMutationInvoiceNumber($conn) {
  $prefix = 'MUT-' . date('Ymd') . '-';
  $stmt = $conn->prepare("
    SELECT noFakturMutasi
    FROM mutasistok
    WHERE noFakturMutasi LIKE ?
    ORDER BY noFakturMutasi DESC
    LIMIT 1
  ");
  $stmt->execute([$prefix . '%']);
  $last = $stmt->fetchColumn();

  $next = 1;
  if ($last && strpos($last, $prefix) === 0) {
    $suffix = substr($last, strlen($prefix));
    $num = intval($suffix);
    if ($num > 0) $next = $num + 1;
  }

  return $prefix . str_pad((string)$next, 4, '0', STR_PAD_LEFT);
}

function normalizeMutationItems($data) {
  $items = [];

  if (isset($data['items']) && is_array($data['items']) && count($data['items']) > 0) {
    foreach ($data['items'] as $it) {
      $items[] = [
        'stokID' => isset($it['stokID']) ? intval($it['stokID']) : 0,
        'varianID' => isset($it['varianID']) ? intval($it['varianID']) : 0,
        'jumlah' => isset($it['jumlah']) ? intval($it['jumlah']) : 0,
        'hargaSatuan' => isset($it['hargaSatuan']) ? floatval($it['hargaSatuan']) : 0
      ];
    }
  } else {
    // Backward compatibility: payload lama 1 item
    $items[] = [
      'stokID' => isset($data['stokID']) ? intval($data['stokID']) : 0,
      'varianID' => isset($data['varianID']) ? intval($data['varianID']) : 0,
      'jumlah' => isset($data['jumlah']) ? intval($data['jumlah']) : 0,
      'hargaSatuan' => isset($data['hargaSatuan']) ? floatval($data['hargaSatuan']) : 0
    ];
  }

  return $items;
}

function ensureUniqueInvoice($conn, $candidate) {
  $no = trim((string)$candidate);
  if ($no === '') return generateMutationInvoiceNumber($conn);

  $stmt = $conn->prepare("SELECT mutasiID FROM mutasistok WHERE noFakturMutasi = ? LIMIT 1");
  $stmt->execute([$no]);
  if ($stmt->fetch(PDO::FETCH_ASSOC)) {
    return generateMutationInvoiceNumber($conn);
  }
  return $no;
}

function formatGroupedMutations($rows) {
  $grouped = [];
  foreach ($rows as $row) {
    $invoice = trim((string)($row['noFakturMutasi'] ?? ''));
    if ($invoice === '') {
      $invoice = 'LEGACY-' . str_pad((string)($row['mutasiID'] ?? 0), 6, '0', STR_PAD_LEFT);
    }

    if (!isset($grouped[$invoice])) {
      $grouped[$invoice] = [
        'mutasiID' => intval($row['mutasiID'] ?? 0),
        'noFakturMutasi' => $invoice,
        'lokasiAsal' => $row['lokasiAsal'] ?? '',
        'lokasiTujuan' => $row['lokasiTujuan'] ?? '',
        'ongkir' => 0.0,
        'totalBarang' => 0.0,
        'totalMutasi' => 0.0,
        'keterangan' => $row['keterangan'] ?? '',
        'tanggal' => $row['tanggal'] ?? '',
        'itemCount' => 0,
        'items' => []
      ];
    }

    $qty = intval($row['jumlah'] ?? 0);
    $harga = floatval($row['hargaSatuan'] ?? 0);
    $subtotal = $qty * $harga;
    $ongkirRow = floatval($row['ongkir'] ?? 0);
    $totalRow = floatval($row['totalMutasi'] ?? 0);

    $grouped[$invoice]['mutasiID'] = max($grouped[$invoice]['mutasiID'], intval($row['mutasiID'] ?? 0));
    $grouped[$invoice]['ongkir'] += $ongkirRow;
    $grouped[$invoice]['totalBarang'] += $subtotal;
    $grouped[$invoice]['totalMutasi'] += $totalRow > 0 ? $totalRow : $subtotal;
    $grouped[$invoice]['itemCount'] += 1;
    if (trim((string)$grouped[$invoice]['keterangan']) === '' && trim((string)($row['keterangan'] ?? '')) !== '') {
      $grouped[$invoice]['keterangan'] = $row['keterangan'];
    }
    if (trim((string)$grouped[$invoice]['tanggal']) === '' && trim((string)($row['tanggal'] ?? '')) !== '') {
      $grouped[$invoice]['tanggal'] = $row['tanggal'];
    }

    $grouped[$invoice]['items'][] = [
      'mutasiID' => intval($row['mutasiID'] ?? 0),
      'stokID' => intval($row['stokID'] ?? 0),
      'varianID' => intval($row['varianID'] ?? 0),
      'namaVarian' => $row['namaVarian'] ?? '',
      'namaProduk' => $row['namaProduk'] ?? '',
      'jumlah' => $qty,
      'hargaSatuan' => $harga,
      'totalBarang' => $subtotal,
      'lokasiAsal' => $row['lokasiAsal'] ?? '',
      'lokasiTujuan' => $row['lokasiTujuan'] ?? ''
    ];
  }

  $groupedValues = array_values($grouped);
  usort($groupedValues, function($a, $b) {
    return strtotime($b['tanggal'] ?? '') <=> strtotime($a['tanggal'] ?? '');
  });

  return $groupedValues;
}

// GET - Ambil semua mutasi stok (group by no faktur)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    ensureMutationColumns($conn);
    if (($_GET['action'] ?? '') === 'generate_invoice') {
      echo json_encode([
        "success" => true,
        "data" => [
          "noFakturMutasi" => generateMutationInvoiceNumber($conn)
        ]
      ]);
      exit();
    }

    $sql = "
      SELECT sm.mutasiID, sm.noFakturMutasi, sm.stokID, sm.lokasiAsal, sm.lokasiTujuan, 
             sm.jumlah, sm.hargaSatuan, sm.totalMutasi, sm.ongkir, sm.dasarHarga, sm.tanggal, sm.keterangan, sm.varianID,
             pv.namaVarian, p.namaProduk
      FROM mutasistok sm
      LEFT JOIN stok s ON sm.stokID = s.stokID
      LEFT JOIN produkvarian pv ON sm.varianID = pv.varianID
      LEFT JOIN produk p ON pv.produkID = p.produkID
      ORDER BY sm.mutasiID DESC
    ";
    $rows = $conn->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => formatGroupedMutations($rows)]);
  } catch (Exception $e) {
    // Jika tabel belum ada, return empty array
    echo json_encode(["success" => true, "data" => []]);
  }
  exit();
}

// POST - Proses mutasi stok antar cabang (multi varian per nota)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  if (!is_array($data)) {
    echo json_encode(["success" => false, "message" => "Payload tidak valid"]);
    exit();
  }

  $lokasiAsal = trim((string)($data['lokasiAsal'] ?? ''));
  $lokasiTujuan = trim((string)($data['lokasiTujuan'] ?? ''));
  $keterangan = trim((string)($data['keterangan'] ?? ''));
  $ongkir = max(0, floatval($data['ongkir'] ?? 0));
  $items = normalizeMutationItems($data);

  if ($lokasiAsal === '' || $lokasiTujuan === '') {
    echo json_encode(["success" => false, "message" => "Lokasi asal dan tujuan harus diisi"]);
    exit();
  }
  if ($lokasiAsal === $lokasiTujuan) {
    echo json_encode(["success" => false, "message" => "Lokasi asal dan tujuan tidak boleh sama"]);
    exit();
  }
  if (count($items) === 0) {
    echo json_encode(["success" => false, "message" => "Item mutasi tidak boleh kosong"]);
    exit();
  }

  try {
    ensureVariantPriceColumns($conn);
    ensureMutationColumns($conn);

    $noFakturMutasi = ensureUniqueInvoice($conn, $data['noFakturMutasi'] ?? '');
    $dasarHarga = 'HARGA_MODAL';
    $now = date('Y-m-d H:i:s');

    $conn->beginTransaction();

    $totalBarang = 0.0;
    $totalQty = 0;
    $insertStmt = $conn->prepare("
      INSERT INTO mutasistok (noFakturMutasi, stokID, lokasiAsal, lokasiTujuan, jumlah, hargaSatuan, totalMutasi, ongkir, dasarHarga, tanggal, keterangan, varianID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($items as $idx => $item) {
      $qty = intval($item['jumlah'] ?? 0);
      $stokIDPayload = intval($item['stokID'] ?? 0);
      $varianIDPayload = intval($item['varianID'] ?? 0);
      $hargaInput = floatval($item['hargaSatuan'] ?? 0);
      if ($qty <= 0) throw new Exception("Qty item mutasi harus lebih dari 0");

      $stokAsal = null;
      if ($stokIDPayload > 0) {
        $stmt = $conn->prepare("
          SELECT stokID, jumlah, varianID
          FROM stok
          WHERE stokID = ? AND lokasi = ?
          LIMIT 1
        ");
        $stmt->execute([$stokIDPayload, $lokasiAsal]);
        $stokAsal = $stmt->fetch(PDO::FETCH_ASSOC);
      } elseif ($varianIDPayload > 0) {
        $stmt = $conn->prepare("
          SELECT stokID, jumlah, varianID
          FROM stok
          WHERE varianID = ? AND lokasi = ?
          LIMIT 1
        ");
        $stmt->execute([$varianIDPayload, $lokasiAsal]);
        $stokAsal = $stmt->fetch(PDO::FETCH_ASSOC);
      }

      if (!$stokAsal) {
        throw new Exception("Stok varian tidak ditemukan di lokasi asal");
      }
      $stokIDAsal = intval($stokAsal['stokID']);
      $varianID = intval($stokAsal['varianID']);
      $stokTersedia = intval($stokAsal['jumlah']);
      if ($stokTersedia < $qty) {
        throw new Exception("Qty mutasi melebihi stok tersedia untuk salah satu item");
      }

      $stmt = $conn->prepare("SELECT harga, hargaModal FROM produkvarian WHERE varianID = ?");
      $stmt->execute([$varianID]);
      $variant = $stmt->fetch(PDO::FETCH_ASSOC);
      $hargaModalDefault = $variant ? floatval($variant['hargaModal'] ?? $variant['harga'] ?? 0) : 0;
      $hargaSatuan = $hargaInput > 0 ? $hargaInput : $hargaModalDefault;
      if ($hargaSatuan <= 0) throw new Exception("Harga satuan mutasi harus lebih dari 0");

      // Kurangi stok asal
      $stmt = $conn->prepare("UPDATE stok SET jumlah = ?, tanggalUpdate = ? WHERE stokID = ?");
      $stmt->execute([$stokTersedia - $qty, $now, $stokIDAsal]);

      // Tambah stok tujuan
      $stmt = $conn->prepare("SELECT stokID, jumlah FROM stok WHERE varianID = ? AND lokasi = ? LIMIT 1");
      $stmt->execute([$varianID, $lokasiTujuan]);
      $stokTujuan = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($stokTujuan) {
        $stmt = $conn->prepare("UPDATE stok SET jumlah = ?, tanggalUpdate = ? WHERE stokID = ?");
        $stmt->execute([intval($stokTujuan['jumlah']) + $qty, $now, intval($stokTujuan['stokID'])]);
      } else {
        $stmt = $conn->prepare("INSERT INTO stok (jumlah, tanggalUpdate, lokasi, varianID) VALUES (?, ?, ?, ?)");
        $stmt->execute([$qty, $now, $lokasiTujuan, $varianID]);
      }

      $subtotal = $qty * $hargaSatuan;
      $ongkirBaris = $idx === 0 ? $ongkir : 0.0;
      $totalBaris = $subtotal + $ongkirBaris;
      $insertStmt->execute([
        $noFakturMutasi,
        $stokIDAsal,
        $lokasiAsal,
        $lokasiTujuan,
        $qty,
        $hargaSatuan,
        $totalBaris,
        $ongkirBaris,
        $dasarHarga,
        $now,
        $idx === 0 ? $keterangan : '',
        $varianID
      ]);

      $totalBarang += $subtotal;
      $totalQty += $qty;
    }

    $grandTotal = $totalBarang + $ongkir;
    $conn->commit();
    echo json_encode([
      "success" => true,
      "message" => "Mutasi stok berhasil dilakukan",
      "data" => [
        "noFakturMutasi" => $noFakturMutasi,
        "jumlahItem" => count($items),
        "totalQty" => $totalQty,
        "ongkir" => $ongkir,
        "totalBarang" => $totalBarang,
        "totalMutasi" => $grandTotal
      ]
    ]);
  } catch (Exception $e) {
    if ($conn->inTransaction()) {
      $conn->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Gagal melakukan mutasi: " . $e->getMessage()]);
  }
  exit();
}
?>

