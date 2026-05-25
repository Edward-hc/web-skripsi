import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";

export default class ManageAccountsPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.isEditMode = false;
    this.allAccounts = []; // Store all accounts for filtering
    this.selectedRole = "Karyawan"; // Default: tampilkan karyawan
    this.selectedCabang = ""; // hanya untuk karyawan; empty = semua cabang
    this.allBranches = [];
  }

  async render() {
    // Wrapper utama
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    // Sidebar
    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    // Topbar
    const topbar = new Topbar("Accounts", "Register & Manajemen Akun");
    wrapper.appendChild(topbar.render());

    // Content Area
    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-8 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <!-- Header dengan Filter Role, Search Bar, dan tombol Tambah Akun -->
      <div class="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div class="flex flex-wrap items-center gap-4 flex-1">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Filter Role:</label>
            <select 
              id="roleFilter" 
              class="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
            >
              <option value="Pemilik">Pemilik</option>
              <option value="Karyawan">Karyawan</option>
            </select>
          </div>
          <div class="flex items-center gap-2" id="cabangFilterWrapper" style="display:none;">
            <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Cabang:</label>
            <select
              id="cabangFilter"
              class="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white min-w-[180px]"
            >
              <option value="">Semua Cabang</option>
            </select>
          </div>
          <div class="relative flex-1 max-w-md">
            <input 
              type="text" 
              id="searchAccounts" 
              placeholder="Cari akun (semua field)..." 
              class="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        <button id="toggleFormBtn" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition whitespace-nowrap">
          Tambah Akun
        </button>
      </div>

      <!-- Form (Hidden by default) -->
      <div id="formContainer" class="hidden bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 id="formTitle" class="text-xl font-semibold mb-4">Tambah Akun Baru</h3>
        
        <form id="accountForm" class="space-y-4">
          <input type="hidden" id="userID" />
          
          <!-- Row 1: Username & Password -->
          <div class="grid grid-cols-2 gap-4">
            <input 
              id="username" 
              class="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" 
              placeholder="Username" 
              required 
            />
            <input 
              id="password" 
              class="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" 
              placeholder="Password" 
              type="password" 
              required 
            />
          </div>

          <!-- Row 2: Nama Depan & Nama Belakang -->
          <div class="grid grid-cols-2 gap-4">
            <input 
              id="fname" 
              class="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" 
              placeholder="Nama Depan" 
              required 
            />
            <input 
              id="lname" 
              class="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" 
              placeholder="Nama Belakang" 
              required 
            />
          </div>

          <!-- Email -->
          <input 
            id="email" 
            class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" 
            placeholder="Email" 
            type="email" 
            required 
          />
          
          <!-- No Telepon -->
          <input 
            id="noTelepon" 
            class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" 
            placeholder="No Telepon" 
          />

          <!-- Role -->
          <select 
            id="role" 
            class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Pilih Role</option>
            <option value="Pemilik">Pemilik</option>
            <option value="Karyawan">Karyawan</option>
          </select>

          <!-- Field Dinamis (Jabatan/Posisi) -->
          <div id="dynamicFields"></div>

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

      <!-- Tabel Akun -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">UserID</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Username</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Telepon</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700" id="jabatanHeader" style="display: none;">Jabatan</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700" id="cabangHeader" style="display: none;">Cabang</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700" id="posisiHeader" style="display: none;">Posisi</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700" id="tanggalMasukHeader" style="display: none;">Tanggal Masuk</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700" id="shiftHeader" style="display: none;">Shift</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody id="accountTable" class="divide-y divide-gray-200">
              <!-- Data akan diisi di sini -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    wrapper.appendChild(container);

    // Render data dan setup events
    this.setupEvents(container);
    await this.renderAccounts(container);

    return wrapper;
  }

  // Render data akun ke tabel
  async renderAccounts(container, accountsToRender = null) {
    const table = container.querySelector("#accountTable");

    try {
      // Jika accountsToRender tidak diberikan, fetch dari API dan apply filter
      if (!accountsToRender) {
        const res = await this.presenter.getAccounts();
        this.allAccounts = Array.isArray(res.data) ? res.data : [];
        
        // Apply filter role jika ada
        const roleFilter = container.querySelector("#roleFilter");
        const roleValue = roleFilter ? roleFilter.value : this.selectedRole;
        const searchInput = container.querySelector("#searchAccounts");
        const searchQuery = searchInput ? searchInput.value : "";
        const cabangFilter = container.querySelector("#cabangFilter");
        const cabangValue = cabangFilter ? cabangFilter.value : this.selectedCabang;
        
        accountsToRender = this.filterAccounts(searchQuery, roleValue, cabangValue);
      }

      // Tentukan role yang sedang difilter
      const roleFilter = container.querySelector("#roleFilter");
      const selectedRole = roleFilter ? roleFilter.value : this.selectedRole;
      const isKaryawanView = selectedRole === "Karyawan";
      const isPemilikView = selectedRole === "Pemilik";
      
      // Tampilkan/sembunyikan header kolom sesuai role yang dipilih
      const jabatanHeader = container.querySelector("#jabatanHeader");
      const cabangHeader = container.querySelector("#cabangHeader");
      const posisiHeader = container.querySelector("#posisiHeader");
      const tanggalMasukHeader = container.querySelector("#tanggalMasukHeader");
      const shiftHeader = container.querySelector("#shiftHeader");
      
      if (jabatanHeader) {
        jabatanHeader.style.display = isPemilikView ? "" : "none";
      }
      if (cabangHeader) {
        cabangHeader.style.display = isKaryawanView ? "" : "none";
      }
      if (posisiHeader) {
        posisiHeader.style.display = isKaryawanView ? "" : "none";
      }
      if (tanggalMasukHeader) {
        tanggalMasukHeader.style.display = isKaryawanView ? "" : "none";
      }
      if (shiftHeader) {
        shiftHeader.style.display = isKaryawanView ? "" : "none";
      }

      if (accountsToRender.length === 0) {
        const colspan = isKaryawanView ? 12 : 8;
        table.innerHTML = `
          <tr>
            <td colspan="${colspan}" class="px-6 py-8 text-center text-gray-500">
              ${this.allAccounts.length === 0 ? 'Belum ada data akun' : 'Tidak ada akun yang sesuai dengan pencarian'}
            </td>
          </tr>
        `;
        return;
      }

      // Format tanggal untuk display
      const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      };

      // Jika tampilan karyawan, urutkan sehingga yang Tidak Aktif turun ke bawah
      let accountsForRender = accountsToRender;
      if (isKaryawanView) {
        accountsForRender = [...accountsToRender].sort((a, b) => {
          const aInactive = (a.status || "").toLowerCase() === "tidak aktif";
          const bInactive = (b.status || "").toLowerCase() === "tidak aktif";
          if (aInactive === bInactive) return 0;
          return aInactive ? 1 : -1; // aktif dulu, tidak aktif di bawah
        });
      }

      table.innerHTML = accountsForRender
        .map((acc) => {
          const isKaryawan = acc.role === "Karyawan";
          const isPemilik = acc.role === "Pemilik";

          const jabatanCell = isPemilikView
            ? `<td class="px-6 py-4 text-sm text-gray-600">${isPemilik ? (acc.jabatan_posisi || "-") : "-"}</td>`
            : "";

          const cabangCell = isKaryawanView
            ? `<td class="px-6 py-4 text-sm text-gray-600">${isKaryawan ? (acc.cabang || "-") : "-"}</td>`
            : "";

          const posisiCell = isKaryawanView
            ? `<td class="px-6 py-4 text-sm text-gray-600">${isKaryawan ? (acc.posisi || "-") : "-"}</td>`
            : "";

          const tanggalMasukCell = isKaryawanView
            ? `<td class="px-6 py-4 text-sm text-gray-600">${isKaryawan ? formatDate(acc.tanggalMasuk) : "-"}</td>`
            : "";

          const shiftCell = isKaryawanView
            ? `<td class="px-6 py-4 text-sm text-gray-600">${isKaryawan ? (acc.shift || "-") : "-"}</td>`
            : "";

          const isInactiveKaryawan = isKaryawanView && isKaryawan && (acc.status || "").toLowerCase() === "tidak aktif";
          const rowTextClass = isInactiveKaryawan ? "text-gray-400" : "text-gray-900";
          const emailTextClass = isInactiveKaryawan ? "text-gray-400" : "text-gray-600";
          const telpTextClass = isInactiveKaryawan ? "text-gray-400" : "text-gray-600";
          const roleBadgeClass = acc.role === "Pemilik"
            ? "bg-purple-100 text-purple-800"
            : (isInactiveKaryawan ? "bg-gray-200 text-gray-700" : "bg-blue-100 text-blue-800");
          
          return `
          <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 text-sm ${rowTextClass}">${acc.userID}</td>
            <td class="px-6 py-4 text-sm ${rowTextClass}">${acc.username}</td>
            <td class="px-6 py-4 text-sm ${rowTextClass}">${acc.fname} ${acc.lname}</td>
            <td class="px-6 py-4 text-sm ${emailTextClass}">${acc.email}</td>
            <td class="px-6 py-4 text-sm ${telpTextClass}">${acc.noTelepon || "-"}</td>
            <td class="px-6 py-4 text-sm">
              <span class="px-3 py-1 rounded-full text-xs font-medium ${roleBadgeClass}">
                ${acc.role}
              </span>
            </td>
            ${jabatanCell}
            ${cabangCell}
            ${posisiCell}
            ${tanggalMasukCell}
            ${shiftCell}
            <td class="px-6 py-4">
              <div class="flex gap-2 justify-center">
                <button 
                  class="edit-btn bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition" 
                  data-id="${acc.userID}"
                >
                  Edit
                </button>
                <button 
                  class="delete-btn bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition" 
                  data-id="${acc.userID}"
                >
                  Hapus
                </button>
              </div>
            </td>
          </tr>
        `;
        })
        .join("");
    } catch (err) {
      console.error("Error rendering accounts:", err);
      const roleFilter = container.querySelector("#roleFilter");
      const selectedRole = roleFilter ? roleFilter.value : this.selectedRole;
      const isKaryawanView = selectedRole === "Karyawan";
      const colspan = isKaryawanView ? 12 : 8;
      table.innerHTML = `
        <tr>
          <td colspan="${colspan}" class="px-6 py-8 text-center text-red-500">
            Gagal memuat data akun
          </td>
        </tr>
      `;
    }
  }

  // Filter accounts berdasarkan search query dan role
  filterAccounts(searchQuery, roleFilter = null, cabangFilter = "") {
    let filtered = this.allAccounts;

    // Filter berdasarkan role
    const roleToUse = roleFilter || this.selectedRole;
    if (roleToUse) {
      filtered = filtered.filter(acc => acc.role === roleToUse);
    }

    // Filter cabang (hanya berlaku untuk Karyawan)
    const cabangToUse = cabangFilter !== undefined ? cabangFilter : this.selectedCabang;
    if (roleToUse === "Karyawan" && cabangToUse) {
      const cabangNorm = cabangToUse.toLowerCase();
      filtered = filtered.filter(acc => (acc.cabang || "").toLowerCase() === cabangNorm);
    }

    // Filter berdasarkan search query - mencari di semua field
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(acc => {
        const fullName = `${acc.fname} ${acc.lname}`.toLowerCase();
        // Format tanggal untuk pencarian
        const tanggalMasukFormatted = acc.tanggalMasuk 
          ? new Date(acc.tanggalMasuk).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }).toLowerCase()
          : "";
        
        return (
          acc.userID?.toString().includes(query) ||
          acc.username?.toLowerCase().includes(query) ||
          acc.fname?.toLowerCase().includes(query) ||
          acc.lname?.toLowerCase().includes(query) ||
          fullName.includes(query) ||
          acc.email?.toLowerCase().includes(query) ||
          acc.noTelepon?.includes(query) ||
          acc.role?.toLowerCase().includes(query) ||
          acc.jabatan_posisi?.toLowerCase().includes(query) ||
          acc.posisi?.toLowerCase().includes(query) ||
          acc.shift?.toLowerCase().includes(query) ||
          acc.cabang?.toLowerCase().includes(query) ||
          acc.tanggalMasuk?.toLowerCase().includes(query) ||
          tanggalMasukFormatted.includes(query) ||
          acc.status?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }

  // Setup semua event listeners
  setupEvents(container) {
    const form = container.querySelector("#accountForm");
    const formContainer = container.querySelector("#formContainer");
    const toggleFormBtn = container.querySelector("#toggleFormBtn");
    const cancelBtn = container.querySelector("#cancelBtn");
    const searchInput = container.querySelector("#searchAccounts");
    const roleFilter = container.querySelector("#roleFilter");
    const cabangFilterWrapper = container.querySelector("#cabangFilterWrapper");
    const cabangFilter = container.querySelector("#cabangFilter");

    // Set default value untuk role filter
    if (roleFilter) {
      roleFilter.value = this.selectedRole;
    }

    const updateCabangFilterVisibility = async () => {
      const roleValue = roleFilter ? roleFilter.value : this.selectedRole;
      if (!cabangFilterWrapper) return;

      if (roleValue === "Karyawan") {
        cabangFilterWrapper.style.display = "";
        await this.loadCabangOptions(container);
      } else {
        cabangFilterWrapper.style.display = "none";
        if (cabangFilter) cabangFilter.value = "";
        this.selectedCabang = "";
      }
    };

    // Function untuk apply filter
    const applyFilters = () => {
      const searchQuery = searchInput ? searchInput.value : "";
      const roleValue = roleFilter ? roleFilter.value : "Semua";
      const cabangValue = cabangFilter ? cabangFilter.value : "";
      const filtered = this.filterAccounts(searchQuery, roleValue, cabangValue);
      this.renderAccounts(container, filtered);
    };

    // Role filter functionality
    if (roleFilter) {
      roleFilter.addEventListener("change", (e) => {
        this.selectedRole = e.target.value;
        updateCabangFilterVisibility();
        applyFilters();
      });
    }

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        applyFilters();
      });
    }

    if (cabangFilter) {
      cabangFilter.addEventListener("change", (e) => {
        this.selectedCabang = e.target.value || "";
        applyFilters();
      });
    }

    updateCabangFilterVisibility();
    const roleSelect = container.querySelector("#role");

    // Toggle form visibility
    toggleFormBtn.addEventListener("click", () => {
      this.isEditMode = false;
      form.reset();
      container.querySelector("#formTitle").textContent = "Tambah Akun Baru";
      container.querySelector("#password").required = true;
      formContainer.classList.toggle("hidden");
      this.updateDynamicFields(container, "");
    });

    // Cancel button
    cancelBtn.addEventListener("click", () => {
      formContainer.classList.add("hidden");
      form.reset();
      this.isEditMode = false;
    });

    // Role change - update dynamic fields
    roleSelect.addEventListener("change", (e) => {
      this.updateDynamicFields(container, e.target.value);
    });

    // Form submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = {
        userID: form.querySelector("#userID").value,
        username: form.querySelector("#username").value,
        password: form.querySelector("#password").value,
        fname: form.querySelector("#fname").value,
        lname: form.querySelector("#lname").value,
        email: form.querySelector("#email").value,
        noTelepon: form.querySelector("#noTelepon").value,
        role: form.querySelector("#role").value,
      };

      // Tambahkan field dinamis sesuai role
      if (formData.role === "Pemilik") {
        const jabatan = form.querySelector("#jabatan");
        if (jabatan) formData.jabatan = jabatan.value;
      } else if (formData.role === "Karyawan") {
        const cabang = form.querySelector("#cabang");
        const posisi = form.querySelector("#posisi");
        const shift = form.querySelector("#shift");
        const tanggalMasuk = form.querySelector("#tanggalMasuk");
        const status = form.querySelector("#status");
        
        if (cabang) formData.cabang = cabang.value;
        if (posisi) formData.posisi = posisi.value;
        if (shift) formData.shift = shift.value;
        if (tanggalMasuk) formData.tanggalMasuk = tanggalMasuk.value;
        if (status) formData.status = status.value;
      }

      // DEBUG: Log data yang akan dikirim
      console.log("📤 Data yang akan dikirim:", formData);

      try {
        let response;
        if (this.isEditMode) {
          response = await this.presenter.updateAccount(formData);
          console.log("✅ Response UPDATE:", response);
          alert("Akun berhasil diperbarui!");
        } else {
          response = await this.presenter.addAccount(formData);
          console.log("✅ Response ADD:", response);
          
          if (response.success) {
            alert("Akun berhasil ditambahkan!");
          } else {
            alert("Gagal: " + response.message);
          }
        }

        form.reset();
        formContainer.classList.add("hidden");
        await this.renderAccounts(container);
      } catch (err) {
        console.error("❌ Error saving account:", err);
        alert("Gagal menyimpan akun. Silakan coba lagi.");
      }
    });

    // Event delegation untuk Edit & Delete
    container.addEventListener("click", async (e) => {
      // Handle Edit
      if (e.target.classList.contains("edit-btn")) {
        const userID = e.target.dataset.id;
        await this.handleEdit(container, userID);
      }

      // Handle Delete
      if (e.target.classList.contains("delete-btn")) {
        const userID = e.target.dataset.id;
        await this.handleDelete(container, userID);
      }
    });
  }

  // Update field dinamis berdasarkan role
  updateDynamicFields(container, role) {
    const dynamicFields = container.querySelector("#dynamicFields");
    
    if (role === "Pemilik") {
      dynamicFields.innerHTML = `
        <input 
          id="jabatan" 
          class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" 
          placeholder="Jabatan (contoh: Direktur, Manager)" 
        />
      `;
    } else if (role === "Karyawan") {
      dynamicFields.innerHTML = `
        <div class="space-y-4">
          <div>
            <label class="block text-gray-700 mb-1 text-sm">Cabang</label>
            <select
              id="cabang"
              class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent bg-white"
            >
              <option value="">Pilih Cabang</option>
            </select>
          </div>
          <input 
            id="posisi" 
            class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" 
            placeholder="Posisi (contoh: Kasir, Staff Gudang)" 
          />
          <select 
            id="shift" 
            class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Pilih Shift</option>
            <option value="Pagi">Pagi</option>
            <option value="Siang">Siang</option>
            <option value="Malam">Malam</option>
          </select>
          <input 
            id="tanggalMasuk" 
            type="date" 
            class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" 
          />
          <select 
            id="status" 
            class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Pilih Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>
      `;
      this.loadCabangOptions(container, "#cabang");
    } else {
      dynamicFields.innerHTML = "";
    }
  }

  async loadCabangOptions(container, selector = "#cabangFilter") {
    const select = container.querySelector(selector);
    if (!select) return;

    try {
      const res = await this.presenter.getBranches();
      const branches = Array.isArray(res.data) ? res.data : [];
      this.allBranches = branches;

      const currentValue = select.value;
      const isFilter = selector === "#cabangFilter";
      select.innerHTML = isFilter
        ? '<option value="">Semua Cabang</option>'
        : '<option value="">Pilih Cabang</option>';

      branches
        .filter((b) => b.status === "Aktif")
        .forEach((b) => {
          const option = document.createElement("option");
          option.value = b.namaCabang;
          option.textContent = b.namaCabang;
          select.appendChild(option);
        });

      if (currentValue) {
        select.value = currentValue;
      }
    } catch (err) {
      console.error("Error loading branches:", err);
    }
  }

  // Handle Edit
  async handleEdit(container, userID) {
    const form = container.querySelector("#accountForm");
    const formContainer = container.querySelector("#formContainer");
    const passwordField = container.querySelector("#password");
    
    this.isEditMode = true;

    try {
      const res = await this.presenter.getAccounts();
      const accounts = res.data;
      const acc = accounts.find((a) => a.userID == userID);

      if (!acc) {
        alert("Akun tidak ditemukan");
        return;
      }

      // Update form title
      container.querySelector("#formTitle").textContent = "Edit Akun";

      // Fill form dengan data
      form.querySelector("#userID").value = acc.userID;
      form.querySelector("#username").value = acc.username;
      passwordField.value = "";
      passwordField.required = false;
      passwordField.placeholder = "Kosongkan jika tidak ingin mengubah password";
      form.querySelector("#fname").value = acc.fname;
      form.querySelector("#lname").value = acc.lname;
      form.querySelector("#email").value = acc.email;
      form.querySelector("#noTelepon").value = acc.noTelepon || "";
      form.querySelector("#role").value = acc.role;

      // Update dynamic fields
      this.updateDynamicFields(container, acc.role);

      // Fill dynamic fields dengan data yang ada
      setTimeout(() => {
        if (acc.role === "Pemilik" && acc.jabatan_posisi) {
          const jabatan = form.querySelector("#jabatan");
          if (jabatan) jabatan.value = acc.jabatan_posisi;
        } else if (acc.role === "Karyawan") {
          const cabang = form.querySelector("#cabang");
          const posisi = form.querySelector("#posisi");
          const shift = form.querySelector("#shift");
          const tanggalMasuk = form.querySelector("#tanggalMasuk");
          const status = form.querySelector("#status");
          
          if (cabang && acc.cabang) cabang.value = acc.cabang;
          if (posisi && acc.posisi) posisi.value = acc.posisi;
          if (shift && acc.shift) shift.value = acc.shift;
          if (tanggalMasuk && acc.tanggalMasuk) {
            // Format tanggal untuk input type="date" (YYYY-MM-DD)
            const date = new Date(acc.tanggalMasuk);
            const formattedDate = date.toISOString().split('T')[0];
            tanggalMasuk.value = formattedDate;
          }
          if (status && acc.status) status.value = acc.status;
        }
      }, 100);

      // Show form
      formContainer.classList.remove("hidden");
    } catch (err) {
      console.error("Error loading account:", err);
      alert("Gagal memuat data akun");
    }
  }

  // Handle Delete
  async handleDelete(container, userID) {
    if (!confirm("Apakah Anda yakin ingin menghapus akun ini?")) {
      return;
    }

    try {
      await this.presenter.deleteAccount(userID);
      alert("Akun berhasil dihapus!");
      await this.renderAccounts(container);
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Gagal menghapus akun");
    }
  }
}