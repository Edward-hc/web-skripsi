import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";

export default class PurchaseReportPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.allPurchases = [];
    this.selectedPeriode = "Harian";
    this.selectedDate = this.getDefaultDateValue("Harian");
    this.selectedCabang = "";
  }

  getDefaultDateValue(type) {
    const now = new Date();
    if (type === "Bulanan") {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    if (type === "Tahunan") {
      return `${now.getFullYear()}`;
    }
    return now.toISOString().split("T")[0];
  }

  rupiah(n) {
    return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
  }

  closePurchaseInvoiceModal(container) {
    const modal = container.querySelector("#purchaseInvoiceModal");
    if (!modal) return;
    modal.classList.remove("flex", "items-center", "justify-center");
    modal.classList.add("hidden");
  }

  openPurchaseInvoiceModal(container, pembelianID) {
    const modal = container.querySelector("#purchaseInvoiceModal");
    const body = container.querySelector("#purchaseInvoiceBody");
    if (!modal || !body) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex", "items-center", "justify-center");
    body.innerHTML = `<p class="text-gray-500">Memuat detail...</p>`;

    this.presenter
      .getPurchaseInvoiceDetail(pembelianID)
      .then((res) => {
        if (!res.success) {
          body.innerHTML = `<p class="text-red-600">${res.message || "Gagal memuat detail."}</p>`;
          return;
        }
        const { header, items } = res.data || {};
        const h = header || {};
        const tanggal = h.tanggalTerima
          ? new Date(h.tanggalTerima).toLocaleDateString("id-ID")
          : "-";
        const totalQtyReturHeader = Number(h.totalQtyRetur || 0) || 0;
        const rows = (items || [])
          .map((it, i) => {
            const qty = Number(it.jumlah || 0) || 0;
            const qtyRetur = Number(it.qtyRetur || 0) || 0;
            const qtySisa = Number(it.qtySisa != null ? it.qtySisa : Math.max(0, qty - qtyRetur)) || 0;
            const harga = Number(it.hargaSatuan || 0) || 0;
            const subtotal = Number(it.subtotal || 0) || 0;
            const diskonItem = Math.max(0, qty * harga - subtotal);
            const returStyle =
              qtyRetur > 0 ? "text-amber-800 font-semibold" : "text-gray-400";

            return `
              <tr class="border-b border-gray-100">
                <td class="px-4 py-3 align-top">${i + 1}</td>
                <td class="px-4 py-3 align-top whitespace-nowrap">${it.varianID ?? "-"}</td>
                <td class="px-4 py-3 align-top">${it.namaVarian || "-"}${it.namaProduk ? ` <span class="text-gray-500">(${it.namaProduk})</span>` : ""}</td>
                <td class="px-4 py-3 text-right align-top whitespace-nowrap">${qty}</td>
                <td class="px-4 py-3 text-right align-top whitespace-nowrap ${returStyle}">${qtyRetur > 0 ? qtyRetur : "—"}</td>
                <td class="px-4 py-3 text-right align-top whitespace-nowrap">${qtySisa}</td>
                <td class="px-4 py-3 text-right align-top whitespace-nowrap">${this.rupiah(harga)}</td>
                <td class="px-4 py-3 text-right align-top whitespace-nowrap">${diskonItem > 0 ? this.rupiah(diskonItem) : "-"}</td>
                <td class="px-4 py-3 text-right font-medium align-top whitespace-nowrap">${this.rupiah(subtotal)}</td>
              </tr>
            `;
          })
          .join("");

        const ongkirH = Number(h.ongkir || 0) || 0;
        const ppnNom = Number(h.ppnNominal || 0) || 0;
        const totalBarangH = Number(h.totalBarangTermasukPpn || 0) || 0;
        const ppnPersen = Number(h.ppnPersen || 0) || 0;
        const ppnLine =
          ppnPersen > 0
            ? `${this.rupiah(ppnNom)} · ${ppnPersen}%`
            : "Tidak ada tambahan PPN";

        body.innerHTML = `
          <div class="space-y-8">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Data faktur</p>
              <table class="w-full text-sm border-collapse">
                <tbody class="divide-y divide-gray-100">
                  <tr>
                    <th scope="row" class="py-2.5 pr-4 text-left font-normal text-gray-500 w-[40%] sm:w-1/3">No faktur</th>
                    <td class="py-2.5 text-gray-900 font-semibold">${h.noFaktur || "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row" class="py-2.5 pr-4 text-left font-normal text-gray-500">Supplier</th>
                    <td class="py-2.5 text-gray-900">${h.supplierName || "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row" class="py-2.5 pr-4 text-left font-normal text-gray-500">Tanggal terima</th>
                    <td class="py-2.5 text-gray-900">${tanggal}</td>
                  </tr>
                  <tr>
                    <th scope="row" class="py-2.5 pr-4 text-left font-normal text-gray-500">Lokasi</th>
                    <td class="py-2.5 text-gray-900">${h.lokasi || "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row" class="py-2.5 pr-4 text-left font-normal text-gray-500">Status</th>
                    <td class="py-2.5 text-gray-900">${h.status || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Ringkasan biaya</p>
              <div class="rounded-lg border border-gray-200 overflow-hidden bg-white">
                <table class="w-full text-sm">
                  <tbody>
                    <tr class="border-b border-gray-100">
                      <td class="px-4 py-3 text-gray-600 align-top">Barang + PPN<br /><span class="text-xs text-gray-400 font-normal">(subtotal pembelian barang, termasuk PPN)</span></td>
                      <td class="px-4 py-3 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap align-top">${this.rupiah(totalBarangH)}</td>
                    </tr>
                    <tr class="border-b border-gray-100">
                      <td class="px-4 py-3 text-gray-600 align-top">Ongkir</td>
                      <td class="px-4 py-3 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap align-top">${ongkirH > 0 ? this.rupiah(ongkirH) : "—"}</td>
                    </tr>
                    <tr class="border-b border-gray-100">
                      <td class="px-4 py-3 text-gray-600 align-top">Keterangan PPN</td>
                      <td class="px-4 py-3 text-right text-gray-900 align-top">${ppnLine}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="bg-gray-50">
                      <td class="px-4 py-3 font-semibold text-gray-800">Total tagihan</td>
                      <td class="px-4 py-3 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">${this.rupiah(h.totalPembelian)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div class="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm">
              <p class="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">Retur ke supplier</p>
              <p class="text-amber-950">${
                totalQtyReturHeader > 0
                  ? `Total <strong>${totalQtyReturHeader}</strong> unit sudah diretur (detail per baris di bawah).`
                  : "Belum ada retur untuk faktur ini."
              }</p>
            </div>

            ${h.catatan ? `<div class="text-sm text-gray-700"><span class="text-gray-500">Catatan:</span> ${h.catatan}</div>` : ""}

            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Daftar item</p>
              <div class="border border-gray-200 rounded-lg overflow-x-auto">
                <table class="w-full min-w-[800px] text-sm">
                  <thead class="bg-gray-50 text-left text-gray-700">
                    <tr>
                      <th class="px-4 py-3 whitespace-nowrap font-semibold">#</th>
                      <th class="px-4 py-3 whitespace-nowrap font-semibold">Varian ID</th>
                      <th class="px-4 py-3 min-w-[180px] font-semibold">Produk / Varian</th>
                      <th class="px-4 py-3 text-right whitespace-nowrap font-semibold">Dibeli</th>
                      <th class="px-4 py-3 text-right whitespace-nowrap font-semibold text-amber-900">Retur</th>
                      <th class="px-4 py-3 text-right whitespace-nowrap font-semibold">Sisa</th>
                      <th class="px-4 py-3 text-right whitespace-nowrap font-semibold">Harga</th>
                      <th class="px-4 py-3 text-right whitespace-nowrap font-semibold">Diskon</th>
                      <th class="px-4 py-3 text-right whitespace-nowrap font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="text-gray-800">${rows || `<tr><td colspan="9" class="px-4 py-6 text-center text-gray-500">Tidak ada baris item</td></tr>`}</tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      })
      .catch(() => {
        body.innerHTML = `<p class="text-red-600">Gagal memuat detail.</p>`;
      });
  }

  getPeriodeKeterangan() {
    const periode = this.selectedPeriode || "Harian";
    const value = this.selectedDate || this.getDefaultDateValue(periode);

    if (periode === "Bulanan") {
      const [year, month] = value.split("-");
      if (year && month) {
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const bulan = date.toLocaleDateString("id-ID", { month: "long" });
        return `Periode Bulanan: ${bulan} ${year}`;
      }
      return `Periode Bulanan: ${value}`;
    }

    if (periode === "Tahunan") {
      return `Periode Tahunan: ${value}`;
    }

    // Harian (default)
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const tgl = date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
      return `Periode Harian: ${tgl}`;
    }

    return `Periode Harian: ${value}`;
  }

  async render() {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    const topbar = new Topbar("Reports Purchases", "Laporan Pembelian");
    wrapper.appendChild(topbar.render());

    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div class="flex flex-wrap items-center gap-4 flex-1 min-w-[260px]">
          <label class="text-sm font-medium text-gray-700">Periode:</label>
          <select
            id="periodePurchases"
            class="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
          >
            <option value="Harian">Harian</option>
            <option value="Bulanan">Bulanan</option>
            <option value="Tahunan">Tahunan</option>
          </select>
          <div id="dateWrapper" class="w-40">
            <input
              type="date"
              id="periodeDate"
              value="${this.selectedDate}"
              class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div class="min-w-[220px]">
            <select
              id="purchaseBranchFilter"
              class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
              title="Filter cabang"
            >
              <option value="">Semua Cabang</option>
            </select>
          </div>
          <div class="relative flex-1 min-w-[210px]">
            <input
              type="text"
              id="searchPurchases"
              placeholder="Cari pembelian..."
              class="w-full border border-gray-300 p-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            id="exportPurchasesExcel"
            class="border border-gray-300 bg-white text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition whitespace-nowrap"
          >
            Export Excel
          </button>
          <button
            id="exportPurchasesPdf"
            class="bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition whitespace-nowrap"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-24">ID</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 min-w-[150px]">No Faktur</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 min-w-[140px]">Tanggal</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 min-w-[160px]">Supplier</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 min-w-[140px]">Lokasi</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 min-w-[120px]">Status</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 min-w-[140px]">Jumlah Item</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 min-w-[160px]">Diskon Pembelian</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 min-w-[140px]">Total Pembelian</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-700 w-24" title="Jumlah unit yang sudah diretur ke supplier">Retur</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-700 w-28">Aksi</th>
              </tr>
            </thead>
            <tbody id="purchaseReportTable" class="divide-y divide-gray-200">
              <!-- data akan diisi -->
            </tbody>
          </table>
        </div>
      </div>

      <div id="purchaseInvoiceModal" class="fixed inset-0 z-50 hidden p-4 sm:p-6 bg-black/50">
        <div class="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col mx-auto">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <h3 class="text-xl font-semibold text-gray-900">Detail Pembelian (Invoice)</h3>
            <button type="button" id="purchaseInvoiceClose" class="text-gray-500 hover:text-gray-800 text-sm font-medium">Tutup</button>
          </div>
          <div id="purchaseInvoiceBody" class="p-6 md:p-8 overflow-y-auto text-base text-gray-700 leading-relaxed"></div>
        </div>
      </div>
    `;

    wrapper.appendChild(container);
    await this.renderPurchases(container);
    await this.populateBranchFilter(container);
    this.setupEvents(container);
    return wrapper;
  }

  async populateBranchFilter(container) {
    const sel = container.querySelector("#purchaseBranchFilter");
    if (!sel) return;
    sel.innerHTML = `<option value="">Semua Cabang</option>`;
    try {
      const res = await this.presenter.getBranches();
      const branches = Array.isArray(res?.data) ? res.data : [];
      branches.forEach((b) => {
        const name = b.namaCabang || "";
        if (!name) return;
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      });
      sel.value = this.selectedCabang || "";
    } catch {
      sel.value = this.selectedCabang || "";
    }
  }

  applyCabangFilter(list) {
    const cab = (this.selectedCabang || "").trim();
    if (!cab) return list || [];
    return (list || []).filter((p) => String(p.lokasi || "") === cab);
  }

  async renderPurchases(container, purchasesToRender = null) {
    const table = container.querySelector("#purchaseReportTable");
    try {
      if (!purchasesToRender) {
        const res = await this.presenter.getPurchaseReports(this.selectedPeriode, this.selectedDate);
        this.allPurchases = Array.isArray(res.data) ? res.data : [];
        purchasesToRender = this.allPurchases;
      }

      const purchases = this.applyCabangFilter(purchasesToRender);
      if (purchases.length === 0) {
        table.innerHTML = `
          <tr>
            <td colspan="11" class="px-6 py-8 text-center text-gray-500">
              Belum ada laporan pembelian
            </td>
          </tr>
        `;
        return;
      }

      table.innerHTML = purchases
        .map((purchase) => {
          const id = purchase.pembelianID
            ? `B${String(purchase.pembelianID).padStart(3, "0")}`
            : "-";
          const tanggal = purchase.tanggalTerima
            ? new Date(purchase.tanggalTerima).toLocaleDateString("id-ID")
            : "-";
          const jumlahItem = Number(purchase.jumlahItem || 0) || 0;
          const diskonPembelian = Number(purchase.diskonPembelian || 0) || 0;
          const totalPembelian = `Rp ${Number(purchase.totalPembelian || 0).toLocaleString("id-ID")}`;
          const pid = purchase.pembelianID || 0;
          const totalQtyRetur = Number(purchase.totalQtyRetur || 0) || 0;
          const returCell =
            totalQtyRetur > 0
              ? `<span class="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-amber-100 text-amber-900 font-semibold px-2 py-0.5">${totalQtyRetur}</span>`
              : `<span class="text-gray-400">—</span>`;
          return `
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 text-sm text-gray-900">${id}</td>
              <td class="px-6 py-4 text-sm text-gray-900 font-semibold">${purchase.noFaktur || "-"}</td>
              <td class="px-6 py-4 text-sm text-gray-900">${tanggal}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${purchase.supplierName || "-"}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${purchase.lokasi || "-"}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${purchase.status || "-"}</td>
              <td class="px-6 py-4 text-sm text-gray-900">${jumlahItem}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${diskonPembelian ? `Rp ${diskonPembelian.toLocaleString("id-ID")}` : "Rp 0"}</td>
              <td class="px-6 py-4 text-sm text-gray-900 font-semibold">${totalPembelian}</td>
              <td class="px-6 py-4 text-sm text-center">${returCell}</td>
              <td class="px-6 py-4 text-center">
                <button type="button" class="purchase-invoice-btn border border-gray-300 bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition whitespace-nowrap" data-pembelian-id="${pid}">
                  Detail
                </button>
              </td>
            </tr>
          `;
        })
        .join("");
    } catch (err) {
      console.error("Error rendering purchases:", err);
      table.innerHTML = `
        <tr>
          <td colspan="11" class="px-6 py-8 text-center text-red-500">
            Gagal memuat data laporan pembelian
          </td>
        </tr>
      `;
    }
  }

  filterPurchases(query) {
    const base = this.applyCabangFilter(this.allPurchases);
    if (!query.trim()) return base;

    const normalized = query.toLowerCase();
    return base.filter((purchase) => {
      const id = purchase.pembelianID ? `b${String(purchase.pembelianID).padStart(3, "0")}` : "";
      // Format tanggal untuk pencarian
      const tanggalFormatted = purchase.tanggalTerima 
        ? new Date(purchase.tanggalTerima).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }).toLowerCase()
        : "";
      
      return (
        id.includes(normalized) ||
        purchase.pembelianID?.toString().includes(normalized) ||
        (purchase.noFaktur?.toLowerCase().includes(normalized)) ||
        (purchase.status?.toLowerCase().includes(normalized)) ||
        (purchase.supplierName?.toLowerCase().includes(normalized)) ||
        (purchase.lokasi?.toLowerCase().includes(normalized)) ||
        (purchase.tanggalTerima?.toLowerCase().includes(normalized)) ||
        tanggalFormatted.includes(normalized) ||
        (purchase.totalPembelian?.toString().includes(normalized)) ||
        (purchase.jumlahItem?.toString().includes(normalized)) ||
        (purchase.diskonPembelian?.toString().includes(normalized)) ||
        (purchase.totalQtyRetur != null &&
          String(purchase.totalQtyRetur).includes(normalized))
      );
    });
  }

  setupEvents(container) {
    const periodeSelect = container.querySelector("#periodePurchases");
    const searchInput = container.querySelector("#searchPurchases");
    const dateInput = container.querySelector("#periodeDate");
    const exportExcelBtn = container.querySelector("#exportPurchasesExcel");
    const exportPdfBtn = container.querySelector("#exportPurchasesPdf");
    const branchFilter = container.querySelector("#purchaseBranchFilter");

    const updateDateInputType = () => {
      if (!dateInput) return;
      if (this.selectedPeriode === "Harian") {
        dateInput.type = "date";
        dateInput.min = "";
        dateInput.step = "";
      } else if (this.selectedPeriode === "Bulanan") {
        dateInput.type = "month";
        dateInput.min = "";
        dateInput.step = "";
      } else {
        dateInput.type = "number";
        dateInput.min = "2000";
        dateInput.step = "1";
      }
      dateInput.value = this.selectedDate;
    };

    updateDateInputType();

    if (periodeSelect) {
      periodeSelect.value = this.selectedPeriode;
      periodeSelect.addEventListener("change", async (e) => {
        this.selectedPeriode = e.target.value;
        this.selectedDate = this.getDefaultDateValue(this.selectedPeriode);
        updateDateInputType();
        await this.renderPurchases(container);
      });
    }

    if (dateInput) {
      dateInput.addEventListener("change", async (e) => {
        this.selectedDate = e.target.value;
        await this.renderPurchases(container);
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const results = this.filterPurchases(e.target.value);
        this.renderPurchases(container, results);
      });
    }

    if (branchFilter) {
      branchFilter.value = this.selectedCabang || "";
      branchFilter.addEventListener("change", async (e) => {
        this.selectedCabang = e.target.value || "";
        const q = searchInput ? searchInput.value || "" : "";
        const results = this.filterPurchases(q);
        await this.renderPurchases(container, results);
      });
    }

    if (exportExcelBtn) {
      exportExcelBtn.addEventListener("click", () => {
        const searchQuery = searchInput ? searchInput.value || "" : "";
        const purchases = this.getCurrentPurchasesForExport(searchQuery);
        this.exportPurchasesToExcel(purchases);
      });
    }

    if (exportPdfBtn) {
      exportPdfBtn.addEventListener("click", () => {
        const searchQuery = searchInput ? searchInput.value || "" : "";
        const purchases = this.getCurrentPurchasesForExport(searchQuery);
        this.exportPurchasesToPdf(purchases);
      });
    }

    const invoiceClose = container.querySelector("#purchaseInvoiceClose");
    const invoiceModal = container.querySelector("#purchaseInvoiceModal");
    if (invoiceClose) {
      invoiceClose.addEventListener("click", () => this.closePurchaseInvoiceModal(container));
    }
    if (invoiceModal) {
      invoiceModal.addEventListener("click", (e) => {
        if (e.target === invoiceModal) this.closePurchaseInvoiceModal(container);
      });
    }
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".purchase-invoice-btn");
      if (!btn) return;
      const id = parseInt(btn.dataset.pembelianId || "0", 10);
      if (!id) return;
      this.openPurchaseInvoiceModal(container, id);
    });
  }

  getCurrentPurchasesForExport(searchQuery) {
    const q = searchQuery || "";
    return this.filterPurchases(q);
  }

  getExportCabangLabel() {
    const c = (this.selectedCabang || "").trim();
    return c || "Semua cabang";
  }

  getPurchaseDateKey(purchase) {
    const raw = purchase.tanggalTerima;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw).slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  getPurchaseMonthKey(purchase) {
    const raw = purchase.tanggalTerima;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  initPaymentBucketsPurchase() {
    return { Tunai: 0, QRIS: 0, Transfer: 0 };
  }

  addToPaymentBucketsPurchase(buckets, metode, amount) {
    const n = Number(amount || 0) || 0;
    const m = String(metode || "")
      .trim()
      .toLowerCase();
    if (m === "tunai") buckets.Tunai += n;
    else if (m === "qris") buckets.QRIS += n;
    else if (m === "transfer") buckets.Transfer += n;
  }

  sumPurchaseTotal(list) {
    return (list || []).reduce((s, p) => s + (Number(p.totalPembelian) || 0), 0);
  }

  sumPurchaseDiskon(list) {
    return (list || []).reduce((s, p) => s + (Number(p.diskonPembelian) || 0), 0);
  }

  sumPurchaseReturQty(list) {
    return (list || []).reduce((s, p) => s + (Number(p.totalQtyRetur) || 0), 0);
  }

  buildPurchaseExportSummaryRows(purchases) {
    const rows = [];
    const list = purchases || [];
    const periode = this.selectedPeriode || "Harian";

    rows.push(["RINGKASAN PEMBUKUAN"]);
    rows.push([]);

    if (periode === "Harian") {
      const b = this.initPaymentBucketsPurchase();
      list.forEach((p) => this.addToPaymentBucketsPurchase(b, p.metodePembayaran, p.totalPembelian));
      rows.push(["Total pembelian", this.sumPurchaseTotal(list)]);
      rows.push(["Total diskon pembelian", this.sumPurchaseDiskon(list)]);
      rows.push(["Jumlah faktur", list.length]);
      rows.push(["Total qty retur (unit)", this.sumPurchaseReturQty(list)]);
      rows.push([]);
      rows.push(["Pembelian per metode (jika diisi di faktur)"]);
      rows.push(["Tunai", b.Tunai]);
      rows.push(["QRIS", b.QRIS]);
      rows.push(["Transfer", b.Transfer]);
    } else if (periode === "Bulanan") {
      const byDay = new Map();
      list.forEach((p) => {
        const k = this.getPurchaseDateKey(p);
        if (!byDay.has(k)) byDay.set(k, []);
        byDay.get(k).push(p);
      });
      const days = [...byDay.keys()].filter(Boolean).sort();
      rows.push([
        "Tanggal terima",
        "Total pembelian",
        "Total diskon",
        "Tunai",
        "QRIS",
        "Transfer",
        "Jumlah faktur",
        "Qty retur"
      ]);
      days.forEach((day) => {
        const grp = byDay.get(day);
        const buck = this.initPaymentBucketsPurchase();
        grp.forEach((p) => this.addToPaymentBucketsPurchase(buck, p.metodePembayaran, p.totalPembelian));
        rows.push([
          day,
          this.sumPurchaseTotal(grp),
          this.sumPurchaseDiskon(grp),
          buck.Tunai,
          buck.QRIS,
          buck.Transfer,
          grp.length,
          this.sumPurchaseReturQty(grp)
        ]);
      });
      rows.push([]);
      const gb = this.initPaymentBucketsPurchase();
      list.forEach((p) => this.addToPaymentBucketsPurchase(gb, p.metodePembayaran, p.totalPembelian));
      rows.push([
        "GRAND TOTAL",
        this.sumPurchaseTotal(list),
        this.sumPurchaseDiskon(list),
        gb.Tunai,
        gb.QRIS,
        gb.Transfer,
        list.length,
        this.sumPurchaseReturQty(list)
      ]);
    } else {
      const byMonth = new Map();
      list.forEach((p) => {
        const k = this.getPurchaseMonthKey(p);
        if (!k) return;
        if (!byMonth.has(k)) byMonth.set(k, []);
        byMonth.get(k).push(p);
      });
      const months = [...byMonth.keys()].sort();
      rows.push([
        "Bulan (YYYY-MM)",
        "Total pembelian",
        "Total diskon",
        "Tunai",
        "QRIS",
        "Transfer",
        "Jumlah faktur",
        "Qty retur"
      ]);
      months.forEach((mkey) => {
        const grp = byMonth.get(mkey);
        const buck = this.initPaymentBucketsPurchase();
        grp.forEach((p) => this.addToPaymentBucketsPurchase(buck, p.metodePembayaran, p.totalPembelian));
        rows.push([
          mkey,
          this.sumPurchaseTotal(grp),
          this.sumPurchaseDiskon(grp),
          buck.Tunai,
          buck.QRIS,
          buck.Transfer,
          grp.length,
          this.sumPurchaseReturQty(grp)
        ]);
      });
      rows.push([]);
      const gb = this.initPaymentBucketsPurchase();
      list.forEach((p) => this.addToPaymentBucketsPurchase(gb, p.metodePembayaran, p.totalPembelian));
      rows.push([
        "GRAND TOTAL",
        this.sumPurchaseTotal(list),
        this.sumPurchaseDiskon(list),
        gb.Tunai,
        gb.QRIS,
        gb.Transfer,
        list.length,
        this.sumPurchaseReturQty(list)
      ]);
    }

    const periodeType = this.selectedPeriode || "Harian";
    if (periodeType === "Harian") {
      rows.push([]);
      rows.push(["DETAIL FAKTUR"]);
      rows.push([]);
    }
    return rows;
  }

  buildPurchasePdfSummaryHtml(purchases) {
    const list = purchases || [];
    const periode = this.selectedPeriode || "Harian";
    let html = `<h2 style="font-size:14px;margin:16px 0 8px;">Ringkasan pembukuan</h2>`;

    if (periode === "Harian") {
      const b = this.initPaymentBucketsPurchase();
      list.forEach((p) => this.addToPaymentBucketsPurchase(b, p.metodePembayaran, p.totalPembelian));
      html += `<table style="margin-bottom:12px;"><tbody>
        <tr><td>Total pembelian</td><td><strong>${this.rupiah(this.sumPurchaseTotal(list))}</strong></td></tr>
        <tr><td>Total diskon</td><td>${this.rupiah(this.sumPurchaseDiskon(list))}</td></tr>
        <tr><td>Jumlah faktur</td><td>${list.length}</td></tr>
        <tr><td>Total qty retur</td><td>${this.sumPurchaseReturQty(list)}</td></tr>
      </tbody></table>`;
      html += `<p style="font-weight:bold;margin:8px 0 4px;">Per metode</p><table><tbody>
        <tr><td>Tunai</td><td>${this.rupiah(b.Tunai)}</td></tr>
        <tr><td>QRIS</td><td>${this.rupiah(b.QRIS)}</td></tr>
        <tr><td>Transfer</td><td>${this.rupiah(b.Transfer)}</td></tr>
      </tbody></table>`;
    } else if (periode === "Bulanan") {
      const byDay = new Map();
      list.forEach((p) => {
        const k = this.getPurchaseDateKey(p);
        if (!byDay.has(k)) byDay.set(k, []);
        byDay.get(k).push(p);
      });
      const days = [...byDay.keys()].filter(Boolean).sort();
      html += `<table style="margin-bottom:12px;font-size:11px;"><thead><tr>
        <th>Tgl</th><th>Total</th><th>Diskon</th><th>Tunai</th><th>QRIS</th><th>Transfer</th><th>Faktur</th><th>Retur</th>
      </tr></thead><tbody>`;
      days.forEach((day) => {
        const grp = byDay.get(day);
        const buck = this.initPaymentBucketsPurchase();
        grp.forEach((p) => this.addToPaymentBucketsPurchase(buck, p.metodePembayaran, p.totalPembelian));
        html += `<tr><td>${day}</td><td>${this.rupiah(this.sumPurchaseTotal(grp))}</td><td>${this.rupiah(this.sumPurchaseDiskon(grp))}</td>
          <td>${this.rupiah(buck.Tunai)}</td><td>${this.rupiah(buck.QRIS)}</td><td>${this.rupiah(buck.Transfer)}</td><td>${grp.length}</td><td>${this.sumPurchaseReturQty(grp)}</td></tr>`;
      });
      const gb = this.initPaymentBucketsPurchase();
      list.forEach((p) => this.addToPaymentBucketsPurchase(gb, p.metodePembayaran, p.totalPembelian));
      html += `<tr style="font-weight:bold;background:#f3f4f6;"><td>GRAND TOTAL</td><td>${this.rupiah(this.sumPurchaseTotal(list))}</td><td>${this.rupiah(this.sumPurchaseDiskon(list))}</td>
        <td>${this.rupiah(gb.Tunai)}</td><td>${this.rupiah(gb.QRIS)}</td><td>${this.rupiah(gb.Transfer)}</td><td>${list.length}</td><td>${this.sumPurchaseReturQty(list)}</td></tr>`;
      html += `</tbody></table>`;
    } else {
      const byMonth = new Map();
      list.forEach((p) => {
        const k = this.getPurchaseMonthKey(p);
        if (!k) return;
        if (!byMonth.has(k)) byMonth.set(k, []);
        byMonth.get(k).push(p);
      });
      const months = [...byMonth.keys()].sort();
      html += `<table style="margin-bottom:12px;font-size:11px;"><thead><tr>
        <th>Bulan</th><th>Total</th><th>Diskon</th><th>Tunai</th><th>QRIS</th><th>Transfer</th><th>Faktur</th><th>Retur</th>
      </tr></thead><tbody>`;
      months.forEach((mkey) => {
        const grp = byMonth.get(mkey);
        const buck = this.initPaymentBucketsPurchase();
        grp.forEach((p) => this.addToPaymentBucketsPurchase(buck, p.metodePembayaran, p.totalPembelian));
        html += `<tr><td>${mkey}</td><td>${this.rupiah(this.sumPurchaseTotal(grp))}</td><td>${this.rupiah(this.sumPurchaseDiskon(grp))}</td>
          <td>${this.rupiah(buck.Tunai)}</td><td>${this.rupiah(buck.QRIS)}</td><td>${this.rupiah(buck.Transfer)}</td><td>${grp.length}</td><td>${this.sumPurchaseReturQty(grp)}</td></tr>`;
      });
      const gb = this.initPaymentBucketsPurchase();
      list.forEach((p) => this.addToPaymentBucketsPurchase(gb, p.metodePembayaran, p.totalPembelian));
      html += `<tr style="font-weight:bold;background:#f3f4f6;"><td>GRAND TOTAL</td><td>${this.rupiah(this.sumPurchaseTotal(list))}</td><td>${this.rupiah(this.sumPurchaseDiskon(list))}</td>
        <td>${this.rupiah(gb.Tunai)}</td><td>${this.rupiah(gb.QRIS)}</td><td>${this.rupiah(gb.Transfer)}</td><td>${list.length}</td><td>${this.sumPurchaseReturQty(list)}</td></tr>`;
      html += `</tbody></table>`;
    }
    return html;
  }

  exportPurchasesToExcel(purchases) {
    const rows = [];

    const nowExport = new Date();
    const dicetakTanggal = nowExport.toLocaleString("id-ID");
    const keteranganPeriode = this.getPeriodeKeterangan();
    const periodeType = this.selectedPeriode || "Harian";

    rows.push(["Dicetak pada", dicetakTanggal]);
    rows.push(["Laporan untuk", keteranganPeriode]);
    rows.push(["Cabang", this.getExportCabangLabel()]);
    rows.push([]);
    rows.push(...this.buildPurchaseExportSummaryRows(purchases));

    if (periodeType === "Harian") {
      rows.push([
        "ID",
        "No Faktur",
        "Tanggal",
        "Supplier",
        "Lokasi",
        "Metode",
        "Status",
        "Jumlah Item",
        "Diskon Pembelian",
        "Total Pembelian",
        "Qty retur (unit)"
      ]);

      (purchases || []).forEach((purchase) => {
        const id = purchase.pembelianID
          ? `B${String(purchase.pembelianID).padStart(3, "0")}`
          : "-";
        const tanggal = purchase.tanggalTerima
          ? new Date(purchase.tanggalTerima).toLocaleDateString("id-ID")
          : "-";
        const supplier = purchase.supplierName || "-";
        const lokasi = purchase.lokasi || "-";
        const status = purchase.status || "-";
        const jumlahItem = Number(purchase.jumlahItem || 0) || 0;
        const diskonPembelian = Number(purchase.diskonPembelian || 0) || 0;
        const totalPembelian = purchase.totalPembelian || 0;
        const totalQtyRetur = Number(purchase.totalQtyRetur || 0) || 0;
        const metode = purchase.metodePembayaran || "-";

        rows.push([
          id,
          purchase.noFaktur || "-",
          tanggal,
          supplier,
          lokasi,
          metode,
          status,
          jumlahItem,
          diskonPembelian,
          totalPembelian,
          totalQtyRetur
        ]);
      });
    }

    const csvContent = rows
      .map((cols) =>
        cols
          .map((v) => {
            const s = v !== null && v !== undefined ? String(v) : "";
            if (s.includes('"') || s.includes(",") || s.includes("\n")) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    link.href = url;
    link.download = `laporan-pembelian-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportPurchasesToPdf(purchases) {
    const nowExport = new Date();
    const dicetakTanggal = nowExport.toLocaleString("id-ID");
    const keteranganPeriode = this.getPeriodeKeterangan();
    const periodeType = this.selectedPeriode || "Harian";
    const cabangLabel = this.getExportCabangLabel();
    const summaryHtml = this.buildPurchasePdfSummaryHtml(purchases);

    const rows = (purchases || []).map((purchase) => {
      const id = purchase.pembelianID
        ? `B${String(purchase.pembelianID).padStart(3, "0")}`
        : "-";
      const tanggal = purchase.tanggalTerima
        ? new Date(purchase.tanggalTerima).toLocaleDateString("id-ID")
        : "-";
      const supplier = purchase.supplierName || "-";
      const lokasi = purchase.lokasi || "-";
      const status = purchase.status || "-";
      const jumlahItem = Number(purchase.jumlahItem || 0) || 0;
      const diskonPembelian = Number(purchase.diskonPembelian || 0) || 0;
      const totalPembelian = `Rp ${Number(purchase.totalPembelian || 0).toLocaleString("id-ID")}`;
      const totalQtyRetur = Number(purchase.totalQtyRetur || 0) || 0;
      const metode = purchase.metodePembayaran || "-";

      return `
        <tr>
          <td>${id}</td>
          <td>${purchase.noFaktur || "-"}</td>
          <td>${tanggal}</td>
          <td>${supplier}</td>
          <td>${lokasi}</td>
          <td>${metode}</td>
          <td>${status}</td>
          <td>${jumlahItem}</td>
          <td>${diskonPembelian ? `Rp ${diskonPembelian.toLocaleString("id-ID")}` : "Rp 0"}</td>
          <td>${totalPembelian}</td>
          <td>${totalQtyRetur}</td>
        </tr>
      `;
    });

    const detailHtml =
      periodeType === "Harian"
        ? `
        <h2 style="font-size:14px;margin:16px 0 8px;">Detail faktur</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>No Faktur</th>
              <th>Tanggal</th>
              <th>Supplier</th>
              <th>Lokasi</th>
              <th>Metode</th>
              <th>Status</th>
              <th>Jumlah Item</th>
              <th>Diskon Pembelian</th>
              <th>Total Pembelian</th>
              <th>Qty retur</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join("")}
          </tbody>
        </table>`
        : "";

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Laporan Pembelian</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; }
          h1 { font-size: 18px; margin-bottom: 12px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
          th { background-color: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Laporan Pembelian</h1>
        <p><strong>Dicetak pada:</strong> ${dicetakTanggal}</p>
        <p><strong>Laporan untuk:</strong> ${keteranganPeriode}</p>
        <p><strong>Cabang:</strong> ${cabangLabel}</p>
        ${summaryHtml}
        ${detailHtml}
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) {
      alert("Pop-up diblokir browser. Izinkan pop-up untuk export PDF.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }
}

