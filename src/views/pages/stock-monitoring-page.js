import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";
import { getCurrentUser } from "../../utils/authStorage.js";

export default class StockMonitoringPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.allStocks = []; 
    this.currentSearchQuery = "";
    this.selectedBranch = ""; 
    this.allAddStockVariants = []; 
    this.allMutations = []; // cache catatan mutasi
    this.mutationDate = ""; // yyyy-mm-dd (WIB)
    this.mutationDraftItems = []; // item mutasi per nota (multi varian)
  }

  async render() {
    // Wrapper utama
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    // Sidebar
    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    // Topbar
    const topbar = new Topbar("Stocks", "Monitoring Stok");
    wrapper.appendChild(topbar.render());

    // Content Area
    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <!-- Header dengan Search Bar dan tombol -->
      <div class="mb-6">
        <div class="flex justify-between items-center gap-4">
          <div class="flex-1">
            <div class="flex gap-3 items-center">
              <div class="relative flex-1 max-w-md">
                <input 
                  type="text" 
                  id="searchStocks" 
                  placeholder="Cari stok (semua field)..." 
                  class="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              <div class="min-w-[220px]">
                <select 
                  id="branchFilter"
                  class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  title="Filter per cabang"
                >
                  <option value="">Semua Cabang</option>
                </select>
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <button id="addStockBtn" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition whitespace-nowrap">
              Tambah Stok
            </button>
            <button id="mutateStockBtn" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition whitespace-nowrap">
              Buat Mutasi
            </button>
            <button id="mutationNotesBtn" class="bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition whitespace-nowrap">
              Catatan Mutasi
            </button>
            <button id="rusakBuangNotesBtn" class="bg-amber-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-900 transition whitespace-nowrap">
              Catatan Buang Rusak
            </button>
          </div>
        </div>
      </div>

      <!-- Notifikasi Stok Menipis -->
      <div id="lowStockNotification" class="hidden mb-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-sm">
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold text-yellow-800">
                    <span id="lowStockCount">0</span> produk dengan stok menipis atau habis memerlukan perhatian!
                  </p>
                  <p class="mt-1 text-sm text-yellow-700">
                    Stok sudah berada di bawah minimum atau habis. Segera lakukan restock.
                  </p>
                </div>
                <div class="ml-4 flex items-center gap-2">
                  <button id="toggleLowStockList" class="text-yellow-700 hover:text-yellow-900 text-sm font-medium">
                    <span id="toggleText">Lihat Detail</span>
                    <svg id="toggleIcon" class="inline-block w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  <button id="dismissNotification" class="text-yellow-400 hover:text-yellow-600">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Daftar Barang Stok Menipis/Habis -->
              <div id="lowStockList" class="hidden mt-4 pt-4 border-t border-yellow-200">
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  <div id="lowStockItems" class="space-y-2">
                    <!-- Daftar akan diisi di sini -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Tambah Stok (Hidden by default) -->
      <div id="addStockContainer" class="hidden bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 class="text-xl font-semibold mb-4">Tambah Stok Baru</h3>
        
        <form id="addStockForm" class="space-y-4">
          <!-- Varian -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Varian</label>
            <div class="space-y-2">
              <div class="relative">
                <input
                  type="text"
                  id="searchAddStockVarian"
                  placeholder="Cari varian / produk..."
                  class="w-full border border-gray-300 p-2.5 pl-9 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                />
                <svg class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <select 
                id="addStockVarian" 
                class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent"
                required
              >
                <option value="">Pilih Varian</option>
              </select>
            </div>
          </div>

          <!-- Lokasi -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
            <select 
              id="addStockLokasi" 
              class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent"
              required
            >
              <option value="">Pilih Lokasi</option>
            </select>
          </div>

          <!-- Jumlah -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
            <input 
              id="addStockJumlah" 
              type="number"
              min="1"
              class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Masukkan jumlah stok"
              required
            />
          </div>

          <!-- Tombol Aksi -->
          <div class="flex gap-3 pt-2">
            <button 
              type="submit" 
              class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Simpan
            </button>
            <button 
              type="button" 
              id="cancelAddStockBtn" 
              class="bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-400 transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>

      <!-- Modal Mutasi Stok (Hidden by default) -->
      <div id="mutationModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">Mutasi Stok Antar Cabang (Per Nota)</h3>
            <button id="closeMutationModal" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form id="mutationForm" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lokasi Asal</label>
                <select id="mutationLokasiAsal" class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Pilih Lokasi Asal</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lokasi Tujuan</label>
                <select id="mutationLokasiTujuan" class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Pilih Lokasi Tujuan</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">No Faktur Mutasi</label>
                <input id="mutationNoFaktur" type="text" readonly class="border border-gray-300 p-3 rounded-lg w-full bg-gray-100 text-gray-600" value="Memuat nomor faktur..." />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Biaya Ongkos Kirim (Opsional)</label>
                <input id="mutationOngkir" type="number" min="0" class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Masukkan ongkir jika ada" value="0" />
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 p-4 space-y-3">
              <h4 class="font-semibold text-gray-800">Tambah Item Mutasi</h4>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Varian</label>
                  <input id="searchMutationVarian" type="text" class="border border-gray-300 p-2.5 rounded-lg w-full mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Cari varian / produk..." />
                  <select id="mutationVarianSelect" class="border border-gray-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Pilih varian dari lokasi asal</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input id="mutationJumlah" type="number" min="1" class="border border-gray-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Qty" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Harga Satuan</label>
                  <input id="mutationHargaSatuan" type="number" min="1" class="border border-gray-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Harga" />
                </div>
              </div>
              <div class="flex items-center justify-between gap-2">
                <p id="mutationDraftHint" class="text-xs text-gray-500">Pilih lokasi asal dahulu untuk memuat varian.</p>
                <button type="button" id="addMutationItemBtn" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Tambah Item</button>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700">Varian</th>
                      <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-24">Tersedia</th>
                      <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-24">Qty</th>
                      <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-32">Harga</th>
                      <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-32">Subtotal</th>
                      <th class="px-3 py-2 text-center text-xs font-semibold text-gray-700 w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="mutationDraftTable" class="divide-y divide-gray-200">
                    <tr><td colspan="6" class="px-3 py-4 text-center text-sm text-gray-500">Belum ada item mutasi</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Keterangan (Opsional)</label>
                <textarea id="mutationKeterangan" rows="2" class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Catatan mutasi stok"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Total Mutasi (Termasuk Ongkir)</label>
                <input id="mutationTotalNilai" type="text" readonly class="border border-gray-300 p-3 rounded-lg w-full bg-gray-100 text-gray-700 font-semibold" value="Rp 0" />
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" class="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">Proses Mutasi (Per Nota)</button>
              <button type="button" id="cancelMutationBtn" class="flex-1 bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-400 transition">Batal</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Catatan Mutasi (Hidden by default) -->
      <div id="mutationNotesModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-6xl">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="text-xl font-semibold">Catatan Mutasi Stok</h3>
              <p class="text-sm text-gray-500 mt-0.5">Daftar transaksi mutasi per nota pengiriman.</p>
            </div>
            <button id="closeMutationNotesModal" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[320px]">
              <div class="relative flex-1 min-w-[240px] max-w-md">
                <input 
                  type="text" 
                  id="searchMutationNotes" 
                  placeholder="Cari no faktur, lokasi, item, atau keterangan..." 
                  class="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Tanggal</label>
                <input
                  type="date"
                  id="mutationDate"
                  class="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div class="flex gap-2">
              <button id="refreshMutationNotesBtn" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition whitespace-nowrap">
                Refresh
              </button>
              <button id="closeMutationNotesBtn" class="bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-400 transition whitespace-nowrap">
                Tutup
              </button>
            </div>
          </div>

          <div class="mb-3">
            <span id="mutationNotesCount" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              0 nota ditampilkan
            </span>
          </div>

          <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div class="overflow-x-auto max-h-[65vh]">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[170px]">No Faktur</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[140px]">Lokasi Asal</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[140px]">Lokasi Tujuan</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-24">Item</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-24">Qty</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700 min-w-[120px]">Ongkir</th>
                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700 min-w-[160px]">Total Mutasi</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[170px]">Tanggal & Jam</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[180px]">Keterangan</th>
                    <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody id="mutationNotesTable" class="divide-y divide-gray-200">
                  <!-- Data akan diisi di sini -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Nota Mutasi (detail per faktur) -->
      <div id="mutationInvoiceModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div class="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Nota Mutasi Stok</h3>
            <button id="closeMutationInvoiceModal" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div id="mutationInvoiceBody" class="p-5"></div>
        </div>
      </div>

      <!-- Modal: pindah ke barang rusak (stok layak -> rusak) -->
      <div id="rusakModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Catat barang rusak</h3>
          <p class="text-xs text-gray-500 mb-4">Memindahkan unit dari stok layak ke barang rusak. Barang rusak <strong>tidak dijual</strong> dan tidak dipakai untuk penjualan.</p>
          <form id="rusakForm" class="space-y-3">
            <input type="hidden" id="rusakStokID" />
            <div>
              <label class="block text-sm text-gray-700 mb-1">Varian</label>
              <input type="text" id="rusakVarianLabel" readonly class="w-full border border-gray-300 p-2 rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Stok layak tersedia</label>
              <input type="text" id="rusakJumlahTersedia" readonly class="w-full border border-gray-300 p-2 rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Qty dipindah ke rusak</label>
              <input type="number" id="rusakQty" min="1" class="w-full border border-gray-300 p-2 rounded-lg text-sm" required />
            </div>
            <div class="flex gap-2 justify-end pt-2">
              <button type="button" id="rusakCancelBtn" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm">Batal</button>
              <button type="submit" class="px-4 py-2 rounded-lg bg-amber-700 text-white text-sm hover:bg-amber-800">Simpan</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal catatan buang rusak -->
      <div id="rusakBuangModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl p-5 w-full max-w-5xl max-h-[85vh] flex flex-col">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-lg font-semibold">Catatan Buang Rusak</h3>
            <button type="button" id="closeRusakBuangModal" class="text-gray-500 hover:text-gray-800 text-xl leading-none">&times;</button>
          </div>
          <input type="text" id="searchRusakBuang" placeholder="Cari varian, lokasi, petugas, keterangan..." class="border border-gray-300 p-2 rounded-lg mb-3 text-sm" />
          <div class="overflow-auto border border-gray-200 rounded-lg flex-1">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 sticky top-0"><tr>
                <th class="px-3 py-2 text-left">Varian</th><th class="px-3 py-2 text-left">Lokasi</th>
                <th class="px-3 py-2 text-right">Qty</th><th class="px-3 py-2 text-left">Tanggal</th>
                <th class="px-3 py-2 text-left">Petugas</th><th class="px-3 py-2 text-left">Keterangan</th>
              </tr></thead>
              <tbody id="rusakBuangTable"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal: kelola qty barang rusak (buang atau kembalikan ke layak) -->
      <div id="rusakKelolaModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Kelola barang rusak</h3>
          <p class="text-xs text-gray-500 mb-4">Barang rusak tidak dijual. Anda bisa <strong>membuang</strong> dari catatan (hilang) atau <strong>mengembalikan</strong> ke stok layak jika bisa dijual lagi.</p>
          <input type="hidden" id="rusakKelolaStokID" />
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Varian</label>
              <input type="text" id="rusakKelolaVarianLabel" readonly class="w-full border border-gray-300 p-2 rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Stok rusak saat ini</label>
              <input type="text" id="rusakKelolaJumlahRusak" readonly class="w-full border border-gray-300 p-2 rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Qty</label>
              <input type="number" id="rusakKelolaQty" min="1" class="w-full border border-gray-300 p-2 rounded-lg text-sm" value="1" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Keterangan pembuangan <span class="text-amber-700">(wajib saat buang)</span></label>
              <textarea id="rusakKelolaKeterangan" rows="2" class="w-full border border-gray-300 p-2 rounded-lg text-sm" placeholder="Contoh: rusak total, dibuang ke tempat sampah..."></textarea>
            </div>
            <div class="flex flex-col gap-2 pt-1">
              <button type="button" id="rusakKelolaDisposeBtn" class="w-full px-4 py-2.5 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-800">Buang dari catatan (hapus)</button>
              <button type="button" id="rusakKelolaRestoreBtn" class="w-full px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm hover:bg-green-800">Kembalikan ke stok layak</button>
              <button type="button" id="rusakKelolaCancelBtn" class="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm">Tutup</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabel Stok -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-20">StokID</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[200px]">Varian</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-24" title="Siap dijual">Layak</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-28" title="Tidak dijual — klik angka jika ada">Rusak</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[150px]">Lokasi</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-32">Tanggal Update</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-24">Status</th>
                <th class="px-3 py-3 text-center text-sm font-semibold text-gray-700 min-w-[140px]">Aksi</th>
              </tr>
            </thead>
            <tbody id="stockTable" class="divide-y divide-gray-200">
              <!-- Data akan diisi di sini -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    wrapper.appendChild(container);

    // Render data dan setup events
    await this.renderStocks(container);
    await this.loadBranchesForFilter(container);
    this.setupEvents(container);

    return wrapper;
  }

  // Render data stok ke tabel
  async renderStocks(container, stocksToRender = null) {
    const table = container.querySelector("#stockTable");

    try {
      // Jika stocksToRender tidak diberikan, fetch dari API
      if (!stocksToRender) {
        const res = await this.presenter.getStocks();
        this.allStocks = Array.isArray(res.data) ? res.data : [];
        stocksToRender = this.allStocks;
      }
      
      const stocks = stocksToRender;
      
      // Notifikasi mengikuti data yang sedang ditampilkan (termasuk filter cabang/search)
      const stocksForNotification = stocks;

      if (stocks.length === 0) {
        table.innerHTML = `
          <tr>
            <td colspan="8" class="px-3 py-6 text-center text-gray-500">
              Belum ada data stok
            </td>
          </tr>
        `;
        return;
      }

      // Hitung jumlah stok yang menipis atau habis untuk notifikasi (dari semua data)
      let lowStockCount = 0;
      const lowStockItems = []; // Array untuk menyimpan barang yang stoknya menipis/habis
      
      // Proses semua stok untuk notifikasi
      stocksForNotification.forEach((stock) => {
        const stokMinimum = stock.stokMinimum !== null && stock.stokMinimum !== undefined 
          ? parseInt(stock.stokMinimum) 
          : 5;
        const jumlah = parseInt(stock.jumlah) || 0;
        
        if (jumlah === 0) {
          lowStockCount++;
          lowStockItems.push({
            namaVarian: stock.namaVarian || `Varian ID: ${stock.varianID}`,
            jumlah: jumlah,
            lokasi: stock.lokasi || "-",
            status: "Habis",
            stokMinimum: stokMinimum
          });
        } else if (jumlah <= stokMinimum) {
          lowStockCount++;
          lowStockItems.push({
            namaVarian: stock.namaVarian || `Varian ID: ${stock.varianID}`,
            jumlah: jumlah,
            lokasi: stock.lokasi || "-",
            status: "Menipis",
            stokMinimum: stokMinimum
          });
        }
      });
      
      // Render tabel dengan data yang sudah difilter (jika ada)
      const stocksHTML = stocks
        .map((stock) => {
          // Tentukan status berdasarkan jumlah dan stokMinimum
          // Jika stokMinimum tidak ada, default ke 5
          const stokMinimum = stock.stokMinimum !== null && stock.stokMinimum !== undefined 
            ? parseInt(stock.stokMinimum) 
            : 5;
          const jumlah = parseInt(stock.jumlah) || 0;
          const jumlahRusak = parseInt(stock.jumlahRusak) || 0;
          
          // Logika status: 0 = Habis, > 0 tapi <= minimum = Menipis, > minimum = Aman
          let status, statusClass, rowClass;
          
          if (jumlah === 0) {
            status = "Habis";
            statusClass = "bg-red-100 text-red-800";
            rowClass = "hover:bg-red-50 transition bg-red-50";
          } else if (jumlah <= stokMinimum) {
            status = "Menipis";
            statusClass = "bg-yellow-100 text-yellow-800";
            rowClass = "hover:bg-yellow-50 transition bg-yellow-50";
          } else {
            status = "Aman";
            statusClass = "bg-green-100 text-green-800";
            rowClass = "hover:bg-gray-50 transition";
          }

          // Format tanggal
          const tanggalUpdate = stock.tanggalUpdate 
            ? new Date(stock.tanggalUpdate).toLocaleDateString('id-ID')
            : "-";

          // Disable tombol mutasi jika stok habis
          const mutateButtonDisabled = jumlah === 0 ? "opacity-50 cursor-not-allowed" : "";
          const mutateButtonDisabledAttr = jumlah === 0 ? "disabled" : "";

          const rusakButtonDisabled = jumlah === 0 ? "opacity-50 cursor-not-allowed" : "";
          const rusakButtonDisabledAttr = jumlah === 0 ? "disabled" : "";

          return `
            <tr class="${rowClass}">
              <td class="px-3 py-3 text-sm text-gray-900 font-medium">${stock.stokID}</td>
              <td class="px-3 py-3 text-sm text-gray-900 font-medium">${stock.namaVarian || stock.varianID}</td>
              <td class="px-3 py-3 text-sm text-gray-900 font-semibold ${jumlah === 0 ? 'text-red-600' : ''}">${jumlah}</td>
              <td class="px-3 py-3 text-sm font-medium">
                ${jumlahRusak > 0
                  ? `<button type="button" class="rusak-count-btn min-w-[2rem] px-2 py-0.5 rounded-md font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 underline decoration-amber-600/50" data-id="${stock.stokID}" data-jumlahrusak="${jumlahRusak}" title="Klik: buang atau kembalikan ke stok layak">${jumlahRusak}</button>`
                  : `<span class="text-gray-400">0</span>`}
              </td>
              <td class="px-3 py-3 text-sm text-gray-600">${stock.lokasi || "-"}</td>
              <td class="px-3 py-3 text-sm text-gray-600">${tanggalUpdate}</td>
              <td class="px-3 py-3 text-sm">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                  ${status}
                </span>
              </td>
              <td class="px-3 py-3">
                <div class="flex gap-1 justify-center flex-wrap">
                  <button 
                    class="mutate-btn bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition ${mutateButtonDisabled}" 
                    data-id="${stock.stokID}"
                    data-varian="${stock.namaVarian || stock.varianID}"
                    data-lokasi="${stock.lokasi}"
                    data-jumlah="${jumlah}"
                    data-varianid="${stock.varianID}"
                    data-hargamodal="${stock.hargaModal ?? 0}"
                    ${mutateButtonDisabledAttr}
                    title="${jumlah === 0 ? 'Stok habis, tidak dapat dimutasi' : 'Mutasi stok'}"
                  >
                    Mutasi
                  </button>
                  <button 
                    type="button"
                    class="rusak-btn bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-800 transition ${rusakButtonDisabled}" 
                    data-id="${stock.stokID}"
                    data-varian="${stock.namaVarian || stock.varianID}"
                    data-jumlah="${jumlah}"
                    ${rusakButtonDisabledAttr}
                    title="${jumlah === 0 ? 'Tidak ada stok layak' : 'Pindahkan ke barang rusak'}"
                  >
                    Rusak
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
      
      table.innerHTML = stocksHTML;
      
      // Tampilkan notifikasi jika ada stok menipis atau habis
      const notification = container.querySelector("#lowStockNotification");
      const lowStockCountEl = container.querySelector("#lowStockCount");
      const lowStockItemsEl = container.querySelector("#lowStockItems");
      
      if (lowStockCount > 0) {
        lowStockCountEl.textContent = lowStockCount;
        
        // Render daftar barang yang stoknya menipis/habis
        if (lowStockItemsEl) {
          lowStockItemsEl.innerHTML = lowStockItems
            .map(item => {
              const statusBadge = item.status === "Habis" 
                ? '<span class="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Habis</span>'
                : '<span class="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Menipis</span>';
              
              return `
                <div class="flex items-center justify-between p-2 bg-white rounded border border-yellow-200 hover:bg-yellow-100 transition">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${item.namaVarian}</p>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="text-xs text-gray-600">Lokasi: ${item.lokasi}</span>
                      <span class="text-xs text-gray-600">Stok: <strong class="${item.jumlah === 0 ? 'text-red-600' : 'text-yellow-600'}">${item.jumlah}</strong></span>
                      <span class="text-xs text-gray-600">Min: ${item.stokMinimum}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    ${statusBadge}
                  </div>
                </div>
              `;
            })
            .join("");
        }
        
        notification.classList.remove("hidden");
      } else {
        notification.classList.add("hidden");
      }
    } catch (err) {
      console.error("Error rendering stocks:", err);
      table.innerHTML = `
        <tr>
          <td colspan="8" class="px-3 py-6 text-center text-red-500">
            Gagal memuat data stok
          </td>
        </tr>
      `;
    }
  }

  // Filter stocks berdasarkan search query
  filterStocks(searchQuery) {
    if (!searchQuery.trim()) {
      return this.allStocks;
    }

    const query = searchQuery.toLowerCase();
    return this.allStocks.filter(stock => {
      const stokMinimum = stock.stokMinimum !== null && stock.stokMinimum !== undefined 
        ? parseInt(stock.stokMinimum) 
        : 5;
      const jumlah = parseInt(stock.jumlah) || 0;
      const jumlahRusak = parseInt(stock.jumlahRusak) || 0;
      let status = "Aman";
      if (jumlah === 0) {
        status = "Habis";
      } else if (jumlah <= stokMinimum) {
        status = "Menipis";
      }

      // Format tanggal untuk pencarian
      const tanggalFormatted = stock.tanggalUpdate 
        ? new Date(stock.tanggalUpdate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }).toLowerCase()
        : "";

      return (
        stock.stokID?.toString().includes(query) ||
        stock.varianID?.toString().includes(query) ||
        stock.namaVarian?.toLowerCase().includes(query) ||
        stock.lokasi?.toLowerCase().includes(query) ||
        stock.jumlah?.toString().includes(query) ||
        jumlahRusak.toString().includes(query) ||
        stokMinimum.toString().includes(query) ||
        status.toLowerCase().includes(query) ||
        stock.tanggalUpdate?.toLowerCase().includes(query) ||
        tanggalFormatted.includes(query)
      );
    });
  }

  applyFilters() {
    const bySearch = this.filterStocks(this.currentSearchQuery);

    if (!this.selectedBranch) {
      return bySearch;
    }

    const selected = this.selectedBranch.toLowerCase();
    return bySearch.filter((stock) => (stock.lokasi || "").toLowerCase() === selected);
  }

  // Setup semua event listeners
  setupEvents(container) {
    const addStockContainer = container.querySelector("#addStockContainer");
    const addStockForm = container.querySelector("#addStockForm");
    const addStockBtn = container.querySelector("#addStockBtn");
    const cancelAddStockBtn = container.querySelector("#cancelAddStockBtn");
    const addStockVarianSelect = container.querySelector("#addStockVarian");
    const addStockVarianSearch = container.querySelector("#searchAddStockVarian");
    
    const mutationModal = container.querySelector("#mutationModal");
    const mutationForm = container.querySelector("#mutationForm");
    const mutateStockBtn = container.querySelector("#mutateStockBtn");
    const rusakBuangBtn = container.querySelector("#rusakBuangNotesBtn");
    const rusakBuangModal = container.querySelector("#rusakBuangModal");
    const searchRusakBuang = container.querySelector("#searchRusakBuang");

    const mutationNotesBtn = container.querySelector("#mutationNotesBtn");
    const closeMutationModal = container.querySelector("#closeMutationModal");
    const cancelMutationBtn = container.querySelector("#cancelMutationBtn");

    const mutationNotesModal = container.querySelector("#mutationNotesModal");
    const mutationInvoiceModal = container.querySelector("#mutationInvoiceModal");
    const mutationInvoiceBody = container.querySelector("#mutationInvoiceBody");
    const closeMutationNotesModal = container.querySelector("#closeMutationNotesModal");
    const closeMutationInvoiceModal = container.querySelector("#closeMutationInvoiceModal");
    const closeMutationNotesBtn = container.querySelector("#closeMutationNotesBtn");
    const refreshMutationNotesBtn = container.querySelector("#refreshMutationNotesBtn");
    const searchMutationNotes = container.querySelector("#searchMutationNotes");
    const mutationDate = container.querySelector("#mutationDate");
    const mutationLokasiAsalSelect = container.querySelector("#mutationLokasiAsal");
    const searchMutationVarianInput = container.querySelector("#searchMutationVarian");
    const mutationVarianSelect = container.querySelector("#mutationVarianSelect");
    const mutationJumlahInput = container.querySelector("#mutationJumlah");
    const mutationHargaInput = container.querySelector("#mutationHargaSatuan");
    const mutationOngkirInput = container.querySelector("#mutationOngkir");
    const mutationTotalInput = container.querySelector("#mutationTotalNilai");
    const mutationDraftTable = container.querySelector("#mutationDraftTable");
    const addMutationItemBtn = container.querySelector("#addMutationItemBtn");
    const mutationDraftHint = container.querySelector("#mutationDraftHint");
    const mutationNoFakturInput = container.querySelector("#mutationNoFaktur");

    const renderMutationDraftTable = () => {
      if (!mutationDraftTable) return;
      if (!Array.isArray(this.mutationDraftItems) || this.mutationDraftItems.length === 0) {
        mutationDraftTable.innerHTML = `<tr><td colspan="6" class="px-3 py-4 text-center text-sm text-gray-500">Belum ada item mutasi</td></tr>`;
        return;
      }
      mutationDraftTable.innerHTML = this.mutationDraftItems.map((it, idx) => {
        const subtotal = (Number(it.jumlah) || 0) * (Number(it.hargaSatuan) || 0);
        return `
          <tr>
            <td class="px-3 py-2 text-sm text-gray-900">${it.namaVarian || "-"}</td>
            <td class="px-3 py-2 text-sm text-gray-600">${Number(it.stokTersedia || 0)}</td>
            <td class="px-3 py-2 text-sm text-gray-900 font-medium">${Number(it.jumlah || 0)}</td>
            <td class="px-3 py-2 text-sm text-gray-900">Rp ${Number(it.hargaSatuan || 0).toLocaleString("id-ID")}</td>
            <td class="px-3 py-2 text-sm text-gray-900 font-semibold">Rp ${Number(subtotal).toLocaleString("id-ID")}</td>
            <td class="px-3 py-2 text-center">
              <button type="button" class="remove-mutation-item text-red-600 hover:text-red-700 text-xs font-medium" data-idx="${idx}">Hapus</button>
            </td>
          </tr>
        `;
      }).join("");
    };

    const updateMutationTotal = () => {
      if (!mutationTotalInput) return;
      const totalBarang = (this.mutationDraftItems || []).reduce((acc, it) => {
        return acc + ((Number(it.jumlah) || 0) * (Number(it.hargaSatuan) || 0));
      }, 0);
      const ongkir = Math.max(0, parseFloat(mutationOngkirInput?.value || 0) || 0);
      const totalMutasi = totalBarang + ongkir;
      mutationTotalInput.value = `Rp ${Number(totalMutasi).toLocaleString("id-ID")}`;
    };
    if (mutationOngkirInput) mutationOngkirInput.addEventListener("input", updateMutationTotal);

    const loadMutationInvoice = async () => {
      if (!mutationNoFakturInput) return;
      mutationNoFakturInput.value = "Memuat nomor faktur...";
      try {
        const invRes = await this.presenter.generateMutationInvoice();
        mutationNoFakturInput.value = invRes?.data?.noFakturMutasi || "Gagal generate faktur";
      } catch (err) {
        console.error("Error generate mutation invoice:", err);
        mutationNoFakturInput.value = "Gagal generate faktur";
      }
    };

    const loadMutationBranches = async () => {
      if (!mutationLokasiAsalSelect) return;
      try {
        const res = await this.presenter.getBranches();
        const branches = Array.isArray(res.data) ? res.data : [];
        const options = branches
          .filter((branch) => branch.status === "Aktif")
          .map((branch) => `<option value="${branch.namaCabang}">${branch.namaCabang}</option>`)
          .join("");
        mutationLokasiAsalSelect.innerHTML = `<option value="">Pilih Lokasi Asal</option>${options}`;
      } catch (err) {
        console.error("Error loading branches:", err);
      }
    };

    const loadMutationVariantOptions = (searchQuery = "") => {
      if (!mutationVarianSelect) return;
      const lokasiAsal = mutationLokasiAsalSelect?.value || "";
      const normalized = (searchQuery || "").toLowerCase().trim();
      const stocks = (this.allStocks || [])
        .filter((s) => String(s.lokasi || "") === lokasiAsal && (parseInt(s.jumlah || 0, 10) || 0) > 0)
        .filter((s) => {
          if (!normalized) return true;
          const namaVarian = (s.namaVarian || "").toLowerCase();
          const namaProduk = (s.namaProduk || "").toLowerCase();
          const varianId = String(s.varianID || "").toLowerCase();
          const stokId = String(s.stokID || "").toLowerCase();
          return (
            namaVarian.includes(normalized) ||
            namaProduk.includes(normalized) ||
            varianId.includes(normalized) ||
            stokId.includes(normalized)
          );
        });
      mutationVarianSelect.innerHTML = '<option value="">Pilih varian dari lokasi asal</option>' + stocks.map((s) => {
        const hargaModal = parseFloat(s.hargaModal ?? 0) || 0;
        return `<option value="${s.stokID}" data-varianid="${s.varianID}" data-nama="${s.namaVarian || s.varianID}" data-jumlah="${parseInt(s.jumlah || 0, 10) || 0}" data-harga="${Math.max(1, Math.round(hargaModal))}">${s.namaVarian || s.varianID} (stok: ${parseInt(s.jumlah || 0, 10) || 0})</option>`;
      }).join("");
      if (mutationDraftHint) {
        mutationDraftHint.textContent = stocks.length > 0
          ? `Tersedia ${stocks.length} varian di lokasi asal.`
          : "Tidak ada stok layak pada lokasi asal.";
      }
    };

    
    const dismissNotificationBtn = container.querySelector("#dismissNotification");
    const searchInput = container.querySelector("#searchStocks");
    const branchFilter = container.querySelector("#branchFilter");
    const toggleLowStockListBtn = container.querySelector("#toggleLowStockList");
    const lowStockList = container.querySelector("#lowStockList");
    const toggleIcon = container.querySelector("#toggleIcon");
    const toggleText = container.querySelector("#toggleText");
    
    // Dismiss notifikasi
    if (dismissNotificationBtn) {
      dismissNotificationBtn.addEventListener("click", () => {
        const notification = container.querySelector("#lowStockNotification");
        notification.classList.add("hidden");
      });
    }

    // Toggle daftar barang stok menipis
    if (toggleLowStockListBtn && lowStockList) {
      toggleLowStockListBtn.addEventListener("click", () => {
        const isHidden = lowStockList.classList.contains("hidden");
        
        if (isHidden) {
          lowStockList.classList.remove("hidden");
          toggleText.textContent = "Sembunyikan";
          toggleIcon.style.transform = "rotate(180deg)";
        } else {
          lowStockList.classList.add("hidden");
          toggleText.textContent = "Lihat Detail";
          toggleIcon.style.transform = "rotate(0deg)";
        }
      });
    }

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.currentSearchQuery = e.target.value || "";
        const filtered = this.applyFilters();
        this.renderStocks(container, filtered);
      });
    }

    // Branch filter functionality
    if (branchFilter) {
      branchFilter.addEventListener("change", (e) => {
        this.selectedBranch = e.target.value || "";
        const filtered = this.applyFilters();
        this.renderStocks(container, filtered);
      });
    }

    // Toggle form tambah stok
    addStockBtn.addEventListener("click", async () => {
      addStockContainer.classList.toggle("hidden");
      if (!addStockContainer.classList.contains("hidden")) {
        // Load dropdowns saat form dibuka
        await this.loadVariantsForAddStock(container);
        await this.loadBranchesForAddStock(container);
        addStockForm.reset();
      }
    });

    // Cancel tambah stok
    cancelAddStockBtn.addEventListener("click", () => {
      addStockContainer.classList.add("hidden");
      addStockForm.reset();
    });

    // Search varian pada form tambah stok
    if (addStockVarianSearch && addStockVarianSelect) {
      addStockVarianSearch.addEventListener("input", () => {
        const query = addStockVarianSearch.value || "";
        this.filterVariantsForAddStock(addStockVarianSelect, query);
      });
    }

    // Form submit tambah stok
    addStockForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const varianID = container.querySelector("#addStockVarian").value;
      const lokasi = container.querySelector("#addStockLokasi").value;
      const jumlah = parseInt(container.querySelector("#addStockJumlah").value);

      if (!varianID || !lokasi || !jumlah || jumlah <= 0) {
        alert("Mohon lengkapi semua field dengan benar");
        return;
      }

      const stockData = {
        varianID: parseInt(varianID),
        lokasi: lokasi,
        jumlah: jumlah
      };

      try {
        const response = await this.presenter.addStock(stockData);
        
        if (response.success) {
          alert("Stok berhasil ditambahkan!");
          addStockContainer.classList.add("hidden");
          addStockForm.reset();
          await this.renderStocks(container);
        } else {
          alert("Gagal: " + response.message);
        }
      } catch (err) {
        console.error("Error adding stock:", err);
        alert("Gagal menambahkan stok. Silakan coba lagi.");
      }
    });

    // Buka catatan mutasi dari tombol header
    if (mutationNotesBtn) {
      mutationNotesBtn.addEventListener("click", async () => {
        if (!mutationNotesModal) return;
        if (searchMutationNotes) searchMutationNotes.value = "";
        if (mutationDate) mutationDate.value = "";
        this.mutationDate = "";
        await this.renderMutationNotes(container);
        mutationNotesModal.classList.remove("hidden");
      });
    }

    const refreshRusakBuang = () => this.refreshRusakBuangLog(container, searchRusakBuang?.value || "");
    if (rusakBuangBtn && rusakBuangModal) {
      rusakBuangBtn.addEventListener("click", async () => {
        if (searchRusakBuang) searchRusakBuang.value = "";
        await refreshRusakBuang();
        rusakBuangModal.classList.remove("hidden");
      });
      container.querySelector("#closeRusakBuangModal")?.addEventListener("click", () => rusakBuangModal.classList.add("hidden"));
      searchRusakBuang?.addEventListener("input", refreshRusakBuang);
    }

    // Tombol header untuk membuat mutasi batch (tanpa pilih baris dulu)
    mutateStockBtn.addEventListener("click", async () => {
      await resetMutationForm();
      mutationModal.classList.remove("hidden");
    });

    // Tutup modal
    const resetMutationForm = async () => {
      this.mutationDraftItems = [];
      mutationForm?.reset();
      if (searchMutationVarianInput) searchMutationVarianInput.value = "";
      renderMutationDraftTable();
      updateMutationTotal();
      await loadMutationInvoice();
      await loadMutationBranches();
      loadMutationVariantOptions();
    };

    closeMutationModal.addEventListener("click", () => {
      mutationModal.classList.add("hidden");
    });

    cancelMutationBtn.addEventListener("click", () => {
      mutationModal.classList.add("hidden");
    });

    // Tutup modal catatan mutasi
    const closeNotes = () => {
      if (!mutationNotesModal) return;
      mutationNotesModal.classList.add("hidden");
      if (searchMutationNotes) searchMutationNotes.value = "";
      if (mutationDate) mutationDate.value = "";
      this.mutationDate = "";
    };

    if (closeMutationNotesModal) {
      closeMutationNotesModal.addEventListener("click", closeNotes);
    }
    if (closeMutationInvoiceModal && mutationInvoiceModal) {
      closeMutationInvoiceModal.addEventListener("click", () => {
        mutationInvoiceModal.classList.add("hidden");
      });
    }

    if (closeMutationNotesBtn) {
      closeMutationNotesBtn.addEventListener("click", closeNotes);
    }
    if (mutationInvoiceModal) {
      mutationInvoiceModal.addEventListener("click", (e) => {
        if (e.target === mutationInvoiceModal) mutationInvoiceModal.classList.add("hidden");
      });
    }

    if (refreshMutationNotesBtn) {
      refreshMutationNotesBtn.addEventListener("click", async () => {
        if (searchMutationNotes) searchMutationNotes.value = "";
        if (mutationDate) mutationDate.value = "";
        this.mutationDate = "";
        await this.renderMutationNotes(container);
      });
    }

    if (searchMutationNotes) {
      searchMutationNotes.addEventListener("input", (e) => {
        const filtered = this.filterMutationNotes(e.target.value || "");
        this.renderMutationNotesTable(container, filtered);
      });
    }

    const applyMutationNotesFilters = () => {
      const searchQuery = searchMutationNotes ? searchMutationNotes.value || "" : "";
      const filtered = this.filterMutationNotes(searchQuery);
      this.renderMutationNotesTable(container, filtered);
    };

    if (mutationDate) {
      mutationDate.addEventListener("change", (e) => {
        this.mutationDate = e.target.value || "";
        applyMutationNotesFilters();
      });
    }

    if (mutationLokasiAsalSelect) {
      mutationLokasiAsalSelect.addEventListener("change", async () => {
        this.mutationDraftItems = [];
        renderMutationDraftTable();
        updateMutationTotal();
        const asal = mutationLokasiAsalSelect.value || "";
        await this.loadBranchesForMutation(container, asal);
        loadMutationVariantOptions(searchMutationVarianInput?.value || "");
      });
    }

    if (searchMutationVarianInput) {
      searchMutationVarianInput.addEventListener("input", (e) => {
        loadMutationVariantOptions(e.target.value || "");
      });
    }

    if (addMutationItemBtn) {
      addMutationItemBtn.addEventListener("click", () => {
        const lokasiAsal = mutationLokasiAsalSelect?.value || "";
        const lokasiTujuan = container.querySelector("#mutationLokasiTujuan")?.value || "";
        const selectedOption = mutationVarianSelect?.selectedOptions?.[0];
        const qty = parseInt(mutationJumlahInput?.value || 0, 10);
        const harga = Math.max(0, parseFloat(mutationHargaInput?.value || 0) || 0);
        if (!lokasiAsal || !lokasiTujuan) return alert("Pilih lokasi asal dan tujuan terlebih dahulu.");
        if (lokasiAsal === lokasiTujuan) return alert("Lokasi asal dan tujuan tidak boleh sama.");
        if (!selectedOption || !selectedOption.value) return alert("Pilih varian yang akan dimutasi.");
        const stokID = parseInt(selectedOption.value || 0, 10);
        const varianID = parseInt(selectedOption.dataset.varianid || 0, 10);
        const namaVarian = selectedOption.dataset.nama || "";
        const stokTersedia = parseInt(selectedOption.dataset.jumlah || 0, 10);
        const hargaDefault = Math.max(1, parseFloat(selectedOption.dataset.harga || 0) || 0);
        const jumlah = Math.max(0, qty);
        const hargaSatuan = harga > 0 ? harga : hargaDefault;
        if (jumlah <= 0) return alert("Qty mutasi harus lebih dari 0.");
        if (jumlah > stokTersedia) return alert(`Qty melebihi stok tersedia (${stokTersedia}).`);
        const existingIdx = this.mutationDraftItems.findIndex((it) => Number(it.stokID) === Number(stokID));
        if (existingIdx >= 0) {
          this.mutationDraftItems[existingIdx].jumlah = jumlah;
          this.mutationDraftItems[existingIdx].hargaSatuan = hargaSatuan;
        } else {
          this.mutationDraftItems.push({ stokID, varianID, namaVarian, stokTersedia, jumlah, hargaSatuan });
        }
        if (mutationJumlahInput) mutationJumlahInput.value = "";
        if (mutationHargaInput) mutationHargaInput.value = String(hargaDefault);
        renderMutationDraftTable();
        updateMutationTotal();
      });
    }

    if (mutationVarianSelect) {
      mutationVarianSelect.addEventListener("change", () => {
        const selected = mutationVarianSelect.selectedOptions?.[0];
        if (!selected) return;
        const hargaDefault = Math.max(1, parseFloat(selected.dataset.harga || 0) || 0);
        if (mutationHargaInput) mutationHargaInput.value = String(hargaDefault);
      });
    }

    container.addEventListener("click", async (e) => {
      if (e.target.classList.contains("mutate-btn")) {
        if (e.target.disabled) {
          alert("Stok habis, tidak dapat dimutasi. Silakan tambah stok terlebih dahulu.");
          return;
        }
        await resetMutationForm();
        const asal = e.target.dataset.lokasi || "";
        if (mutationLokasiAsalSelect) {
          mutationLokasiAsalSelect.value = asal;
        }
        await this.loadBranchesForMutation(container, asal);
        loadMutationVariantOptions(searchMutationVarianInput?.value || "");
        const stokID = parseInt(e.target.dataset.id || 0, 10);
        const qty = parseInt(e.target.dataset.jumlah || 0, 10);
        const namaVarian = e.target.dataset.varian || "";
        const varianID = parseInt(e.target.dataset.varianid || 0, 10);
        const hargaModal = Math.max(1, Math.round(parseFloat(e.target.dataset.hargamodal || 0) || 0));
        if (stokID && qty > 0) {
          this.mutationDraftItems = [{
            stokID,
            varianID,
            namaVarian,
            stokTersedia: qty,
            jumlah: 1,
            hargaSatuan: hargaModal
          }];
          renderMutationDraftTable();
          updateMutationTotal();
        }
        mutationModal.classList.remove("hidden");
      }
      if (e.target.classList.contains("remove-mutation-item")) {
        const idx = parseInt(e.target.dataset.idx || -1, 10);
        if (idx < 0) return;
        this.mutationDraftItems.splice(idx, 1);
        renderMutationDraftTable();
        updateMutationTotal();
      }
      const noteBtn = e.target.closest(".view-mutation-invoice-btn");
      if (noteBtn) {
        const noFaktur = (noteBtn.dataset.faktur || "").trim();
        const invoice = (this.allMutations || []).find((m) => String(m.noFakturMutasi || "").trim() === noFaktur);
        if (!invoice || !mutationInvoiceBody || !mutationInvoiceModal) return;
        const tanggal = invoice.tanggal ? this.formatWIB(invoice.tanggal) : "-";
        const itemRows = (Array.isArray(invoice.items) ? invoice.items : [])
          .map((it, idx) => {
            const nama = it.namaVarian
              ? it.namaVarian + (it.namaProduk ? ` (${it.namaProduk})` : "")
              : `Varian ID: ${it.varianID || "-"}`;
            const qty = parseInt(it.jumlah || 0, 10) || 0;
            const harga = Number(it.hargaSatuan || 0);
            const subtotal = Number(it.totalBarang || qty * harga);
            return `
              <tr class="border-b border-gray-100">
                <td class="px-3 py-2 text-sm">${idx + 1}</td>
                <td class="px-3 py-2 text-sm text-gray-900">${nama}</td>
                <td class="px-3 py-2 text-sm text-gray-700">${qty}</td>
                <td class="px-3 py-2 text-sm text-gray-700">Rp ${harga.toLocaleString("id-ID")}</td>
                <td class="px-3 py-2 text-sm text-gray-900 font-medium">Rp ${subtotal.toLocaleString("id-ID")}</td>
              </tr>
            `;
          })
          .join("");
        mutationInvoiceBody.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div><p class="text-xs text-gray-500">No Faktur</p><p class="text-sm font-semibold text-gray-900">${invoice.noFakturMutasi || "-"}</p></div>
            <div><p class="text-xs text-gray-500">Tanggal</p><p class="text-sm text-gray-900">${tanggal}</p></div>
            <div><p class="text-xs text-gray-500">Lokasi Asal</p><p class="text-sm text-gray-900">${invoice.lokasiAsal || "-"}</p></div>
            <div><p class="text-xs text-gray-500">Lokasi Tujuan</p><p class="text-sm text-gray-900">${invoice.lokasiTujuan || "-"}</p></div>
          </div>
          <div class="mb-4">
            <p class="text-xs text-gray-500">Keterangan</p>
            <p class="text-sm text-gray-900">${(invoice.keterangan || "").trim() || "-"}</p>
          </div>
          <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-12">No</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700">Varian</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-20">Qty</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-32">Harga</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-36">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemRows || '<tr><td colspan="5" class="px-3 py-4 text-center text-sm text-gray-500">Tidak ada detail item</td></tr>'}</tbody>
            </table>
          </div>
          <div class="mt-4 flex flex-wrap justify-end gap-6 text-sm">
            <div><span class="text-gray-500">Ongkir:</span> <span class="font-semibold text-gray-900">Rp ${Number(invoice.ongkir || 0).toLocaleString("id-ID")}</span></div>
            <div><span class="text-gray-500">Total Mutasi:</span> <span class="font-semibold text-gray-900">Rp ${Number(invoice.totalMutasi || 0).toLocaleString("id-ID")}</span></div>
          </div>
        `;
        mutationInvoiceModal.classList.remove("hidden");
      }
    });

    const rusakModal = container.querySelector("#rusakModal");
    const rusakForm = container.querySelector("#rusakForm");
    const rusakCancelBtn = container.querySelector("#rusakCancelBtn");

    if (rusakCancelBtn && rusakModal) {
      rusakCancelBtn.addEventListener("click", () => {
        rusakModal.classList.add("hidden");
        if (rusakForm) rusakForm.reset();
      });
    }

    container.addEventListener("click", (e) => {
      const rusakBtn = e.target.closest(".rusak-btn");
      if (!rusakBtn || !rusakModal) return;
      if (rusakBtn.disabled) {
        alert("Tidak ada stok layak untuk dipindahkan ke rusak.");
        return;
      }
      const stokID = rusakBtn.dataset.id;
      const varian = rusakBtn.dataset.varian || "";
      const jumlah = parseInt(rusakBtn.dataset.jumlah || 0, 10) || 0;
      if (jumlah <= 0) return;
      if (container.querySelector("#rusakStokID")) container.querySelector("#rusakStokID").value = stokID;
      if (container.querySelector("#rusakVarianLabel")) container.querySelector("#rusakVarianLabel").value = varian;
      if (container.querySelector("#rusakJumlahTersedia")) container.querySelector("#rusakJumlahTersedia").value = String(jumlah);
      const qtyEl = container.querySelector("#rusakQty");
      if (qtyEl) {
        qtyEl.max = String(jumlah);
        qtyEl.value = "1";
      }
      rusakModal.classList.remove("hidden");
    });

    const rusakKelolaModal = container.querySelector("#rusakKelolaModal");
    const openRusakKelola = (stokID, jumlahRusak, namaVarian) => {
      if (!rusakKelolaModal) return;
      const idEl = container.querySelector("#rusakKelolaStokID");
      const varEl = container.querySelector("#rusakKelolaVarianLabel");
      const jrEl = container.querySelector("#rusakKelolaJumlahRusak");
      const qtyIn = container.querySelector("#rusakKelolaQty");
      const ketEl = container.querySelector("#rusakKelolaKeterangan");
      if (idEl) idEl.value = String(stokID);
      if (varEl) varEl.value = namaVarian || "";
      if (jrEl) jrEl.value = String(jumlahRusak);
      if (qtyIn) {
        qtyIn.max = String(jumlahRusak);
        qtyIn.value = "1";
      }
      if (ketEl) ketEl.value = "";
      rusakKelolaModal.classList.remove("hidden");
    };

    container.addEventListener("click", (e) => {
      const countBtn = e.target.closest(".rusak-count-btn");
      if (!countBtn || !rusakKelolaModal) return;
      const stokID = parseInt(countBtn.dataset.id || 0, 10);
      const jr = parseInt(countBtn.dataset.jumlahrusak || 0, 10) || 0;
      if (!stokID || jr <= 0) return;
      const stock = (this.allStocks || []).find((s) => String(s.stokID) === String(stokID));
      const nama = stock ? (stock.namaVarian || String(stock.varianID)) : "";
      openRusakKelola(stokID, jr, nama);
    });

    const rusakKelolaCancel = container.querySelector("#rusakKelolaCancelBtn");
    if (rusakKelolaCancel && rusakKelolaModal) {
      rusakKelolaCancel.addEventListener("click", () => {
        rusakKelolaModal.classList.add("hidden");
      });
    }
    if (rusakKelolaModal) {
      rusakKelolaModal.addEventListener("click", (e) => {
        if (e.target === rusakKelolaModal) rusakKelolaModal.classList.add("hidden");
      });
    }

    const runRusakKelola = async (action) => {
      const user = getCurrentUser();
      if (!user) {
        alert("Silakan login terlebih dahulu.");
        return;
      }
      const stokID = parseInt(container.querySelector("#rusakKelolaStokID")?.value || 0, 10);
      const maxJr = parseInt(container.querySelector("#rusakKelolaJumlahRusak")?.value || 0, 10);
      const qty = parseInt(container.querySelector("#rusakKelolaQty")?.value || 0, 10);
      const keterangan = (container.querySelector("#rusakKelolaKeterangan")?.value || "").trim();
      if (!stokID || !qty || qty <= 0) {
        alert("Qty tidak valid.");
        return;
      }
      if (qty > maxJr) {
        alert(`Maksimal ${maxJr} unit.`);
        return;
      }
      if (action === "dispose" && !keterangan) {
        alert("Keterangan wajib diisi saat membuang barang rusak.");
        return;
      }
      try {
        const payload = {
          userID: user.userID,
          stokID,
          qty,
          action
        };
        if (action === "dispose") payload.keterangan = keterangan;
        const res = await this.presenter.manageRusakStock(payload);
        if (!res.success) {
          alert(res.message || "Gagal.");
          return;
        }
        alert(res.message || "Berhasil.");
        rusakKelolaModal.classList.add("hidden");
        await this.renderStocks(container);
      } catch (err) {
        console.error(err);
        alert("Gagal menyimpan.");
      }
    };

    const disposeBtn = container.querySelector("#rusakKelolaDisposeBtn");
    const restoreBtn = container.querySelector("#rusakKelolaRestoreBtn");
    if (disposeBtn) disposeBtn.addEventListener("click", () => runRusakKelola("dispose"));
    if (restoreBtn) restoreBtn.addEventListener("click", () => runRusakKelola("restore"));

    if (rusakForm) {
      rusakForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          return;
        }
        const stokID = parseInt(container.querySelector("#rusakStokID")?.value || 0, 10);
        const qty = parseInt(container.querySelector("#rusakQty")?.value || 0, 10);
        if (!stokID || !qty || qty <= 0) {
          alert("Qty tidak valid.");
          return;
        }
        try {
          const res = await this.presenter.moveStockToDamaged({
            userID: user.userID,
            stokID,
            qty
          });
          if (!res.success) {
            alert(res.message || "Gagal menyimpan.");
            return;
          }
          alert(res.message || "Berhasil.");
          rusakModal.classList.add("hidden");
          rusakForm.reset();
          await this.renderStocks(container);
        } catch (err) {
          console.error(err);
          alert("Gagal menyimpan.");
        }
      });
    }

    // Form submit mutasi (per nota)
    mutationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const lokasiAsal = container.querySelector("#mutationLokasiAsal").value;
      const lokasiTujuan = container.querySelector("#mutationLokasiTujuan").value;
      const ongkir = Math.max(0, parseFloat(container.querySelector("#mutationOngkir").value || 0) || 0);
      const noFakturMutasi = (container.querySelector("#mutationNoFaktur").value || "").trim();
      const keterangan = container.querySelector("#mutationKeterangan").value;

      // Validasi
      if (!lokasiAsal || !lokasiTujuan) {
        alert("Mohon lengkapi semua field yang diperlukan");
        return;
      }

      if (lokasiAsal === lokasiTujuan) {
        alert("Lokasi asal dan tujuan tidak boleh sama");
        return;
      }

      if (!Array.isArray(this.mutationDraftItems) || this.mutationDraftItems.length === 0) {
        alert("Tambahkan minimal 1 item mutasi.");
        return;
      }

      if (!noFakturMutasi || noFakturMutasi.toLowerCase().includes("gagal") || noFakturMutasi.toLowerCase().includes("memuat")) {
        alert("No faktur mutasi belum siap. Silakan tunggu sebentar lalu coba lagi.");
        return;
      }

      const mutationData = {
        lokasiAsal: lokasiAsal,
        lokasiTujuan: lokasiTujuan,
        noFakturMutasi: noFakturMutasi,
        ongkir: ongkir,
        keterangan: keterangan || "",
        items: this.mutationDraftItems.map((it) => ({
          stokID: parseInt(it.stokID),
          varianID: parseInt(it.varianID),
          jumlah: parseInt(it.jumlah),
          hargaSatuan: parseFloat(it.hargaSatuan)
        }))
      };

      try {
        const response = await this.presenter.mutateStock(mutationData);
        
        if (response.success) {
          alert(`Mutasi stok berhasil dilakukan. Nota: ${response?.data?.noFakturMutasi || "-"}`);
          mutationModal.classList.add("hidden");
          await resetMutationForm();
          await this.renderStocks(container);
        } else {
          alert("Gagal: " + response.message);
        }
      } catch (err) {
        console.error("Error mutating stock:", err);
        alert("Gagal melakukan mutasi stok. Silakan coba lagi.");
      }
    });

    // Inisialisasi modal mutasi batch
    resetMutationForm();
  }

  // Load branches untuk dropdown lokasi tujuan
  async loadBranchesForMutation(container, excludeLokasi = null) {
    try {
      const res = await this.presenter.getBranches();
      const branches = Array.isArray(res.data) ? res.data : [];
      
      const select = container.querySelector("#mutationLokasiTujuan");
      select.innerHTML = '<option value="">Pilih Lokasi Tujuan</option>';
      
      branches
        .filter(branch => branch.status === "Aktif" && branch.namaCabang !== excludeLokasi)
        .forEach(branch => {
          const option = document.createElement("option");
          option.value = branch.namaCabang;
          option.textContent = branch.namaCabang;
          select.appendChild(option);
        });
    } catch (err) {
      console.error("Error loading branches:", err);
    }
  }

  // Load variants untuk dropdown form tambah stok
  async loadVariantsForAddStock(container) {
    try {
      const res = await this.presenter.getVariants();
      const variants = Array.isArray(res.data) ? res.data : [];
      this.allAddStockVariants = variants;
      
      const select = container.querySelector("#addStockVarian");
      const searchInput = container.querySelector("#searchAddStockVarian");

      if (searchInput) {
        searchInput.value = "";
      }

      this.renderAddStockVariantOptions(select, this.allAddStockVariants);
    } catch (err) {
      console.error("Error loading variants:", err);
    }
  }

  renderAddStockVariantOptions(selectElement, variants) {
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">Pilih Varian</option>';

    (variants || [])
      .filter((variant) => variant.status === "Tersedia" || !variant.status)
      .forEach((variant) => {
        const option = document.createElement("option");
        option.value = variant.varianID;
        const displayText = variant.namaVarian
          ? variant.namaVarian + (variant.namaProduk ? " (" + variant.namaProduk + ")" : "")
          : "Varian ID: " + variant.varianID;
        option.textContent = displayText;
        selectElement.appendChild(option);
      });
  }

  filterVariantsForAddStock(selectElement, query) {
    if (!Array.isArray(this.allAddStockVariants) || !selectElement) return;

    const normalized = (query || "").toLowerCase();
    if (!normalized.trim()) {
      this.renderAddStockVariantOptions(selectElement, this.allAddStockVariants);
      return;
    }

    const filtered = this.allAddStockVariants.filter((variant) => {
      const namaVarian = (variant.namaVarian || "").toLowerCase();
      const namaProduk = (variant.namaProduk || "").toLowerCase();
      const varianIDStr = variant.varianID ? String(variant.varianID).toLowerCase() : "";

      return (
        namaVarian.includes(normalized) ||
        namaProduk.includes(normalized) ||
        varianIDStr.includes(normalized)
      );
    });

    this.renderAddStockVariantOptions(selectElement, filtered);
  }

  // Load branches untuk dropdown lokasi form tambah stok
  async loadBranchesForAddStock(container) {
    try {
      const res = await this.presenter.getBranches();
      const branches = Array.isArray(res.data) ? res.data : [];
      
      const select = container.querySelector("#addStockLokasi");
      select.innerHTML = '<option value="">Pilih Lokasi</option>';
      
      branches
        .filter(branch => branch.status === "Aktif")
        .forEach(branch => {
          const option = document.createElement("option");
          option.value = branch.namaCabang;
          option.textContent = branch.namaCabang;
          select.appendChild(option);
        });
    } catch (err) {
      console.error("Error loading branches:", err);
    }
  }

  async refreshRusakBuangLog(container, search = "") {
    const table = container.querySelector("#rusakBuangTable");
    if (!table) return;
    const q = (search || "").toLowerCase();
    const match = (row) => !q || [row.namaVarian, row.lokasi, row.keterangan, row.namaPetugas, row.jumlah, row.tanggalBuang]
      .some((v) => String(v ?? "").toLowerCase().includes(q));
    try {
      const user = getCurrentUser();
      const res = await this.presenter.getRusakDisposals(user?.userID);
      const rows = (res.data || []).filter(match);
      table.innerHTML = rows.length
        ? rows.map((r) => `<tr class="hover:bg-gray-50">
            <td class="px-3 py-2">${r.namaVarian || "-"}</td>
            <td class="px-3 py-2">${r.lokasi || "-"}</td>
            <td class="px-3 py-2 text-right font-semibold text-amber-800">${r.jumlah ?? 0}</td>
            <td class="px-3 py-2">${r.tanggalBuang ? this.formatWIB(r.tanggalBuang) : "-"}</td>
            <td class="px-3 py-2">${r.namaPetugas || "-"}</td>
            <td class="px-3 py-2">${(r.keterangan || "").trim() || "-"}</td>
          </tr>`).join("")
        : `<tr><td colspan="6" class="px-3 py-6 text-center text-gray-500">Belum ada catatan buang rusak</td></tr>`;
    } catch (err) {
      console.error(err);
      table.innerHTML = `<tr><td colspan="6" class="px-3 py-6 text-center text-red-500">Gagal memuat data</td></tr>`;
    }
  }

  async renderMutationNotes(container) {
    try {
      const res = await this.presenter.getStockMutations();
      this.allMutations = Array.isArray(res.data) ? res.data : [];
      const searchQuery = container.querySelector("#searchMutationNotes")?.value || "";
      const filtered = this.filterMutationNotes(searchQuery);
      this.renderMutationNotesTable(container, filtered);
    } catch (err) {
      console.error("Error loading stock mutations:", err);
      this.allMutations = [];
      this.renderMutationNotesTable(container, []);
    }
  }

  parseDatetimeAsJakartaDate(datetimeStr) {
    // Backend format biasanya "YYYY-MM-DD HH:MM:SS"
    if (!datetimeStr || typeof datetimeStr !== "string") return null;
    const s = datetimeStr.trim();
    const parts = s.split(" ");
    if (parts.length < 2) return null;

    const [datePart, timePart] = parts;
    const [y, m, d] = datePart.split("-").map((v) => parseInt(v, 10));
    const [hh, mm, ss] = timePart.split(":").map((v) => parseInt(v, 10));
    if (!y || !m || !d) return null;

    const hour = Number.isFinite(hh) ? hh : 0;
    const minute = Number.isFinite(mm) ? mm : 0;
    const second = Number.isFinite(ss) ? ss : 0;

    // Anggap string dari backend adalah waktu WIB (UTC+7),
    // jadi instant UTC = WIB - 7 jam.
    return new Date(Date.UTC(y, m - 1, d, hour - 7, minute, second));
  }

  formatWIB(datetimeStr) {
    const date = this.parseDatetimeAsJakartaDate(datetimeStr);
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  }

  getWIBDateKey(datetimeStr) {
    const date = this.parseDatetimeAsJakartaDate(datetimeStr);
    if (!date) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";
    const day = parts.find((p) => p.type === "day")?.value || "";
    return year && month && day ? `${year}-${month}-${day}` : "";
  }

  renderMutationNotesTable(container, mutations) {
    const table = container.querySelector("#mutationNotesTable");
    const countBadge = container.querySelector("#mutationNotesCount");
    if (!table) return;

    if (!Array.isArray(mutations) || mutations.length === 0) {
      if (countBadge) countBadge.textContent = "0 nota ditampilkan";
      table.innerHTML = `
        <tr>
          <td colspan="10" class="px-4 py-6 text-center text-gray-500">
            Belum ada catatan mutasi stok
          </td>
        </tr>
      `;
      return;
    }
    if (countBadge) {
      countBadge.textContent = `${mutations.length} nota ditampilkan`;
    }

    table.innerHTML = mutations
      .map((m) => {
        const tanggal = m.tanggal ? this.formatWIB(m.tanggal) : "-";
        const itemCount = parseInt(m.itemCount || (Array.isArray(m.items) ? m.items.length : 0), 10) || 0;
        const totalQty = Array.isArray(m.items)
          ? m.items.reduce((acc, it) => acc + (parseInt(it.jumlah || 0, 10) || 0), 0)
          : 0;
        const ongkir = Number(m.ongkir || 0);
        const totalMutasi = Number(m.totalMutasi || 0);

        return `
          <tr class="hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-sm text-gray-900">
              <div class="font-semibold">${(m.noFakturMutasi || "").trim() || "-"}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">${m.lokasiAsal || "-"}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${m.lokasiTujuan || "-"}</td>
            <td class="px-4 py-3 text-sm text-right">
              <span class="inline-flex min-w-[2rem] justify-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-semibold">${itemCount}</span>
            </td>
            <td class="px-4 py-3 text-sm text-right font-semibold text-gray-900">${totalQty}</td>
            <td class="px-4 py-3 text-sm text-right text-gray-700">Rp ${ongkir.toLocaleString("id-ID")}</td>
            <td class="px-4 py-3 text-sm text-right font-semibold text-gray-900">Rp ${totalMutasi.toLocaleString("id-ID")}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${tanggal}</td>
            <td class="px-4 py-3 text-sm text-gray-600 max-w-[260px] truncate" title="${(m.keterangan || "").trim() || "-"}">${(m.keterangan || "").trim() || "-"}</td>
            <td class="px-4 py-3 text-center">
              <button type="button" class="view-mutation-invoice-btn bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition" data-faktur="${(m.noFakturMutasi || "").trim()}">Lihat Nota</button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  filterMutationNotes(searchQuery) {
    const query = (searchQuery || "").toLowerCase();
    const selectedDate = this.mutationDate;

    return (this.allMutations || []).filter((m) => {
      const wibDateKey = this.getWIBDateKey(m.tanggal);

      // Filter tanggal (per hari, WIB)
      if (selectedDate) {
        if (!wibDateKey) return false;
        if (wibDateKey !== selectedDate) return false;
      }

      // Filter search (opsional)
      if (!query.trim()) return true;

      const tanggal = m.tanggal ? this.formatWIB(m.tanggal).toLowerCase() : "";
      const noFakturMutasi = (m.noFakturMutasi || "").toLowerCase();
      const ongkir = m.ongkir !== null && m.ongkir !== undefined ? String(m.ongkir).toLowerCase() : "";
      const totalMutasi = m.totalMutasi !== null && m.totalMutasi !== undefined ? String(m.totalMutasi).toLowerCase() : "";
      const asal = (m.lokasiAsal || "").toLowerCase();
      const tujuan = (m.lokasiTujuan || "").toLowerCase();
      const ket = (m.keterangan || "").toLowerCase();
      const itemCount = m.itemCount !== null && m.itemCount !== undefined ? String(m.itemCount).toLowerCase() : "";
      const itemBlob = Array.isArray(m.items)
        ? m.items
            .map((it) => {
              return [
                it.varianID,
                it.namaVarian,
                it.namaProduk,
                it.jumlah,
                it.hargaSatuan,
                it.totalBarang
              ].join(" ");
            })
            .join(" ")
            .toLowerCase()
        : "";

      return (
        noFakturMutasi.includes(query) ||
        asal.includes(query) ||
        tujuan.includes(query) ||
        itemCount.includes(query) ||
        ongkir.includes(query) ||
        totalMutasi.includes(query) ||
        tanggal.includes(query) ||
        ket.includes(query) ||
        itemBlob.includes(query)
      );
    });
  }

  // Load branches untuk dropdown filter cabang (monitoring)
  async loadBranchesForFilter(container) {
    const select = container.querySelector("#branchFilter");
    if (!select) return;

    try {
      const res = await this.presenter.getBranches();
      const branches = Array.isArray(res.data) ? res.data : [];

      select.innerHTML = '<option value="">Semua Cabang</option>';

      branches
        .filter((b) => b.status === "Aktif")
        .forEach((b) => {
          const option = document.createElement("option");
          option.value = b.namaCabang;
          option.textContent = b.namaCabang;
          select.appendChild(option);
        });
    } catch (err) {
      console.error("Error loading branches for filter:", err);
      // keep default "Semua Cabang"
    }
  }
}

