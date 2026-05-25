import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";
import { getCurrentUser } from "../../utils/authStorage.js";

export default class ReturSupplierPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.cabang = "";
    this.invoices = [];
    this.filteredInvoices = [];
    this.selectedInvoice = null;
    this.invoiceItems = [];
    this.itemsSearchQuery = "";
    this.currentPage = 1;
    this.pageSize = 30;
    this.cart = [];
  }

  rupiah(value) {
    return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  }

  showAlert(container, message, type = "error") {
    const el = container.querySelector("#returAlert");
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

    wrapper.appendChild(new Sidebar().render());
    wrapper.appendChild(new Topbar("Retur Supplier", "Retur Supplier (Karyawan)").render());

    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white rounded-xl shadow-lg p-4">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[220px]">
              <label class="block text-xs text-gray-500 mb-1">Tanggal Retur</label>
              <input id="returTanggal" type="date" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
            <div class="flex-1 min-w-[220px]">
              <label class="block text-xs text-gray-500 mb-1">Lokasi (Cabang)</label>
              <input id="returLokasi" type="text" readonly class="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-100 text-gray-700" />
            </div>
            <div class="flex-1 min-w-[260px]">
              <label class="block text-xs text-gray-500 mb-1">Pilih No Faktur Pembelian</label>
              <input id="returInvoiceSearch" type="text" placeholder="Cari No Faktur..." class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
          </div>

          <div class="mt-3">
            <label class="block text-xs text-gray-500 mb-1">Daftar Invoice</label>
            <select id="returInvoiceSelect" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
              <option value="">Pilih invoice</option>
            </select>
          </div>

          <div class="mt-3">
            <label class="block text-xs text-gray-500 mb-1">Supplier</label>
            <input id="returSupplierName" type="text" readonly class="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-100 text-gray-700" />
          </div>

          <div class="mt-3">
            <label class="block text-xs text-gray-500 mb-1">Catatan Retur (Opsional)</label>
            <textarea id="returKeterangan" rows="2" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" placeholder="Catatan"></textarea>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 xl:col-span-7 space-y-4">
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-gray-900">Item dari Pembelian</h3>
                  <p class="text-xs text-gray-500 mt-0.5">Isi qty retur lalu tekan “Tambah ke Keranjang”.</p>
                </div>
                <div class="relative w-64">
                  <input id="returItemsSearch" type="text" placeholder="Cari varian..." class="w-full border border-gray-300 p-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                  <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>

              <div class="overflow-x-auto max-h-[420px]">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Varian ID</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[240px]">Produk / Varian</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Beli</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-28">Sudah Diretur</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Tersedia</th>
                      <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-28">Qty Retur</th>
                      <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="returItemsTable" class="divide-y divide-gray-200"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="col-span-12 xl:col-span-5 space-y-4">
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="p-4 border-b border-gray-200">
                <h3 class="font-semibold text-gray-900">Keranjang Retur</h3>
              </div>
              <div class="overflow-x-auto max-h-[520px]">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                      <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">Qty</th>
                      <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-10">x</th>
                    </tr>
                  </thead>
                  <tbody id="returCartTable" class="divide-y divide-gray-200"></tbody>
                </table>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-4 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Jumlah Jenis</span>
                <span id="returJenisCount" class="font-semibold text-gray-900">0</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Jumlah Total Qty</span>
                <span id="returTotalQty" class="font-semibold text-gray-900">0</span>
              </div>

              <button id="returSubmitBtn" class="w-full bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">
                Simpan Retur Supplier
              </button>
            </div>
          </div>
        </div>

        <div id="returAlert" class="hidden rounded-xl p-4 text-sm"></div>
      </div>
    `;

    wrapper.appendChild(container);

    await this.loadInit(container);
    this.setupEvents(container);
    this.renderCart(container);

    return wrapper;
  }

  async loadInit(container) {
    const user = getCurrentUser();
    if (!user) {
      this.showAlert(container, "Silakan login terlebih dahulu.", "error");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const returTanggal = container.querySelector("#returTanggal");
    if (returTanggal) returTanggal.value = today;

    try {
      const res = await this.presenter.getInvoices(user.userID);
      if (!res.success) {
        this.showAlert(container, res.message || "Gagal memuat invoice", "error");
        return;
      }

      this.invoices = Array.isArray(res.data?.invoices) ? res.data.invoices : [];
      this.filteredInvoices = this.invoices;
      this.cabang = res.data?.cabang || "";

      const lokasiEl = container.querySelector("#returLokasi");
      if (lokasiEl) lokasiEl.value = this.cabang || "-";

      const select = container.querySelector("#returInvoiceSelect");
      select.innerHTML = `<option value="">Pilih invoice</option>` + this.filteredInvoices
        .map((inv) => `<option value="${inv.pembelianID}">${inv.noFaktur} (${inv.supplierName || "-"})</option>`)
        .join("");
    } catch (err) {
      console.error(err);
      this.showAlert(container, "Gagal memuat invoice", "error");
    }
  }

  filterInvoices(query) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return this.invoices;
    return this.invoices.filter((inv) => {
      return (
        String(inv.pembelianID || "").includes(q) ||
        (inv.noFaktur || "").toLowerCase().includes(q) ||
        (inv.supplierName || "").toLowerCase().includes(q)
      );
    });
  }

  async loadInvoiceItems(container, pembelianID) {
    const user = getCurrentUser();
    if (!user) return;
    if (!pembelianID) return;

    try {
      const res = await this.presenter.getInvoiceItems(pembelianID, user.userID);
      if (!res.success) {
        this.showAlert(container, res.message || "Gagal memuat item retur", "error");
        return;
      }

      this.selectedInvoice = res.data?.invoice || null;
      this.invoiceItems = Array.isArray(res.data?.items) ? res.data.items : [];

      const supplierNameEl = container.querySelector("#returSupplierName");
      if (supplierNameEl) supplierNameEl.value = this.selectedInvoice?.supplierName || "-";

      this.itemsSearchQuery = "";
      this.renderItemsTable(container);
      this.cart = [];
      this.renderCart(container);
      this.showAlert(container, "");
    } catch (err) {
      console.error(err);
      this.showAlert(container, "Gagal memuat item retur", "error");
    }
  }

  getFilteredItems() {
    const q = (this.itemsSearchQuery || "").toLowerCase().trim();
    if (!q) return this.invoiceItems;
    return this.invoiceItems.filter((it) => {
      return (
        String(it.varianID || "").includes(q) ||
        (it.namaVarian || "").toLowerCase().includes(q) ||
        (it.namaProduk || "").toLowerCase().includes(q) ||
        (it.produkNama || "").toLowerCase().includes(q)
      );
    });
  }

  renderItemsTable(container) {
    const tbody = container.querySelector("#returItemsTable");
    if (!tbody) return;

    const items = this.getFilteredItems().filter((it) => (it.maxReturnQty || 0) > 0);
    if (!items.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-4 py-6 text-center text-gray-500">Tidak ada item yang bisa diretur</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map((it) => {
      const nama = `${it.namaVarian || `Varian ID ${it.varianID}`}${it.namaProduk ? ` (${it.namaProduk})` : ""}`;
      const purchasedQty = Number(it.purchasedQty || 0);
      const returnedQty = Number(it.returnedQty || 0);
      const remainingQty = Number(it.remainingQty || 0);
      const maxQty = Number(it.maxReturnQty || 0);
      return `
        <tr class="hover:bg-gray-50 transition">
          <td class="px-4 py-3 text-sm text-gray-700">${it.varianID}</td>
          <td class="px-4 py-3 text-sm text-gray-900 font-medium">${nama}</td>
          <td class="px-4 py-3 text-sm text-gray-700">${purchasedQty}</td>
          <td class="px-4 py-3 text-sm text-gray-700">${returnedQty}</td>
          <td class="px-4 py-3 text-sm text-gray-700">${maxQty}</td>
          <td class="px-4 py-3 text-center">
            <input class="retur-qty-input w-20 border border-gray-300 p-1.5 rounded text-center text-sm" data-varianid="${it.varianID}" data-maxqty="${maxQty}" type="number" min="0" value="0" />
          </td>
          <td class="px-4 py-3 text-center">
            <button class="retur-add-btn bg-black text-white px-3 py-1.5 rounded-lg text-xs hover:bg-gray-800 transition" data-varianid="${it.varianID}">
              Tambah
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  renderCart(container) {
    const tbody = container.querySelector("#returCartTable");
    if (!tbody) return;

    if (!this.cart.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="px-3 py-6 text-center text-gray-500">Keranjang kosong</td>
        </tr>
      `;
    } else {
      tbody.innerHTML = this.cart.map((it, idx) => {
        return `
          <tr>
            <td class="px-4 py-3 text-sm text-gray-900 font-medium max-w-[240px] truncate" title="${it.nama}">${it.nama}</td>
            <td class="px-4 py-3 text-center">
              <input class="retur-cart-qty w-20 border border-gray-300 p-1.5 rounded text-center text-sm" data-varianid="${it.varianID}" type="number" min="1" value="${it.qty}" />
            </td>
            <td class="px-4 py-3 text-center">
              <button class="retur-cart-remove text-red-600 hover:text-red-800 text-sm" data-varianid="${it.varianID}">🗑</button>
            </td>
          </tr>
        `;
      }).join("");
    }

    const jenisCountEl = container.querySelector("#returJenisCount");
    const totalQtyEl = container.querySelector("#returTotalQty");
    if (jenisCountEl) jenisCountEl.textContent = String(this.cart.length);
    if (totalQtyEl) totalQtyEl.textContent = String(this.cart.reduce((n, it) => n + (parseInt(it.qty) || 0), 0));
  }

  addToCart(varianID, qty, container) {
    const item = this.invoiceItems.find((it) => String(it.varianID) === String(varianID));
    if (!item) return { ok: false, message: "Item tidak ditemukan" };

    const maxQty = Number(item.maxReturnQty || 0);
    const qtyInt = Math.floor(Number(qty || 0));
    if (!qtyInt || qtyInt <= 0) return { ok: false, message: "Qty retur harus > 0" };
    if (qtyInt > maxQty) return { ok: false, message: "Qty retur melebihi batas" };

    const existing = this.cart.find((c) => String(c.varianID) === String(varianID));
    const nama = `${item.namaVarian || `Varian ID ${item.varianID}`}${item.namaProduk ? ` (${item.namaProduk})` : ""}`;

    if (existing) {
      existing.qty = qtyInt;
    } else {
      this.cart.push({ varianID, nama, qty: qtyInt });
    }

    this.renderItemsTable(container);
    return { ok: true };
  }

  removeFromCart(varianID) {
    this.cart = this.cart.filter((c) => String(c.varianID) !== String(varianID));
  }

  setupEvents(container) {
    const invoiceSearch = container.querySelector("#returInvoiceSearch");
    const invoiceSelect = container.querySelector("#returInvoiceSelect");
    const itemsSearch = container.querySelector("#returItemsSearch");
    const itemsTable = container.querySelector("#returItemsTable");
    const submitBtn = container.querySelector("#returSubmitBtn");

    if (invoiceSearch) {
      invoiceSearch.addEventListener("input", (e) => {
        const q = e.target.value || "";
        const filtered = this.filterInvoices(q);
        this.filteredInvoices = filtered;
        invoiceSelect.innerHTML = `<option value="">Pilih invoice</option>` + filtered
          .map((inv) => `<option value="${inv.pembelianID}">${inv.noFaktur} (${inv.supplierName || "-"})</option>`)
          .join("");
      });
    }

    if (invoiceSelect) {
      invoiceSelect.addEventListener("change", async (e) => {
        const id = parseInt(e.target.value || 0);
        if (!id) {
          this.selectedInvoice = null;
          this.invoiceItems = [];
          this.cart = [];
          this.renderItemsTable(container);
          this.renderCart(container);
          return;
        }
        await this.loadInvoiceItems(container, id);
      });
    }

    if (itemsSearch) {
      itemsSearch.addEventListener("input", (e) => {
        this.itemsSearchQuery = e.target.value || "";
        this.renderItemsTable(container);
      });
    }

    container.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".retur-add-btn");
      if (!addBtn) return;
      const varianID = addBtn.dataset.varianid;
      const qtyInput = container.querySelector(`.retur-qty-input[data-varianid="${varianID}"]`);
      const qty = qtyInput ? qtyInput.value : 0;
      const res = this.addToCart(varianID, qty, container);
      if (!res.ok) {
        this.showAlert(container, res.message || "Gagal menambah retur", "error");
        return;
      }
      this.showAlert(container, "");
      this.renderCart(container);
    });

    container.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".retur-cart-remove");
      if (!removeBtn) return;
      this.removeFromCart(removeBtn.dataset.varianid);
      this.renderCart(container);
    });

    container.addEventListener("change", (e) => {
      if (!e.target.classList.contains("retur-cart-qty")) return;
      const varianID = e.target.dataset.varianid;
      const newQty = parseInt(e.target.value || 0);
      const item = this.invoiceItems.find((it) => String(it.varianID) === String(varianID));
      if (!item) return;
      const maxQty = Number(item.maxReturnQty || 0);
      if (newQty <= 0) return;
      if (newQty > maxQty) {
        e.target.value = item.maxReturnQty;
        return;
      }
      const existing = this.cart.find((c) => String(c.varianID) === String(varianID));
      if (existing) existing.qty = newQty;
      this.renderCart(container);
    });

    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        await this.submitRetur(container);
      });
    }
  }

  async submitRetur(container) {
    const user = getCurrentUser();
    if (!user) {
      this.showAlert(container, "Silakan login terlebih dahulu.", "error");
      return;
    }
    if (!this.selectedInvoice) {
      this.showAlert(container, "Pilih invoice terlebih dahulu.", "error");
      return;
    }
    if (!this.cart.length) {
      this.showAlert(container, "Keranjang retur masih kosong.", "error");
      return;
    }

    const tanggalRetur = container.querySelector("#returTanggal")?.value || new Date().toISOString().split("T")[0];
    const lokasi = container.querySelector("#returLokasi")?.value || this.cabang;
    const keterangan = container.querySelector("#returKeterangan")?.value || "";

    const payload = {
      userID: user.userID,
      pembelianID: this.selectedInvoice.pembelianID,
      tanggalRetur,
      lokasi,
      keterangan,
      items: this.cart.map((it) => ({ varianID: it.varianID, qty: it.qty }))
    };

    try {
      const res = await this.presenter.submitRetur(payload);
      if (!res.success) {
        this.showAlert(container, res.message || "Gagal menyimpan retur.", "error");
        return;
      }
      alert("Retur supplier berhasil disimpan!");
      // reset state
      this.cart = [];
      await this.loadInvoiceItems(container, this.selectedInvoice.pembelianID);
      this.showAlert(container, "");
    } catch (err) {
      console.error(err);
      this.showAlert(container, "Gagal menyimpan retur.", "error");
    }
  }
}

