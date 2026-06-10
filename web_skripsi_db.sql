SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


CREATE TABLE `detail_transaksi` (
  `detailTransaksiID` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `hargaSatuan` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `transaksiID` int(11) NOT NULL,
  `varianID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `diskon` (
  `diskonID` int(11) NOT NULL,
  `namaDiskon` varchar(50) NOT NULL,
  `tipeDiskon` enum('PERCENTAGE','NOMINAL') NOT NULL,
  `nilaiDiskon` decimal(10,2) NOT NULL,
  `keterangan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `karyawan`
--

CREATE TABLE `karyawan` (
  `karyawanID` int(11) NOT NULL,
  `posisi` varchar(30) NOT NULL,
  `shift` varchar(20) NOT NULL,
  `tanggalMasuk` date NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `userID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `karyawan`
--

INSERT INTO `karyawan` (`karyawanID`, `posisi`, `shift`, `tanggalMasuk`, `status`, `userID`) VALUES
(1, 'kasir', 'Pagi', '2025-11-15', 'Aktif', 21);

-- --------------------------------------------------------

--
-- Table structure for table `kategoriproduk`
--

CREATE TABLE `kategoriproduk` (
  `kategoriID` int(11) NOT NULL,
  `namaKategori` varchar(50) NOT NULL,
  `deskripsi` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `laporan`
--

CREATE TABLE `laporan` (
  `laporanID` int(11) NOT NULL,
  `periode` varchar(20) NOT NULL,
  `tanggalBuat` date NOT NULL,
  `ownerID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `laporan_pembelian`
--

CREATE TABLE `laporan_pembelian` (
  `laporanPembelianID` int(11) NOT NULL,
  `totalPembelian` decimal(10,2) NOT NULL,
  `jumlahItem` int(11) NOT NULL,
  `diskonPembelian` decimal(10,2) DEFAULT NULL,
  `lokasi` varchar(50) NOT NULL,
  `laporanID` int(11) NOT NULL,
  `pembelianID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `laporan_penjualan`
--

CREATE TABLE `laporan_penjualan` (
  `laporanPenjualanID` int(11) NOT NULL,
  `totalPembelian` decimal(10,2) NOT NULL,
  `totalPenjualan` decimal(10,2) NOT NULL,
  `totalDiskon` decimal(10,2) NOT NULL,
  `jumlahItem` int(11) NOT NULL,
  `lokasi` varchar(50) NOT NULL,
  `laporanID` int(11) NOT NULL,
  `penjualanID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mutasistok`
--

CREATE TABLE `mutasistok` (
  `mutasiID` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `tanggal` datetime NOT NULL,
  `lokasiAsal` varchar(50) NOT NULL,
  `lokasiTujuan` varchar(50) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `varianID` int(11) NOT NULL,
  `stokID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nota`
--

CREATE TABLE `nota` (
  `notaID` int(11) NOT NULL,
  `nomorNota` varchar(30) NOT NULL,
  `tanggalCetak` date NOT NULL,
  `totalBayar` decimal(10,2) NOT NULL,
  `detail` text DEFAULT NULL,
  `penjualanID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `owner`
--

CREATE TABLE `owner` (
  `ownerID` int(11) NOT NULL,
  `jabatan` varchar(50) NOT NULL,
  `noTelepon` varchar(15) DEFAULT NULL,
  `userID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `owner`
--

INSERT INTO `owner` (`ownerID`, `jabatan`, `noTelepon`, `userID`) VALUES
(4, 'owner', '081258926817', 18);

-- --------------------------------------------------------

--
-- Table structure for table `pembelian`
--

CREATE TABLE `pembelian` (
  `pembelianID` int(11) NOT NULL,
  `noFaktur` varchar(50) NOT NULL,
  `tanggalTerima` date NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `lokasi` varchar(50) NOT NULL,
  `transaksiID` int(11) NOT NULL,
  `supplierID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `penjualan`
--

CREATE TABLE `penjualan` (
  `penjualanID` int(11) NOT NULL,
  `namaPembeli` varchar(50) DEFAULT NULL,
  `jenisPenjualan` enum('NORMAL','RESELLER') NOT NULL,
  `metodePembayaran` varchar(30) NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `lokasi` varchar(50) NOT NULL,
  `transaksiID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produk`
--

CREATE TABLE `produk` (
  `produkID` int(11) NOT NULL,
  `namaProduk` varchar(50) NOT NULL,
  `deskripsi` text NOT NULL,
  `kategoriID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produkvarian`
--

CREATE TABLE `produkvarian` (
  `varianID` int(11) NOT NULL,
  `namaVarian` varchar(50) NOT NULL,
  `hargaJual` decimal(10,2) NOT NULL,
  `hargaReseller` decimal(10,2) NOT NULL,
  `hargaModal` decimal(10,2) NOT NULL,
  `stokMinimum` int(11) NOT NULL,
  `status` varchar(20) NOT NULL,
  `produkID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `returpenjualan`
--

CREATE TABLE `returpenjualan` (
  `returID` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `alasan` text NOT NULL,
  `disposisiBarang` enum('KEMBALI_STOK','BARANG_RUSAK') NOT NULL DEFAULT 'KEMBALI_STOK',
  `nominalPengembalian` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tanggalRetur` date NOT NULL,
  `lokasi` varchar(50) NOT NULL,
  `varianID` int(11) NOT NULL,
  `penjualanID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `retursupplier`
--

CREATE TABLE `retursupplier` (
  `returSupplierID` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `tanggalRetur` date NOT NULL,
  `lokasi` varchar(50) NOT NULL,
  `pembelianID` int(11) NOT NULL,
  `varianID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stok`
--

CREATE TABLE `stok` (
  `stokID` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `jumlahRusak` int(11) NOT NULL DEFAULT 0,
  `tanggalUpdate` datetime NOT NULL,
  `lokasi` varchar(50) NOT NULL,
  `varianID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stok_rusak_buang`
-- Catatan barang rusak yang dibuang dari stok (tidak kembali ke layak)
--

CREATE TABLE `stok_rusak_buang` (
  `buangRusakID` int(11) NOT NULL,
  `stokID` int(11) NOT NULL,
  `varianID` int(11) NOT NULL,
  `lokasi` varchar(50) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `keterangan` text NOT NULL,
  `tanggalBuang` datetime NOT NULL,
  `userID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `supplierID` int(11) NOT NULL,
  `nama` varchar(50) NOT NULL,
  `alamat` varchar(100) NOT NULL,
  `noTelepon` varchar(20) NOT NULL,
  `email` varchar(50) DEFAULT NULL,
  `kontakPerson` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `transaksiID` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `jumlah` int(11) NOT NULL,
  `hargaSatuan` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `karyawanID` int(11) NOT NULL,
  `varianID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaksi_diskon`
--

CREATE TABLE `transaksi_diskon` (
  `transaksiDiskonID` int(11) NOT NULL,
  `totalDiskon` decimal(10,2) NOT NULL,
  `tanggalTerapkan` datetime NOT NULL,
  `transaksiID` int(11) NOT NULL,
  `diskonID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `userID` int(11) NOT NULL,
  `username` varchar(30) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fname` varchar(30) NOT NULL,
  `lname` varchar(30) NOT NULL,
  `email` varchar(50) NOT NULL,
  `noTelepon` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`userID`, `username`, `password`, `fname`, `lname`, `email`, `noTelepon`) VALUES
(18, 'edward123', '$2y$10$c60ZwcYOq7Jz1MY7cy.of.ZE4XwSZMy7AgRXsLhLEhGBitFZMpxE6', 'edward harlleyandy', 'cuangarta', 'edward.hccc07@gmail.com', '081258926817'),
(21, 'ed', '$2y$10$JNJypaSc05yAB99jgVOTjOxcBaomw6IIpFewDtuyjTOlnHYpxi5Cm', 'edward', 'harlley', 'boa.voz88@gmail.com', '08123456789');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  ADD PRIMARY KEY (`detailTransaksiID`),
  ADD KEY `fk_detail_transaksi` (`transaksiID`),
  ADD KEY `fk_detail_varian` (`varianID`);

--
-- Indexes for table `diskon`
--
ALTER TABLE `diskon`
  ADD PRIMARY KEY (`diskonID`);

--
-- Indexes for table `karyawan`
--
ALTER TABLE `karyawan`
  ADD PRIMARY KEY (`karyawanID`),
  ADD KEY `fk_karyawan_user` (`userID`);

--
-- Indexes for table `kategoriproduk`
--
ALTER TABLE `kategoriproduk`
  ADD PRIMARY KEY (`kategoriID`);

--
-- Indexes for table `laporan`
--
ALTER TABLE `laporan`
  ADD PRIMARY KEY (`laporanID`),
  ADD KEY `fk_laporan_owner` (`ownerID`);

--
-- Indexes for table `laporan_pembelian`
--
ALTER TABLE `laporan_pembelian`
  ADD PRIMARY KEY (`laporanPembelianID`),
  ADD KEY `fk_lapbel_laporan` (`laporanID`),
  ADD KEY `fk_lapbel_pembelian` (`pembelianID`);

--
-- Indexes for table `laporan_penjualan`
--
ALTER TABLE `laporan_penjualan`
  ADD PRIMARY KEY (`laporanPenjualanID`),
  ADD KEY `fk_lappen_laporan` (`laporanID`),
  ADD KEY `fk_lappen_penjualan` (`penjualanID`);

--
-- Indexes for table `mutasistok`
--
ALTER TABLE `mutasistok`
  ADD PRIMARY KEY (`mutasiID`),
  ADD KEY `fk_mutasi_varian` (`varianID`),
  ADD KEY `fk_mutasi_stok` (`stokID`);

--
-- Indexes for table `nota`
--
ALTER TABLE `nota`
  ADD PRIMARY KEY (`notaID`),
  ADD KEY `fk_nota_penjualan` (`penjualanID`);

--
-- Indexes for table `owner`
--
ALTER TABLE `owner`
  ADD PRIMARY KEY (`ownerID`),
  ADD KEY `fk_owner_user` (`userID`);

--
-- Indexes for table `pembelian`
--
ALTER TABLE `pembelian`
  ADD PRIMARY KEY (`pembelianID`),
  ADD KEY `fk_pembelian_transaksi` (`transaksiID`);

--
-- Indexes for table `penjualan`
--
ALTER TABLE `penjualan`
  ADD PRIMARY KEY (`penjualanID`),
  ADD KEY `fk_penjualan_transaksi` (`transaksiID`);

--
-- Indexes for table `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`produkID`),
  ADD KEY `fk_produk_kategori` (`kategoriID`);

--
-- Indexes for table `produkvarian`
--
ALTER TABLE `produkvarian`
  ADD PRIMARY KEY (`varianID`),
  ADD KEY `fk_varian_produk` (`produkID`);

--
-- Indexes for table `returpenjualan`
--
ALTER TABLE `returpenjualan`
  ADD PRIMARY KEY (`returID`),
  ADD KEY `fk_returpen_varian` (`varianID`),
  ADD KEY `fk_returpen_penjualan` (`penjualanID`);

--
-- Indexes for table `retursupplier`
--
ALTER TABLE `retursupplier`
  ADD PRIMARY KEY (`returSupplierID`),
  ADD KEY `fk_retursupp_pembelian` (`pembelianID`),
  ADD KEY `fk_retursupp_varian` (`varianID`);

--
-- Indexes for table `stok`
--
ALTER TABLE `stok`
  ADD PRIMARY KEY (`stokID`),
  ADD KEY `fk_stok_varian` (`varianID`);

--
-- Indexes for table `stok_rusak_buang`
--
ALTER TABLE `stok_rusak_buang`
  ADD PRIMARY KEY (`buangRusakID`),
  ADD KEY `fk_srb_stok` (`stokID`),
  ADD KEY `fk_srb_varian` (`varianID`),
  ADD KEY `fk_srb_user` (`userID`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`supplierID`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`transaksiID`),
  ADD KEY `fk_transaksi_karyawan` (`karyawanID`);

--
-- Indexes for table `transaksi_diskon`
--
ALTER TABLE `transaksi_diskon`
  ADD PRIMARY KEY (`transaksiDiskonID`),
  ADD KEY `fk_td_transaksi` (`transaksiID`),
  ADD KEY `fk_td_diskon` (`diskonID`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`userID`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  MODIFY `detailTransaksiID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `diskon`
--
ALTER TABLE `diskon`
  MODIFY `diskonID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `karyawan`
--
ALTER TABLE `karyawan`
  MODIFY `karyawanID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `kategoriproduk`
--
ALTER TABLE `kategoriproduk`
  MODIFY `kategoriID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `laporan`
--
ALTER TABLE `laporan`
  MODIFY `laporanID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `laporan_pembelian`
--
ALTER TABLE `laporan_pembelian`
  MODIFY `laporanPembelianID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `laporan_penjualan`
--
ALTER TABLE `laporan_penjualan`
  MODIFY `laporanPenjualanID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mutasistok`
--
ALTER TABLE `mutasistok`
  MODIFY `mutasiID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nota`
--
ALTER TABLE `nota`
  MODIFY `notaID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `owner`
--
ALTER TABLE `owner`
  MODIFY `ownerID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pembelian`
--
ALTER TABLE `pembelian`
  MODIFY `pembelianID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penjualan`
--
ALTER TABLE `penjualan`
  MODIFY `penjualanID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produk`
--
ALTER TABLE `produk`
  MODIFY `produkID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produkvarian`
--
ALTER TABLE `produkvarian`
  MODIFY `varianID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `returpenjualan`
--
ALTER TABLE `returpenjualan`
  MODIFY `returID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `retursupplier`
--
ALTER TABLE `retursupplier`
  MODIFY `returSupplierID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stok`
--
ALTER TABLE `stok`
  MODIFY `stokID` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `stok_rusak_buang`
  MODIFY `buangRusakID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `supplierID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `transaksiID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaksi_diskon`
--
ALTER TABLE `transaksi_diskon`
  MODIFY `transaksiDiskonID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `userID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  ADD CONSTRAINT `fk_detail_transaksi` FOREIGN KEY (`transaksiID`) REFERENCES `transaksi` (`transaksiID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_varian` FOREIGN KEY (`varianID`) REFERENCES `produkvarian` (`varianID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `karyawan`
--
ALTER TABLE `karyawan`
  ADD CONSTRAINT `fk_karyawan_user` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `laporan`
--
ALTER TABLE `laporan`
  ADD CONSTRAINT `fk_laporan_owner` FOREIGN KEY (`ownerID`) REFERENCES `owner` (`ownerID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `laporan_pembelian`
--
ALTER TABLE `laporan_pembelian`
  ADD CONSTRAINT `fk_lapbel_laporan` FOREIGN KEY (`laporanID`) REFERENCES `laporan` (`laporanID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lapbel_pembelian` FOREIGN KEY (`pembelianID`) REFERENCES `pembelian` (`pembelianID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `laporan_penjualan`
--
ALTER TABLE `laporan_penjualan`
  ADD CONSTRAINT `fk_lappen_laporan` FOREIGN KEY (`laporanID`) REFERENCES `laporan` (`laporanID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lappen_penjualan` FOREIGN KEY (`penjualanID`) REFERENCES `penjualan` (`penjualanID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `mutasistok`
--
ALTER TABLE `mutasistok`
  ADD CONSTRAINT `fk_mutasi_stok` FOREIGN KEY (`stokID`) REFERENCES `stok` (`stokID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mutasi_varian` FOREIGN KEY (`varianID`) REFERENCES `produkvarian` (`varianID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `nota`
--
ALTER TABLE `nota`
  ADD CONSTRAINT `fk_nota_penjualan` FOREIGN KEY (`penjualanID`) REFERENCES `penjualan` (`penjualanID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `owner`
--
ALTER TABLE `owner`
  ADD CONSTRAINT `fk_owner_user` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pembelian`
--
ALTER TABLE `pembelian`
  ADD CONSTRAINT `fk_pembelian_transaksi` FOREIGN KEY (`transaksiID`) REFERENCES `transaksi` (`transaksiID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `penjualan`
--
ALTER TABLE `penjualan`
  ADD CONSTRAINT `fk_penjualan_transaksi` FOREIGN KEY (`transaksiID`) REFERENCES `transaksi` (`transaksiID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `produk`
--
ALTER TABLE `produk`
  ADD CONSTRAINT `fk_produk_kategori` FOREIGN KEY (`kategoriID`) REFERENCES `kategoriproduk` (`kategoriID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `produkvarian`
--
ALTER TABLE `produkvarian`
  ADD CONSTRAINT `fk_varian_produk` FOREIGN KEY (`produkID`) REFERENCES `produk` (`produkID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `returpenjualan`
--
ALTER TABLE `returpenjualan`
  ADD CONSTRAINT `fk_returpen_penjualan` FOREIGN KEY (`penjualanID`) REFERENCES `penjualan` (`penjualanID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_returpen_varian` FOREIGN KEY (`varianID`) REFERENCES `produkvarian` (`varianID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `retursupplier`
--
ALTER TABLE `retursupplier`
  ADD CONSTRAINT `fk_retursupp_pembelian` FOREIGN KEY (`pembelianID`) REFERENCES `pembelian` (`pembelianID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_retursupp_varian` FOREIGN KEY (`varianID`) REFERENCES `produkvarian` (`varianID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stok`
--
ALTER TABLE `stok`
  ADD CONSTRAINT `fk_stok_varian` FOREIGN KEY (`varianID`) REFERENCES `produkvarian` (`varianID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stok_rusak_buang`
--
ALTER TABLE `stok_rusak_buang`
  ADD CONSTRAINT `fk_srb_stok` FOREIGN KEY (`stokID`) REFERENCES `stok` (`stokID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_srb_varian` FOREIGN KEY (`varianID`) REFERENCES `produkvarian` (`varianID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_srb_user` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `fk_transaksi_karyawan` FOREIGN KEY (`karyawanID`) REFERENCES `karyawan` (`karyawanID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `transaksi_diskon`
--
ALTER TABLE `transaksi_diskon`
  ADD CONSTRAINT `fk_td_diskon` FOREIGN KEY (`diskonID`) REFERENCES `diskon` (`diskonID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_td_transaksi` FOREIGN KEY (`transaksiID`) REFERENCES `transaksi` (`transaksiID`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

