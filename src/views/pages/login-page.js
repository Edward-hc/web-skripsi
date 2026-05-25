export default class LoginPage {
  constructor(presenter) {
    this.presenter = presenter;
  }

  render() {
    const container = document.createElement("div");
    container.className =
      "flex items-center justify-center min-h-screen bg-gray-50";

    container.innerHTML = `
      <div class="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 class="text-center text-2xl font-semibold text-gray-800">Delapan Jaya</h1>
        <p class="text-center text-gray-500 mb-6 text-sm">Masuk untuk melanjutkan</p>

        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="email">Email</label>
            <input type="email" id="email" required placeholder="email@contoh.com"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
          </div>

          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="password">Password</label>
            <input type="password" id="password" required placeholder="•••••"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
          </div>

          <div>
            <label class="block text-gray-700 mb-1 text-sm" for="role">Role</label>
            <select id="role" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm">
              <option value="pemilik">Pemilik</option>
              <option value="karyawan">Karyawan</option>
            </select>
          </div>

          <button type="submit"
            class="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">
            Login
          </button>

          <p class="text-center text-sm text-gray-600 mt-3">
            Belum punya akun?
            <a href="#/register" class="text-blue-600 hover:underline font-medium">Daftar</a>
          </p>
        </form>
      </div>
    `;

    // Event handling
    const form = container.querySelector("#loginForm");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value.trim();
      const role = form.role.value;

      this.presenter.handleLogin({ email, password, role });
    });

    return container;
  }
}
