-- Tabel untuk Manajemen Cabang
CREATE TABLE IF NOT EXISTS `cabang` (
  `cabangID` varchar(10) NOT NULL,
  `namaCabang` varchar(50) NOT NULL,
  `alamat` varchar(100) NOT NULL,
  `status` enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  PRIMARY KEY (`cabangID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert sample data
INSERT INTO `cabang` (`cabangID`, `namaCabang`, `alamat`, `status`) VALUES
('C001', 'Toko Pusat', 'Jl. Merdeka 1', 'Aktif'),
('C002', 'Toko Selatan', 'Jl. Sudirman 10', 'Nonaktif');

