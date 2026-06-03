import {
  clearCurrentUser,
  getCurrentUser,
  setCurrentUser,
} from "../utils/authStorage.js";

/**
 * Model User — lapisan data & operasi terkait akun pengguna.
 * Memanggil REST API (via ApiService) dan mengelola representasi sesi di browser.
 *
 * Pola MVP: Presenter → UserModel → ApiService → PHP/MySQL
 */
export default class UserModel {
  constructor(apiService) {
    this.api = apiService;
  }

  // --- Autentikasi ---

  async login({ email, password, role }) {
    return await this.api.post("/login.php", { email, password, role });
  }

  async register(data) {
    return await this.api.post("/register.php", data);
  }

  // --- Sesi client (state login di browser) ---

  getSession() {
    return getCurrentUser();
  }

  saveSession(user) {
    setCurrentUser(user);
  }

  clearSession() {
    clearCurrentUser();
  }

  // --- CRUD akun (manajemen pemilik) ---

  async getAllAccounts() {
    return await this.api.get("/manage_accounts.php");
  }

  async createAccount(data) {
    return await this.api.post("/manage_accounts.php", data);
  }

  async updateAccount(data) {
    return await this.api.put("/manage_accounts.php", data);
  }

  async deleteAccount(userID) {
    return await this.api.delete("/manage_accounts.php", { userID });
  }
}
