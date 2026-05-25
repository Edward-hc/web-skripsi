import Sidebar from "../components/sidebar.js";
import Topbar from "../components/topbar.js";

export default class ManageSuppliersPage {
  constructor(presenter) {
    this.presenter = presenter;
    this.allSuppliers = [];
    this.isEditMode = false;
  }

  async render() {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col bg-gray-50 min-h-screen";
    wrapper.appendChild(new Sidebar().render());
    wrapper.appendChild(new Topbar("Supplier", "Manajemen Supplier").render());

    const container = document.createElement("div");
    container.className = "ml-64 mt-16 p-6 transition-all duration-300";
    container.style.width = "calc(100% - 256px)";

    container.innerHTML = `
      <div class="flex justify-between items-center mb-6 gap-4">
        <div class="flex-1 max-w-md">
          <input id="searchSuppliers" type="text" placeholder="Cari supplier..." class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
        </div>
        <button id="toggleSupplierForm" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition whitespace-nowrap">Tambah Supplier</button>
      </div>

      <div id="supplierFormContainer" class="hidden bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 id="supplierFormTitle" class="text-xl font-semibold mb-4">Tambah Supplier</h3>
        <form id="supplierForm" class="space-y-4">
          <input id="supplierID" type="hidden" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nama Supplier</label>
              <input id="nama" class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">No Telepon Perusahaan</label>
              <input id="noTelepon" placeholder="021xxxxxxx / 08xxxxxxxxxx" class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" required />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
            <textarea id="alamat" rows="2" class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" required></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input id="email" type="email" class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Contact Person (No. Telepon Sales)</label>
              <input id="kontakPerson" placeholder="Nama sales / no HP sales" class="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">Simpan</button>
            <button type="button" id="cancelSupplierForm" class="bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-400 transition">Batal</button>
          </div>
        </form>
      </div>

      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-20">ID</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[180px]">Nama</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[250px]">Alamat</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-40">No Telp Perusahaan</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[180px]">Email</th>
                <th class="px-3 py-3 text-left text-sm font-semibold text-gray-700 min-w-[190px]">Contact Person (Sales)</th>
                <th class="px-3 py-3 text-center text-sm font-semibold text-gray-700 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody id="supplierTable" class="divide-y divide-gray-200"></tbody>
          </table>
        </div>
      </div>
    `;

    wrapper.appendChild(container);
    await this.renderSuppliers(container);
    this.setupEvents(container);
    return wrapper;
  }

  async renderSuppliers(container, suppliers = null) {
    const table = container.querySelector("#supplierTable");
    try {
      if (!suppliers) {
        const res = await this.presenter.getSuppliers();
        this.allSuppliers = Array.isArray(res.data) ? res.data : [];
        suppliers = this.allSuppliers;
      }

      if (!suppliers.length) {
        table.innerHTML = `<tr><td colspan="7" class="px-3 py-6 text-center text-gray-500">Belum ada data supplier</td></tr>`;
        return;
      }

      table.innerHTML = suppliers.map((s) => `
        <tr class="hover:bg-gray-50 transition">
          <td class="px-3 py-3 text-sm text-gray-900 font-medium">${s.supplierID}</td>
          <td class="px-3 py-3 text-sm text-gray-900 font-medium">${s.nama || "-"}</td>
          <td class="px-3 py-3 text-sm text-gray-600">${s.alamat || "-"}</td>
          <td class="px-3 py-3 text-sm text-gray-600">${s.noTelepon || "-"}</td>
          <td class="px-3 py-3 text-sm text-gray-600">${s.email || "-"}</td>
          <td class="px-3 py-3 text-sm text-gray-600">${s.kontakPerson || "-"}</td>
          <td class="px-3 py-3 text-center">
            <div class="flex gap-2 justify-center">
              <button class="edit-supplier bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition" data-id="${s.supplierID}">Edit</button>
              <button class="delete-supplier bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-700 transition" data-id="${s.supplierID}">Hapus</button>
            </div>
          </td>
        </tr>
      `).join("");
    } catch (err) {
      console.error(err);
      table.innerHTML = `<tr><td colspan="7" class="px-3 py-6 text-center text-red-500">Gagal memuat supplier</td></tr>`;
    }
  }

  setupEvents(container) {
    const formWrap = container.querySelector("#supplierFormContainer");
    const form = container.querySelector("#supplierForm");
    const title = container.querySelector("#supplierFormTitle");

    container.querySelector("#toggleSupplierForm").addEventListener("click", () => {
      this.isEditMode = false;
      form.reset();
      container.querySelector("#supplierID").value = "";
      title.textContent = "Tambah Supplier";
      formWrap.classList.toggle("hidden");
    });

    container.querySelector("#cancelSupplierForm").addEventListener("click", () => {
      formWrap.classList.add("hidden");
      this.isEditMode = false;
      form.reset();
      container.querySelector("#supplierID").value = "";
    });

    container.querySelector("#searchSuppliers").addEventListener("input", (e) => {
      const q = (e.target.value || "").toLowerCase().trim();
      if (!q) {
        this.renderSuppliers(container, this.allSuppliers);
        return;
      }
      const filtered = this.allSuppliers.filter((s) =>
        String(s.supplierID || "").includes(q) ||
        (s.nama || "").toLowerCase().includes(q) ||
        (s.alamat || "").toLowerCase().includes(q) ||
        (s.noTelepon || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.kontakPerson || "").toLowerCase().includes(q)
      );
      this.renderSuppliers(container, filtered);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        supplierID: parseInt(container.querySelector("#supplierID").value || 0),
        nama: form.querySelector("#nama").value.trim(),
        alamat: form.querySelector("#alamat").value.trim(),
        noTelepon: form.querySelector("#noTelepon").value.trim(),
        email: form.querySelector("#email").value.trim(),
        kontakPerson: form.querySelector("#kontakPerson").value.trim()
      };
      try {
        const res = (this.isEditMode && payload.supplierID)
          ? await this.presenter.updateSupplier(payload)
          : await this.presenter.addSupplier(payload);
        if (!res.success) {
          alert(res.message || "Gagal menyimpan supplier");
          return;
        }
        alert(this.isEditMode ? "Supplier berhasil diperbarui" : "Supplier berhasil ditambahkan");
        formWrap.classList.add("hidden");
        form.reset();
        this.isEditMode = false;
        await this.renderSuppliers(container);
      } catch (err) {
        console.error(err);
        alert("Gagal menyimpan supplier");
      }
    });

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".edit-supplier");
      if (!btn) return;
      const supplierID = parseInt(btn.dataset.id || 0);
      const data = this.allSuppliers.find((s) => Number(s.supplierID) === supplierID);
      if (!data) return;
      this.isEditMode = true;
      title.textContent = "Edit Supplier";
      container.querySelector("#supplierID").value = data.supplierID || "";
      form.querySelector("#nama").value = data.nama || "";
      form.querySelector("#alamat").value = data.alamat || "";
      form.querySelector("#noTelepon").value = data.noTelepon || "";
      form.querySelector("#email").value = data.email || "";
      form.querySelector("#kontakPerson").value = data.kontakPerson || "";
      formWrap.classList.remove("hidden");
    });

    container.addEventListener("click", async (e) => {
      const btn = e.target.closest(".delete-supplier");
      if (!btn) return;

      const supplierID = parseInt(btn.dataset.id || 0, 10);
      if (!supplierID) return;

      if (!confirm("Hapus supplier ini?")) return;

      try {
        const res = await this.presenter.deleteSupplier(supplierID);
        if (!res?.success) {
          alert(res?.message || "Gagal menghapus supplier");
          return;
        }

        alert(res?.message || "Supplier berhasil dihapus!");

        // Reload, dan kalau user sedang filter via search, tetap jaga filter-nya.
        const q = (container.querySelector("#searchSuppliers")?.value || "").toLowerCase().trim();
        if (!q) {
          await this.renderSuppliers(container);
          return;
        }

        const filtered = this.allSuppliers.filter((s) => {
          return (
            String(s.supplierID || "").includes(q) ||
            (s.nama || "").toLowerCase().includes(q) ||
            (s.alamat || "").toLowerCase().includes(q) ||
            (s.noTelepon || "").toLowerCase().includes(q) ||
            (s.email || "").toLowerCase().includes(q) ||
            (s.kontakPerson || "").toLowerCase().includes(q)
          );
        });
        await this.renderSuppliers(container, filtered);
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus supplier");
      }
    });
  }
}

