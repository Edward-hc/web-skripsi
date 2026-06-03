import UserModel from "../models/userModel.js";

export default class LoginPresenter {
  constructor(apiService) {
    this.userModel = new UserModel(apiService);
  }

  async handleLogin({ email, password, role }) {
    try {
      const result = await this.userModel.login({ email, password, role });

      if (result.success) {
        this.userModel.saveSession(result.data);

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
