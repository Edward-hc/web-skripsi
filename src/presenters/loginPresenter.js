import { setCurrentUser } from "../utils/authStorage.js";

export default class LoginPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async handleLogin({ email, password, role }) {
    try {
      const result = await this.api.post("/login.php", { email, password, role });

      if (result.success) {
        setCurrentUser(result.data);

        if (role === "pemilik") {
          window.location.hash = "#/manage-accounts";
        } else {
          window.location.hash = "#/pos"; // halaman POS nanti
        }
      } else {
        alert(result.message || "Login gagal");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat login");
    }
  }
}
