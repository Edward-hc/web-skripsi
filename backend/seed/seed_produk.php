<?php
/**
 * Seed data katalog produk (kategori, produk, varian) dan stok per cabang.
 * Jalankan: php backend/seed/seed_produk.php
 * Seed ulang: php backend/seed/seed_produk.php --force
 */
require_once __DIR__ . '/../config/db_connect.php';

$catDeskripsi = [
  'Besi' => 'Material besi konstruksi untuk rangka, kolom, dan struktur bangunan.',
  'Semen' => 'Semen dan mortar untuk pengecoran, plester, acian, serta finishing.',
  'Cat' => 'Cat dan pelapis untuk dinding interior, eksterior, kayu, dan besi.',
  'Pipa' => 'Pipa PVC, fitting, dan aksesoris instalasi air bersih maupun limbah.',
  'Kayu' => 'Kayu konstruksi, triplek, dan multiplek untuk rangka dan finishing.',
  'Atap' => 'Material penutup atap, talang air, dan perlengkapan pemasangan atap.',
  'Kelistrikan' => 'Kabel, saklar, stop kontak, dan komponen panel listrik rumah.',
  'Fastener' => 'Paku, sekrup, baut, dan pengikat untuk pekerjaan kayu dan beton.',
  'Gypsum' => 'Papan gypsum, rangka hollow, compound, dan aksesoris partisi.',
  'Waterproofing' => 'Pelapis anti bocor dan membran untuk lantai serta atap datar.',
  'Perekat' => 'Lem dan sealant untuk pipa, kayu, keramik, dan sambungan.',
  'Bata & Block' => 'Bata, batako, hebel, dan paving untuk dinding serta hardscape.',
  'Sanitari' => 'Kloset, wastafel, kran, shower, dan aksesoris kamar mandi.',
  'Peralatan Tukang' => 'Alat tukang dan perlengkapan pekerjaan lapangan.',
  'Insulasi' => 'Rockwool, glasswool, dan material peredam panas serta suara.',
  'Rangka Atap' => 'Kanal, reng, dan aksesoris rangka atap baja ringan.',
  'Eceran' => 'Barang eceran per ons, setengah kilo, dan kilogram untuk kebutuhan kecil.',
];

$prodDeskripsi = [
  'Besi Siku' => 'Profil besi siku untuk rangka dan struktur.',
  'Besi Hollow' => 'Besi kotak hollow untuk partisi dan rangka ringan.',
  'Besi Beton' => 'Besi tulangan beton polos dan ulir.',
  'Wiremesh' => 'Kawat anyaman untuk pengecoran lantai dan dak.',
  'Semen Portland' => 'Semen serbaguna untuk adukan struktur.',
  'Semen Putih' => 'Semen putih untuk acian dan finishing dekoratif.',
  'Semen Instan' => 'Semen pracetak untuk acian, plester, dan perekat keramik.',
  'Semen Mortar' => 'Mortar siap pakai untuk pasangan bata dan plester.',
  'Semen Tahan Air' => 'Semen additive untuk area basah dan waterproofing.',
  'Cat Tembok' => 'Cat tembok interior dan eksterior.',
  'Cat Dasar' => 'Cat dasar sebelum finishing tembok.',
  'Cat Besi' => 'Cat protektif untuk permukaan besi.',
  'Cat Kayu' => 'Cat dan pelindung permukaan kayu.',
  'Vernis Kayu' => 'Vernis transparan untuk finishing kayu.',
  'Thinner' => 'Pengencer cat dan pelarut pengecatan.',
  'Pipa PVC' => 'Pipa PVC tekanan rendah untuk instalasi air.',
  'Pipa AW' => 'Pipa PVC tekanan sedang (AW) untuk saluran utama.',
  'Elbow PVC' => 'Fitting siku PVC untuk belokan pipa.',
  'Tee PVC' => 'Fitting tee PVC untuk cabang pipa.',
  'Socket PVC' => 'Fitting soket PVC untuk penyambungan pipa.',
  'Kayu Meranti' => 'Kayu meranti untuk rangka dan kusen.',
  'Kayu Kamper' => 'Kayu kamper untuk rangka atap dan struktur.',
  'Triplek' => 'Lembaran triplek untuk bekisting dan partisi.',
  'Multiplek' => 'Lembaran multiplek untuk furniture dan finishing.',
  'Seng Gelombang' => 'Penutup atap seng bergelombang.',
  'Spandek' => 'Atap spandek baja ringan berlapis.',
  'Nok Atap' => 'Penutup puncak atap spandek.',
  'Talang Air' => 'Talang pembuangan air hujan dari atap.',
  'Sekrup Atap' => 'Sekrup khusus pemasangan atap spandek.',
  'Aluminium Foil' => 'Foil insulasi bawah penutup atap.',
  'Kabel NYA' => 'Kabel tunggal NYA untuk instalasi rumah.',
  'Kabel NYM' => 'Kabel serabut NYM untuk stop kontak dan lampu.',
  'Saklar' => 'Saklar on/off instalasi listrik.',
  'Stop Kontak' => 'Stop kontak stopkontak dinding.',
  'MCB' => 'Miniature circuit breaker proteksi panel.',
  'Paku Beton' => 'Paku untuk pemasangan rangka ke beton.',
  'Paku Kayu' => 'Paku untuk sambungan kayu.',
  'Sekrup Gypsum' => 'Sekrup black phosphate untuk papan gypsum.',
  'Baut Hex' => 'Baut kepala hex untuk sambungan struktur.',
  'Dynabolt' => 'Baut ekspansi untuk dinding beton/bata.',
  'Papan Gypsum' => 'Papan gypsum untuk partisi dan plafon.',
  'Hollow Gypsum' => 'Rangka hollow metal untuk plafon gypsum.',
  'Compound' => 'Compound gypsum untuk nat dan finishing.',
  'Joint Tape' => 'Pita penguat sambungan papan gypsum.',
  'Corner Bead' => 'Sudut pelindung tepi gypsum.',
  'Pelapis Anti Bocor' => 'Coating cair anti rembes untuk basemen dan WC.',
  'Membran Bakar' => 'Membran aspal untuk waterproofing atap datar.',
  'Lem PVC' => 'Lem solvent untuk sambungan pipa PVC.',
  'Lem Kayu' => 'Lem kayu untuk sambungan furnitur dan rangka.',
  'Lem Epoxy' => 'Lem epoxy dua komponen untuk perbaikan kuat.',
  'Sealant Silikon' => 'Sealant silikon untuk celah keramik dan kaca.',
  'Besi CNP' => 'Canal CNP untuk struktur dan rangka baja.',
  'Plat Besi' => 'Plat besi lembaran untuk fabrikasi.',
  'Baja Ringan' => 'Profil baja ringan untuk rangka atap.',
  'Besi WF' => 'Wide flange untuk struktur berat.',
  'Besi UNP' => 'Profil UNP untuk balok dan rangka.',
  'Besi As' => 'Besi as bulat untuk sambungan dan tiang.',
  'Genteng Beton' => 'Genteng beton pres untuk penutup atap.',
  'Genteng Metal' => 'Genteng metal berpasir untuk atap rumah.',
  'Polycarbonate' => 'Lembar polycarbonate bening atau berlapis.',
  'Atap UPVC' => 'Penutup atap UPVC bergelombang.',
  'Flashing Atap' => 'Flashing galvalum untuk sambungan atap.',
  'Pipa D' => 'Pipa PVC saluran pembuangan (D).',
  'Reducer PVC' => 'Fitting reducer untuk transisi diameter pipa.',
  'Valve Tap' => 'Kran valve untuk instalasi pipa.',
  'Floor Drain' => 'Floor drain saluran lantai.',
  'Kayu Keruing' => 'Kayu keruing untuk konstruksi berat.',
  'Kayu Merbau' => 'Kayu merbau untuk rangka premium.',
  'Kayu Jati Belanda' => 'Kayu jati belanda untuk kusen dan furniture.',
  'Triplek Marine' => 'Triplek marine tahan air.',
  'Triplek Film Face' => 'Triplek film face untuk bekisting halus.',
  'MDF' => 'Medium density fiberboard untuk furniture.',
  'Blockboard' => 'Blockboard untuk pintu dan panel.',
  'Plafon PVC' => 'Plafon PVC strip untuk langit-langit.',
  'Kabel NYY' => 'Kabel NYY serabut untuk instalasi listrik.',
  'Kabel NYAF' => 'Kabel NYAF fleksibel untuk panel dan mesin.',
  'Lampu LED' => 'Lampu LED hemat energi.',
  'Fitting Lampu' => 'Fitting dan downlight lampu.',
  'Kontaktor' => 'Kontaktor listrik untuk panel kontrol.',
  'Terminal Block' => 'Terminal block sambungan kabel.',
  'KWH Meter' => 'Meteran listrik rumah tangga.',
  'Sekrup Beton' => 'Sekrup beton untuk fischer wall plug.',
  'Sekrup Kayu' => 'Sekrup kayu self drilling.',
  'Baut Flange' => 'Baut flange untuk sambungan plat.',
  'Mur Baut' => 'Mur hex pengunci baut.',
  'Rivet' => 'Rivet aluminium untuk sambungan tipis.',
  'Anchor Bolt' => 'Anchor bolt untuk fondasi dan mesin.',
  'Ring Sekrup' => 'Ring sekrup drill point untuk baja tipis.',
  'Washer Flat' => 'Ring plat pengencang baut.',
  'Grouting Waterproof' => 'Grouting waterproof untuk celah beton.',
  'Polyurethane Sealant' => 'Sealant polyurethane elastis.',
  'Asphalt Emulsion' => 'Emulsi aspal untuk waterproofing.',
  'Foam Sealant' => 'Sealant foam expanding untuk celah.',
  'Lem Contact' => 'Lem contact semprot untuk laminasi.',
  'Lem Tembak' => 'Lem tembak stick untuk crafts dan perbaikan.',
  'Bata Merah' => 'Bata merah untuk pasangan dinding.',
  'Batako' => 'Batako semen untuk dinding struktur.',
  'Hebel AAC' => 'Bata ringan AAC autoclaved aerated concrete.',
  'Bata Ringan' => 'Bata ringan standar untuk partisi.',
  'Paving Block' => 'Paving block untuk halaman dan jalan setapak.',
  'U-Ditch' => 'Saluran U-ditch beton precast.',
  'Buis Beton' => 'Buis beton saluran air.',
  'Kansteen' => 'Kansteen tepi jalan dan taman.',
  'Cover Buis' => 'Tutup buis beton saluran.',
  'Kloset' => 'Kloset duduk dan jongkok.',
  'Wastafel' => 'Wastafel wastafel kamar mandi.',
  'Shower Set' => 'Shower set dan rain shower.',
  'Kran Air' => 'Kran air wastafel dan dapur.',
  'Sifon Wastafel' => 'Sifon pembuangan wastafel.',
  'Bak Cuci' => 'Bak cuci piring stainless.',
  'Flexible Hose' => 'Selang fleksibel kran air.',
  'Ember Cor' => 'Ember cor semen dan adukan.',
  'Roskam' => 'Roskam pengaduk semen.',
  'Ceta Semen' => 'Ceta semen untuk finishing lantai.',
  'Meteran' => 'Meteran ukur tukang.',
  'Waterpass' => 'Waterpass penyodok permukaan.',
  'Palu Kayu' => 'Palu kayu pekerjaan konstruksi.',
  'Gergaji Kayu' => 'Gergaji kayu manual.',
  'Wire Brush' => 'Wire brush gerinda pembersih karat.',
  'Mata Bor Beton' => 'Mata bor beton SDS.',
  'Pisau Cutterm' => 'Pisau cutterm cutter.',
  'Sarung Tangan Karet' => 'Sarung tangan karet pekerja.',
  'Masker N95' => 'Masker debu pekerja konstruksi.',
  'Rockwool' => 'Rockwool peredam panas dan suara.',
  'Glasswool' => 'Glasswool isolasi atap dan dinding.',
  'Foil Bubble' => 'Aluminium foil bubble insulasi atap.',
  'Weather Strip' => 'Weather strip karet pintu jendela.',
  'Kanal Baja Ringan' => 'Kanal C profil baja ringan.',
  'Reng Baja Ringan' => 'Reng C profil baja ringan.',
  'Siku Atap' => 'Siku penutup sudut rangka atap.',
  'Klem Baja Ringan' => 'Klem pengikat rangka baja ringan.',
  'Skrup Baja Ringan' => 'Skrup self drill baja ringan.',
  'Aksesori Plafon' => 'Aksesori trim plafon gypsum.',
  'Compound Gypsum Lembut' => 'Compound gypsum finishing halus.',
  'Paku Kayu Ecer' => 'Paku kayu dijual ecer per ons atau setengah kilo.',
  'Paku Beton Ecer' => 'Paku beton dijual ecer per ons atau setengah kilo.',
  'Paku Payung Ecer' => 'Paku payung finishing dijual ecer.',
  'Sekrup Kayu Ecer' => 'Sekrup kayu dijual ecer per ons atau setengah kilo.',
  'Baut Mur Ecer' => 'Baut dan mur dijual ecer per ons.',
  'Kawat Bendrat Ecer' => 'Kawat bendrat pengikat besi ecer per ons atau kilo.',
  'Paku Tembak Ecer' => 'Paku tembak nail gun dijual ecer per ons.',
];

function stokMinimumUntuk(string $kategori, string $produk, string $varian, int $hargaJual): int
{
  $v = strtolower($varian);
  $p = strtolower($produk);

  if (preg_match('/elbow|tee|socket|saklar|stop kontak/', $v) || preg_match('/elbow|tee|socket/', $p)) {
    return random_int(80, 120);
  }
  if (preg_match('/paku|sekrup|dynabolt|baut|joint tape|corner bead|thinner|lem pvc 100/', $v)) {
    return random_int(35, 55);
  }
  if ($hargaJual >= 500000) {
    return random_int(6, 10);
  }
  if ($hargaJual >= 300000) {
    return random_int(8, 14);
  }
  if (preg_match('/semen|mortar|portland|putih|instan|waterproof|compound/', $v)) {
    return random_int(40, 60);
  }
  if ($kategori === 'Cat' && preg_match('/25 kg|20 kg|1 liter roll/', $v)) {
    return random_int(10, 18);
  }
  if ($kategori === 'Cat') {
    return random_int(22, 32);
  }
  if ($kategori === 'Kayu' && preg_match('/triplek|multiplek/', $p)) {
    return random_int(12, 20);
  }
  if ($kategori === 'Pipa' && preg_match('/pipa pvc|pipa aw/', $p)) {
    return random_int(25, 40);
  }
  if ($kategori === 'Besi') {
    return random_int(15, 25);
  }
  if ($kategori === 'Kelistrikan' && preg_match('/kabel/', $p)) {
    return random_int(8, 12);
  }
  if ($kategori === 'Atap') {
    return random_int(20, 35);
  }
  if ($kategori === 'Bata & Block' && $hargaJual < 20000) {
    return random_int(200, 400);
  }
  if ($kategori === 'Sanitari' || $kategori === 'Peralatan Tukang') {
    return random_int(8, 18);
  }
  if ($kategori === 'Insulasi' || $kategori === 'Rangka Atap') {
    return random_int(12, 22);
  }
  if ($kategori === 'Eceran') {
    return random_int(60, 120);
  }
  return random_int(18, 30);
}

/** Nama cabang dari cabang.json (fallback bawaan). */
function daftarCabang(): array
{
  $default = ['Delapan Jaya (Utama)', 'Delapan Jaya (Cabang Kedua)'];
  $file = __DIR__ . '/../data/cabang.json';
  if (!is_readable($file)) {
    return $default;
  }
  $data = json_decode(file_get_contents($file), true);
  if (!is_array($data)) {
    return $default;
  }
  $nama = array_values(array_filter(array_map(
    static fn($b) => trim((string) ($b['namaCabang'] ?? '')),
    $data
  )));
  return count($nama) >= 2 ? $nama : $default;
}

/**
 * Jumlah stok per cabang — bervariasi, cabang utama biasanya lebih besar
 * tapi tidak selalu (agar tidak monoton).
 */
function stokJumlahCabang(
  string $kategori,
  string $produk,
  string $varian,
  int $hargaJual,
  int $stokMin,
  string $namaCabang
): int {
  $utama = stripos($namaCabang, 'Utama') !== false;
  $hash = crc32($varian . '|' . $namaCabang);
  $v = strtolower($varian);
  $p = strtolower($produk);

  if (preg_match('/elbow|tee|socket|saklar|stop kontak/', $v)) {
    $lo = 95;
    $hi = 340;
  } elseif (preg_match('/paku|sekrup|joint tape|corner bead|thinner|lem pvc 100/', $v)) {
    $lo = 42;
    $hi = 165;
  } elseif ($hargaJual >= 650000) {
    $lo = 3;
    $hi = 11;
  } elseif ($hargaJual >= 400000) {
    $lo = 5;
    $hi = 18;
  } elseif ($hargaJual >= 200000) {
    $lo = 9;
    $hi = 32;
  } elseif (preg_match('/semen|mortar|portland|putih|instan|waterproof|compound/', $v)) {
    $lo = 55;
    $hi = 185;
  } elseif ($kategori === 'Cat' && preg_match('/25 kg|20 kg/', $v)) {
    $lo = 11;
    $hi = 38;
  } elseif ($kategori === 'Cat') {
    $lo = 24;
    $hi = 72;
  } elseif ($kategori === 'Besi') {
    $lo = 22;
    $hi = 68;
  } elseif ($kategori === 'Pipa' && preg_match('/pipa/', $p)) {
    $lo = 38;
    $hi = 125;
  } elseif ($kategori === 'Kayu' && preg_match('/triplek|multiplek/', $p)) {
    $lo = 16;
    $hi = 52;
  } elseif ($kategori === 'Kayu') {
    $lo = 12;
    $hi = 36;
  } elseif ($kategori === 'Kelistrikan' && preg_match('/kabel/', $p)) {
    $lo = 7;
    $hi = 24;
  } elseif ($kategori === 'Atap') {
    $lo = 18;
    $hi = 58;
  } elseif ($kategori === 'Bata & Block' && $hargaJual < 20000) {
    $lo = 350;
    $hi = 1200;
  } elseif ($kategori === 'Sanitari' || $kategori === 'Peralatan Tukang') {
    $lo = 8;
    $hi = 35;
  } elseif ($kategori === 'Insulasi' || $kategori === 'Rangka Atap') {
    $lo = 14;
    $hi = 48;
  } elseif ($kategori === 'Eceran') {
    $lo = 95;
    $hi = 420;
  } else {
    $lo = 20;
    $hi = 75;
  }

  $qty = $lo + ($hash % ($hi - $lo + 1));

  if ($utama) {
    $qty = (int) round($qty * (1.05 + (($hash >> 7) % 30) / 100));
  } else {
    $faktor = 0.72 + (($hash >> 11) % 33) / 100;
    if (($hash >> 3) % 7 === 0) {
      $faktor = 0.88 + (($hash >> 5) % 18) / 100;
    }
    $qty = (int) round($qty * $faktor);
  }

  if (($hash >> 4) % 11 !== 0) {
    $qty = max($qty, $stokMin + 3 + ($hash % 22));
  } elseif (($hash >> 2) % 5 === 0) {
    $qty = max(2, $stokMin - 1 - ($hash % 4));
  }

  return max(1, $qty);
}

function pastikanKolomStokRusak(PDO $conn): void
{
  try {
    $dbName = $conn->query('SELECT DATABASE()')->fetchColumn();
    if (!$dbName) {
      return;
    }
    $stmt = $conn->prepare("
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'stok' AND COLUMN_NAME = 'jumlahRusak'
    ");
    $stmt->execute([$dbName]);
    if ((int) $stmt->fetchColumn() === 0) {
      $conn->exec('ALTER TABLE stok ADD COLUMN jumlahRusak INT NOT NULL DEFAULT 0 AFTER jumlah');
    }
  } catch (Exception $e) {
    // ignore
  }
}

$items = [
  ['Besi', 'Besi Siku', 'Besi Siku 25x25x3 mm Panjang 6 m', 120000, 110000, 95000],
  ['Besi', 'Besi Siku', 'Besi Siku 30x30x3 mm Panjang 6 m', 145000, 135000, 118000],
  ['Besi', 'Besi Siku', 'Besi Siku 40x40x4 mm Panjang 6 m', 210000, 195000, 170000],
  ['Besi', 'Besi Hollow', 'Besi Hollow 20x20x1,2 mm Panjang 6 m', 75000, 68000, 58000],
  ['Besi', 'Besi Hollow', 'Besi Hollow 40x40x1,4 mm Panjang 6 m', 135000, 125000, 108000],
  ['Besi', 'Besi Hollow', 'Besi Hollow 50x50x1,6 mm Panjang 6 m', 185000, 175000, 150000],
  ['Besi', 'Besi Beton', 'Besi Beton Polos Diameter 8 mm Panjang 12 m', 68000, 62000, 54000],
  ['Besi', 'Besi Beton', 'Besi Beton Polos Diameter 10 mm Panjang 12 m', 105000, 98000, 84000],
  ['Besi', 'Besi Beton', 'Besi Beton Ulir Diameter 13 mm Panjang 12 m', 185000, 175000, 150000],
  ['Besi', 'Wiremesh', 'Wiremesh M6 Ukuran 2,1 x 5,4 m', 520000, 495000, 440000],
  ['Semen', 'Semen Portland', 'Semen Gresik Portland 50 kg', 72000, 69000, 63000],
  ['Semen', 'Semen Portland', 'Semen Holcim 40 kg', 59000, 56000, 50000],
  ['Semen', 'Semen Putih', 'Semen Putih Tiga Roda 40 kg', 110000, 103000, 90000],
  ['Semen', 'Semen Putih', 'Semen Putih Semen Padang 20 kg', 58000, 54000, 47000],
  ['Semen', 'Semen Instan', 'Mortar Utama Acian 25 kg', 78000, 72000, 62000],
  ['Semen', 'Semen Instan', 'Semen Tiga Roda Perekat Keramik 25 kg', 82000, 76000, 66000],
  ['Semen', 'Semen Instan', 'Semen Gresik Plester 40 kg', 92000, 87000, 75000],
  ['Semen', 'Semen Mortar', 'Mortar Utama Semen Mortar 40 kg', 88000, 82000, 71000],
  ['Semen', 'Semen Tahan Air', 'Sika Top Seal Waterproof 20 kg', 95000, 89000, 77000],
  ['Semen', 'Semen Tahan Air', 'Aquaproof Waterproof 5 kg', 32000, 29000, 24000],
  ['Cat', 'Cat Tembok', 'Cat Avian Interior 5 kg', 125000, 118000, 102000],
  ['Cat', 'Cat Tembok', 'Cat Propam Interior 25 kg', 485000, 460000, 400000],
  ['Cat', 'Cat Tembok', 'Cat Dulux Weathershield Eksterior 5 kg', 165000, 155000, 135000],
  ['Cat', 'Cat Tembok', 'Cat Mowilex Eksterior 25 kg', 650000, 620000, 550000],
  ['Cat', 'Cat Dasar', 'Cat Nippon Alkali Resistant 5 kg', 180000, 170000, 145000],
  ['Cat', 'Cat Besi', 'Cat Avian No Drop Glossy 1 kg', 95000, 88000, 75000],
  ['Cat', 'Cat Besi', 'Cat Jotun Pilot QD Glossy 5 kg', 420000, 395000, 340000],
  ['Cat', 'Cat Kayu', 'Cat Avian Kayu 1 kg', 90000, 84000, 72000],
  ['Cat', 'Vernis Kayu', 'Vernis Politur Jotun 1 Liter', 78000, 72000, 60000],
  ['Cat', 'Thinner', 'Thinner Sayerlack 1 Liter', 35000, 32000, 26000],
  ['Pipa', 'Pipa PVC', 'Pipa Rucika Standard 1/2 Inch Panjang 4 m', 28000, 25000, 20000],
  ['Pipa', 'Pipa PVC', 'Pipa Rucika Standard 3/4 Inch Panjang 4 m', 40000, 37000, 31000],
  ['Pipa', 'Pipa PVC', 'Pipa Wavin Standard 1 Inch Panjang 4 m', 65000, 60000, 52000],
  ['Pipa', 'Pipa PVC', 'Pipa Vinilon Standard 2 Inch Panjang 4 m', 145000, 135000, 118000],
  ['Pipa', 'Pipa AW', 'Pipa Rucika AW 1 Inch Panjang 4 m', 82000, 76000, 66000],
  ['Pipa', 'Pipa AW', 'Pipa Wavin AW 2 Inch Panjang 4 m', 185000, 175000, 150000],
  ['Pipa', 'Elbow PVC', 'Elbow Rucika 1/2 Inch', 5000, 4500, 3500],
  ['Pipa', 'Elbow PVC', 'Elbow Rucika 1 Inch', 8000, 7000, 5500],
  ['Pipa', 'Tee PVC', 'Tee Rucika 1 Inch', 10000, 9000, 7000],
  ['Pipa', 'Socket PVC', 'Socket Rucika 1 Inch', 4000, 3500, 2800],
  ['Kayu', 'Kayu Meranti', 'Kayu Meranti 4x6 cm Panjang 4 m', 95000, 88000, 75000],
  ['Kayu', 'Kayu Meranti', 'Kayu Meranti 5x7 cm Panjang 4 m', 140000, 130000, 112000],
  ['Kayu', 'Kayu Kamper', 'Kayu Kamper 4x6 cm Panjang 4 m', 125000, 118000, 100000],
  ['Kayu', 'Kayu Kamper', 'Kayu Kamper 5x10 cm Panjang 4 m', 245000, 230000, 200000],
  ['Kayu', 'Triplek', 'Triplek Albasia 3 mm Ukuran 122x244 cm', 75000, 70000, 58000],
  ['Kayu', 'Triplek', 'Triplek Albasia 6 mm Ukuran 122x244 cm', 125000, 118000, 102000],
  ['Kayu', 'Triplek', 'Triplek Korindo 9 mm Ukuran 122x244 cm', 185000, 175000, 150000],
  ['Kayu', 'Triplek', 'Triplek Korindo 12 mm Ukuran 122x244 cm', 240000, 225000, 195000],
  ['Kayu', 'Multiplek', 'Multiplek Albasia 15 mm Ukuran 122x244 cm', 335000, 315000, 275000],
  ['Kayu', 'Multiplek', 'Multiplek Albasia 18 mm Ukuran 122x244 cm', 420000, 395000, 345000],
  ['Atap', 'Seng Gelombang', 'Seng Gelombang 0,20 mm x 180 cm', 68000, 63000, 53000],
  ['Atap', 'Seng Gelombang', 'Seng Gelombang 0,25 mm x 240 cm', 110000, 103000, 88000],
  ['Atap', 'Spandek', 'Atap Spandek MWP 0,30 mm x 3 m', 210000, 198000, 170000],
  ['Atap', 'Spandek', 'Atap Spandek Trimdek 0,35 mm x 4 m', 320000, 300000, 260000],
  ['Atap', 'Nok Atap', 'Nok Atap MWP Spandek Panjang 3 m', 95000, 88000, 74000],
  ['Atap', 'Talang Air', 'Talang Air Onda PVC Panjang 4 m', 145000, 135000, 118000],
  ['Atap', 'Talang Air', 'Talang Air Royal Galvanis Panjang 4 m', 210000, 198000, 170000],
  ['Atap', 'Sekrup Atap', 'Sekrup Atap 12 x 65 mm Isi 100 pcs', 88000, 82000, 70000],
  ['Atap', 'Sekrup Atap', 'Sekrup Atap 12 x 75 mm Isi 100 pcs', 98000, 92000, 78000],
  ['Atap', 'Aluminium Foil', 'Aluminium Foil Super Silver 1 m x 10 m', 320000, 300000, 260000],
  ['Kelistrikan', 'Kabel NYA', 'Kabel Supreme NYA 1,5 mm 50 m', 220000, 205000, 180000],
  ['Kelistrikan', 'Kabel NYA', 'Kabel Kobe NYA 2,5 mm 50 m', 360000, 340000, 300000],
  ['Kelistrikan', 'Kabel NYM', 'Kabel Supreme NYM 2x1,5 mm 50 m', 420000, 400000, 350000],
  ['Kelistrikan', 'Kabel NYM', 'Kabel Paris NYM 3x2,5 mm 50 m', 850000, 810000, 720000],
  ['Kelistrikan', 'Saklar', 'Saklar Panasonic Tunggal 16A', 28000, 25000, 20000],
  ['Kelistrikan', 'Saklar', 'Saklar Legrand Ganda 16A', 42000, 38000, 31000],
  ['Kelistrikan', 'Stop Kontak', 'Stop Kontak Panasonic Tunggal 16A', 30000, 27000, 22000],
  ['Kelistrikan', 'Stop Kontak', 'Stop Kontak Schneider Ganda 16A', 45000, 42000, 34000],
  ['Kelistrikan', 'MCB', 'MCB Schneider 6A 1 Phase', 55000, 50000, 42000],
  ['Kelistrikan', 'MCB', 'MCB Hager 10A 1 Phase', 58000, 53000, 45000],
  ['Fastener', 'Paku Beton', 'Paku Beton 5 cm Kemasan 1 kg', 32000, 29000, 24000],
  ['Fastener', 'Paku Beton', 'Paku Beton 7 cm Kemasan 1 kg', 35000, 32000, 26000],
  ['Fastener', 'Paku Kayu', 'Paku Kayu 5 cm Kemasan 1 kg', 28000, 25000, 20000],
  ['Fastener', 'Paku Kayu', 'Paku Kayu 7 cm Kemasan 1 kg', 31000, 28000, 23000],
  ['Fastener', 'Sekrup Gypsum', 'Sekrup Gypsum 6 x 1 Inch Isi 500 pcs', 52000, 48000, 40000],
  ['Fastener', 'Sekrup Gypsum', 'Sekrup Gypsum 6 x 2 Inch Isi 500 pcs', 68000, 63000, 53000],
  ['Fastener', 'Baut Hex', 'Baut Hex M10 x 50 mm Isi 50 pcs', 85000, 80000, 68000],
  ['Fastener', 'Baut Hex', 'Baut Hex M12 x 75 mm Isi 50 pcs', 125000, 118000, 102000],
  ['Fastener', 'Dynabolt', 'Dynabolt Fischer M10 x 100 mm Isi 10 pcs', 58000, 53000, 45000],
  ['Fastener', 'Dynabolt', 'Dynabolt Fischer M12 x 120 mm Isi 10 pcs', 85000, 80000, 68000],
  ['Gypsum', 'Papan Gypsum', 'Papan Gypsum Jayaboard 9 mm 120x240 cm', 95000, 88000, 75000],
  ['Gypsum', 'Papan Gypsum', 'Papan Gypsum Knauf 12 mm 120x240 cm', 135000, 125000, 108000],
  ['Gypsum', 'Hollow Gypsum', 'Hollow Gypsum 2x4 cm Panjang 4 m', 42000, 38000, 31000],
  ['Gypsum', 'Hollow Gypsum', 'Hollow Gypsum 4x4 cm Panjang 4 m', 55000, 50000, 42000],
  ['Gypsum', 'Compound', 'Compound USG 5 kg', 45000, 41000, 33000],
  ['Gypsum', 'Compound', 'Compound Knauf 20 kg', 145000, 135000, 118000],
  ['Gypsum', 'Joint Tape', 'Joint Tape USG 90 m', 18000, 16000, 12000],
  ['Gypsum', 'Corner Bead', 'Corner Bead Gypsum Panjang 3 m', 22000, 20000, 15000],
  ['Gypsum', 'Sekrup Gypsum', 'Sekrup USG Gypsum 1 Inch Isi 1000 pcs', 95000, 88000, 75000],
  ['Gypsum', 'Sekrup Gypsum', 'Sekrup USG Gypsum 2 Inch Isi 1000 pcs', 125000, 118000, 100000],
  ['Waterproofing', 'Pelapis Anti Bocor', 'Sika Pelapis Anti Bocor 1 kg', 58000, 54000, 45000],
  ['Waterproofing', 'Pelapis Anti Bocor', 'Aquaproof Pelapis Anti Bocor 4 kg', 185000, 175000, 150000],
  ['Waterproofing', 'Pelapis Anti Bocor', 'Sika Pelapis Anti Bocor 20 kg', 820000, 780000, 700000],
  ['Waterproofing', 'Membran Bakar', 'Membran Bakar Sika 3 mm Roll 10 m', 650000, 620000, 550000],
  ['Waterproofing', 'Membran Bakar', 'Membran Bakar Sika 4 mm Roll 10 m', 820000, 780000, 700000],
  ['Perekat', 'Lem PVC', 'Lem PVC Isarplas 100 ml', 15000, 13500, 10000],
  ['Perekat', 'Lem PVC', 'Lem PVC Rucika 400 ml', 45000, 42000, 34000],
  ['Perekat', 'Lem Kayu', 'Lem Kayu Parbond 500 gram', 28000, 25000, 20000],
  ['Perekat', 'Lem Epoxy', 'Lem Epoxy Alteco 1 kg', 95000, 88000, 74000],
  ['Perekat', 'Sealant Silikon', 'Sealant Silikon Dextone 300 ml', 42000, 38000, 31000],

  // --- Tambahan varian (101–267) ---
  ['Besi', 'Besi Siku', 'Besi Siku 50x50x5 mm Panjang 6 m', 265000, 248000, 215000],
  ['Besi', 'Besi Siku', 'Besi Siku 60x60x6 mm Panjang 6 m', 385000, 360000, 310000],
  ['Besi', 'Besi Hollow', 'Besi Hollow 30x30x1,2 mm Panjang 6 m', 98000, 91000, 78000],
  ['Besi', 'Besi Hollow', 'Besi Hollow 40x60x1,4 mm Panjang 6 m', 195000, 182000, 158000],
  ['Besi', 'Besi Hollow', 'Besi Hollow 75x75x2,3 mm Panjang 6 m', 420000, 395000, 345000],
  ['Besi', 'Besi Beton', 'Besi Beton Polos Diameter 12 mm Panjang 12 m', 145000, 135000, 118000],
  ['Besi', 'Besi Beton', 'Besi Beton Polos Diameter 16 mm Panjang 12 m', 285000, 268000, 235000],
  ['Besi', 'Besi Beton', 'Besi Beton Ulir Diameter 10 mm Panjang 12 m', 128000, 119000, 102000],
  ['Besi', 'Besi Beton', 'Besi Beton Ulir Diameter 16 mm Panjang 12 m', 325000, 305000, 268000],
  ['Besi', 'Wiremesh', 'Wiremesh M8 Ukuran 2,1 x 5,4 m', 685000, 650000, 580000],
  ['Besi', 'Wiremesh', 'Wiremesh M10 Ukuran 2,1 x 5,4 m', 920000, 875000, 780000],
  ['Besi', 'Besi CNP', 'Besi CNP 100 x 50 x 3 mm Panjang 6 m', 485000, 455000, 398000],
  ['Besi', 'Besi CNP', 'Besi CNP 125 x 65 x 5 mm Panjang 6 m', 720000, 680000, 595000],
  ['Besi', 'Besi CNP', 'Besi CNP 150 x 75 x 6 mm Panjang 6 m', 980000, 925000, 810000],
  ['Besi', 'Plat Besi', 'Plat Besi 3 mm Ukuran 120x240 cm', 890000, 840000, 735000],
  ['Besi', 'Plat Besi', 'Plat Besi 5 mm Ukuran 120x240 cm', 1450000, 1375000, 1200000],
  ['Besi', 'Baja Ringan', 'Baja Ringan C75 Panjang 6 m', 165000, 154000, 135000],
  ['Besi', 'Baja Ringan', 'Baja Ringan C100 Panjang 6 m', 215000, 201000, 175000],
  ['Besi', 'Baja Ringan', 'Baja Ringan Reng C75 Panjang 6 m', 98000, 91000, 79000],
  ['Besi', 'Besi WF', 'Besi WF 150 Panjang 6 m', 2850000, 2680000, 2350000],
  ['Besi', 'Besi UNP', 'Besi UNP 100 Panjang 6 m', 1250000, 1180000, 1030000],
  ['Besi', 'Besi As', 'Besi As Diameter 16 mm Panjang 6 m', 185000, 172000, 150000],

  ['Semen', 'Semen Portland', 'Semen Semen Padang Portland 50 kg', 70000, 67000, 61000],
  ['Semen', 'Semen Portland', 'Semen Tiga Roda PCC 40 kg', 62000, 59000, 52000],
  ['Semen', 'Semen Portland', 'Semen Gresik PCC 50 kg', 74000, 71000, 64000],
  ['Semen', 'Semen Portland', 'Semen Holcim Hydraulic 40 kg', 85000, 80000, 70000],
  ['Semen', 'Semen Instan', 'Semen Gresik Super Masonry 40 kg', 78000, 73000, 63500],
  ['Semen', 'Semen Instan', 'Mortar Utama Skimcoat 20 kg', 95000, 89000, 77000],
  ['Semen', 'Semen Instan', 'Semen Holcim Express 25 kg', 88000, 82000, 71000],
  ['Semen', 'Semen Putih', 'Semen Tiga Roda Hydrate 20 kg', 65000, 61000, 53000],
  ['Semen', 'Semen Mortar', 'Semen Super Nat Perekat 5 kg', 42000, 39000, 33500],
  ['Semen', 'Semen Mortar', 'Semen Instant Tile Grout 5 kg Putih', 45000, 42000, 36000],

  ['Cat', 'Cat Tembok', 'Cat Avian Premium Interior 2,5 kg', 75000, 70000, 60000],
  ['Cat', 'Cat Tembok', 'Cat Propam Exterior 5 kg', 172000, 161000, 140000],
  ['Cat', 'Cat Tembok', 'Cat Dulux Catylux Interior 5 kg', 138000, 129000, 112000],
  ['Cat', 'Cat Tembok', 'Cat Jotun Jotashield 5 kg', 198000, 185000, 161000],
  ['Cat', 'Cat Tembok', 'Cat Nippon Spot-less 25 kg', 520000, 490000, 425000],
  ['Cat', 'Cat Tembok', 'Cat Mowilex Weathercoat 5 kg', 178000, 167000, 145000],
  ['Cat', 'Cat Tembok', 'Cat Avian No Drop Anti Noda 5 kg', 142000, 133000, 115000],
  ['Cat', 'Cat Dasar', 'Cat Avian Red Oxide Primer 1 kg', 72000, 67000, 58000],
  ['Cat', 'Cat Besi', 'Cat Besi Hammerite 1 kg', 112000, 105000, 90000],
  ['Cat', 'Cat Besi', 'Cat Anti Karat Nippon 1 kg', 98000, 91000, 79000],
  ['Cat', 'Cat Kayu', 'Cat Kayu Propam Melamic 1 kg', 88000, 82000, 71000],
  ['Cat', 'Vernis Kayu', 'Vernis Avian Waterbased 1 Liter', 82000, 76000, 65000],
  ['Cat', 'Thinner', 'Thinner SPC 1 Liter', 38000, 35000, 28500],

  ['Pipa', 'Pipa PVC', 'Pipa Rucika Standard 3 Inch Panjang 4 m', 195000, 182000, 158000],
  ['Pipa', 'Pipa PVC', 'Pipa Wavin Standard 1/2 Inch Panjang 4 m', 26000, 24000, 20500],
  ['Pipa', 'Pipa PVC', 'Pipa PVC Onda 3 Inch Panjang 4 m', 188000, 175000, 152000],
  ['Pipa', 'Pipa AW', 'Pipa Rucika AW 1/2 Inch Panjang 4 m', 48000, 44000, 38000],
  ['Pipa', 'Pipa AW', 'Pipa Vinilon AW 3/4 Inch Panjang 4 m', 68000, 63000, 55000],
  ['Pipa', 'Pipa D', 'Pipa D Rucika 4 Inch Panjang 4 m', 225000, 210000, 183000],
  ['Pipa', 'Pipa D', 'Pipa HDPE Vinilon 2 Inch Panjang 4 m', 165000, 154000, 135000],
  ['Pipa', 'Elbow PVC', 'Elbow Wavin 3/4 Inch', 6500, 5800, 4500],
  ['Pipa', 'Tee PVC', 'Tee Wavin 1/2 Inch', 7500, 6800, 5200],
  ['Pipa', 'Socket PVC', 'Socket Wavin 3/4 Inch', 5200, 4600, 3600],
  ['Pipa', 'Reducer PVC', 'Reducer Rucika 1 Inch ke 1/2 Inch', 9500, 8600, 6800],
  ['Pipa', 'Valve Tap', 'Valve Tap Rucika 1/2 Inch', 28000, 26000, 22000],

  ['Kayu', 'Kayu Keruing', 'Kayu Keruing 5x7 cm Panjang 4 m', 155000, 145000, 125000],
  ['Kayu', 'Kayu Keruing', 'Kayu Keruing 6x12 cm Panjang 4 m', 285000, 268000, 232000],
  ['Kayu', 'Kayu Merbau', 'Kayu Merbau 4x6 cm Panjang 4 m', 175000, 163000, 142000],
  ['Kayu', 'Kayu Jati Belanda', 'Kayu Jati Belanda 5x5 cm Panjang 4 m', 135000, 126000, 110000],
  ['Kayu', 'Triplek Marine', 'Triplek Marine 12 mm Ukuran 122x244 cm', 285000, 268000, 232000],
  ['Kayu', 'Triplek Film Face', 'Triplek Film Face 18 mm Ukuran 122x244 cm', 395000, 370000, 322000],
  ['Kayu', 'MDF', 'MDF Jayaboard 9 mm Ukuran 122x244 cm', 185000, 172000, 150000],
  ['Kayu', 'MDF', 'MDF Jayaboard 15 mm Ukuran 122x244 cm', 265000, 248000, 215000],
  ['Kayu', 'Blockboard', 'Blockboard 18 mm Ukuran 122x244 cm', 310000, 290000, 252000],

  ['Atap', 'Genteng Beton', 'Genteng Beton Flat Merah', 8500, 7800, 6500],
  ['Atap', 'Genteng Beton', 'Genteng Beton Flat Hitam', 8800, 8100, 6800],
  ['Atap', 'Genteng Beton', 'Genteng Beton Presco Warna Coklat', 9200, 8500, 7200],
  ['Atap', 'Genteng Metal', 'Genteng Metal Pasir Merah', 42000, 39000, 33500],
  ['Atap', 'Genteng Metal', 'Genteng Metal Pasir Abu', 43500, 40500, 35000],
  ['Atap', 'Polycarbonate', 'Polycarbonate Solid Clear 3 mm 210x600 cm', 485000, 455000, 395000],
  ['Atap', 'Polycarbonate', 'Polycarbonate Twinwall 10 mm 210x600 cm', 720000, 675000, 590000],
  ['Atap', 'Atap UPVC', 'Atap UPVC Onda 880 mm x 6 m', 195000, 182000, 158000],
  ['Atap', 'Flashing Atap', 'Flashing Atap Galvalum Panjang 3 m', 125000, 116000, 100000],
  ['Atap', 'Talang Air', 'Talang Air Mini Onda 3 m', 98000, 91000, 79000],

  ['Kelistrikan', 'Kabel NYA', 'Kabel NYA Supreme 4 mm 50 m', 485000, 455000, 398000],
  ['Kelistrikan', 'Kabel NYY', 'Kabel NYY Kobe 2x2,5 mm 50 m', 520000, 490000, 425000],
  ['Kelistrikan', 'Kabel NYAF', 'Kabel NYAF Jumbo 1,5 mm 100 m', 285000, 268000, 232000],
  ['Kelistrikan', 'Lampu LED', 'Lampu LED Philips 9 Watt Putih', 45000, 42000, 36000],
  ['Kelistrikan', 'Lampu LED', 'Lampu LED Osram 12 Watt Warm White', 52000, 48000, 41000],
  ['Kelistrikan', 'Lampu LED', 'Lampu Emergency Philips 10 Watt', 185000, 172000, 150000],
  ['Kelistrikan', 'Fitting Lampu', 'Fitting Lampu Downlight Panasonic 7 Watt', 78000, 72000, 62000],
  ['Kelistrikan', 'Stop Kontak', 'Stop Kontak BROCO Tanpa Ground 16A', 32000, 29000, 24000],
  ['Kelistrikan', 'Stop Kontak', 'Stop Kontak Outdoor Schneider IP54', 125000, 116000, 100000],
  ['Kelistrikan', 'Saklar', 'Saklar Uticon Hotel Series 16A', 48000, 44000, 38000],
  ['Kelistrikan', 'MCB', 'MCB Schneider 16A 1 Phase', 62000, 57000, 48000],
  ['Kelistrikan', 'MCB', 'MCB Hager 20A 1 Phase', 68000, 63000, 54000],
  ['Kelistrikan', 'Kontaktor', 'Kontaktor Schneider 2 Pole 20A', 285000, 268000, 232000],
  ['Kelistrikan', 'Terminal Block', 'Terminal Block Wago 2 Pin Isi 50 pcs', 95000, 88000, 75000],
  ['Kelistrikan', 'KWH Meter', 'KWH Meter Hexing 1 Phase', 385000, 360000, 315000],

  ['Fastener', 'Paku Beton', 'Paku Beton 10 cm Kemasan 1 kg', 38000, 35000, 28500],
  ['Fastener', 'Paku Kayu', 'Paku Kayu 10 cm Kemasan 1 kg', 34000, 31000, 25500],
  ['Fastener', 'Sekrup Beton', 'Sekrup Beton Fischer 6 x 60 mm Isi 100 pcs', 72000, 67000, 58000],
  ['Fastener', 'Sekrup Kayu', 'Sekrup Kayu 8 x 2 Inch Isi 500 pcs', 58000, 54000, 46000],
  ['Fastener', 'Baut Flange', 'Baut Flange M8 x 40 mm Isi 50 pcs', 65000, 60000, 52000],
  ['Fastener', 'Mur Baut', 'Mur Baut Hex M10 Isi 50 pcs', 42000, 39000, 33500],
  ['Fastener', 'Rivet', 'Rivet Aluminium 4 x 12 mm Isi 500 pcs', 48000, 44000, 38000],
  ['Fastener', 'Anchor Bolt', 'Anchor Bolt M12 x 150 mm Isi 10 pcs', 95000, 88000, 75000],
  ['Fastener', 'Ring Sekrup', 'Ring Sekrup Drill Bit 6 mm Isi 100 pcs', 55000, 51000, 44000],
  ['Fastener', 'Washer Flat', 'Washer Flat M10 Isi 100 pcs', 28000, 25000, 20500],

  ['Gypsum', 'Papan Gypsum', 'Papan Gypsum Moisture Resistant Jayaboard 12 mm', 158000, 148000, 128000],
  ['Gypsum', 'Papan Gypsum', 'Papan Gypsum Fire Resistant Knauf 12 mm', 172000, 161000, 140000],
  ['Gypsum', 'Hollow Gypsum', 'Hollow Gypsum 3x5 cm Panjang 4 m', 48000, 44000, 38000],
  ['Gypsum', 'Compound Gypsum Lembut', 'Compound Gypsum Lembut 1 kg', 18000, 16000, 13000],
  ['Gypsum', 'Aksesori Plafon', 'Aksesori Plafon Metal Corner Trim 3 m', 35000, 32000, 26000],
  ['Gypsum', 'Plafon PVC', 'Plafon PVC Shunda 20 cm Panjang 6 m', 42000, 39000, 33500],
  ['Gypsum', 'Plafon PVC', 'Plafon PVC Shunda 30 cm Panjang 6 m', 58000, 54000, 46000],

  ['Waterproofing', 'Grouting Waterproof', 'Grouting Waterproof Sika 5 kg', 125000, 116000, 100000],
  ['Waterproofing', 'Polyurethane Sealant', 'Polyurethane Sealant Sika 600 ml', 185000, 172000, 150000],
  ['Waterproofing', 'Asphalt Emulsion', 'Asphalt Emulsion 20 Liter', 420000, 395000, 345000],

  ['Perekat', 'Foam Sealant', 'Foam Sealant Bosny 750 ml', 85000, 79000, 68000],
  ['Perekat', 'Lem Contact', 'Lem Contact Semboyan 450 gram', 52000, 48000, 41000],
  ['Perekat', 'Lem Tembak', 'Lem Tembak Techbond Isi 10 batang', 35000, 32000, 26000],

  ['Bata & Block', 'Bata Merah', 'Bata Merah Press Ukuran 50-110-220 mm', 950, 880, 750],
  ['Bata & Block', 'Bata Merah', 'Bata Merah Manual Ukuran 52-115-230 mm', 820, 760, 650],
  ['Bata & Block', 'Batako', 'Batako Press Ukuran 40x10x20 cm', 4200, 3900, 3350],
  ['Bata & Block', 'Batako', 'Batako Manual Ukuran 40x10x20 cm', 3800, 3500, 3000],
  ['Bata & Block', 'Hebel AAC', 'Hebel AAC 10 cm Ukuran 60x20x10 cm', 12500, 11600, 10000],
  ['Bata & Block', 'Hebel AAC', 'Hebel AAC 7,5 cm Ukuran 60x20x7,5 cm', 10800, 10000, 8600],
  ['Bata & Block', 'Hebel AAC', 'Hebel AAC 15 cm Ukuran 60x20x15 cm', 15800, 14800, 12800],
  ['Bata & Block', 'Bata Ringan', 'Bata Ringan ST 150 Ukuran 60x20x7,5 cm', 9800, 9100, 7800],
  ['Bata & Block', 'Paving Block', 'Paving Block Hexagon Merah Tebal 6 cm', 5200, 4800, 4100],
  ['Bata & Block', 'Paving Block', 'Paving Block Square Abu Tebal 8 cm', 6800, 6300, 5400],
  ['Bata & Block', 'U-Ditch', 'U-Ditch Beton Precast 50x50 cm', 285000, 268000, 232000],
  ['Bata & Block', 'Buis Beton', 'Buis Beton Diameter 60 cm Panjang 1 m', 420000, 395000, 345000],
  ['Bata & Block', 'Kansteen', 'Kansteen 10x25x50 cm', 18500, 17200, 15000],
  ['Bata & Block', 'Cover Buis', 'Cover Buis Beton Diameter 60 cm', 85000, 79000, 68000],

  ['Sanitari', 'Kloset', 'Kloset Duduk Toto CW552', 1450000, 1370000, 1200000],
  ['Sanitari', 'Kloset', 'Kloset Jongkok Ina 40 cm', 285000, 268000, 232000],
  ['Sanitari', 'Wastafel', 'Wastafel Toto LW451', 685000, 645000, 560000],
  ['Sanitari', 'Wastafel', 'Wastafel Ina 55 cm', 320000, 300000, 260000],
  ['Sanitari', 'Shower Set', 'Shower Set Wasser Single Handle', 285000, 268000, 232000],
  ['Sanitari', 'Shower Set', 'Shower Set Onda Rain Shower', 425000, 400000, 348000],
  ['Sanitari', 'Kran Air', 'Kran Air Wasser 1/2 Inch', 85000, 79000, 68000],
  ['Sanitari', 'Kran Air', 'Kran Air Onda 3/4 Inch', 98000, 91000, 79000],
  ['Sanitari', 'Floor Drain', 'Floor Drain Rucika 4 Inch', 42000, 39000, 33500],
  ['Sanitari', 'Sifon Wastafel', 'Sifon Wastafel Chrome', 35000, 32000, 26000],
  ['Sanitari', 'Bak Cuci', 'Bak Cuci Multi Slot Stainless 80 cm', 1250000, 1180000, 1030000],
  ['Sanitari', 'Flexible Hose', 'Flexible Hose Wasser 60 cm', 45000, 42000, 36000],

  ['Peralatan Tukang', 'Ember Cor', 'Ember Cor 22 Liter', 28000, 25000, 20500],
  ['Peralatan Tukang', 'Roskam', 'Roskam Semen 37 cm', 42000, 39000, 33500],
  ['Peralatan Tukang', 'Ceta Semen', 'Ceta Semen 40x40 cm', 65000, 60000, 52000],
  ['Peralatan Tukang', 'Meteran', 'Meteran Fukuda 5 Meter', 38000, 35000, 28500],
  ['Peralatan Tukang', 'Waterpass', 'Waterpass 60 cm', 85000, 79000, 68000],
  ['Peralatan Tukang', 'Palu Kayu', 'Palu Kayu Besar', 72000, 67000, 58000],
  ['Peralatan Tukang', 'Gergaji Kayu', 'Gergaji Kayu 18 Inch', 95000, 88000, 75000],
  ['Peralatan Tukang', 'Wire Brush', 'Wire Brush Gerinda 4 Inch', 22000, 20000, 16500],
  ['Peralatan Tukang', 'Mata Bor Beton', 'Mata Bor Beton 10 mm', 35000, 32000, 26000],
  ['Peralatan Tukang', 'Pisau Cutterm', 'Pisau Cutterm Besar', 15000, 13500, 11000],
  ['Peralatan Tukang', 'Sarung Tangan Karet', 'Sarung Tangan Karet Isi 12 pasang', 48000, 44000, 38000],
  ['Peralatan Tukang', 'Masker N95', 'Masker N95 Isi 20 pcs', 85000, 79000, 68000],

  ['Insulasi', 'Rockwool', 'Rockwool Density 40 Ukuran 60x120x5 cm', 85000, 79000, 68000],
  ['Insulasi', 'Rockwool', 'Rockwool Density 60 Ukuran 60x120x5 cm', 115000, 107000, 92000],
  ['Insulasi', 'Glasswool', 'Glasswool 25 mm Roll 1,2 x 10 m', 185000, 172000, 150000],
  ['Insulasi', 'Glasswool', 'Glasswool 50 mm Roll 1,2 x 10 m', 320000, 300000, 260000],
  ['Insulasi', 'Foil Bubble', 'Aluminium Foil Bubble Sheet 4 mm 1,2 x 25 m', 485000, 455000, 395000],
  ['Insulasi', 'Weather Strip', 'Weather Strip Karet Pintu 10 m', 42000, 39000, 33500],

  ['Rangka Atap', 'Kanal Baja Ringan', 'Kanal C75 Baja Ringan Panjang 6 m', 175000, 163000, 142000],
  ['Rangka Atap', 'Kanal Baja Ringan', 'Kanal C100 Baja Ringan Panjang 6 m', 225000, 210000, 183000],
  ['Rangka Atap', 'Reng Baja Ringan', 'Reng C75 Baja Ringan Panjang 6 m', 105000, 98000, 85000],
  ['Rangka Atap', 'Reng Baja Ringan', 'Reng C100 Baja Ringan Panjang 6 m', 135000, 126000, 110000],
  ['Rangka Atap', 'Siku Atap', 'Siku Atap Baja Ringan Panjang 3 m', 78000, 72000, 62000],
  ['Rangka Atap', 'Klem Baja Ringan', 'Klem Baja Ringan Isi 100 pcs', 65000, 60000, 52000],
  ['Rangka Atap', 'Skrup Baja Ringan', 'Skrup Baja Ringan 12x14 Isi 500 pcs', 82000, 76000, 66000],
  ['Besi', 'Besi Beton', 'Besi Beton Ulir Diameter 12 mm Panjang 12 m', 168000, 157000, 136000],
  ['Semen', 'Semen Tahan Air', 'Semen Viva Waterproof 10 kg', 68000, 63000, 54000],

  // --- Eceran (per ons / setengah kg / kg) ---
  ['Eceran', 'Paku Kayu Ecer', 'Paku Kayu 5 cm Ecer per Ons', 3800, 3500, 2800],
  ['Eceran', 'Paku Kayu Ecer', 'Paku Kayu 5 cm Ecer per 1/2 kg', 16500, 15200, 13000],
  ['Eceran', 'Paku Kayu Ecer', 'Paku Kayu 5 cm Ecer per 1 kg', 29500, 27200, 23500],
  ['Eceran', 'Paku Kayu Ecer', 'Paku Kayu 7 cm Ecer per Ons', 4200, 3900, 3200],
  ['Eceran', 'Paku Kayu Ecer', 'Paku Kayu 7 cm Ecer per 1/2 kg', 18500, 17200, 15000],
  ['Eceran', 'Paku Kayu Ecer', 'Paku Kayu 10 cm Ecer per Ons', 4500, 4200, 3500],
  ['Eceran', 'Paku Beton Ecer', 'Paku Beton 5 cm Ecer per Ons', 4200, 3900, 3200],
  ['Eceran', 'Paku Beton Ecer', 'Paku Beton 5 cm Ecer per 1/2 kg', 18500, 17200, 15000],
  ['Eceran', 'Paku Beton Ecer', 'Paku Beton 5 cm Ecer per 1 kg', 33500, 31000, 26800],
  ['Eceran', 'Paku Beton Ecer', 'Paku Beton 7 cm Ecer per Ons', 4500, 4200, 3500],
  ['Eceran', 'Paku Beton Ecer', 'Paku Beton 7 cm Ecer per 1/2 kg', 19500, 18200, 15800],
  ['Eceran', 'Paku Beton Ecer', 'Paku Beton 10 cm Ecer per Ons', 4800, 4400, 3600],
  ['Eceran', 'Paku Payung Ecer', 'Paku Payung 1 Inch Ecer per Ons', 3200, 2900, 2400],
  ['Eceran', 'Paku Payung Ecer', 'Paku Payung 1,5 Inch Ecer per Ons', 3500, 3200, 2600],
  ['Eceran', 'Sekrup Kayu Ecer', 'Sekrup Kayu 1 Inch Ecer per Ons', 6500, 6000, 5000],
  ['Eceran', 'Sekrup Kayu Ecer', 'Sekrup Kayu 2 Inch Ecer per Ons', 7200, 6700, 5500],
  ['Eceran', 'Sekrup Kayu Ecer', 'Sekrup Kayu 2 Inch Ecer per 1/2 kg', 32000, 30000, 26000],
  ['Eceran', 'Baut Mur Ecer', 'Baut M8 Ecer per Ons', 8500, 7900, 6500],
  ['Eceran', 'Baut Mur Ecer', 'Mur M8 Ecer per Ons', 5500, 5100, 4200],
  ['Eceran', 'Baut Mur Ecer', 'Ring M8 Ecer per Ons', 3500, 3200, 2600],
  ['Eceran', 'Kawat Bendrat Ecer', 'Kawat Bendrat Ecer per Ons', 2500, 2300, 1900],
  ['Eceran', 'Kawat Bendrat Ecer', 'Kawat Bendrat Ecer per 1/2 kg', 11500, 10700, 9200],
  ['Eceran', 'Kawat Bendrat Ecer', 'Kawat Bendrat Ecer per 1 kg', 22000, 20500, 17800],
  ['Eceran', 'Paku Tembak Ecer', 'Paku Tembak 2 Inch Ecer per Ons', 5800, 5400, 4500],
  ['Eceran', 'Paku Tembak Ecer', 'Paku Tembak 3 Inch Ecer per 1/2 kg', 28500, 26800, 23200],
];

$seenVarian = [];
foreach ($items as $i => $row) {
  $nama = $row[2];
  if (isset($seenVarian[$nama])) {
    fwrite(STDERR, "Duplikat nama varian: \"$nama\" (baris " . ($i + 1) . ")\n");
    exit(1);
  }
  $seenVarian[$nama] = true;
}

if (count($items) < 267) {
  fwrite(STDERR, 'Jumlah varian terlalu sedikit, saat ini: ' . count($items) . "\n");
  exit(1);
}

try {
  $countKat = (int) $conn->query("SELECT COUNT(*) FROM kategoriproduk")->fetchColumn();
  $countProd = (int) $conn->query("SELECT COUNT(*) FROM produk")->fetchColumn();

  if ($countKat > 0 || $countProd > 0) {
    echo "Database sudah berisi kategori/produk ($countKat kategori, $countProd produk).\n";
    echo "Hapus data lama dulu jika ingin seed ulang, atau jalankan dengan argumen --force\n";
    if (!in_array('--force', $argv ?? [], true)) {
      exit(1);
    }
    $conn->exec('SET FOREIGN_KEY_CHECKS = 0');
    $conn->exec('DELETE FROM stok');
    $conn->exec('DELETE FROM produkvarian');
    $conn->exec('DELETE FROM produk');
    $conn->exec('DELETE FROM kategoriproduk');
    $conn->exec('ALTER TABLE kategoriproduk AUTO_INCREMENT = 1');
    $conn->exec('ALTER TABLE produk AUTO_INCREMENT = 1');
    $conn->exec('ALTER TABLE produkvarian AUTO_INCREMENT = 1');
    $conn->exec('ALTER TABLE stok AUTO_INCREMENT = 1');
    $conn->exec('SET FOREIGN_KEY_CHECKS = 1');
    echo "Data lama dihapus (--force).\n";
  }

  $conn->beginTransaction();

  require_once __DIR__ . '/../utils/produkvarian_schema.php';
  ensureProdukvarianPriceSchema($conn);

  $katIds = [];
  $stmtKat = $conn->prepare('INSERT INTO kategoriproduk (namaKategori, deskripsi) VALUES (?, ?)');
  foreach ($catDeskripsi as $nama => $desk) {
    $stmtKat->execute([$nama, $desk]);
    $katIds[$nama] = (int) $conn->lastInsertId();
  }

  $prodIds = [];
  $stmtProd = $conn->prepare('INSERT INTO produk (namaProduk, deskripsi, kategoriID) VALUES (?, ?, ?)');
  $stmtVar = $conn->prepare('
    INSERT INTO produkvarian (namaVarian, hargaJual, hargaReseller, hargaModal, stokMinimum, status, produkID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  ');

  $variantCount = 0;
  $varianUntukStok = [];
  foreach ($items as [$kat, $prod, $varian, $jual, $reseller, $modal]) {
    $key = $kat . '|' . $prod;
    if (!isset($prodIds[$key])) {
      $desk = $prodDeskripsi[$prod] ?? "Produk $prod untuk kebutuhan $kat.";
      $stmtProd->execute([$prod, $desk, $katIds[$kat]]);
      $prodIds[$key] = (int) $conn->lastInsertId();
    }

    $stokMin = stokMinimumUntuk($kat, $prod, $varian, (int) $jual);
    $stmtVar->execute([
      $varian,
      $jual,
      $reseller,
      $modal,
      $stokMin,
      'Tersedia',
      $prodIds[$key],
    ]);
    $varianUntukStok[] = [
      'varianID' => (int) $conn->lastInsertId(),
      'kategori' => $kat,
      'produk' => $prod,
      'namaVarian' => $varian,
      'hargaJual' => (int) $jual,
      'stokMinimum' => $stokMin,
    ];
    $variantCount++;
  }

  pastikanKolomStokRusak($conn);
  date_default_timezone_set('Asia/Jakarta');
  $tanggalStok = date('Y-m-d H:i:s');
  $cabangList = daftarCabang();
  $stmtStok = $conn->prepare(
    'INSERT INTO stok (jumlah, jumlahRusak, tanggalUpdate, lokasi, varianID) VALUES (?, 0, ?, ?, ?)'
  );
  $stokCount = 0;
  foreach ($varianUntukStok as $row) {
    foreach ($cabangList as $namaCabang) {
      $jumlah = stokJumlahCabang(
        $row['kategori'],
        $row['produk'],
        $row['namaVarian'],
        $row['hargaJual'],
        $row['stokMinimum'],
        $namaCabang
      );
      $stmtStok->execute([$jumlah, $tanggalStok, $namaCabang, $row['varianID']]);
      $stokCount++;
    }
  }

  $conn->commit();

  echo "Seed selesai.\n";
  echo '- Kategori: ' . count($katIds) . "\n";
  echo '- Produk: ' . count($prodIds) . "\n";
  echo "- Varian: $variantCount\n";
  echo "- Stok: $stokCount baris (" . count($cabangList) . " cabang)\n";
} catch (Exception $e) {
  if ($conn->inTransaction()) {
    $conn->rollBack();
  }
  fwrite(STDERR, 'Gagal seed: ' . $e->getMessage() . "\n");
  exit(1);
}
