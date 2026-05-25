import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";

export default class ManageBranchesPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.isEditMode = false;
    this.allBranches = []; // Store all branches for filtering
  }

  async render() {
    // Wrapper utama
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    // Sidebar
    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    // Topbar
    const topbar = new Topbar("Branch", "Manajemen Cabang");
    wrapper.appendChild(topbar.render());

    // Content Area
    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <!-- Header dengan tombol Tambah Cabang dan Search Bar -->
      <div class="flex justify-between items-center mb-6 gap-4">
        <div class="flex-1 max-w-md">
          <div class="relative">
            <input 
              type="text" 
              id="searchBranches" 
              placeholder="Cari cabang (semua field)..." 
              class="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        <button id="toggleFormBtn" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition whitespace-nowrap">
          Tambah Cabang
        </button>
      </div>

      <!-- Form (Hidden by default) -->
      <div id="formContainer" class="hidden bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 id="formTitle" class="text-xl font-semibold mb-4">Tambah Cabang</h3>
        
        <form id="branchForm" class="space-y-4">
          <input type="hidden" id="oldCabangID" />
          
          <!-- Nama Cabang -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nama Cabang</label>
            <input 
              id="namaCabang" 
              class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" 
              placeholder="Toko Pusat" 
              required 
            />
          </div>

          <!-- Alamat -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
            <textarea 
              id="alamat" 
              rows="2"
              class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" 
              placeholder="Jl. Merdeka 1" 
              required 
            ></textarea>
          </div>

          <!-- Row: No Telepon & Jam Operasional -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">No Telepon</label>
              <input 
                id="noTelepon" 
                type="tel"
                class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" 
                placeholder="08123456789" 
                required 
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Jam Operasional</label>
              <input 
                id="jamOperasional" 
                class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" 
                placeholder="08:00 - 20:00" 
              />
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              id="status" 
              class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
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
              id="cancelBtn" 
              class="bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-400 transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>

      <!-- Tabel Cabang -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
             <thead class="bg-gray-50 border-b border-gray-200">
               <tr>
                 <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-20">CabangID</th>
                 <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[180px]">Nama</th>
                 <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[280px]">Alamat</th>
                 <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-32">No Telepon</th>
                 <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-36">Jam Operasional</th>
                 <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-24">Status</th>
                 <th class="px-3 py-3 text-center text-sm font-semibold text-gray-700 w-44">Aksi</th>
               </tr>
             </thead>
            <tbody id="branchTable" class="divide-y divide-gray-200">
              <!-- Data akan diisi di sini -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    wrapper.appendChild(container);

    // Render data dan setup events
    await this.renderBranches(container);
    this.setupEvents(container);

    return wrapper;
  }

  // Render data cabang ke tabel
  async renderBranches(container, branchesToRender = null) {
    const table = container.querySelector("#branchTable");

    try {
      // Jika branchesToRender tidak diberikan, fetch dari API
      if (!branchesToRender) {
        const res = await this.presenter.getBranches();
        this.allBranches = Array.isArray(res.data) ? res.data : [];
        branchesToRender = this.allBranches;
      }

      if (branchesToRender.length === 0) {
        table.innerHTML = `
          <tr>
            <td colspan="7" class="px-3 py-6 text-center text-gray-500">
              ${this.allBranches.length === 0 ? 'Belum ada data cabang' : 'Tidak ada cabang yang sesuai dengan pencarian'}
            </td>
          </tr>
        `;
        return;
      }

      table.innerHTML = branchesToRender
        .map((branch) => `
          <tr class="hover:bg-gray-50 transition">
            <td class="px-3 py-3 text-sm text-gray-900 font-medium">${branch.cabangID}</td>
            <td class="px-3 py-3 text-sm text-gray-900 font-medium">${branch.namaCabang}</td>
            <td class="px-3 py-3 text-sm text-gray-600">${branch.alamat || "-"}</td>
            <td class="px-3 py-3 text-sm text-gray-600">${branch.noTelepon || "-"}</td>
            <td class="px-3 py-3 text-sm text-gray-600">${branch.jamOperasional || "-"}</td>
            <td class="px-3 py-3 text-sm">
              <span class="px-2 py-1 rounded-full text-xs font-medium ${
                branch.status === "Aktif" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }">
                ${branch.status}
              </span>
            </td>
            <td class="px-3 py-3">
              <div class="flex gap-1 justify-center">
                <button 
                  class="edit-btn bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition" 
                  data-id="${branch.cabangID}"
                >
                  Edit
                </button>
                <button 
                  class="toggle-status-btn bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition" 
                  data-id="${branch.cabangID}"
                  data-status="${branch.status}"
                >
                  Toggle
                </button>
              </div>
            </td>
          </tr>
        `)
        .join("");
    } catch (err) {
      console.error("Error rendering branches:", err);
      table.innerHTML = `
        <tr>
          <td colspan="7" class="px-3 py-6 text-center text-red-500">
            Gagal memuat data cabang
          </td>
        </tr>
      `;
    }
  }

  // Filter branches berdasarkan search query
  filterBranches(searchQuery) {
    if (!searchQuery.trim()) {
      return this.allBranches;
    }

    const query = searchQuery.toLowerCase();
    return this.allBranches.filter(branch => {
      return (
        branch.cabangID?.toLowerCase().includes(query) ||
        branch.namaCabang?.toLowerCase().includes(query) ||
        branch.alamat?.toLowerCase().includes(query) ||
        branch.noTelepon?.includes(query) ||
        branch.jamOperasional?.toLowerCase().includes(query) ||
        branch.status?.toLowerCase().includes(query)
      );
    });
  }

  // Setup semua event listeners
  setupEvents(container) {
    const form = container.querySelector("#branchForm");
    const formContainer = container.querySelector("#formContainer");
    const toggleFormBtn = container.querySelector("#toggleFormBtn");
    const cancelBtn = container.querySelector("#cancelBtn");
    const searchInput = container.querySelector("#searchBranches");

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value;
        const filtered = this.filterBranches(query);
        this.renderBranches(container, filtered);
      });
    }

    // Toggle form visibility
    toggleFormBtn.addEventListener("click", () => {
      this.isEditMode = false;
      form.reset();
      container.querySelector("#formTitle").textContent = "Tambah Cabang";
      container.querySelector("#oldCabangID").value = "";
      formContainer.classList.toggle("hidden");
    });

    // Cancel button
    cancelBtn.addEventListener("click", () => {
      formContainer.classList.add("hidden");
      form.reset();
      this.isEditMode = false;
      container.querySelector("#oldCabangID").value = "";
    });

    // Form submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const oldCabangID = container.querySelector("#oldCabangID").value;
      const formData = {
        namaCabang: form.querySelector("#namaCabang").value,
        alamat: form.querySelector("#alamat").value,
        noTelepon: form.querySelector("#noTelepon").value,
        jamOperasional: form.querySelector("#jamOperasional").value,
        status: form.querySelector("#status").value,
      };

      // Jika edit mode, tambahkan cabangID
      if (oldCabangID) {
        formData.cabangID = oldCabangID;
      }

      console.log("📤 Submitting branch:", formData);

      try {
        let response;
        if (this.isEditMode && oldCabangID) {
          response = await this.presenter.updateBranch(formData);
          console.log("✅ Response UPDATE:", response);
          if (response.success) {
            alert("Cabang berhasil diperbarui!");
          } else {
            alert("Gagal: " + response.message);
            return;
          }
        } else {
          response = await this.presenter.addBranch(formData);
          console.log("✅ Response ADD:", response);
          
          if (response.success) {
            alert("Cabang berhasil ditambahkan!");
          } else {
            alert("Gagal: " + response.message);
            return;
          }
        }

        form.reset();
        container.querySelector("#oldCabangID").value = "";
        formContainer.classList.add("hidden");
        await this.renderBranches(container);
      } catch (err) {
        console.error("❌ Error saving branch:", err);
        alert("Gagal menyimpan cabang. Silakan coba lagi.");
      }
    });

    // Event delegation untuk Edit & Toggle Status
    container.addEventListener("click", async (e) => {
      // Handle Edit
      if (e.target.classList.contains("edit-btn")) {
        const cabangID = e.target.dataset.id;
        await this.handleEdit(container, cabangID);
      }

      // Handle Toggle Status
      if (e.target.classList.contains("toggle-status-btn")) {
        const cabangID = e.target.dataset.id;
        const currentStatus = e.target.dataset.status;
        await this.handleToggleStatus(container, cabangID, currentStatus);
      }
    });
  }

  // Handle Edit
  async handleEdit(container, cabangID) {
    const form = container.querySelector("#branchForm");
    const formContainer = container.querySelector("#formContainer");
    
    this.isEditMode = true;

    try {
      const res = await this.presenter.getBranches();
      const branches = res.data;
      const branch = branches.find((b) => b.cabangID === cabangID);

      if (!branch) {
        alert("Cabang tidak ditemukan");
        return;
      }

      // Update form title
      container.querySelector("#formTitle").textContent = "Edit Cabang";

      // Fill form dengan data
      container.querySelector("#oldCabangID").value = branch.cabangID;
      form.querySelector("#namaCabang").value = branch.namaCabang || "";
      form.querySelector("#alamat").value = branch.alamat || "";
      form.querySelector("#noTelepon").value = branch.noTelepon || "";
      form.querySelector("#jamOperasional").value = branch.jamOperasional || "";
      form.querySelector("#status").value = branch.status || "Aktif";

      // Show form
      formContainer.classList.remove("hidden");
    } catch (err) {
      console.error("Error loading branch:", err);
      alert("Gagal memuat data cabang");
    }
  }

  // Handle Toggle Status
  async handleToggleStatus(container, cabangID, currentStatus) {
    if (!confirm(`Apakah Anda yakin ingin mengubah status cabang ini menjadi ${currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif'}?`)) {
      return;
    }

    try {
      const response = await this.presenter.toggleBranchStatus(cabangID, currentStatus);
      if (response.success) {
        alert("Status cabang berhasil diubah!");
        await this.renderBranches(container);
      } else {
        alert("Gagal: " + response.message);
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      alert("Gagal mengubah status cabang");
    }
  }
}

