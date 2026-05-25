import { getCurrentUser } from "../../utils/authStorage.js";
import { getSidebarWidthPx } from "../../utils/sidebarState.js";

export default class Topbar {
  constructor(pageTitle, pageSubtitle = "") {
    this.pageTitle = pageTitle;
    this.pageSubtitle = pageSubtitle;
  }

  render() {
    const user = getCurrentUser() || {};
    const username = user.username || user.fname || "User";
    const role = user.role || "User";
    const initial = (username.charAt(0) || "U").toUpperCase();

    const topbar = document.createElement("div");
    topbar.id = "topbar";
    topbar.className = "fixed top-0 left-0 h-16 bg-white border-b border-gray-200 shadow-sm z-40 flex items-center justify-between px-8 transition-all duration-300";
    const w = getSidebarWidthPx();
    topbar.style.marginLeft = `${w}px`;
    topbar.style.width = `calc(100% - ${w}px)`;

    topbar.innerHTML = `
      <!-- Page Title -->
      <div class="flex-1">
        <h1 class="text-xl font-bold text-gray-900">${this.pageTitle}</h1>
        ${this.pageSubtitle ? `<p class="text-sm text-gray-600 mt-0.5">${this.pageSubtitle}</p>` : ""}
      </div>

      <!-- User Info - Kanan Atas (dari kanan ke kiri: logo profile, nama) -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
            ${initial}
          </div>
          <div class="text-left">
            <p class="text-sm font-semibold text-gray-900">${username}</p>
            <p class="text-xs text-gray-500">${role}</p>
          </div>
        </div>
      </div>
    `;

    // Update margin saat sidebar collapse
    setTimeout(() => {
      this.updateTopbarMargin(topbar);
      
      // Listen to sidebar toggle
      const toggleBtn = document.getElementById("sidebarToggle");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          setTimeout(() => this.updateTopbarMargin(topbar), 100);
        });
      }
    }, 200);

    return topbar;
  }

  updateTopbarMargin(topbar) {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      const sidebarWidth = sidebar.style.width || "256px";
      const width = parseInt(sidebarWidth);
      topbar.style.marginLeft = `${width}px`;
      topbar.style.width = `calc(100% - ${width}px)`;
    }
  }
}
