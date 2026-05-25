import { getCurrentUser } from "../../utils/authStorage.js";
import {
  applySidebarCollapsedLayout,
  isSidebarCollapsedPersisted,
  setSidebarCollapsedPersisted,
} from "../../utils/sidebarState.js";

export default class Sidebar {
  constructor() {
    this.isCollapsed = isSidebarCollapsedPersisted();
  }

  render() {
    const user = getCurrentUser();
    const role = String(user?.role || "");
    const isKaryawan = role.toLowerCase() === "karyawan" || role.toLowerCase() === "employee";

    const wrapper = document.createElement("div");
    wrapper.id = "sidebar";
    wrapper.className = "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-50 flex flex-col";
    wrapper.style.width = this.isCollapsed ? "80px" : "256px";

    const menuOwner = `
      <!-- Manajemen -->
      <div>
        <h3 class="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider sidebar-text">Manajemen</h3>
        <div class="space-y-1">
          <a href="#/manage-accounts" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Register & Akun</span>
          </a>

          <a href="#/products" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Manajemen Produk</span>
          </a>

          <a href="#/branches" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Manajemen Cabang</span>
          </a>

          <a href="#/suppliers" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Manajemen Supplier</span>
          </a>

          <a href="#/stock" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Monitoring Stok</span>
          </a>
        </div>
      </div>

      <!-- Laporan -->
      <div>
        <h3 class="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider sidebar-text">Laporan</h3>
        <div class="space-y-1">
          <a href="#/sales-report" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Laporan Penjualan</span>
          </a>

          <a href="#/purchase-report" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Laporan Pembelian</span>
          </a>
        </div>
      </div>
    `;

    const menuKaryawan = `
      <div>
        <h3 class="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider sidebar-text">Karyawan</h3>
        <div class="space-y-1">
          <a href="#/pos" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.2 6H19M7 13l.4-2M10 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Penjualan (POS)</span>
          </a>

          <a href="#/purchase-input" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h18M9 3v18m6-18v18M4 8h16M4 16h16"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Input Pembelian</span>
          </a>

          <a href="#/retur-supplier" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l-4-4m0 0l4-4m-4 4h14a6 6 0 010 12h-1"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Retur Supplier</span>
          </a>

          <a href="#/stock-check" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 014-4h8M3 7h18M5 7v10a2 2 0 002 2h6"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Pemeriksaan Stok</span>
          </a>
        </div>
      </div>
    `;

    wrapper.innerHTML = `
      <!-- Toggle Button -->
      <button id="sidebarToggle" class="absolute -right-3 top-6 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-gray-50 transition z-50">
        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>

      <div class="flex flex-col h-full overflow-y-auto">
        <!-- Header - Logo dan Nama Bersampingan -->
        <div class="p-5 border-b border-gray-200">
          <div class="flex items-center gap-3 sidebar-text">
            <div class="w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-lg font-bold text-sm sidebar-logo flex-shrink-0">
              TD
            </div>
            <div class="min-w-0">
              <h1 class="font-semibold text-gray-900 text-sm whitespace-nowrap truncate">Toko Delapan Jaya</h1>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <!-- Main Menu -->
          <div>
            <h3 class="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider sidebar-text">Utama</h3>
            <div class="space-y-1">
              <a href="#/dashboard" class="nav-item flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <svg class="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                <span class="sidebar-text whitespace-nowrap text-sm font-medium">Dashboard</span>
              </a>
            </div>
          </div>
          ${isKaryawan ? menuKaryawan : menuOwner}

        </nav>

        <!-- Logout -->
        <div class="px-3 py-4 border-t border-gray-200">
          <a href="#/logout" class="flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-150 sidebar-text">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span class="sidebar-text whitespace-nowrap text-sm font-medium">Logout</span>
          </a>
        </div>
      </div>
    `;

    if (this.isCollapsed) {
      const sidebarTexts = wrapper.querySelectorAll(".sidebar-text");
      const toggleIcon = wrapper.querySelector("#sidebarToggle svg path");
      sidebarTexts.forEach((el) => {
        el.style.display = "none";
      });
      if (toggleIcon) {
        toggleIcon.setAttribute("d", "M9 5l7 7-7 7");
      }
    }

    // Toggle + terapkan layout tersimpan setelah sibling (topbar, konten) ada di DOM
    setTimeout(() => {
      applySidebarCollapsedLayout(this.isCollapsed, true);

      const toggleBtn = wrapper.querySelector("#sidebarToggle");
      toggleBtn.addEventListener("click", () => {
        this.isCollapsed = !this.isCollapsed;
        setSidebarCollapsedPersisted(this.isCollapsed);
        applySidebarCollapsedLayout(this.isCollapsed);
      });

      // Set active menu item based on current route
      this.setActiveMenuItem(wrapper);
      
      // Update active menu on route change
      window.addEventListener("hashchange", () => {
        this.setActiveMenuItem(wrapper);
      });
    }, 100);

    return wrapper;
  }

  setActiveMenuItem(wrapper) {
    const currentRoute = window.location.hash;
    const navItems = wrapper.querySelectorAll(".nav-item");
    
    navItems.forEach(item => {
      const href = item.getAttribute("href");
      if (href === currentRoute) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
}