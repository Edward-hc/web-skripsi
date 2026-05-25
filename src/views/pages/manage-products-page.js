import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";

export default class ManageProductsPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.activeTab = "kategori";
    this.allCategories = [];
    this.allProducts = [];
    this.allVariants = [];
  }

  async render() {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";

    const sidebar = new Sidebar();
    wrapper.appendChild(sidebar.render());

    // Topbar
    const topbar = new Topbar("Products", "Manajemen Produk");
    wrapper.appendChild(topbar.render());

    const container = document.createElement("div");
    container.className = "main-content transition-all duration-300 mt-16";
    container.style.marginLeft = "256px";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <div class="p-8">

        <!-- Tabs -->
        <div class="bg-white rounded-xl shadow-lg mb-6">
          <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6">
              <button 
                class="tab-btn py-4 px-2 border-b-2 font-medium text-sm transition" 
                data-tab="kategori"
              >
                Kategori
              </button>
              <button 
                class="tab-btn py-4 px-2 border-b-2 font-medium text-sm transition" 
                data-tab="produk"
              >
                Produk
              </button>
              <button 
                class="tab-btn py-4 px-2 border-b-2 font-medium text-sm transition" 
                data-tab="varian"
              >
                Varian
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <div id="tabContent"></div>
          </div>
        </div>
      </div>
    `;

    wrapper.appendChild(container);

    // Setup tabs
    this.setupTabs(container);
    await this.renderTabContent(container, "kategori");

    return wrapper;
  }

  setupTabs(container) {
    const tabs = container.querySelectorAll(".tab-btn");
    
    tabs.forEach(tab => {
      tab.addEventListener("click", async () => {
        const tabName = tab.dataset.tab;
        this.activeTab = tabName;
        
        // Update active state
        tabs.forEach(t => {
          t.classList.remove("border-blue-500", "text-blue-600");
          t.classList.add("border-transparent", "text-gray-500");
        });
        tab.classList.remove("border-transparent", "text-gray-500");
        tab.classList.add("border-blue-500", "text-blue-600");

        // Render content
        await this.renderTabContent(container, tabName);
      });
    });

    // Set initial active tab
    tabs[0].classList.add("border-blue-500", "text-blue-600");
    tabs[0].classList.remove("border-transparent", "text-gray-500");
  }

  async renderTabContent(container, tabName) {
    const content = container.querySelector("#tabContent");

    if (tabName === "kategori") {
      await this.renderKategoriTab(content);
    } else if (tabName === "produk") {
      await this.renderProdukTab(content);
    } else if (tabName === "varian") {
      await this.renderVarianTab(content);
    }
  }

  // ============ KATEGORI TAB ============
  async renderKategoriTab(content) {
    content.innerHTML = `
      <div class="space-y-6">
        <!-- Form Tambah Kategori -->
        <div class="w-full bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">Tambah Kategori</h3>
          <form id="kategoriForm" class="space-y-4">
            <input type="hidden" id="kategoriID" />
            <div class="grid grid-cols-2 gap-4">
              <input 
                id="namaKategori" 
                class="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Nama Kategori (contoh: Besi)" 
                required 
              />
              <input 
                id="deskripsiKategori" 
                class="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Deskripsi" 
              />
            </div>
            <div class="flex gap-3">
              <button type="submit" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">
                Simpan Kategori
              </button>
              <button type="button" id="cancelKategori" class="hidden bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-400 transition">
                Batal
              </button>
            </div>
          </form>
        </div>

        <!-- Search Bar Kategori -->
        <div class="max-w-md">
          <div class="relative">
            <input 
              type="text" 
              id="searchKategori" 
              placeholder="Cari kategori (semua field)..." 
              class="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <!-- Tabel Kategori -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Deskripsi</th>
                  <th class="px-6 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody id="kategoriTable" class="divide-y divide-gray-200"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadKategori(content);
    this.setupKategoriEvents(content);
  }

  async loadKategori(content, categoriesToRender = null) {
    const table = content.querySelector("#kategoriTable");
    
    try {
      // Jika categoriesToRender tidak diberikan, fetch dari API
      if (!categoriesToRender) {
        const res = await this.presenter.getCategories();
        this.allCategories = res.data || [];
        categoriesToRender = this.allCategories;
      }

      const categories = categoriesToRender;

      if (categories.length === 0) {
        table.innerHTML = `
          <tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">${this.allCategories.length === 0 ? 'Belum ada kategori' : 'Tidak ada kategori yang sesuai dengan pencarian'}</td></tr>
        `;
        return;
      }

      table.innerHTML = categories.map(cat => `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 text-sm text-gray-900">${cat.kategoriID}</td>
          <td class="px-6 py-4 text-sm font-medium text-gray-900">${cat.namaKategori}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${cat.deskripsi || "-"}</td>
          <td class="px-6 py-4 text-center">
            <div class="flex gap-2 justify-center">
              <button class="edit-kategori bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700" data-id="${cat.kategoriID}">Edit</button>
              <button class="delete-kategori bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700" data-id="${cat.kategoriID}">Hapus</button>
            </div>
          </td>
        </tr>
      `).join("");
    } catch (err) {
      console.error("Error loading categories:", err);
      table.innerHTML = `
        <tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Gagal memuat data</td></tr>
      `;
    }
  }

  filterKategori(searchQuery) {
    if (!searchQuery.trim()) {
      return this.allCategories;
    }
    const query = searchQuery.toLowerCase();
    return this.allCategories.filter(cat => {
      return (
        cat.kategoriID?.toString().includes(query) ||
        cat.namaKategori?.toLowerCase().includes(query) ||
        cat.deskripsi?.toLowerCase().includes(query)
      );
    });
  }

  setupKategoriEvents(content) {
    const form = content.querySelector("#kategoriForm");
    const cancelBtn = content.querySelector("#cancelKategori");
    const searchInput = content.querySelector("#searchKategori");

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value;
        const filtered = this.filterKategori(query);
        this.loadKategori(content, filtered);
      });
    }

    // Submit form
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = form.querySelector("#kategoriID").value;
      const data = {
        kategoriID: id,
        namaKategori: form.querySelector("#namaKategori").value,
        deskripsi: form.querySelector("#deskripsiKategori").value,
      };

      console.log("📤 Submitting category:", data);

      try {
        let response;
        if (id) {
          response = await this.presenter.updateCategory(data);
          console.log("✅ Category updated:", response);
          if (response.success) {
            alert("Kategori berhasil diperbarui!");
          } else {
            alert("Gagal: " + (response.message || "Terjadi kesalahan"));
            return;
          }
        } else {
          response = await this.presenter.addCategory(data);
          console.log("✅ Category added:", response);
          if (response.success) {
            alert("Kategori berhasil ditambahkan!");
          } else {
            alert("Gagal: " + (response.message || "Terjadi kesalahan"));
            return;
          }
        }
        
        form.reset();
        form.querySelector("#kategoriID").value = "";
        cancelBtn.classList.add("hidden");
        await this.loadKategori(content);
      } catch (err) {
        console.error("❌ Error saving category:", err);
        alert("Gagal menyimpan kategori: " + err.message);
      }
    });

    // Cancel edit
    cancelBtn.addEventListener("click", () => {
      form.reset();
      cancelBtn.classList.add("hidden");
    });

    // Edit & Delete
    content.addEventListener("click", async (e) => {
      if (e.target.classList.contains("edit-kategori")) {
        const id = e.target.dataset.id;
        const res = await this.presenter.getCategories();
        const cat = res.data.find(c => c.kategoriID == id);
        
        if (cat) {
          form.querySelector("#kategoriID").value = cat.kategoriID;
          form.querySelector("#namaKategori").value = cat.namaKategori;
          form.querySelector("#deskripsiKategori").value = cat.deskripsi || "";
          cancelBtn.classList.remove("hidden");
        }
      }

      if (e.target.classList.contains("delete-kategori")) {
        if (confirm("Hapus kategori ini? Produk terkait juga akan terhapus.")) {
          const id = e.target.dataset.id;
          try {
            await this.presenter.deleteCategory(id);
            alert("Kategori berhasil dihapus!");
            await this.loadKategori(content);
          } catch (err) {
            alert("Gagal menghapus kategori");
          }
        }
      }
    });
  }

  // ============ PRODUK TAB ============
  async renderProdukTab(content) {
    content.innerHTML = `
      <div class="space-y-6">
        <div class="w-full bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">Tambah Produk</h3>
          <form id="produkForm" class="space-y-4">
            <input type="hidden" id="produkID" />
            <div class="grid grid-cols-3 gap-4">
              <input id="namaProduk" class="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Nama Produk (contoh: Besi Hollow)" required />
              <select id="kategoriProduk" class="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                <option value="">Pilih Kategori</option>
              </select>
              <input id="deskripsiProduk" class="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Deskripsi" />
            </div>
            <div class="flex gap-3">
              <button type="submit" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800">Simpan Produk</button>
              <button type="button" id="cancelProduk" class="hidden bg-gray-300 px-6 py-2.5 rounded-lg">Batal</button>
            </div>
          </form>
        </div>

        <!-- Search Bar Produk -->
        <div class="max-w-md">
          <div class="relative">
            <input 
              type="text" 
              id="searchProduk" 
              placeholder="Cari produk (semua field)..." 
              class="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <div class="bg-white rounded-lg border">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold">ID</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Nama Produk</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Kategori</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Deskripsi</th>
                <th class="px-6 py-3 text-center text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody id="produkTable" class="divide-y"></tbody>
          </table>
        </div>
      </div>
    `;

    await this.loadKategoriDropdown(content);
    await this.loadProduk(content);
    this.setupProdukEvents(content);
  }

  async loadKategoriDropdown(content) {
    const select = content.querySelector("#kategoriProduk");
    try {
      const res = await this.presenter.getCategories();
      const categories = res.data || [];

      select.innerHTML = '<option value="">Pilih Kategori</option>' + 
        categories.map(c => `<option value="${c.kategoriID}">${c.namaKategori}</option>`).join("");
    } catch (err) {
      console.error("Error loading categories for dropdown:", err);
    }
  }

  async loadProduk(content, productsToRender = null) {
    const table = content.querySelector("#produkTable");
    
    try {
      // Jika productsToRender tidak diberikan, fetch dari API
      if (!productsToRender) {
        const res = await this.presenter.getProducts();
        this.allProducts = res.data || [];
        productsToRender = this.allProducts;
      }

      const products = productsToRender;

      if (products.length === 0) {
        table.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">${this.allProducts.length === 0 ? 'Belum ada produk' : 'Tidak ada produk yang sesuai dengan pencarian'}</td></tr>`;
        return;
      }

      table.innerHTML = products.map(p => `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 text-sm">${p.produkID}</td>
          <td class="px-6 py-4 text-sm font-medium">${p.namaProduk}</td>
          <td class="px-6 py-4 text-sm"><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">${p.namaKategori || "-"}</span></td>
          <td class="px-6 py-4 text-sm text-gray-600">${p.deskripsi || "-"}</td>
          <td class="px-6 py-4 text-center">
            <div class="flex gap-2 justify-center">
              <button class="edit-produk bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700" data-id="${p.produkID}">Edit</button>
              <button class="delete-produk bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700" data-id="${p.produkID}">Hapus</button>
            </div>
          </td>
        </tr>
      `).join("");
    } catch (err) {
      console.error("Error loading products:", err);
      table.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Gagal memuat data</td></tr>`;
    }
  }

  filterProduk(searchQuery) {
    if (!searchQuery.trim()) {
      return this.allProducts;
    }
    const query = searchQuery.toLowerCase();
    return this.allProducts.filter(prod => {
      return (
        prod.produkID?.toString().includes(query) ||
        prod.namaProduk?.toLowerCase().includes(query) ||
        prod.namaKategori?.toLowerCase().includes(query) ||
        prod.deskripsi?.toLowerCase().includes(query)
      );
    });
  }

  setupProdukEvents(content) {
    const form = content.querySelector("#produkForm");
    const cancelBtn = content.querySelector("#cancelProduk");
    const searchInput = content.querySelector("#searchProduk");

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value;
        const filtered = this.filterProduk(query);
        this.loadProduk(content, filtered);
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = form.querySelector("#produkID").value;
      const data = {
        produkID: id,
        namaProduk: form.querySelector("#namaProduk").value,
        kategoriID: form.querySelector("#kategoriProduk").value,
        deskripsi: form.querySelector("#deskripsiProduk").value,
      };

      console.log("📤 Submitting product:", data);

      try {
        let response;
        if (id) {
          response = await this.presenter.updateProduct(data);
          if (response.success) {
            alert("Produk berhasil diperbarui!");
          } else {
            alert("Gagal: " + (response.message || "Terjadi kesalahan"));
            return;
          }
        } else {
          response = await this.presenter.addProduct(data);
          if (response.success) {
            alert("Produk berhasil ditambahkan!");
          } else {
            alert("Gagal: " + (response.message || "Terjadi kesalahan"));
            return;
          }
        }
        form.reset();
        form.querySelector("#produkID").value = "";
        cancelBtn.classList.add("hidden");
        await this.loadProduk(content);
      } catch (err) {
        console.error("❌ Error saving product:", err);
        alert("Gagal menyimpan produk: " + err.message);
      }
    });

    cancelBtn.addEventListener("click", () => {
      form.reset();
      cancelBtn.classList.add("hidden");
    });

    content.addEventListener("click", async (e) => {
      if (e.target.classList.contains("edit-produk")) {
        const id = e.target.dataset.id;
        const res = await this.presenter.getProducts();
        const prod = res.data.find(p => p.produkID == id);
        
        if (prod) {
          form.querySelector("#produkID").value = prod.produkID;
          form.querySelector("#namaProduk").value = prod.namaProduk;
          form.querySelector("#kategoriProduk").value = prod.kategoriID;
          form.querySelector("#deskripsiProduk").value = prod.deskripsi || "";
          cancelBtn.classList.remove("hidden");
        }
      }

      if (e.target.classList.contains("delete-produk")) {
        if (confirm("Hapus produk ini? Varian terkait juga akan terhapus.")) {
          try {
            await this.presenter.deleteProduct(e.target.dataset.id);
            alert("Produk berhasil dihapus!");
            await this.loadProduk(content);
          } catch (err) {
            alert("Gagal menghapus produk");
          }
        }
      }
    });
  }

  // ============ VARIAN TAB ============
  async renderVarianTab(content) {
    content.innerHTML = `
      <div class="space-y-6">
        <div class="w-full bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">Tambah Varian</h3>
          <form id="varianForm" class="space-y-4">
            <input type="hidden" id="varianID" />
            <div class="grid grid-cols-2 gap-4">
              <input id="namaVarian" class="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Nama Varian (contoh: Hollow 40x40)" required />
              <select id="produkVarian" class="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                <option value="">Pilih Produk</option>
              </select>
            </div>
            <div class="grid grid-cols-5 gap-4">
              <input id="hargaJualVarian" type="number" class="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Harga Jual" required />
              <input id="hargaResellerVarian" type="number" class="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Harga Reseller" required />
              <input id="hargaModalVarian" type="number" class="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Harga Modal" required />
              <input id="stokMinVarian" type="number" class="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Stok Minimum" />
              <select id="statusVarian" class="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="Tersedia">Tersedia</option>
                <option value="Tidak Tersedia">Tidak Tersedia</option>
              </select>
            </div>
            <div class="flex gap-3">
              <button type="submit" class="bg-black text-white px-6 py-2.5 rounded-lg">Simpan Varian</button>
              <button type="button" id="cancelVarian" class="hidden bg-gray-300 px-6 py-2.5 rounded-lg">Batal</button>
            </div>
          </form>
        </div>

        <!-- Search Bar Varian -->
        <div class="max-w-md">
          <div class="relative">
            <input 
              type="text" 
              id="searchVarian" 
              placeholder="Cari varian (semua field)..." 
              class="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <div class="bg-white rounded-lg border">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold">ID</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Nama Varian</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Produk</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Harga Jual</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Harga Reseller</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Harga Modal</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Stok Min</th>
                <th class="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th class="px-6 py-3 text-center text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody id="varianTable" class="divide-y"></tbody>
          </table>
        </div>
      </div>
    `;

    await this.loadProdukDropdown(content);
    await this.loadVarian(content);
    this.setupVarianEvents(content);
  }

  async loadProdukDropdown(content) {
    const select = content.querySelector("#produkVarian");
    try {
      const res = await this.presenter.getProducts();
      const products = res.data || [];

      select.innerHTML = '<option value="">Pilih Produk</option>' + 
        products.map(p => `<option value="${p.produkID}">${p.namaProduk}</option>`).join("");
    } catch (err) {
      console.error("Error loading products for dropdown:", err);
    }
  }

  async loadVarian(content, variantsToRender = null) {
    const table = content.querySelector("#varianTable");
    
    try {
      // Jika variantsToRender tidak diberikan, fetch dari API
      if (!variantsToRender) {
        const res = await this.presenter.getVariants();
        this.allVariants = res.data || [];
        variantsToRender = this.allVariants;
      }

      const variants = variantsToRender;

      if (variants.length === 0) {
        table.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-gray-500">${this.allVariants.length === 0 ? 'Belum ada varian' : 'Tidak ada varian yang sesuai dengan pencarian'}</td></tr>`;
        return;
      }

      table.innerHTML = variants.map(v => `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 text-sm">${v.varianID}</td>
          <td class="px-6 py-4 text-sm font-medium">${v.namaVarian}</td>
          <td class="px-6 py-4 text-sm"><span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">${v.namaProduk || "-"}</span></td>
          <td class="px-6 py-4 text-sm">Rp ${Number(v.hargaJual ?? v.harga ?? 0).toLocaleString('id-ID')}</td>
          <td class="px-6 py-4 text-sm">Rp ${Number(v.hargaReseller ?? v.harga ?? 0).toLocaleString('id-ID')}</td>
          <td class="px-6 py-4 text-sm">Rp ${Number(v.hargaModal ?? v.harga ?? 0).toLocaleString('id-ID')}</td>
          <td class="px-6 py-4 text-sm">${v.stokMinimum}</td>
          <td class="px-6 py-4 text-sm">
            <span class="px-2 py-1 rounded text-xs ${v.status === 'Tersedia' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              ${v.status}
            </span>
          </td>
          <td class="px-6 py-4 text-center">
            <div class="flex gap-2 justify-center">
              <button class="edit-varian bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700" data-id="${v.varianID}">Edit</button>
              <button class="delete-varian bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700" data-id="${v.varianID}">Hapus</button>
            </div>
          </td>
        </tr>
      `).join("");
    } catch (err) {
      console.error("Error loading variants:", err);
      table.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-red-500">Gagal memuat data</td></tr>`;
    }
  }

  filterVarian(searchQuery) {
    if (!searchQuery.trim()) {
      return this.allVariants;
    }
    const query = searchQuery.toLowerCase();
    return this.allVariants.filter(varian => {
      return (
        varian.varianID?.toString().includes(query) ||
        varian.namaVarian?.toLowerCase().includes(query) ||
        varian.namaProduk?.toLowerCase().includes(query) ||
        varian.harga?.toString().includes(query) ||
        varian.hargaJual?.toString().includes(query) ||
        varian.hargaReseller?.toString().includes(query) ||
        varian.hargaModal?.toString().includes(query) ||
        varian.status?.toLowerCase().includes(query) ||
        varian.stokMinimum?.toString().includes(query)
      );
    });
  }

  setupVarianEvents(content) {
    const form = content.querySelector("#varianForm");
    const cancelBtn = content.querySelector("#cancelVarian");
    const searchInput = content.querySelector("#searchVarian");

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value;
        const filtered = this.filterVarian(query);
        this.loadVarian(content, filtered);
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = form.querySelector("#varianID").value;
      const data = {
        varianID: id,
        namaVarian: form.querySelector("#namaVarian").value,
        produkID: form.querySelector("#produkVarian").value,
        harga: form.querySelector("#hargaJualVarian").value, // compatibility
        hargaJual: form.querySelector("#hargaJualVarian").value,
        hargaReseller: form.querySelector("#hargaResellerVarian").value,
        hargaModal: form.querySelector("#hargaModalVarian").value,
        stokMinimum: form.querySelector("#stokMinVarian").value || 0,
        status: form.querySelector("#statusVarian").value,
      };

      console.log("📤 Submitting variant:", data);

      try {
        let response;
        if (id) {
          response = await this.presenter.updateVariant(data);
          if (response.success) {
            alert("Varian berhasil diperbarui!");
          } else {
            alert("Gagal: " + (response.message || "Terjadi kesalahan"));
            return;
          }
        } else {
          response = await this.presenter.addVariant(data);
          if (response.success) {
            alert("Varian berhasil ditambahkan!");
          } else {
            alert("Gagal: " + (response.message || "Terjadi kesalahan"));
            return;
          }
        }
        form.reset();
        form.querySelector("#varianID").value = "";
        cancelBtn.classList.add("hidden");
        await this.loadVarian(content);
      } catch (err) {
        console.error("❌ Error saving variant:", err);
        alert("Gagal menyimpan varian: " + err.message);
      }
    });

    cancelBtn.addEventListener("click", () => {
      form.reset();
      cancelBtn.classList.add("hidden");
    });

    content.addEventListener("click", async (e) => {
      if (e.target.classList.contains("edit-varian")) {
        const id = e.target.dataset.id;
        const res = await this.presenter.getVariants();
        const varian = res.data.find(v => v.varianID == id);
        
        if (varian) {
          form.querySelector("#varianID").value = varian.varianID;
          form.querySelector("#namaVarian").value = varian.namaVarian;
          form.querySelector("#produkVarian").value = varian.produkID;
          form.querySelector("#hargaJualVarian").value = varian.hargaJual ?? varian.harga ?? 0;
          form.querySelector("#hargaResellerVarian").value = varian.hargaReseller ?? varian.harga ?? 0;
          form.querySelector("#hargaModalVarian").value = varian.hargaModal ?? varian.harga ?? 0;
          form.querySelector("#stokMinVarian").value = varian.stokMinimum;
          form.querySelector("#statusVarian").value = varian.status;
          cancelBtn.classList.remove("hidden");
        }
      }

      if (e.target.classList.contains("delete-varian")) {
        if (confirm("Hapus varian ini?")) {
          try {
            await this.presenter.deleteVariant(e.target.dataset.id);
            alert("Varian berhasil dihapus!");
            await this.loadVarian(content);
          } catch (err) {
            alert("Gagal menghapus varian");
          }
        }
      }
    });
  }
}