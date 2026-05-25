import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";
import { printSalesReceipt } from "../../utils/receiptPrinter.js";

export default class SalesReportPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.selectedPeriode = "Harian";
    this.selectedDate = this.getDefaultDateValue("Harian");
    this.allReports = [];
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

  rupiah(n) {
    return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
  }

  closeSalesInvoiceModal(container) {
    const modal = container.querySelector("#salesInvoiceModal");
    if (!modal) return;
    modal.classList.remove("flex", "items-center", "justify-center");
    modal.classList.add("hidden");
  }

  openSalesInvoiceModal(container, penjualanID) {
    const modal = container.querySelector("#salesInvoiceModal");
    const body = container.querySelector("#salesInvoiceBody");
    if (!modal || !body) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex", "items-center", "justify-center");
    body.innerHTML = `<p class="text-gray-500">Memuat detail...</p>`;

    this.presenter
      .getSalesInvoiceDetail(penjualanID)
      .then((res) => {
        if (!res.success) {
          body.innerHTML = `<p class="text-red-600">${res.message || "Gagal memuat detail."}</p>`;
          return;
        }
        const { header, items } = res.data || {};
        const h = header || {};
        const tanggal = h.tanggalBuat
          ? new Date(h.tanggalBuat).toLocaleDateString("id-ID")
          : h.tanggal
            ? new Date(h.tanggal).toLocaleDateString("id-ID")
            : "-";
        const rows = (items || [])
          .map((it, i) => {
            const jumlahAsli = Number(it.jumlah || 0) || 0;
            const jumlahTersisa =
              it.jumlahTersisa !== undefined && it.jumlahTersisa !== null
                ? Number(it.jumlahTersisa)
                : jumlahAsli;
            const qtyRetur = Math.max(0, jumlahAsli - jumlahTersisa);
            const qtyHtml =
              qtyRetur > 0
                ? `${jumlahTersisa}<span class="text-amber-600 font-semibold">(${qtyRetur})</span>`
                : `${jumlahTersisa}`;

            const harga = Number(it.hargaSatuan || 0) || 0;
            const subtotal =
              it.subtotalTersisa !== undefined && it.subtotalTersisa !== null
                ? Number(it.subtotalTersisa) || 0
                : Number(it.subtotal || 0) || 0;
            const diskonItem = Math.max(0, jumlahTersisa * harga - subtotal);

            return `
              <tr class="border-b border-gray-100">
                <td class="px-4 py-3 align-top">${i + 1}</td>
                <td class="px-4 py-3 align-top whitespace-nowrap">${it.varianID ?? "-"}</td>
                <td class="px-4 py-3 align-top">${it.namaVarian || "-"}${it.namaProduk ? ` <span class="text-gray-500">(${it.namaProduk})</span>` : ""}</td>
                <td class="px-4 py-3 text-right align-top whitespace-nowrap tabular-nums">${qtyHtml}</td>
                <td class="px-4 py-3 text-right align-top whitespace-nowrap">${this.rupiah(harga)}</td>
                <td class="px-4 py-3 text-right align-top whitespace-nowrap">${diskonItem > 0 ? this.rupiah(diskonItem) : "-"}</td>
                <td class="px-4 py-3 text-right font-medium align-top whitespace-nowrap">${this.rupiah(subtotal)}</td>
              </tr>
            `;
          })
          .join("");

        body.innerHTML = `
          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-base leading-relaxed">
              <div><span class="text-gray-500 text-sm">Customer</span><br /><span class="font-semibold text-gray-900">${h.namaPembeli || "-"}</span></div>
              <div><span class="text-gray-500 text-sm">Metode</span><br />${h.metodePembayaran || "-"}</div>
              <div><span class="text-gray-500 text-sm">Tanggal</span><br />${tanggal}</div>
              <div><span class="text-gray-500 text-sm">Lokasi</span><br />${h.lokasi || "-"}</div>
              <div><span class="text-gray-500 text-sm">Total (setelah retur)</span><br /><span class="font-semibold">${this.rupiah(h.totalPenjualan ?? h.totalTransaksi)}</span></div>
              <div><span class="text-gray-500 text-sm">Diskon</span><br />${this.rupiah(h.totalDiskon)}</div>
              ${
                Number(h.totalPengembalianKumulatif || 0) > 0
                  ? `<div class="sm:col-span-2"><span class="text-gray-500 text-sm">Total pengembalian (retur) kumulatif</span><br /><span class="font-semibold text-amber-800">${this.rupiah(h.totalPengembalianKumulatif)}</span> <span class="text-xs text-gray-500">(sudah mengurangi laporan)</span></div>`
                  : ""
              }
              <div class="sm:col-span-2"><span class="text-gray-500 text-sm">Catatan</span><br />${h.catatan ? `<span class="font-medium text-gray-900">${h.catatan}</span>` : `<span class="text-gray-400">—</span>`}</div>
            </div>
            <div class="border border-gray-200 rounded-lg overflow-x-auto">
              <table class="w-full min-w-[640px] text-base">
                <thead class="bg-gray-50 text-left text-gray-700">
                  <tr>
                    <th class="px-4 py-3 whitespace-nowrap">#</th>
                    <th class="px-4 py-3 whitespace-nowrap">Varian ID</th>
                    <th class="px-4 py-3 min-w-[180px]">Produk / Varian</th>
                    <th class="px-4 py-3 text-right whitespace-nowrap">Qty</th>
                    <th class="px-4 py-3 text-right whitespace-nowrap">Harga</th>
                    <th class="px-4 py-3 text-right whitespace-nowrap">Diskon</th>
                    <th class="px-4 py-3 text-right whitespace-nowrap">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${rows || `<tr><td colspan="7" class="px-4 py-6 text-center text-gray-500">Tidak ada baris item</td></tr>`}</tbody>
              </table>
            </div>
          </div>
        `;
      })
      .catch(() => {
        body.innerHTML = `<p class="text-red-600">Gagal memuat detail.</p>`;
      });
  }

  async render() {
    // Wrapper utama
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    // Sidebar
    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    // Topbar
    const topbar = new Topbar("Reports Sales", "Laporan Penjualan");
    wrapper.appendChild(topbar.render());

    // Content Area
    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div class="flex flex-wrap items-center gap-4 flex-1 min-w-[260px]">
          <label class="text-sm font-medium text-gray-700">Periode:</label>
          <select
            id="periodeFilter"
            class="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
          >
            <option value="Harian">Harian</option>
            <option value="Bulanan">Bulanan</option>
            <option value="Tahunan">Tahunan</option>
          </select>
          <div class="w-40" id="periodeDateWrapper">
            <input
              type="date"
              id="periodeDate"
              value="${this.selectedDate}"
              class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div class="min-w-[220px]">
            <select
              id="salesBranchFilter"
              class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
              title="Filter cabang"
            >
              <option value="">Semua Cabang</option>
            </select>
          </div>
          <div class="relative flex-1 min-w-[210px]">
            <input
              id="searchSales"
              type="text"
              placeholder="Cari laporan penjualan..."
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
            id="exportSalesExcel"
            class="border border-gray-300 bg-white text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition whitespace-nowrap"
          >
            Export Excel
          </button>
          <button
            id="exportSalesPdf"
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
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-24">ID</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">Periode</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[150px]">Total Penjualan</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[130px]">Total Diskon</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-24">Jumlah</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[150px]">Lokasi</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[110px]">Waktu</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-28">Aksi</th>
              </tr>
            </thead>
            <tbody id="salesReportTable" class="divide-y divide-gray-200">
              <!-- Data akan diisi di sini -->
            </tbody>
          </table>
        </div>
      </div>

      <div id="salesInvoiceModal" class="fixed inset-0 z-50 hidden p-4 sm:p-6 bg-black/50">
        <div class="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col mx-auto">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <h3 class="text-xl font-semibold text-gray-900">Detail Penjualan (Invoice)</h3>
            <button type="button" id="salesInvoiceClose" class="text-gray-500 hover:text-gray-800 text-sm font-medium">Tutup</button>
          </div>
          <div id="salesInvoiceBody" class="p-6 md:p-8 overflow-y-auto text-base text-gray-700 leading-relaxed"></div>
        </div>
      </div>
    `;

    wrapper.appendChild(container);

    // Render data dan setup events
    await this.renderSalesReports(container);
    await this.populateBranchFilter(container);
    this.setupEvents(container);

    return wrapper;
  }

  async populateBranchFilter(container) {
    const sel = container.querySelector("#salesBranchFilter");
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
    return (list || []).filter((r) => String(r.lokasi || "") === cab);
  }

  // Render data laporan penjualan ke tabel
  async renderSalesReports(container, reportsToRender = null) {
    const table = container.querySelector("#salesReportTable");

    try {
      let reports;
      if (reportsToRender) {
        reports = this.applyCabangFilter(reportsToRender);
      } else {
        const res = await this.presenter.getSalesReports(this.selectedPeriode, this.selectedDate);
        this.allReports = Array.isArray(res.data) ? res.data : [];
        reports = this.applyCabangFilter(this.allReports);
      }

      if (reports.length === 0) {
        table.innerHTML = `
          <tr>
            <td colspan="8" class="px-6 py-8 text-center text-gray-500">
              Belum ada data laporan penjualan
            </td>
          </tr>
        `;
        return;
      }

      table.innerHTML = reports
        .map((report) => {
          // Format ID (LP001, LP002, etc.)
          const reportID = report.laporanPenjualanID 
            ? `LP${String(report.laporanPenjualanID).padStart(3, '0')}`
            : '-';
          
          // Format periode (tanggal)
          const periode = report.periode || report.tanggalBuat || "-";
          
          // Format currency
          const totalPenjualan = report.totalPenjualan 
            ? `Rp ${Number(report.totalPenjualan).toLocaleString('id-ID')}`
            : "Rp 0";
          
          const totalDiskon = report.totalDiskon 
            ? `Rp ${Number(report.totalDiskon).toLocaleString('id-ID')}`
            : "Rp 0";

          const pjId = report.penjualanID || 0;
          const detailBtn = pjId
            ? `
              <div class="flex items-center justify-center gap-2">
                <button type="button" class="sales-invoice-btn border border-gray-300 bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition whitespace-nowrap" data-penjualan-id="${pjId}">Detail</button>
                <button type="button" class="sales-print-btn bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition whitespace-nowrap" data-penjualan-id="${pjId}">Cetak</button>
              </div>
            `
            : `<span class="text-gray-400 text-xs">—</span>`;

          return `
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 text-sm text-gray-900 font-medium">${reportID}</td>
              <td class="px-6 py-4 text-sm text-gray-900">${periode}</td>
              <td class="px-6 py-4 text-sm text-gray-900 font-semibold">${totalPenjualan}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${totalDiskon}</td>
              <td class="px-6 py-4 text-sm text-gray-900">${report.jumlahItem || 0}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${report.lokasi || "-"}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${report.waktu || "00:00:00"}</td>
              <td class="px-6 py-4 text-center">${detailBtn}</td>
            </tr>
          `;
        })
        .join("");
      } catch (err) {
      console.error("Error rendering sales reports:", err);
      table.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-8 text-center text-red-500">
            Gagal memuat data laporan penjualan
          </td>
        </tr>
      `;
    }
  }

  // Setup semua event listeners
  setupEvents(container) {
    const periodeFilter = container.querySelector("#periodeFilter");
    const searchInput = container.querySelector("#searchSales");
    const dateInput = container.querySelector("#periodeDate");
    const exportExcelBtn = container.querySelector("#exportSalesExcel");
    const exportPdfBtn = container.querySelector("#exportSalesPdf");
    const branchFilter = container.querySelector("#salesBranchFilter");

    const updateDateType = () => {
      if (!dateInput) return;
      if (this.selectedPeriode === "Bulanan") {
        dateInput.type = "month";
      } else if (this.selectedPeriode === "Tahunan") {
        dateInput.type = "number";
        dateInput.min = "2000";
        dateInput.step = "1";
      } else {
        dateInput.type = "date";
      }
      dateInput.value = this.selectedDate;
    };

    updateDateType();

    if (periodeFilter) {
      periodeFilter.value = this.selectedPeriode;
      periodeFilter.addEventListener("change", async (e) => {
        this.selectedPeriode = e.target.value;
        this.selectedDate = this.getDefaultDateValue(this.selectedPeriode);
        updateDateType();
        await this.renderSalesReports(container);
      });
    }

    if (dateInput) {
      dateInput.addEventListener("change", async (e) => {
        this.selectedDate = e.target.value;
        await this.renderSalesReports(container);
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const filtered = this.filterReports(e.target.value);
        this.renderSalesReports(container, filtered);
      });
    }

    if (branchFilter) {
      branchFilter.value = this.selectedCabang || "";
      branchFilter.addEventListener("change", async (e) => {
        this.selectedCabang = e.target.value || "";
        const q = searchInput ? searchInput.value || "" : "";
        const filtered = this.filterReports(q);
        await this.renderSalesReports(container, filtered);
      });
    }

    if (exportExcelBtn) {
      exportExcelBtn.addEventListener("click", () => {
        const searchQuery = searchInput ? searchInput.value || "" : "";
        const reports = this.getCurrentReportsForExport(searchQuery);
        this.exportSalesToExcel(reports);
      });
    }

    if (exportPdfBtn) {
      exportPdfBtn.addEventListener("click", () => {
        const searchQuery = searchInput ? searchInput.value || "" : "";
        const reports = this.getCurrentReportsForExport(searchQuery);
        this.exportSalesToPdf(reports);
      });
    }

    const salesInvoiceClose = container.querySelector("#salesInvoiceClose");
    const salesInvoiceModal = container.querySelector("#salesInvoiceModal");
    if (salesInvoiceClose) {
      salesInvoiceClose.addEventListener("click", () => this.closeSalesInvoiceModal(container));
    }
    if (salesInvoiceModal) {
      salesInvoiceModal.addEventListener("click", (e) => {
        if (e.target === salesInvoiceModal) this.closeSalesInvoiceModal(container);
      });
    }
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".sales-invoice-btn");
      if (!btn) return;
      const id = parseInt(btn.dataset.penjualanId || "0", 10);
      if (!id) return;
      this.openSalesInvoiceModal(container, id);
    });

    container.addEventListener("click", async (e) => {
      const btn = e.target.closest(".sales-print-btn");
      if (!btn) return;
      const id = parseInt(btn.dataset.penjualanId || "0", 10);
      if (!id) return;
      const res = await this.presenter.getSalesInvoiceDetail(id);
      if (!res.success) {
        alert(res.message || "Gagal memuat nota.");
        return;
      }
      let alamat = "";
      try {
        const br = await this.presenter.getBranches();
        const branches = Array.isArray(br?.data) ? br.data : [];
        const lokasi = res.data?.header?.lokasi || "";
        const match = branches.find((b) => String(b.namaCabang || "") === String(lokasi));
        alamat = match?.alamat || "";
      } catch {
        alamat = "";
      }
      printSalesReceipt(res.data, { alamatToko: alamat, printedAt: new Date() });
    });
  }

  filterReports(query) {
    const base = this.applyCabangFilter(this.allReports);
    if (!query.trim()) return base;
    const normalized = query.toLowerCase();
    return base.filter((report) => {
      const reportID = report.laporanPenjualanID ? `lp${String(report.laporanPenjualanID).padStart(3, "0")}` : "";
      // Format currency untuk pencarian (tanpa titik dan koma)
      const totalPenjualanStr = report.totalPenjualan ? report.totalPenjualan.toString().replace(/[.,]/g, "") : "";
      const totalDiskonStr = report.totalDiskon ? report.totalDiskon.toString().replace(/[.,]/g, "") : "";
      const jumlahItemStr = report.jumlahItem ? report.jumlahItem.toString() : "";
      
      return (
        reportID.includes(normalized) ||
        report.laporanPenjualanID?.toString().includes(normalized) ||
        (report.periode?.toLowerCase().includes(normalized)) ||
        (report.lokasi?.toLowerCase().includes(normalized)) ||
        (report.waktu?.toLowerCase().includes(normalized)) ||
        totalPenjualanStr.includes(normalized) ||
        totalDiskonStr.includes(normalized) ||
        jumlahItemStr.includes(normalized) ||
        report.totalPenjualan?.toString().includes(normalized) ||
        report.totalDiskon?.toString().includes(normalized) ||
        report.jumlahItem?.toString().includes(normalized)
      );
    });
  }

  getCurrentReportsForExport(searchQuery) {
    const q = searchQuery || "";
    return this.filterReports(q);
  }

  /** Cabang untuk header cetak/export (bukan kolom tabel). */
  getExportCabangLabel() {
    const c = (this.selectedCabang || "").trim();
    return c || "Semua cabang";
  }

  /** Tanggal transaksi (YYYY-MM-DD) untuk pengelompokan. */
  getSalesDateKey(report) {
    const raw = report.tanggalBuat || report.periode;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw).slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  getSalesMonthKey(report) {
    const raw = report.tanggalBuat || report.periode;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  initPaymentBuckets() {
    return { Tunai: 0, QRIS: 0, Transfer: 0 };
  }

  addToPaymentBuckets(buckets, metode, amount) {
    const n = Number(amount || 0) || 0;
    const m = String(metode || "")
      .trim()
      .toLowerCase();
    if (m === "tunai") buckets.Tunai += n;
    else if (m === "qris") buckets.QRIS += n;
    else if (m === "transfer") buckets.Transfer += n;
  }

  sumSalesPenjualan(list) {
    return (list || []).reduce((s, r) => s + (Number(r.totalPenjualan) || 0), 0);
  }

  sumSalesDiskon(list) {
    return (list || []).reduce((s, r) => s + (Number(r.totalDiskon) || 0), 0);
  }

  /** Baris CSV: ringkasan pembukuan + header section detail. */
  buildSalesExportSummaryRows(reports) {
    const rows = [];
    const list = reports || [];
    const periode = this.selectedPeriode || "Harian";

    rows.push(["RINGKASAN PEMBUKUAN"]);
    rows.push([]);

    if (periode === "Harian") {
      const b = this.initPaymentBuckets();
      list.forEach((r) => this.addToPaymentBuckets(b, r.metodePembayaran, r.totalPenjualan));
      rows.push(["Total penjualan", this.sumSalesPenjualan(list)]);
      rows.push(["Total diskon", this.sumSalesDiskon(list)]);
      rows.push(["Jumlah transaksi", list.length]);
      rows.push([]);
      rows.push(["Penjualan per metode"]);
      rows.push(["Tunai", b.Tunai]);
      rows.push(["QRIS", b.QRIS]);
      rows.push(["Transfer", b.Transfer]);
    } else if (periode === "Bulanan") {
      const byDay = new Map();
      list.forEach((r) => {
        const k = this.getSalesDateKey(r);
        if (!byDay.has(k)) byDay.set(k, []);
        byDay.get(k).push(r);
      });
      const days = [...byDay.keys()].filter(Boolean).sort();
      rows.push([
        "Tanggal",
        "Total penjualan",
        "Total diskon",
        "Tunai",
        "QRIS",
        "Transfer",
        "Jumlah trx"
      ]);
      days.forEach((day) => {
        const grp = byDay.get(day);
        const buck = this.initPaymentBuckets();
        grp.forEach((r) => this.addToPaymentBuckets(buck, r.metodePembayaran, r.totalPenjualan));
        rows.push([
          day,
          this.sumSalesPenjualan(grp),
          this.sumSalesDiskon(grp),
          buck.Tunai,
          buck.QRIS,
          buck.Transfer,
          grp.length
        ]);
      });
      rows.push([]);
      const gb = this.initPaymentBuckets();
      list.forEach((r) => this.addToPaymentBuckets(gb, r.metodePembayaran, r.totalPenjualan));
      rows.push([
        "GRAND TOTAL",
        this.sumSalesPenjualan(list),
        this.sumSalesDiskon(list),
        gb.Tunai,
        gb.QRIS,
        gb.Transfer,
        list.length
      ]);
    } else {
      const byMonth = new Map();
      list.forEach((r) => {
        const k = this.getSalesMonthKey(r);
        if (!k) return;
        if (!byMonth.has(k)) byMonth.set(k, []);
        byMonth.get(k).push(r);
      });
      const months = [...byMonth.keys()].sort();
      rows.push([
        "Bulan (YYYY-MM)",
        "Total penjualan",
        "Total diskon",
        "Tunai",
        "QRIS",
        "Transfer",
        "Jumlah trx"
      ]);
      months.forEach((mkey) => {
        const grp = byMonth.get(mkey);
        const buck = this.initPaymentBuckets();
        grp.forEach((r) => this.addToPaymentBuckets(buck, r.metodePembayaran, r.totalPenjualan));
        rows.push([
          mkey,
          this.sumSalesPenjualan(grp),
          this.sumSalesDiskon(grp),
          buck.Tunai,
          buck.QRIS,
          buck.Transfer,
          grp.length
        ]);
      });
      rows.push([]);
      const gb = this.initPaymentBuckets();
      list.forEach((r) => this.addToPaymentBuckets(gb, r.metodePembayaran, r.totalPenjualan));
      rows.push([
        "GRAND TOTAL",
        this.sumSalesPenjualan(list),
        this.sumSalesDiskon(list),
        gb.Tunai,
        gb.QRIS,
        gb.Transfer,
        list.length
      ]);
    }

    const periodeType = this.selectedPeriode || "Harian";
    if (periodeType === "Harian") {
      rows.push([]);
      rows.push(["DETAIL TRANSAKSI"]);
      rows.push([]);
    }
    return rows;
  }

  exportSalesToExcel(reports) {
    const rows = [];

    const nowExport = new Date();
    const dicetakTanggal = nowExport.toLocaleString("id-ID");
    const keteranganPeriode = this.getPeriodeKeterangan();
    const periodeType = this.selectedPeriode || "Harian";

    rows.push(["Dicetak pada", dicetakTanggal]);
    rows.push(["Laporan untuk", keteranganPeriode]);
    rows.push(["Cabang", this.getExportCabangLabel()]);
    rows.push([]);
    rows.push(...this.buildSalesExportSummaryRows(reports));

    if (periodeType === "Harian") {
      rows.push([
        "ID",
        "Tanggal",
        "Metode pembayaran",
        "Total Penjualan",
        "Total Diskon",
        "Jumlah Item",
        "Lokasi",
        "Waktu"
      ]);

      (reports || []).forEach((report) => {
        const reportID = report.laporanPenjualanID
          ? `LP${String(report.laporanPenjualanID).padStart(3, "0")}`
          : "-";
        const periode = report.periode || report.tanggalBuat || "-";
        const totalPenjualan = report.totalPenjualan || 0;
        const totalDiskon = report.totalDiskon || 0;
        const jumlahItem = report.jumlahItem || 0;
        const lokasi = report.lokasi || "-";
        const waktu = report.waktu || "00:00:00";
        const metode = report.metodePembayaran || "-";

        rows.push([
          reportID,
          periode,
          metode,
          totalPenjualan,
          totalDiskon,
          jumlahItem,
          lokasi,
          waktu
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
    link.download = `laporan-penjualan-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  buildSalesPdfSummaryHtml(reports) {
    const list = reports || [];
    const periode = this.selectedPeriode || "Harian";
    let html = `<h2 style="font-size:14px;margin:16px 0 8px;">Ringkasan pembukuan</h2>`;

    if (periode === "Harian") {
      const b = this.initPaymentBuckets();
      list.forEach((r) => this.addToPaymentBuckets(b, r.metodePembayaran, r.totalPenjualan));
      html += `<table style="margin-bottom:12px;"><tbody>
        <tr><td>Total penjualan</td><td><strong>${this.rupiah(this.sumSalesPenjualan(list))}</strong></td></tr>
        <tr><td>Total diskon</td><td>${this.rupiah(this.sumSalesDiskon(list))}</td></tr>
        <tr><td>Jumlah transaksi</td><td>${list.length}</td></tr>
      </tbody></table>`;
      html += `<p style="font-weight:bold;margin:8px 0 4px;">Per metode</p>
        <table><tbody>
        <tr><td>Tunai</td><td>${this.rupiah(b.Tunai)}</td></tr>
        <tr><td>QRIS</td><td>${this.rupiah(b.QRIS)}</td></tr>
        <tr><td>Transfer</td><td>${this.rupiah(b.Transfer)}</td></tr>
        </tbody></table>`;
    } else if (periode === "Bulanan") {
      const byDay = new Map();
      list.forEach((r) => {
        const k = this.getSalesDateKey(r);
        if (!byDay.has(k)) byDay.set(k, []);
        byDay.get(k).push(r);
      });
      const days = [...byDay.keys()].filter(Boolean).sort();
      html += `<table style="margin-bottom:12px;font-size:11px;"><thead><tr>
        <th>Tanggal</th><th>Total</th><th>Diskon</th><th>Tunai</th><th>QRIS</th><th>Transfer</th><th>Trx</th>
      </tr></thead><tbody>`;
      days.forEach((day) => {
        const grp = byDay.get(day);
        const buck = this.initPaymentBuckets();
        grp.forEach((r) => this.addToPaymentBuckets(buck, r.metodePembayaran, r.totalPenjualan));
        html += `<tr><td>${day}</td><td>${this.rupiah(this.sumSalesPenjualan(grp))}</td><td>${this.rupiah(this.sumSalesDiskon(grp))}</td>
          <td>${this.rupiah(buck.Tunai)}</td><td>${this.rupiah(buck.QRIS)}</td><td>${this.rupiah(buck.Transfer)}</td><td>${grp.length}</td></tr>`;
      });
      const gb = this.initPaymentBuckets();
      list.forEach((r) => this.addToPaymentBuckets(gb, r.metodePembayaran, r.totalPenjualan));
      html += `<tr style="font-weight:bold;background:#f3f4f6;"><td>GRAND TOTAL</td><td>${this.rupiah(this.sumSalesPenjualan(list))}</td><td>${this.rupiah(this.sumSalesDiskon(list))}</td>
        <td>${this.rupiah(gb.Tunai)}</td><td>${this.rupiah(gb.QRIS)}</td><td>${this.rupiah(gb.Transfer)}</td><td>${list.length}</td></tr>`;
      html += `</tbody></table>`;
    } else {
      const byMonth = new Map();
      list.forEach((r) => {
        const k = this.getSalesMonthKey(r);
        if (!k) return;
        if (!byMonth.has(k)) byMonth.set(k, []);
        byMonth.get(k).push(r);
      });
      const months = [...byMonth.keys()].sort();
      html += `<table style="margin-bottom:12px;font-size:11px;"><thead><tr>
        <th>Bulan</th><th>Total</th><th>Diskon</th><th>Tunai</th><th>QRIS</th><th>Transfer</th><th>Trx</th>
      </tr></thead><tbody>`;
      months.forEach((mkey) => {
        const grp = byMonth.get(mkey);
        const buck = this.initPaymentBuckets();
        grp.forEach((r) => this.addToPaymentBuckets(buck, r.metodePembayaran, r.totalPenjualan));
        html += `<tr><td>${mkey}</td><td>${this.rupiah(this.sumSalesPenjualan(grp))}</td><td>${this.rupiah(this.sumSalesDiskon(grp))}</td>
          <td>${this.rupiah(buck.Tunai)}</td><td>${this.rupiah(buck.QRIS)}</td><td>${this.rupiah(buck.Transfer)}</td><td>${grp.length}</td></tr>`;
      });
      const gb = this.initPaymentBuckets();
      list.forEach((r) => this.addToPaymentBuckets(gb, r.metodePembayaran, r.totalPenjualan));
      html += `<tr style="font-weight:bold;background:#f3f4f6;"><td>GRAND TOTAL</td><td>${this.rupiah(this.sumSalesPenjualan(list))}</td><td>${this.rupiah(this.sumSalesDiskon(list))}</td>
        <td>${this.rupiah(gb.Tunai)}</td><td>${this.rupiah(gb.QRIS)}</td><td>${this.rupiah(gb.Transfer)}</td><td>${list.length}</td></tr>`;
      html += `</tbody></table>`;
    }

    return html;
  }

  exportSalesToPdf(reports) {
    const nowExport = new Date();
    const dicetakTanggal = nowExport.toLocaleString("id-ID");
    const keteranganPeriode = this.getPeriodeKeterangan();
    const periodeType = this.selectedPeriode || "Harian";
    const cabangLabel = this.getExportCabangLabel();

    const rows = (reports || []).map((report) => {
      const reportID = report.laporanPenjualanID
        ? `LP${String(report.laporanPenjualanID).padStart(3, "0")}`
        : "-";
      const periode = report.periode || report.tanggalBuat || "-";
      const totalPenjualan = report.totalPenjualan
        ? `Rp ${Number(report.totalPenjualan).toLocaleString("id-ID")}`
        : "Rp 0";
      const totalDiskon = report.totalDiskon
        ? `Rp ${Number(report.totalDiskon).toLocaleString("id-ID")}`
        : "Rp 0";
      const jumlahItem = report.jumlahItem || 0;
      const lokasi = report.lokasi || "-";
      const waktu = report.waktu || "00:00:00";
      const metode = report.metodePembayaran || "-";

      return `
        <tr>
          <td>${reportID}</td>
          <td>${periode}</td>
          <td>${metode}</td>
          <td>${totalPenjualan}</td>
          <td>${totalDiskon}</td>
          <td>${jumlahItem}</td>
          <td>${lokasi}</td>
          <td>${waktu}</td>
        </tr>
      `;
    });

    const summaryHtml = this.buildSalesPdfSummaryHtml(reports);

    const detailHtml =
      periodeType === "Harian"
        ? `
        <h2 style="font-size:14px;margin:16px 0 8px;">Detail transaksi</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tanggal</th>
              <th>Metode</th>
              <th>Total Penjualan</th>
              <th>Total Diskon</th>
              <th>Jumlah Item</th>
              <th>Lokasi</th>
              <th>Waktu</th>
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
        <title>Laporan Penjualan</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; }
          h1 { font-size: 18px; margin-bottom: 12px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
          th { background-color: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Laporan Penjualan</h1>
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

