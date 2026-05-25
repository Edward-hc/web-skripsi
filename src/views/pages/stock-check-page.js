import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";
import { getCurrentUser } from "../../utils/authStorage.js";

export default class StockCheckPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.allStocks = [];
    this.currentSearchQuery = "";
    this.selectedBranch = "";
    const user = getCurrentUser();
    this.defaultBranch = String(user?.namaCabang || "").trim();
  }

  async render() {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    const topbar = new Topbar("Stocks", "Pemeriksaan Stok");
    wrapper.appendChild(topbar.render());

    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <div class="mb-6">
        <div class="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div class="relative w-full md:max-w-lg">
            <input
              type="text"
              id="searchStockCheck"
              placeholder="Cari produk, varian, status, lokasi..."
              class="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <div class="w-full md:w-64">
            <select
              id="branchStockCheck"
              class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Semua Cabang</option>
            </select>
          </div>
        </div>
      </div>

      <div id="stockCheckInfo" class="mb-4 text-sm text-gray-600"></div>

      <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[240px]">Produk / Varian</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-28">Stok Layak</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-28">Stok Rusak</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[140px]">Cabang</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-28">Status</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[130px]">Update</th>
              </tr>
            </thead>
            <tbody id="stockCheckTable" class="divide-y divide-gray-200"></tbody>
          </table>
        </div>
      </div>
    `;

    wrapper.appendChild(container);
    this.setupEvents(container);
    await this.loadBranchOptions(container);
    await this.renderStocks(container);
    return wrapper;
  }

  setupEvents(container) {
    const searchInput = container.querySelector("#searchStockCheck");
    const branchSelect = container.querySelector("#branchStockCheck");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.currentSearchQuery = e.target.value || "";
        this.renderStocks(container, this.applyFilters());
      });
    }

    if (branchSelect) {
      branchSelect.addEventListener("change", (e) => {
        this.selectedBranch = e.target.value || "";
        this.renderStocks(container, this.applyFilters());
      });
    }
  }

  async loadBranchOptions(container) {
    const select = container.querySelector("#branchStockCheck");
    if (!select) return;

    try {
      const res = await this.presenter.getBranches();
      const branches = Array.isArray(res?.data) ? res.data : [];
      select.innerHTML = '<option value="">Semua Cabang</option>';
      branches
        .filter((branch) => branch.status === "Aktif")
        .forEach((branch) => {
          const option = document.createElement("option");
          option.value = branch.namaCabang;
          option.textContent = branch.namaCabang;
          select.appendChild(option);
        });

      // Auto-filter ke cabang karyawan saat pertama kali buka halaman.
      if (this.defaultBranch) {
        const defaultOption = branches.find(
          (branch) =>
            String(branch.namaCabang || "").toLowerCase() === this.defaultBranch.toLowerCase()
        );
        if (defaultOption) {
          this.selectedBranch = defaultOption.namaCabang;
          select.value = defaultOption.namaCabang;
        }
      }
    } catch (err) {
      console.error("Error loading branches:", err);
    }
  }

  getStockStatus(stock) {
    const stokMinimum = stock.stokMinimum !== null && stock.stokMinimum !== undefined
      ? parseInt(stock.stokMinimum, 10)
      : 5;
    const jumlah = parseInt(stock.jumlah, 10) || 0;

    if (jumlah === 0) {
      return { label: "Habis", className: "bg-red-100 text-red-800" };
    }
    if (jumlah <= stokMinimum) {
      return { label: "Menipis", className: "bg-yellow-100 text-yellow-800" };
    }
    return { label: "Aman", className: "bg-green-100 text-green-800" };
  }

  filterStocks(searchQuery) {
    const query = (searchQuery || "").trim().toLowerCase();
    if (!query) return this.allStocks;

    return this.allStocks.filter((stock) => {
      const status = this.getStockStatus(stock).label.toLowerCase();
      const tanggal = stock.tanggalUpdate
        ? new Date(stock.tanggalUpdate).toLocaleDateString("id-ID").toLowerCase()
        : "";

      return (
        String(stock.varianID || "").toLowerCase().includes(query) ||
        String(stock.namaVarian || "").toLowerCase().includes(query) ||
        String(stock.namaProduk || "").toLowerCase().includes(query) ||
        String(stock.lokasi || "").toLowerCase().includes(query) ||
        String(stock.jumlah || "").toLowerCase().includes(query) ||
        String(stock.jumlahRusak || "").toLowerCase().includes(query) ||
        status.includes(query) ||
        tanggal.includes(query)
      );
    });
  }

  applyFilters() {
    const searchFiltered = this.filterStocks(this.currentSearchQuery);
    if (!this.selectedBranch) return searchFiltered;
    const selected = this.selectedBranch.toLowerCase();
    return searchFiltered.filter((stock) => String(stock.lokasi || "").toLowerCase() === selected);
  }

  async renderStocks(container, stocksToRender = null) {
    const table = container.querySelector("#stockCheckTable");
    const info = container.querySelector("#stockCheckInfo");
    if (!table || !info) return;

    try {
      if (!stocksToRender) {
        const res = await this.presenter.getStocks();
        this.allStocks = Array.isArray(res?.data) ? res.data : [];
        stocksToRender = this.applyFilters();
      }

      const stocks = stocksToRender || [];
      info.textContent = `Total data: ${stocks.length} produk`;

      if (!stocks.length) {
        table.innerHTML = `
          <tr>
            <td colspan="6" class="px-3 py-8 text-center text-gray-500">
              Data stok tidak ditemukan untuk filter saat ini.
            </td>
          </tr>
        `;
        return;
      }

      table.innerHTML = stocks.map((stock) => {
        const status = this.getStockStatus(stock);
        const jumlah = parseInt(stock.jumlah, 10) || 0;
        const jumlahRusak = parseInt(stock.jumlahRusak, 10) || 0;
        const tanggalUpdate = stock.tanggalUpdate
          ? new Date(stock.tanggalUpdate).toLocaleDateString("id-ID")
          : "-";

        return `
          <tr class="hover:bg-gray-50 transition">
            <td class="px-3 py-3 text-sm text-gray-900 font-medium">
              ${stock.namaVarian || `Varian ID: ${stock.varianID || "-"}`}
            </td>
            <td class="px-3 py-3 text-sm font-semibold ${jumlah === 0 ? "text-red-600" : "text-gray-900"}">${jumlah}</td>
            <td class="px-3 py-3 text-sm text-amber-700 font-semibold">${jumlahRusak}</td>
            <td class="px-3 py-3 text-sm text-gray-600">${stock.lokasi || "-"}</td>
            <td class="px-3 py-3 text-sm">
              <span class="px-2 py-1 rounded-full text-xs font-medium ${status.className}">
                ${status.label}
              </span>
            </td>
            <td class="px-3 py-3 text-sm text-gray-600">${tanggalUpdate}</td>
          </tr>
        `;
      }).join("");
    } catch (err) {
      console.error("Error loading stock check data:", err);
      info.textContent = "Data tidak tersedia sementara.";
      table.innerHTML = `
        <tr>
          <td colspan="6" class="px-3 py-8 text-center text-red-500">
            Data tidak tersedia sementara. Periksa koneksi lalu coba lagi.
          </td>
        </tr>
      `;
    }
  }
}

