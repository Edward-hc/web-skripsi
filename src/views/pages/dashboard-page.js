import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";
import { getCurrentUser } from "../../utils/authStorage.js";

export default class DashboardPage {
  render() {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    const topbar = new Topbar("Dashboard", "Dashboard");
    wrapper.appendChild(topbar.render());

    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    const user = getCurrentUser();

    const name = user?.fname ? `${user.fname} ${user.lname || ""}`.trim() : (user?.email || "-");
    const role = user?.role || "-";
    const isKaryawan = String(role).toLowerCase() === "karyawan" || String(role).toLowerCase() === "employee";

    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900">Selamat datang</h2>
        <p class="text-gray-600 mt-1">Akun: <span class="font-medium">${name}</span></p>
        <p class="text-gray-600">Role: <span class="font-medium">${role}</span></p>

        <div class="mt-6 flex flex-wrap gap-3">
          ${
            isKaryawan
              ? `<a href="#/pos" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">Mulai Penjualan (POS)</a>`
              : `<a href="#/sales-report" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">Lihat Laporan Penjualan</a>`
          }
          <a href="#/logout" class="bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-400 transition">Logout</a>
        </div>
      </div>
    `;

    wrapper.appendChild(container);
    return wrapper;
  }
}

