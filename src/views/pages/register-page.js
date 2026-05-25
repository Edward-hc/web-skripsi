export default class RegisterPage {
  constructor(presenter) {
    this.presenter = presenter;
  }

  render() {
    const container = document.createElement("div");
    container.className =
      "flex items-center justify-center min-h-screen bg-gray-50";

    container.innerHTML = `
      <div class="bg-white p-8 rounded-2xl shadow-md w-full max-w-lg">
        <h1 class="text-center text-2xl font-semibold text-gray-800 mb-2">Buat Akun Baru</h1>
        <p class="text-center text-gray-500 mb-6 text-sm">Silakan isi data dengan benar</p>

        <form id="registerForm" class="space-y-4">
          <!-- Role -->
          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="role">Role</label>
            <select id="role" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
              <option value="">-- Pilih Role --</option>
              <option value="pemilik">Pemilik</option>
              <option value="karyawan">Karyawan</option>
            </select>
          </div>

          <!-- User Data -->
          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="username">Username</label>
            <input type="text" id="username" required placeholder="Masukkan username"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-gray-700 mb-1 text-sm" for="fname">Nama Depan</label>
              <input type="text" id="fname" required placeholder="Nama depan"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
            </div>
            <div>
              <label class="block text-gray-700 mb-1 text-sm" for="lname">Nama Belakang</label>
              <input type="text" id="lname" required placeholder="Nama belakang"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
            </div>
          </div>

          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="email">Email</label>
            <input type="email" id="email" required placeholder="email@contoh.com"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
          </div>

          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="noTelepon">Nomor Telepon</label>
            <input type="text" id="noTelepon" placeholder="08xxxxxxxxxx"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
          </div>

          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="password">Password</label>
            <input type="password" id="password" required placeholder="Minimal 8 karakter"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
          </div>

          <!-- Role Specific Fields -->
          <div id="roleFields"></div>

          <button type="submit"
            class="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">
            Daftar
          </button>

          <p class="text-center text-sm text-gray-600 mt-3">
            Sudah punya akun?
            <a href="#/login" class="text-blue-600 hover:underline font-medium">Masuk</a>
          </p>
        </form>
      </div>
    `;

    // Role selection logic
    const roleSelect = container.querySelector("#role");
    const roleFields = container.querySelector("#roleFields");
    roleSelect.addEventListener("change", () => {
      const role = roleSelect.value;
      roleFields.innerHTML = "";

      if (role === "pemilik") {
        roleFields.innerHTML = `
          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="jabatan">Jabatan Pemilik</label>
            <input type="text" id="jabatan" required placeholder="Contoh: Pemilik Cabang"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
          </div>
        `;
      } else if (role === "karyawan") {
        roleFields.innerHTML = `
          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="posisi">Posisi</label>
            <input type="text" id="posisi" required placeholder="Contoh: Kasir"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
          </div>

          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="shift">Shift</label>
            <select id="shift" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
              <option value="pagi">Pagi</option>
              <option value="sore">Sore</option>
              <option value="malam">Malam</option>
            </select>
          </div>

          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="tanggalMasuk">Tanggal Masuk</label>
            <input type="date" id="tanggalMasuk" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
          </div>

          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="status">Status</label>
            <select id="status" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
              <option value="aktif">Aktif</option>
              <option value="tidak aktif">Tidak Aktif</option>
            </select>
          </div>
        `;
      }
    });

    // Form submission
    const form = container.querySelector("#registerForm");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.presenter.handleRegister(form);
    });

    return container;
  }
}
