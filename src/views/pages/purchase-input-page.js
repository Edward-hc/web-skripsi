import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";
import { getCurrentUser } from "../../utils/authStorage.js";

export default class PurchaseInputPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.catalog = [];
    this.suppliers = [];
    this.cabang = "";
    this.cart = [];
    this.searchQuery = "";
    this.currentPage = 1;
    this.pageSize = 20;
  }

  rupiah(value) {
    return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  }

  getUser() {
    return getCurrentUser();
  }

  showAlert(container, message, type = "warning") {
    const el = container.querySelector("#purchaseAlert");
    if (!el) return;
    if (!message) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }

    el.className = `rounded-xl p-4 text-sm ${type === "error" ? "bg-red-50 border border-red-200 text-red-700" : "bg-yellow-50 border border-yellow-200 text-yellow-800"}`;
    el.textContent = message;
    el.classList.remove("hidden");
  }

  async render() {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    const topbar = new Topbar("Purchases", "Input Pembelian Supplier");
    wrapper.appendChild(topbar.render());

    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white rounded-xl shadow-lg p-4">
          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-12 md:col-span-2">
              <label class="block text-xs text-gray-500 mb-1">Tanggal Faktur</label>
              <input id="purchaseTanggalFaktur" type="date" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
            <div class="col-span-12 md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">No Faktur</label>
              <input id="purchaseNoFaktur" type="text" placeholder="INV/FB-..." class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
            <div class="col-span-12 md:col-span-2">
              <label class="block text-xs text-gray-500 mb-1">Tanggal Terima</label>
              <input id="purchaseTanggalTerima" type="date" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
            <div class="col-span-12 md:col-span-2">
              <label class="block text-xs text-gray-500 mb-1">Jatuh Tempo</label>
              <input id="purchaseJatuhTempo" type="date" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
            <div class="col-span-12 md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">Supplier</label>
              <select id="purchaseSupplier" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                <option value="">Pilih Supplier</option>
              </select>
            </div>
            <div class="col-span-12 md:col-span-2">
              <label class="block text-xs text-gray-500 mb-1">Status</label>
              <select id="purchaseStatus" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                <option value="Diterima">Diterima</option>
                <option value="Proses">Proses</option>
              </select>
            </div>
            <div class="col-span-12 md:col-span-2">
              <label class="block text-xs text-gray-500 mb-1">Kasir</label>
              <input id="purchaseKasir" type="text" readonly class="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-100 text-gray-700" />
            </div>
            <div class="col-span-12 md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">Cabang</label>
              <input id="purchaseCabang" type="text" readonly class="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-100 text-gray-700" />
            </div>
          </div>
          <div class="mt-3 grid grid-cols-12 gap-3">
            <div class="col-span-12 md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">Ongkir</label>
              <input id="purchaseOngkir" type="number" min="0" value="0" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
            <div class="col-span-12 md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">PPN (%)</label>
              <input id="purchasePpnPersen" type="number" min="0" step="0.01" value="0" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
            <div class="col-span-12 md:col-span-6">
              <label class="block text-xs text-gray-500 mb-1">Catatan Faktur</label>
              <input id="purchaseCatatan" type="text" placeholder="Catatan tambahan invoice supplier..." class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
          </div>
          <div id="purchaseSupplierInfo" class="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">Pilih supplier untuk melihat detail kontak/alamat.</div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 xl:col-span-7 space-y-4">
            <div class="bg-white rounded-xl shadow-lg p-4">
              <div class="grid grid-cols-12 gap-2 items-stretch">
                <div class="col-span-12 md:col-span-6 relative">
                  <input id="purchaseSearch" type="text" placeholder="Cari produk/varian/ID..." class="w-full border border-gray-300 p-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                  <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <div class="col-span-6 md:col-span-2">
                  <input id="purchaseQuickVarianID" type="number" min="1" placeholder="ID Varian" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div class="col-span-3 md:col-span-1">
                  <input id="purchaseQuickQty" type="number" min="1" value="1" class="w-full border border-gray-300 p-2.5 rounded-lg text-center focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div class="col-span-3 md:col-span-3 flex gap-2">
                  <button id="purchaseQuickAdd" class="flex-1 bg-black text-white px-3 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">Tambah</button>
                  <button id="purchaseClearSearch" class="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition">Reset</button>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">Katalog Varian (Harga Modal)</h3>
                <div class="text-xs text-gray-500">Klik tambah untuk masuk ke keranjang pembelian</div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">ID</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produk / Varian</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">Harga Modal</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">Stok</th>
                      <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="purchaseProductTable" class="divide-y divide-gray-200"></tbody>
                </table>
              </div>
              <div class="p-3 border-t border-gray-200 flex items-center justify-between">
                <div class="text-sm text-gray-600" id="purchasePageInfo">Halaman 1</div>
                <div class="flex gap-2">
                  <button id="purchasePrevPage" class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Prev</button>
                  <button id="purchaseNextPage" class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Next</button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-12 xl:col-span-5 space-y-4">
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="p-4 border-b border-gray-200">
                <h3 class="font-semibold text-gray-900">Keranjang Pembelian</h3>
              </div>
              <div class="overflow-x-auto max-h-[520px]">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 min-w-0">Item</th>
                      <th class="px-2 py-2.5 text-center text-sm font-semibold text-gray-700 w-20">Qty</th>
                      <th class="px-2 py-2.5 text-left text-sm font-semibold text-gray-700 w-[168px]" title="Harga beli &amp; diskon per item">Harga</th>
                      <th class="px-2 py-2.5 text-right text-sm font-semibold text-gray-700 w-24">Sub</th>
                      <th class="px-2 py-2.5 text-center text-sm font-semibold text-gray-700 w-10"></th>
                    </tr>
                  </thead>
                  <tbody id="purchaseCartTable" class="divide-y divide-gray-200"></tbody>
                </table>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Ringkasan Pembelian</h3>
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Jumlah Item</span>
                  <span id="purchaseJumlahItem" class="font-semibold">0</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Subtotal</span>
                  <span id="purchaseTotal" class="font-bold">Rp 0</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Diskon item</span>
                  <span id="purchaseDiskonValue" class="font-semibold">Rp 0</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">PPN</span>
                  <span id="purchasePpnValue" class="font-semibold">Rp 0</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Ongkir</span>
                  <span id="purchaseOngkirValue" class="font-semibold">Rp 0</span>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span class="text-gray-700 font-semibold">Grand Total</span>
                  <span id="purchaseGrandTotal" class="font-bold text-base">Rp 0</span>
                </div>
                <div class="pt-2 border-t border-gray-200 flex gap-2">
                  <button id="purchaseCancel" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-400 transition">Bersihkan</button>
                  <button id="purchaseProcess" class="flex-1 bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">Simpan Pembelian</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="purchaseAlert" class="hidden rounded-xl p-4 text-sm"></div>
      </div>
    `;

    wrapper.appendChild(container);

    await this.loadCatalog(container);
    this.setupEvents(container);
    this.renderCart(container);

    return wrapper;
  }

  async loadCatalog(container) {
    const user = this.getUser();
    if (!user) {
      this.showAlert(container, "Silakan login terlebih dahulu.", "error");
      return;
    }

    const tanggalFakturEl = container.querySelector("#purchaseTanggalFaktur");
    const tanggalTerimaEl = container.querySelector("#purchaseTanggalTerima");
    const kasirEl = container.querySelector("#purchaseKasir");
    const cabangEl = container.querySelector("#purchaseCabang");
    const supplierEl = container.querySelector("#purchaseSupplier");

    const nowDate = new Date().toISOString().split("T")[0];
    if (tanggalFakturEl) tanggalFakturEl.value = nowDate;
    if (tanggalTerimaEl) tanggalTerimaEl.value = nowDate;
    if (kasirEl) kasirEl.value = user.fname ? `${user.fname} ${user.lname || ""}`.trim() : (user.email || "");

    try {
      const res = await this.presenter.getCatalog(user.userID);
      if (!res.success) {
        this.showAlert(container, res.message || "Gagal memuat data pembelian", "error");
        return;
      }

      this.cabang = res.data?.cabang || "";
      if (cabangEl) cabangEl.value = this.cabang || "-";

      this.catalog = Array.isArray(res.data?.items) ? res.data.items : [];
      this.suppliers = Array.isArray(res.data?.suppliers) ? res.data.suppliers : [];

      if (supplierEl) {
        supplierEl.innerHTML = '<option value="">Pilih Supplier</option>' + this.suppliers.map((s) => `<option value="${s.supplierID}">${s.nama}</option>`).join("");
      }

      this.renderProductList(container);
      this.showAlert(container, "");
    } catch (err) {
      console.error(err);
      this.showAlert(container, "Gagal memuat data pembelian", "error");
    }
  }

  getFilteredCatalog() {
    const q = (this.searchQuery || "").toLowerCase().trim();
    if (!q) return this.catalog;
    return (this.catalog || []).filter((it) => {
      return (
        String(it.varianID || "").includes(q) ||
        (it.namaVarian || "").toLowerCase().includes(q) ||
        (it.namaProduk || "").toLowerCase().includes(q)
      );
    });
  }

  getPagedCatalog() {
    const items = this.getFilteredCatalog().filter((it) => (it.status || "").toLowerCase() !== "tidak tersedia");
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.pageSize;
    return { pageItems: items.slice(start, start + this.pageSize), total, totalPages };
  }

  resolveHargaBeli(item) {
    return parseFloat(item.hargaModal ?? item.hargaJual ?? item.harga ?? 0) || 0;
  }

  renderProductList(container) {
    const table = container.querySelector("#purchaseProductTable");
    const info = container.querySelector("#purchasePageInfo");
    if (!table) return;

    const { pageItems, total, totalPages } = this.getPagedCatalog();
    if (!pageItems.length) {
      table.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-gray-500">Tidak ada produk</td></tr>`;
      if (info) info.textContent = "Tidak ada data";
      return;
    }

    table.innerHTML = pageItems.map((it) => {
      const stok = parseInt(it.stok) || 0;
      const name = `${it.namaVarian || `Varian ID ${it.varianID}`}${it.namaProduk ? ` (${it.namaProduk})` : ""}`;
      return `
        <tr class="hover:bg-gray-50 transition">
          <td class="px-4 py-3 text-sm text-gray-700">${it.varianID}</td>
          <td class="px-4 py-3 text-sm text-gray-900 font-medium">${name}</td>
          <td class="px-4 py-3 text-sm text-gray-700">${this.rupiah(this.resolveHargaBeli(it))}</td>
          <td class="px-4 py-3 text-sm text-gray-600">${stok}</td>
          <td class="px-4 py-3 text-center">
            <button class="purchase-add-item bg-black text-white px-3 py-1.5 rounded-lg text-xs hover:bg-gray-800 transition" data-varianid="${it.varianID}">Tambah</button>
          </td>
        </tr>
      `;
    }).join("");

    if (info) info.textContent = `Halaman ${this.currentPage}/${totalPages} - ${total} item`;
  }

  addToCart(varianID, qty = 1) {
    const item = (this.catalog || []).find((it) => String(it.varianID) === String(varianID));
    if (!item) return { ok: false, message: "Varian tidak ditemukan." };

    const qtyToAdd = Math.max(1, parseInt(qty) || 1);
    const existing = this.cart.find((c) => String(c.varianID) === String(varianID));
    if (existing) {
      existing.qty += qtyToAdd;
    } else {
      this.cart.push({
        varianID: item.varianID,
        namaVarian: item.namaVarian,
        namaProduk: item.namaProduk,
        qty: qtyToAdd,
        hargaBeli: this.resolveHargaBeli(item),
        diskonType: "NOMINAL",
        diskonValue: 0
      });
    }
    return { ok: true };
  }

  updateQty(varianID, qty) {
    const row = this.cart.find((c) => String(c.varianID) === String(varianID));
    if (!row) return;
    row.qty = Math.max(1, parseInt(qty) || 1);
  }

  updateHargaBeli(varianID, harga) {
    const row = this.cart.find((c) => String(c.varianID) === String(varianID));
    if (!row) return;
    row.hargaBeli = Math.max(0, parseFloat(harga) || 0);
  }

  updateDiskon(varianID, type, value) {
    const row = this.cart.find((c) => String(c.varianID) === String(varianID));
    if (!row) return;
    row.diskonType = type === "PERCENTAGE" ? "PERCENTAGE" : "NOMINAL";
    row.diskonValue = Math.max(0, parseFloat(value) || 0);
  }

  getItemDiscount(item) {
    const qty = Math.max(0, parseInt(item.qty) || 0);
    const harga = Math.max(0, parseFloat(item.hargaBeli) || 0);
    const gross = qty * harga;
    const rawValue = Math.max(0, parseFloat(item.diskonValue) || 0);
    const type = item.diskonType === "PERCENTAGE" ? "PERCENTAGE" : "NOMINAL";

    let discount = 0;
    if (type === "PERCENTAGE") {
      discount = gross * Math.min(rawValue, 100) / 100;
    } else {
      discount = rawValue;
    }
    return Math.min(discount, gross);
  }

  removeFromCart(varianID) {
    this.cart = (this.cart || []).filter((c) => String(c.varianID) !== String(varianID));
  }

  getTotals() {
    const jumlahItem = (this.cart || []).reduce((n, it) => n + (parseInt(it.qty) || 0), 0);
    const subTotal = (this.cart || []).reduce((sum, it) => sum + ((parseFloat(it.hargaBeli) || 0) * (parseInt(it.qty) || 0)), 0);
    const totalDiskon = (this.cart || []).reduce((sum, it) => sum + this.getItemDiscount(it), 0);
    const subTotalSetelahDiskon = Math.max(0, subTotal - totalDiskon);
    return { jumlahItem, subTotal, totalDiskon, subTotalSetelahDiskon };
  }

  renderCart(container) {
    const table = container.querySelector("#purchaseCartTable");
    if (!table) return;

    if (!this.cart.length) {
      table.innerHTML = `<tr><td colspan="5" class="px-3 py-6 text-center text-gray-500">Keranjang pembelian kosong</td></tr>`;
    } else {
      table.innerHTML = this.cart.map((it, idx) => {
        const name = `${it.namaVarian || `Varian ID ${it.varianID}`}${it.namaProduk ? ` (${it.namaProduk})` : ""}`;
        const gross = (parseFloat(it.hargaBeli) || 0) * (parseInt(it.qty) || 0);
        const diskonItem = this.getItemDiscount(it);
        const subtotal = Math.max(0, gross - diskonItem);
        return `
          <tr>
            <td class="px-3 py-2.5 text-sm text-gray-900 font-medium max-w-[220px] truncate align-top" title="${name}">${name}</td>
            <td class="px-2 py-2.5 text-center align-top">
              <input class="purchase-qty-input w-16 border border-gray-300 p-1.5 rounded text-center text-sm" data-varianid="${it.varianID}" type="number" min="1" value="${it.qty}" />
            </td>
            <td class="px-2 py-2.5 align-top w-[168px] min-w-[168px] max-w-[168px]">
              <div class="flex flex-col gap-1.5">
                <input class="purchase-price-input w-full border border-gray-300 p-1.5 rounded text-right text-sm" data-varianid="${it.varianID}" type="number" min="0" value="${it.hargaBeli}" />
                <div class="flex items-center gap-1.5 min-w-0">
                  <select class="purchase-discount-type shrink-0 w-11 border border-gray-300 py-1.5 px-1 rounded text-sm text-center" data-varianid="${it.varianID}">
                  <option value="NOMINAL" ${it.diskonType === "NOMINAL" ? "selected" : ""}>Rp</option>
                  <option value="PERCENTAGE" ${it.diskonType === "PERCENTAGE" ? "selected" : ""}>%</option>
                  </select>
                  <input class="purchase-discount-value min-w-0 flex-1 border border-gray-300 p-1.5 rounded text-right text-sm" data-varianid="${it.varianID}" type="number" min="0" step="0.01" value="${it.diskonValue || 0}" title="Nilai diskon" />
                </div>
              </div>
            </td>
            <td class="px-2 py-2.5 text-sm font-semibold text-gray-900 text-right whitespace-nowrap align-top">${this.rupiah(subtotal)}</td>
            <td class="px-2 py-2.5 text-center align-top">
              <button type="button" class="purchase-remove text-red-600 hover:text-red-800 text-sm leading-none p-1" data-varianid="${it.varianID}" title="Hapus">🗑</button>
            </td>
          </tr>
        `;
      }).join("");
    }

    const { jumlahItem, subTotal, totalDiskon, subTotalSetelahDiskon } = this.getTotals();
    const ongkir = Math.max(0, parseFloat(container.querySelector("#purchaseOngkir")?.value || 0) || 0);
    const ppnPersen = Math.max(0, parseFloat(container.querySelector("#purchasePpnPersen")?.value || 0) || 0);
    const ppnValue = subTotalSetelahDiskon * ppnPersen / 100;
    const grandTotal = Math.max(0, subTotalSetelahDiskon + ongkir + ppnValue);
    const jumlahEl = container.querySelector("#purchaseJumlahItem");
    const totalEl = container.querySelector("#purchaseTotal");
    const diskonEl2 = container.querySelector("#purchaseDiskonValue");
    const ppnEl = container.querySelector("#purchasePpnValue");
    const ongkirEl = container.querySelector("#purchaseOngkirValue");
    const grandTotalEl = container.querySelector("#purchaseGrandTotal");
    if (jumlahEl) jumlahEl.textContent = String(jumlahItem);
    if (totalEl) totalEl.textContent = this.rupiah(subTotal);
    if (diskonEl2) diskonEl2.textContent = this.rupiah(totalDiskon);
    if (ppnEl) ppnEl.textContent = this.rupiah(ppnValue);
    if (ongkirEl) ongkirEl.textContent = this.rupiah(ongkir);
    if (grandTotalEl) grandTotalEl.textContent = this.rupiah(grandTotal);
  }

  setupEvents(container) {
    const searchEl = container.querySelector("#purchaseSearch");
    const clearSearchBtn = container.querySelector("#purchaseClearSearch");
    const quickVarianEl = container.querySelector("#purchaseQuickVarianID");
    const quickQtyEl = container.querySelector("#purchaseQuickQty");
    const quickAddBtn = container.querySelector("#purchaseQuickAdd");
    const prevPageBtn = container.querySelector("#purchasePrevPage");
    const nextPageBtn = container.querySelector("#purchaseNextPage");
    const cancelBtn = container.querySelector("#purchaseCancel");
    const processBtn = container.querySelector("#purchaseProcess");
    const supplierEl = container.querySelector("#purchaseSupplier");
    const supplierInfoEl = container.querySelector("#purchaseSupplierInfo");
    const ongkirEl = container.querySelector("#purchaseOngkir");
    const ppnEl = container.querySelector("#purchasePpnPersen");
    const renderSupplierInfo = () => {
      if (!supplierInfoEl || !supplierEl) return;
      const id = parseInt(supplierEl.value || 0);
      const s = this.suppliers.find((x) => Number(x.supplierID) === id);
      if (!s) {
        supplierInfoEl.textContent = "Pilih supplier untuk melihat detail kontak/alamat.";
        return;
      }
      supplierInfoEl.innerHTML = `Nama: <b>${s.nama || "-"}</b> | No Telp Perusahaan: ${s.noTelepon || "-"} | Contact Person Sales: ${s.kontakPerson || "-"} | Email: ${s.email || "-"}<br>Alamat: ${s.alamat || "-"}`;
    };

    if (supplierEl) supplierEl.addEventListener("change", renderSupplierInfo);
    if (ongkirEl) ongkirEl.addEventListener("input", () => this.renderCart(container));
    if (ppnEl) ppnEl.addEventListener("input", () => this.renderCart(container));


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
      const res = this.addToCart(varianID, qty);
      if (!res.ok) {
        this.showAlert(container, res.message || "Gagal menambah item.");
      } else {
        this.showAlert(container, "");
        if (quickVarianEl) quickVarianEl.value = "";
        if (quickQtyEl) quickQtyEl.value = "1";
      }
      this.renderCart(container);
    };

    if (quickAddBtn) quickAddBtn.addEventListener("click", doQuickAdd);
    if (quickVarianEl) quickVarianEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doQuickAdd(); } });
    if (quickQtyEl) quickQtyEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doQuickAdd(); } });

    if (prevPageBtn) prevPageBtn.addEventListener("click", () => { this.currentPage -= 1; this.renderProductList(container); });
    if (nextPageBtn) nextPageBtn.addEventListener("click", () => { this.currentPage += 1; this.renderProductList(container); });

    container.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".purchase-add-item");
      if (addBtn) {
        const varianID = addBtn.dataset.varianid;
        const res = this.addToCart(varianID, 1);
        if (!res.ok) this.showAlert(container, res.message || "Gagal menambah item.");
        this.renderCart(container);
        return;
      }

      const removeBtn = e.target.closest(".purchase-remove");
      if (removeBtn) {
        this.removeFromCart(removeBtn.dataset.varianid);
        this.renderCart(container);
      }
    });

    container.addEventListener("change", (e) => {
      if (e.target.classList.contains("purchase-qty-input")) {
        this.updateQty(e.target.dataset.varianid, e.target.value);
        this.renderCart(container);
      }
      if (e.target.classList.contains("purchase-price-input")) {
        this.updateHargaBeli(e.target.dataset.varianid, e.target.value);
        this.renderCart(container);
      }
      if (e.target.classList.contains("purchase-discount-type")) {
        const varianID = e.target.dataset.varianid;
        const row = this.cart.find((c) => String(c.varianID) === String(varianID));
        this.updateDiskon(varianID, e.target.value, row ? row.diskonValue : 0);
        this.renderCart(container);
      }
      if (e.target.classList.contains("purchase-discount-value")) {
        const varianID = e.target.dataset.varianid;
        const row = this.cart.find((c) => String(c.varianID) === String(varianID));
        this.updateDiskon(varianID, row ? row.diskonType : "NOMINAL", e.target.value);
        this.renderCart(container);
      }
    });

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.cart = [];
        const fakturEl = container.querySelector("#purchaseNoFaktur");
        if (fakturEl) fakturEl.value = "";
        const catatanEl = container.querySelector("#purchaseCatatan");
        if (catatanEl) catatanEl.value = "";
        if (ongkirEl) ongkirEl.value = "0";
        if (ppnEl) ppnEl.value = "0";
        this.showAlert(container, "");
        this.renderCart(container);
      });
    }

    if (processBtn) {
      processBtn.addEventListener("click", async () => {
        await this.processPurchase(container);
      });
    }
  }

  async processPurchase(container) {
    const user = this.getUser();
    if (!user) {
      this.showAlert(container, "Silakan login terlebih dahulu.", "error");
      return;
    }
    if (!this.cart.length) {
      this.showAlert(container, "Keranjang pembelian masih kosong.");
      return;
    }

    const supplierID = parseInt(container.querySelector("#purchaseSupplier")?.value || 0);
    const noFaktur = (container.querySelector("#purchaseNoFaktur")?.value || "").trim();
    const tanggalFaktur = (container.querySelector("#purchaseTanggalFaktur")?.value || "").trim();
    const tanggalTerima = (container.querySelector("#purchaseTanggalTerima")?.value || "").trim();
    const jatuhTempo = (container.querySelector("#purchaseJatuhTempo")?.value || "").trim();
    const status = (container.querySelector("#purchaseStatus")?.value || "Diterima").trim();
    const ongkir = Math.max(0, parseFloat(container.querySelector("#purchaseOngkir")?.value || 0) || 0);
    const ppnPersen = Math.max(0, parseFloat(container.querySelector("#purchasePpnPersen")?.value || 0) || 0);
    const catatan = (container.querySelector("#purchaseCatatan")?.value || "").trim();
    if (!supplierID) {
      this.showAlert(container, "Pilih supplier terlebih dahulu.");
      return;
    }
    if (!noFaktur) {
      this.showAlert(container, "No faktur wajib diisi.");
      return;
    }
    if (!tanggalTerima) {
      this.showAlert(container, "Tanggal terima wajib diisi.");
      return;
    }

    try {
      const payload = {
        userID: user.userID,
        supplierID: supplierID,
        noFaktur: noFaktur,
        tanggalFaktur,
        tanggalTerima,
        jatuhTempo,
        status,
        ongkir,
        ppnPersen,
        catatan,
        items: this.cart.map((it) => ({
          varianID: it.varianID,
          qty: it.qty,
          hargaBeli: it.hargaBeli,
          diskonType: it.diskonType || "NOMINAL",
          diskonValue: Math.max(0, parseFloat(it.diskonValue) || 0)
        }))
      };

      const res = await this.presenter.submitPurchase(payload);
      if (!res.success) {
        this.showAlert(container, res.message || "Gagal menyimpan pembelian.", "error");
        return;
      }

      alert(`Pembelian berhasil disimpan. Total: ${this.rupiah(res.data?.totalPembelian || 0)}`);
      this.cart = [];
      container.querySelector("#purchaseNoFaktur").value = "";
      container.querySelector("#purchaseSupplier").value = "";
      container.querySelector("#purchaseCatatan").value = "";
      container.querySelector("#purchaseOngkir").value = "0";
      container.querySelector("#purchasePpnPersen").value = "0";
      await this.loadCatalog(container);
      this.renderCart(container);
    } catch (err) {
      console.error(err);
      this.showAlert(container, "Gagal menyimpan pembelian.", "error");
    }
  }
}

