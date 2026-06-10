import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";
import { getCurrentUser } from "../../utils/authStorage.js";
import { printSalesReceipt } from "../../utils/receiptPrinter.js";

export default class PosPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.catalog = [];
    this.cabang = "";
    this.cart = [];
    this.searchQuery = "";
    this.currentPage = 1;
    this.pageSize = 20;
    // Retur penjualan (modal)
    this.returInvoices = [];
    this.returFilteredInvoices = [];
    this.returSelectedInvoice = null;
    this.returInvoiceItems = [];
    this.returItemsSearchQuery = "";
    this.returCart = [];
  }

  async render() {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    const topbar = new Topbar("POS", "Penjualan (POS)");
    wrapper.appendChild(topbar.render());

    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white rounded-xl shadow-lg p-4">
          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-12 md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">Tanggal</label>
              <input id="posTanggal" type="date" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
            <div class="col-span-12 md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">Kasir</label>
              <input id="posKasir" type="text" readonly class="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-100 text-gray-700" />
            </div>
            <div class="col-span-12 md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">Cabang</label>
              <input id="posCabang" type="text" readonly class="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-100 text-gray-700" />
            </div>
            <div class="col-span-12 md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">Customer</label>
              <select id="posCustomer" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                <option value="Umum">Umum</option>
                <option value="Reseller">Reseller</option>
              </select>
            </div>
            <div class="col-span-12 flex flex-wrap justify-end items-end gap-2 pt-1">
              <button type="button" id="posReturOpenBtn" class="px-4 py-2.5 rounded-lg border border-gray-800 text-sm font-medium text-gray-900 hover:bg-gray-100 transition">
                Retur penjualan
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 xl:col-span-7 space-y-4">
            <div class="bg-white rounded-xl shadow-lg p-4">
              <div class="grid grid-cols-12 gap-2 items-stretch">
                <div class="col-span-12 md:col-span-6 relative">
                  <input id="posSearch" type="text" placeholder="Cari cepat produk/varian/ID..." class="w-full border border-gray-300 p-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                  <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <div class="col-span-6 md:col-span-2">
                  <input id="posQuickVarianID" type="number" min="1" placeholder="ID Varian" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div class="col-span-3 md:col-span-1">
                  <input id="posQuickQty" type="number" min="1" value="1" class="w-full border border-gray-300 p-2.5 rounded-lg text-center focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div class="col-span-3 md:col-span-3 flex gap-2">
                  <button id="posQuickAdd" class="flex-1 bg-black text-white px-3 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">Tambah</button>
                  <button id="posClearSearch" class="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition">Reset</button>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">Katalog Produk</h3>
                <div class="text-xs text-gray-500">Klik produk untuk tambah ke keranjang</div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">ID</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produk / Varian</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Harga</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">Stok</th>
                      <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="posProductTable" class="divide-y divide-gray-200"></tbody>
                </table>
              </div>
              <div class="p-3 border-t border-gray-200 flex items-center justify-between">
                <div class="text-sm text-gray-600" id="posPageInfo">Halaman 1</div>
                <div class="flex gap-2">
                  <button id="posPrevPage" class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Prev</button>
                  <button id="posNextPage" class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Next</button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-12 xl:col-span-5 space-y-4">
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="p-4 border-b border-gray-200">
                <h3 class="font-semibold text-gray-900">Keranjang</h3>
              </div>
              <div class="overflow-x-auto max-h-[520px]">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                      <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">Qty</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Diskon</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Sub</th>
                      <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-10">x</th>
                    </tr>
                  </thead>
                  <tbody id="posCartTable" class="divide-y divide-gray-200"></tbody>
                </table>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Pembayaran</h3>
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Subtotal</span>
                  <span id="posSubtotal" class="font-semibold">Rp 0</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Total Diskon Item</span>
                  <span id="posTotalDiskon" class="font-semibold">Rp 0</span>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span class="text-gray-800 font-semibold">Total</span>
                  <span id="posTotal" class="font-bold">Rp 0</span>
                </div>
                <div>
                  <label class="text-gray-600">Metode Pembayaran</label>
                  <select id="posMetode" class="w-full border border-gray-300 p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
                <div>
                  <label class="text-gray-600">Bayar</label>
                  <input id="posBayar" type="number" min="0" class="w-full border border-gray-300 p-2.5 rounded-lg mt-1 text-right focus:ring-2 focus:ring-black focus:border-transparent" value="0" />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Kembalian</span>
                  <span id="posKembalian" class="font-semibold">Rp 0</span>
                </div>
                <div>
                  <label class="text-gray-600">Catatan</label>
                  <textarea id="posCatatan" rows="2" class="w-full border border-gray-300 p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-black focus:border-transparent" placeholder="Opsional"></textarea>
                </div>
                <div class="flex gap-2 pt-2">
                  <button id="posCancel" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-400 transition">Bersihkan</button>
                  <button id="posProcess" class="flex-1 bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">Proses</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="posAlert" class="hidden bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-sm"></div>
      </div>

      <div id="posReturModal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Retur penjualan</h2>
              <p class="text-xs text-gray-500">Nominal pengembalian dana (net) dihitung otomatis dari harga &amp; diskon saat jual, lalu mengurangi total di laporan penjualan. Kasir tetap mengembalikan uang ke pelanggan sesuai metode pembayaran.</p>
            </div>
            <button type="button" id="posReturCloseBtn" class="p-2 rounded-lg hover:bg-gray-200 text-gray-600" aria-label="Tutup">✕</button>
          </div>
          <div class="overflow-y-auto p-4 space-y-4 flex-1">
            <div id="posReturAlert" class="hidden rounded-lg p-3 text-sm"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Tanggal retur</label>
                <input id="posReturTanggal" type="date" class="w-full border border-gray-300 p-2 rounded-lg text-sm" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Cabang</label>
                <input id="posReturLokasi" type="text" readonly class="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 text-sm" />
              </div>
              <div class="md:col-span-2 lg:col-span-1">
                <label class="block text-xs text-gray-500 mb-1">Cari penjualan</label>
                <input id="posReturInvoiceSearch" type="text" placeholder="ID / nama pembeli..." class="w-full border border-gray-300 p-2 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Pilih penjualan</label>
              <select id="posReturInvoiceSelect" class="w-full border border-gray-300 p-2.5 rounded-lg text-sm">
                <option value="">— Pilih —</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Pembeli</label>
              <input id="posReturBuyer" type="text" readonly class="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 text-sm" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Alasan retur <span class="text-red-600">*</span></label>
                <textarea id="posReturAlasan" rows="2" class="w-full border border-gray-300 p-2 rounded-lg text-sm" placeholder="Contoh: barang rusak, tidak sesuai..."></textarea>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Barang yang diterima</label>
                <select id="posReturDisposisi" class="w-full border border-gray-300 p-2.5 rounded-lg text-sm">
                  <option value="KEMBALI_STOK">Masuk kembali ke stok jual (bisa dijual lagi)</option>
                  <option value="BARANG_RUSAK">Catat sebagai barang rusak (tidak dijual)</option>
                </select>
              </div>
            </div>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="px-3 py-2 bg-gray-50 flex justify-between items-center gap-2">
                <span class="text-sm font-medium text-gray-800">Item penjualan</span>
                <input id="posReturItemsSearch" type="text" placeholder="Cari varian..." class="max-w-xs border border-gray-300 p-1.5 rounded text-sm" />
              </div>
              <div class="overflow-x-auto max-h-[220px]">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-3 py-2 text-left font-semibold text-gray-700">Varian</th>
                      <th class="px-3 py-2 text-left font-semibold text-gray-700 w-16">Jual</th>
                      <th class="px-3 py-2 text-left font-semibold text-gray-700 w-16">Retur</th>
                      <th class="px-3 py-2 text-left font-semibold text-gray-700 w-16">Sisa</th>
                      <th class="px-3 py-2 text-center font-semibold text-gray-700 w-20">Qty</th>
                      <th class="px-3 py-2 text-center font-semibold text-gray-700 w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="posReturItemsTable" class="divide-y divide-gray-100"></tbody>
                </table>
              </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <div class="px-3 py-2 bg-gray-50 text-sm font-medium text-gray-800">Keranjang retur</div>
                <div class="overflow-x-auto max-h-[180px]">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th class="px-3 py-2 text-left">Item</th>
                        <th class="px-3 py-2 text-center w-20">Qty</th>
                        <th class="px-3 py-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody id="posReturCartTable" class="divide-y divide-gray-100"></tbody>
                  </table>
                </div>
              </div>
              <div class="flex flex-col justify-end gap-2">
                <button type="button" id="posReturSubmitBtn" class="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition text-sm">
                  Simpan retur
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    wrapper.appendChild(container);

    await this.loadCatalog(container);
    this.setupEvents(container);
    this.renderCart(container);

    return wrapper;
  }

  getUser() {
    return getCurrentUser();
  }

  rupiah(value) {
    return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  }

  getCustomerType(container) {
    const val = container.querySelector("#posCustomer")?.value || "Umum";
    return val === "Reseller" ? "Reseller" : "Umum";
  }

  resolveUnitPrice(item, customerType) {
    if (customerType === "Reseller") {
      return parseFloat(item.hargaReseller ?? item.hargaJual ?? 0) || 0;
    }
    return parseFloat(item.hargaJual ?? 0) || 0;
  }

  showAlert(container, message) {
    const el = container.querySelector("#posAlert");
    if (!el) return;
    if (!message) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.textContent = message;
    el.classList.remove("hidden");
  }

  async loadCatalog(container) {
    const user = this.getUser();
    if (!user) {
      this.showAlert(container, "Silakan login terlebih dahulu.");
      return;
    }

    const tanggalEl = container.querySelector("#posTanggal");
    const kasirEl = container.querySelector("#posKasir");
    const cabangEl = container.querySelector("#posCabang");

    if (tanggalEl) tanggalEl.value = new Date().toISOString().split("T")[0];
    if (kasirEl) kasirEl.value = user.fname ? `${user.fname} ${user.lname || ""}`.trim() : (user.email || "");

    try {
      const res = await this.presenter.getCatalog(user.userID);
      if (!res.success) {
        this.showAlert(container, res.message || "Gagal memuat katalog");
        return;
      }

      this.cabang = res.data?.cabang || "";
      if (cabangEl) cabangEl.value = this.cabang || "-";

      this.catalog = Array.isArray(res.data?.items) ? res.data.items : [];
      this.applyCustomerPricing(container);
      this.renderProductList(container);
      this.renderCart(container);
      this.showAlert(container, "");
    } catch (err) {
      console.error("Error loading POS catalog:", err);
      this.showAlert(container, "Gagal memuat katalog POS.");
    }
  }

  getFilteredCatalog() {
    const q = (this.searchQuery || "").toLowerCase().trim();
    if (!q) return this.catalog;
    return (this.catalog || []).filter((it) => {
      const namaVarian = (it.namaVarian || "").toLowerCase();
      const namaProduk = (it.namaProduk || "").toLowerCase();
      const varianID = it.varianID ? String(it.varianID) : "";
      return namaVarian.includes(q) || namaProduk.includes(q) || varianID.includes(q);
    });
  }

  getPagedCatalog() {
    const items = this.getFilteredCatalog()
      .filter((it) => (it.status || "").toLowerCase() !== "tidak tersedia");
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.pageSize;
    const pageItems = items.slice(start, start + this.pageSize);
    return { pageItems, total, totalPages };
  }

  renderProductList(container) {
    const tbody = container.querySelector("#posProductTable");
    const info = container.querySelector("#posPageInfo");
    if (!tbody) return;

    const { pageItems, total, totalPages } = this.getPagedCatalog();

    if (!pageItems.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-gray-500">Tidak ada produk</td></tr>`;
      if (info) info.textContent = "Tidak ada data";
      return;
    }

    const customerType = this.getCustomerType(container);
    tbody.innerHTML = pageItems
      .map((it) => {
        const name = it.namaVarian
          ? `${it.namaVarian}${it.namaProduk ? ` (${it.namaProduk})` : ""}`
          : `Varian ID: ${it.varianID}`;
        const stok = parseInt(it.stok) || 0;
        const stokClass = stok === 0 ? "text-red-600" : (stok <= (parseInt(it.stokMinimum) || 0) ? "text-yellow-700" : "text-gray-600");

        return `
          <tr class="hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-sm text-gray-700">${it.varianID}</td>
            <td class="px-4 py-3 text-sm text-gray-900 font-medium">${name}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${this.rupiah(this.resolveUnitPrice(it, customerType))}</td>
            <td class="px-4 py-3 text-sm ${stokClass}">${stok}</td>
            <td class="px-4 py-3 text-center">
              <button class="pos-add-item bg-black text-white px-3 py-1.5 rounded-lg text-xs hover:bg-gray-800 transition ${stok === 0 ? "opacity-40 cursor-not-allowed" : ""}" data-varianid="${it.varianID}" ${stok === 0 ? "disabled" : ""}>
                Tambah
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    if (info) {
      info.textContent = `Halaman ${this.currentPage}/${totalPages} - ${total} item`;
    }
  }

  addToCart(container, varianID, qty = 1) {
    const item = (this.catalog || []).find((it) => String(it.varianID) === String(varianID));
    if (!item) return { ok: false, message: "Varian tidak ditemukan." };

    const stok = parseInt(item.stok) || 0;
    const existing = this.cart.find((c) => String(c.varianID) === String(varianID));
    const qtyToAdd = Math.max(1, parseInt(qty) || 1);
    const nextQty = existing ? existing.qty + qtyToAdd : qtyToAdd;
    if (nextQty > stok) {
      return { ok: false, message: "Stok tidak cukup." };
    }

    if (existing) {
      existing.qty += qtyToAdd;
      existing.harga = this.resolveUnitPrice(item, this.getCustomerType(container));
    } else {
      this.cart.push({
        varianID: item.varianID,
        namaVarian: item.namaVarian,
        namaProduk: item.namaProduk,
        hargaJual: parseFloat(item.hargaJual ?? 0) || 0,
        hargaReseller: parseFloat(item.hargaReseller ?? item.hargaJual ?? 0) || 0,
        harga: this.resolveUnitPrice(item, this.getCustomerType(container)),
        stok: stok,
        qty: qtyToAdd,
        diskonType: "NOMINAL",
        diskonValue: 0
      });
    }
    return { ok: true };
  }

  applyCustomerPricing(container) {
    const customerType = this.getCustomerType(container);
    this.cart = (this.cart || []).map((it) => ({
      ...it,
      harga: this.resolveUnitPrice(it, customerType)
    }));
  }

  updateQty(varianID, qty) {
    const item = this.cart.find((c) => String(c.varianID) === String(varianID));
    if (!item) return;
    const next = Math.max(1, parseInt(qty) || 1);
    if (next > (item.stok || 0)) return;
    item.qty = next;
  }

  removeFromCart(varianID) {
    this.cart = (this.cart || []).filter((c) => String(c.varianID) !== String(varianID));
  }

  updateDiskon(varianID, type, value) {
    const row = this.cart.find((c) => String(c.varianID) === String(varianID));
    if (!row) return;
    row.diskonType = type === "PERCENTAGE" ? "PERCENTAGE" : "NOMINAL";
    row.diskonValue = Math.max(0, parseFloat(value) || 0);
  }

  getItemDiscount(item) {
    const gross = (parseFloat(item.harga) || 0) * (parseInt(item.qty) || 0);
    const type = item.diskonType === "PERCENTAGE" ? "PERCENTAGE" : "NOMINAL";
    const value = Math.max(0, parseFloat(item.diskonValue) || 0);

    let discount = 0;
    if (type === "PERCENTAGE") {
      discount = gross * Math.min(value, 100) / 100;
    } else {
      discount = value;
    }
    return Math.min(discount, gross);
  }

  computeTotals(container) {
    const subtotal = (this.cart || []).reduce((sum, it) => sum + ((parseFloat(it.harga) || 0) * (parseInt(it.qty) || 0)), 0);
    const totalDiskon = (this.cart || []).reduce((sum, it) => sum + this.getItemDiscount(it), 0);
    const total = Math.max(0, subtotal - totalDiskon);
    return { subtotal, diskon: totalDiskon, total };
  }

  renderCart(container) {
    const tbody = container.querySelector("#posCartTable");
    if (!tbody) return;

    if (!this.cart.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-8 text-center text-gray-500">Keranjang masih kosong</td>
        </tr>
      `;
    } else {
      tbody.innerHTML = this.cart
        .map((it, idx) => {
          const name = it.namaVarian
            ? `${it.namaVarian}${it.namaProduk ? ` (${it.namaProduk})` : ""}`
            : `Varian ID: ${it.varianID}`;
          const diskon = this.getItemDiscount(it);
          const subtotal = Math.max(0, (it.harga * it.qty) - diskon);
          return `
            <tr>
              <td class="px-4 py-3 text-sm text-gray-900 font-medium max-w-[220px] truncate" title="${name}">${name}<div class="text-xs text-gray-500 whitespace-nowrap">${this.rupiah(it.harga)} / item</div></td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button class="pos-qty-minus border border-gray-300 w-8 h-8 rounded-lg hover:bg-gray-50" data-varianid="${it.varianID}">-</button>
                  <input class="pos-qty-input w-16 border border-gray-300 p-1.5 rounded-lg text-center text-sm" data-varianid="${it.varianID}" type="number" min="1" max="${it.stok}" value="${it.qty}" />
                  <button class="pos-qty-plus border border-gray-300 w-8 h-8 rounded-lg hover:bg-gray-50" data-varianid="${it.varianID}">+</button>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <select class="pos-discount-type w-20 border border-gray-300 p-1.5 rounded text-xs" data-varianid="${it.varianID}">
                    <option value="NOMINAL" ${it.diskonType === "NOMINAL" ? "selected" : ""}>Nominal</option>
                    <option value="PERCENTAGE" ${it.diskonType === "PERCENTAGE" ? "selected" : ""}>%</option>
                  </select>
                  <input class="pos-discount-value w-16 border border-gray-300 p-1.5 rounded text-right text-xs" data-varianid="${it.varianID}" type="number" min="0" step="0.01" value="${it.diskonValue || 0}" />
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 font-semibold">${this.rupiah(subtotal)}</td>
              <td class="px-4 py-3 text-center">
                <button class="pos-remove text-red-600 hover:text-red-800" data-varianid="${it.varianID}" title="Hapus">
                  🗑
                </button>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    const { subtotal, total } = this.computeTotals(container);
    const subtotalEl = container.querySelector("#posSubtotal");
    const totalDiskonEl = container.querySelector("#posTotalDiskon");
    const totalEl = container.querySelector("#posTotal");
    if (subtotalEl) subtotalEl.textContent = this.rupiah(subtotal);
    if (totalDiskonEl) totalDiskonEl.textContent = this.rupiah(Math.max(0, subtotal - total));
    if (totalEl) totalEl.textContent = this.rupiah(total);

    this.updateKembalian(container);
  }

  updateKembalian(container) {
    const bayarEl = container.querySelector("#posBayar");
    const kembalianEl = container.querySelector("#posKembalian");
    const { total } = this.computeTotals(container);
    const bayar = Math.max(0, parseFloat(bayarEl?.value || 0) || 0);
    const kembalian = bayar - total;
    if (kembalianEl) {
      kembalianEl.textContent = this.rupiah(kembalian);
      kembalianEl.className = `font-semibold ${kembalian < 0 ? "text-red-600" : "text-gray-900"}`;
    }
  }

  setupEvents(container) {
    const searchEl = container.querySelector("#posSearch");
    const clearSearchBtn = container.querySelector("#posClearSearch");
    const quickVarianEl = container.querySelector("#posQuickVarianID");
    const quickQtyEl = container.querySelector("#posQuickQty");
    const quickAddBtn = container.querySelector("#posQuickAdd");
    const prevPageBtn = container.querySelector("#posPrevPage");
    const nextPageBtn = container.querySelector("#posNextPage");
    const bayarEl = container.querySelector("#posBayar");
    const cancelBtn = container.querySelector("#posCancel");
    const processBtn = container.querySelector("#posProcess");
    const customerEl = container.querySelector("#posCustomer");

    if (searchEl) {
      searchEl.addEventListener("input", (e) => {
        this.searchQuery = e.target.value || "";
        this.currentPage = 1;
        this.renderProductList(container);
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        this.searchQuery = "";
        this.currentPage = 1;
        if (searchEl) searchEl.value = "";
        this.renderProductList(container);
      });
    }

    const doQuickAdd = () => {
      const varianID = quickVarianEl ? parseInt(quickVarianEl.value) : 0;
      const qty = quickQtyEl ? parseInt(quickQtyEl.value) : 1;
      if (!varianID) {
        this.showAlert(container, "Isi ID varian terlebih dahulu.");
        return;
      }
      const res = this.addToCart(container, varianID, qty);
      if (!res.ok) {
        this.showAlert(container, res.message || "Gagal menambah item");
      } else {
        this.showAlert(container, "");
        if (quickVarianEl) quickVarianEl.value = "";
        if (quickQtyEl) quickQtyEl.value = "1";
      }
      this.renderCart(container);
    };

    if (quickAddBtn) {
      quickAddBtn.addEventListener("click", doQuickAdd);
    }
    if (quickVarianEl) {
      quickVarianEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          doQuickAdd();
        }
      });
    }

    if (customerEl) {
      customerEl.addEventListener("change", () => {
        this.applyCustomerPricing(container);
        this.renderProductList(container);
        this.renderCart(container);
      });
    }
    if (quickQtyEl) {
      quickQtyEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          doQuickAdd();
        }
      });
    }

    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        this.currentPage -= 1;
        this.renderProductList(container);
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        this.currentPage += 1;
        this.renderProductList(container);
      });
    }

    if (bayarEl) {
      bayarEl.addEventListener("input", () => {
        this.updateKembalian(container);
      });
    }

    container.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".pos-add-item");
      if (addBtn) {
        const varianID = addBtn.dataset.varianid;
        const res = this.addToCart(container, varianID, 1);
        if (!res.ok) {
          this.showAlert(container, res.message || "Gagal menambah item");
        } else {
          this.showAlert(container, "");
        }
        this.renderCart(container);
        return;
      }

      const minus = e.target.closest(".pos-qty-minus");
      if (minus) {
        const varianID = minus.dataset.varianid;
        const item = this.cart.find((c) => String(c.varianID) === String(varianID));
        if (item && item.qty > 1) item.qty -= 1;
        this.renderCart(container);
        return;
      }

      const plus = e.target.closest(".pos-qty-plus");
      if (plus) {
        const varianID = plus.dataset.varianid;
        const item = this.cart.find((c) => String(c.varianID) === String(varianID));
        if (item && item.qty < (item.stok || 0)) item.qty += 1;
        this.renderCart(container);
        return;
      }

      const remove = e.target.closest(".pos-remove");
      if (remove) {
        const varianID = remove.dataset.varianid;
        this.removeFromCart(varianID);
        this.renderCart(container);
      }
    });

    container.addEventListener("change", (e) => {
      if (e.target.classList.contains("pos-qty-input")) {
        const varianID = e.target.dataset.varianid;
        this.updateQty(varianID, e.target.value);
        this.renderCart(container);
        return;
      }
      if (e.target.classList.contains("pos-discount-type")) {
        const varianID = e.target.dataset.varianid;
        const row = this.cart.find((c) => String(c.varianID) === String(varianID));
        this.updateDiskon(varianID, e.target.value, row ? row.diskonValue : 0);
        this.renderCart(container);
        return;
      }
      if (e.target.classList.contains("pos-discount-value")) {
        const varianID = e.target.dataset.varianid;
        const row = this.cart.find((c) => String(c.varianID) === String(varianID));
        this.updateDiskon(varianID, row ? row.diskonType : "NOMINAL", e.target.value);
        this.renderCart(container);
      }
    });

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.cart = [];
        const bayarEl2 = container.querySelector("#posBayar");
        const catatanEl = container.querySelector("#posCatatan");
        if (bayarEl2) bayarEl2.value = "0";
        if (catatanEl) catatanEl.value = "";
        this.showAlert(container, "");
        this.renderCart(container);
      });
    }

    if (processBtn) {
      processBtn.addEventListener("click", async () => {
        await this.processPayment(container);
      });
    }

    this.setupReturEvents(container);
  }

  returInvoiceLabel(inv) {
    const id = inv.penjualanID ?? "";
    const tgl = inv.tanggalPenjualan || "-";
    const nama = (inv.namaPembeli || "Umum").trim();
    return `#${id} — ${tgl} — ${nama}`;
  }

  showReturAlert(container, message, type = "error") {
    const el = container.querySelector("#posReturAlert");
    if (!el) return;
    if (!message) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.className = `rounded-lg p-3 text-sm ${type === "error" ? "bg-red-50 border border-red-200 text-red-800" : "bg-amber-50 border border-amber-200 text-amber-900"}`;
    el.textContent = message;
    el.classList.remove("hidden");
  }

  closeReturModal(container) {
    const modal = container.querySelector("#posReturModal");
    if (modal) modal.classList.add("hidden");
    this.showReturAlert(container, "");
  }

  async openReturModal(container) {
    const modal = container.querySelector("#posReturModal");
    if (!modal) return;
    const user = this.getUser();
    if (!user) {
      this.showAlert(container, "Silakan login terlebih dahulu.");
      return;
    }
    const tgl = container.querySelector("#posReturTanggal");
    if (tgl) tgl.value = new Date().toISOString().split("T")[0];
    const lokasiEl = container.querySelector("#posReturLokasi");
    if (lokasiEl) lokasiEl.value = this.cabang || "-";
    this.returSelectedInvoice = null;
    this.returInvoiceItems = [];
    this.returCart = [];
    this.returItemsSearchQuery = "";
    container.querySelector("#posReturInvoiceSelect").innerHTML = `<option value="">— Pilih —</option>`;
    container.querySelector("#posReturBuyer").value = "";
    if (container.querySelector("#posReturAlasan")) container.querySelector("#posReturAlasan").value = "";
    if (container.querySelector("#posReturDisposisi")) container.querySelector("#posReturDisposisi").value = "KEMBALI_STOK";
    if (container.querySelector("#posReturInvoiceSearch")) container.querySelector("#posReturInvoiceSearch").value = "";
    if (container.querySelector("#posReturItemsSearch")) container.querySelector("#posReturItemsSearch").value = "";

    modal.classList.remove("hidden");
    this.showReturAlert(container, "");
    await this.loadReturInvoices(container);
    this.renderReturItemsTable(container);
    this.renderReturCart(container);
  }

  async loadReturInvoices(container) {
    const user = this.getUser();
    if (!user) return;
    try {
      const res = await this.presenter.getReturInvoices(user.userID);
      if (!res.success) {
        this.showReturAlert(container, res.message || "Gagal memuat penjualan", "error");
        return;
      }
      this.returInvoices = Array.isArray(res.data?.invoices) ? res.data.invoices : [];
      this.returFilteredInvoices = this.returInvoices;
      const sel = container.querySelector("#posReturInvoiceSelect");
      if (sel) {
        sel.innerHTML =
          `<option value="">— Pilih —</option>` +
          this.returFilteredInvoices.map((inv) => `<option value="${inv.penjualanID}">${this.returInvoiceLabel(inv)}</option>`).join("");
      }
    } catch (e) {
      console.error(e);
      this.showReturAlert(container, "Gagal memuat daftar penjualan.", "error");
    }
  }

  filterReturInvoices(query) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return this.returInvoices;
    return this.returInvoices.filter((inv) => {
      return (
        String(inv.penjualanID || "").includes(q) ||
        (inv.namaPembeli || "").toLowerCase().includes(q) ||
        (inv.tanggalPenjualan || "").toLowerCase().includes(q)
      );
    });
  }

  async loadReturInvoiceItems(container, penjualanID) {
    const user = this.getUser();
    if (!user || !penjualanID) return;
    try {
      const res = await this.presenter.getReturInvoiceItems(penjualanID, user.userID);
      if (!res.success) {
        this.showReturAlert(container, res.message || "Gagal memuat item", "error");
        return;
      }
      this.returSelectedInvoice = res.data?.invoice || null;
      this.returInvoiceItems = Array.isArray(res.data?.items) ? res.data.items : [];
      const buyer = container.querySelector("#posReturBuyer");
      if (buyer) buyer.value = this.returSelectedInvoice?.namaPembeli || "Umum";
      this.returItemsSearchQuery = "";
      this.returCart = [];
      this.showReturAlert(container, "");
      this.renderReturItemsTable(container);
      this.renderReturCart(container);
    } catch (e) {
      console.error(e);
      this.showReturAlert(container, "Gagal memuat item retur.", "error");
    }
  }

  getFilteredReturItems() {
    const q = (this.returItemsSearchQuery || "").toLowerCase().trim();
    if (!q) return this.returInvoiceItems;
    return this.returInvoiceItems.filter((it) => {
      return (
        String(it.varianID || "").includes(q) ||
        (it.namaVarian || "").toLowerCase().includes(q) ||
        (it.namaProduk || "").toLowerCase().includes(q)
      );
    });
  }

  renderReturItemsTable(container) {
    const tbody = container.querySelector("#posReturItemsTable");
    if (!tbody) return;
    const items = this.getFilteredReturItems().filter((it) => (it.maxReturnQty || 0) > 0);
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-3 py-6 text-center text-gray-500">Tidak ada item yang bisa diretur</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map((it) => {
        const nama = `${it.namaVarian || `ID ${it.varianID}`}${it.namaProduk ? ` (${it.namaProduk})` : ""}`;
        const pj = Number(it.purchasedQty || 0);
        const rj = Number(it.returnedQty || 0);
        const mx = Number(it.maxReturnQty || 0);
        return `
          <tr class="hover:bg-gray-50">
            <td class="px-3 py-2 text-gray-900">${nama}</td>
            <td class="px-3 py-2">${pj}</td>
            <td class="px-3 py-2">${rj}</td>
            <td class="px-3 py-2">${mx}</td>
            <td class="px-3 py-2 text-center">
              <input type="number" min="0" class="pos-retur-qty w-16 border border-gray-300 p-1 rounded text-center text-xs" data-varianid="${it.varianID}" data-maxqty="${mx}" value="0" />
            </td>
            <td class="px-3 py-2 text-center">
              <button type="button" class="pos-retur-add bg-black text-white px-2 py-1 rounded text-xs" data-varianid="${it.varianID}">Tambah</button>
            </td>
          </tr>`;
      })
      .join("");
  }

  renderReturCart(container) {
    const tbody = container.querySelector("#posReturCartTable");
    if (!tbody) return;
    if (!this.returCart.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="px-3 py-6 text-center text-gray-500">Kosong</td></tr>`;
      return;
    }
    tbody.innerHTML = this.returCart
      .map((it) => {
        return `
          <tr>
            <td class="px-3 py-2 text-gray-900 truncate max-w-[200px]" title="${it.nama}">${it.nama}</td>
            <td class="px-3 py-2 text-center">
              <input type="number" min="1" class="pos-retur-cart-qty w-20 border border-gray-300 p-1 rounded text-center text-xs" data-varianid="${it.varianID}" value="${it.qty}" />
            </td>
            <td class="px-3 py-2 text-center">
              <button type="button" class="pos-retur-remove text-red-600 text-sm" data-varianid="${it.varianID}">🗑</button>
            </td>
          </tr>`;
      })
      .join("");
  }

  addToReturCart(container, varianID, qty) {
    const item = this.returInvoiceItems.find((it) => String(it.varianID) === String(varianID));
    if (!item) return { ok: false, message: "Item tidak ditemukan" };
    const maxQty = Number(item.maxReturnQty || 0);
    const qtyInt = Math.floor(Number(qty || 0));
    if (!qtyInt || qtyInt <= 0) return { ok: false, message: "Qty harus > 0" };
    if (qtyInt > maxQty) return { ok: false, message: "Qty melebihi sisa retur" };
    const nama = `${item.namaVarian || `Varian ${item.varianID}`}${item.namaProduk ? ` (${item.namaProduk})` : ""}`;
    const ex = this.returCart.find((c) => String(c.varianID) === String(varianID));
    if (ex) ex.qty = qtyInt;
    else this.returCart.push({ varianID, nama, qty: qtyInt });
    this.renderReturItemsTable(container);
    return { ok: true };
  }

  setupReturEvents(container) {
    const openBtn = container.querySelector("#posReturOpenBtn");
    const modal = container.querySelector("#posReturModal");
    const closeBtn = container.querySelector("#posReturCloseBtn");
    const invSearch = container.querySelector("#posReturInvoiceSearch");
    const invSelect = container.querySelector("#posReturInvoiceSelect");
    const itemsSearch = container.querySelector("#posReturItemsSearch");
    const submitBtn = container.querySelector("#posReturSubmitBtn");

    if (openBtn) {
      openBtn.addEventListener("click", () => this.openReturModal(container));
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeReturModal(container));
    }
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.closeReturModal(container);
      });
    }
    if (invSearch && invSelect) {
      invSearch.addEventListener("input", (e) => {
        const filtered = this.filterReturInvoices(e.target.value || "");
        this.returFilteredInvoices = filtered;
        invSelect.innerHTML =
          `<option value="">— Pilih —</option>` +
          filtered.map((inv) => `<option value="${inv.penjualanID}">${this.returInvoiceLabel(inv)}</option>`).join("");
      });
    }
    if (invSelect) {
      invSelect.addEventListener("change", async (e) => {
        const id = parseInt(e.target.value || 0, 10);
        if (!id) {
          this.returSelectedInvoice = null;
          this.returInvoiceItems = [];
          this.returCart = [];
          this.renderReturItemsTable(container);
          this.renderReturCart(container);
          return;
        }
        await this.loadReturInvoiceItems(container, id);
      });
    }
    if (itemsSearch) {
      itemsSearch.addEventListener("input", (e) => {
        this.returItemsSearchQuery = e.target.value || "";
        this.renderReturItemsTable(container);
      });
    }

    container.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".pos-retur-add");
      if (!addBtn || !modal || !modal.contains(addBtn)) return;
      const varianID = addBtn.dataset.varianid;
      const inp = container.querySelector(`.pos-retur-qty[data-varianid="${varianID}"]`);
      const qty = inp ? inp.value : 0;
      const res = this.addToReturCart(container, varianID, qty);
      if (!res.ok) this.showReturAlert(container, res.message || "Gagal", "error");
      else {
        this.showReturAlert(container, "");
        this.renderReturCart(container);
      }
    });

    container.addEventListener("click", (e) => {
      const rm = e.target.closest(".pos-retur-remove");
      if (!rm || !modal || !modal.contains(rm)) return;
      this.returCart = this.returCart.filter((c) => String(c.varianID) !== String(rm.dataset.varianid));
      this.renderReturItemsTable(container);
      this.renderReturCart(container);
    });

    container.addEventListener("change", (e) => {
      if (!e.target.classList.contains("pos-retur-cart-qty")) return;
      if (!modal || !modal.contains(e.target)) return;
      const varianID = e.target.dataset.varianid;
      const newQty = parseInt(e.target.value || 0, 10);
      const item = this.returInvoiceItems.find((it) => String(it.varianID) === String(varianID));
      if (!item) return;
      const maxQty = Number(item.maxReturnQty || 0);
      if (newQty <= 0) return;
      if (newQty > maxQty) {
        e.target.value = maxQty;
        return;
      }
      const ex = this.returCart.find((c) => String(c.varianID) === String(varianID));
      if (ex) ex.qty = newQty;
      this.renderReturCart(container);
    });

    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        const user = this.getUser();
        if (!user) {
          this.showReturAlert(container, "Silakan login.", "error");
          return;
        }
        if (!this.returSelectedInvoice) {
          this.showReturAlert(container, "Pilih penjualan terlebih dahulu.", "error");
          return;
        }
        if (!this.returCart.length) {
          this.showReturAlert(container, "Keranjang retur kosong.", "error");
          return;
        }
        const alasan = (container.querySelector("#posReturAlasan")?.value || "").trim();
        if (!alasan) {
          this.showReturAlert(container, "Alasan retur wajib diisi.", "error");
          return;
        }
        const tanggalRetur = container.querySelector("#posReturTanggal")?.value || new Date().toISOString().split("T")[0];
        const lokasi = container.querySelector("#posReturLokasi")?.value || this.cabang;
        const disposisiBarang = container.querySelector("#posReturDisposisi")?.value || "KEMBALI_STOK";
        const payload = {
          userID: user.userID,
          penjualanID: this.returSelectedInvoice.penjualanID,
          tanggalRetur,
          lokasi,
          alasan,
          disposisiBarang,
          items: this.returCart.map((it) => ({ varianID: it.varianID, qty: it.qty }))
        };
        try {
          const res = await this.presenter.submitReturPenjualan(payload);
          if (!res.success) {
            this.showReturAlert(container, res.message || "Gagal menyimpan.", "error");
            return;
          }
          const dana = res.data?.totalPengembalianDana;
          const msg =
            dana != null
              ? `Retur tersimpan. Pengembalian dana (net): ${this.rupiah(dana)} — total di laporan penjualan sudah dikurangi otomatis.`
              : (res.message || "Retur penjualan berhasil disimpan.");
          alert(msg);
          this.returCart = [];
          await this.loadReturInvoiceItems(container, this.returSelectedInvoice.penjualanID);
          await this.loadCatalog(container);
          this.renderProductList(container);
        } catch (err) {
          console.error(err);
          this.showReturAlert(container, "Gagal menyimpan retur.", "error");
        }
      });
    }
  }

  async processPayment(container) {
    const user = this.getUser();
    if (!user) {
      this.showAlert(container, "Silakan login terlebih dahulu.");
      return;
    }

    if (!this.cart.length) {
      this.showAlert(container, "Keranjang masih kosong.");
      return;
    }

    const { total } = this.computeTotals(container);
    const bayarEl = container.querySelector("#posBayar");
    const bayar = Math.max(0, parseFloat(bayarEl?.value || 0) || 0);
    if (bayar < total) {
      this.showAlert(container, "Nominal bayar kurang.");
      return;
    }

    const metode = container.querySelector("#posMetode")?.value || "Tunai";
    const namaPembeli = container.querySelector("#posCustomer")?.value || "Umum";
    const catatan = container.querySelector("#posCatatan")?.value || "";

    try {
      const payload = {
        userID: user.userID,
        metodePembayaran: metode,
        namaPembeli: namaPembeli,
        catatan: catatan,
        items: this.cart.map((it) => ({
          varianID: it.varianID,
          qty: it.qty,
          diskonType: it.diskonType || "NOMINAL",
          diskonValue: Math.max(0, parseFloat(it.diskonValue) || 0)
        }))
      };

      const res = await this.presenter.processSale(payload);
      if (!res.success) {
        this.showAlert(container, res.message || "Gagal memproses pembayaran.");
        return;
      }

      const penjualanID = parseInt(res.data?.penjualanID || "0", 10);
      alert(`Transaksi berhasil! Total: ${this.rupiah(res.data?.total || total)}`);

      // Cetak nota untuk customer (langsung setelah sukses)
      if (penjualanID) {
        try {
          const detail = await this.presenter.getSalesInvoiceDetail(penjualanID);
          if (detail?.success) {
            const bayar2 = Math.max(0, parseFloat(bayarEl?.value || 0) || 0);
            const kembalian2 = bayar2 - total;
            const kasirName = container.querySelector("#posKasir")?.value || "";
            let alamat = "";
            try {
              const br = await this.presenter.getBranches();
              const branches = Array.isArray(br?.data) ? br.data : [];
              const lokasi = detail.data?.header?.lokasi || this.cabang || "";
              const match = branches.find((b) => String(b.namaCabang || "") === String(lokasi));
              alamat = match?.alamat || "";
            } catch {
              alamat = "";
            }
            printSalesReceipt(detail.data, { bayar: bayar2, kembalian: kembalian2, kasir: kasirName, alamatToko: alamat, printedAt: new Date() });
          }
        } catch (e) {
          // kalau gagal print, transaksi tetap sukses
          console.warn("Gagal cetak nota:", e);
        }
      }

      // reset dan reload katalog (stok berubah)
      this.cart = [];
      container.querySelector("#posBayar").value = "0";
      container.querySelector("#posCatatan").value = "";
      await this.loadCatalog(container);
      this.renderCart(container);
    } catch (err) {
      console.error("Error processing payment:", err);
      this.showAlert(container, "Gagal memproses pembayaran.");
    }
  }
}

