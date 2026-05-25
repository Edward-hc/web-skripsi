export default class RegisterPresenter {
  constructor(apiService) {
    this.apiService = apiService;
  }

  async handleRegister(form) {
    const role = form.role.value;

    const data = {
      role: role,
      username: form.username.value.trim(),
      fname: form.fname.value.trim(),
      lname: form.lname.value.trim(),
      email: form.email.value.trim(),
      noTelepon: form.noTelepon.value.trim(),
      password: form.password.value.trim(),
    };

    if (role === "pemilik") {
      data.jabatan = form.jabatan.value.trim();
    } else if (role === "karyawan") {
      data.posisi = form.posisi.value.trim();
      data.shift = form.shift.value.trim();
      data.tanggalMasuk = form.tanggalMasuk.value;
      data.status = form.status.value.trim();
    }

    try {
      const res = await this.apiService.post("/register.php", data);
      console.log("Response dari backend:", res); 

      if (res.success) {
        alert("Pendaftaran berhasil!");
        window.location.href = "#/login";
      } else {
        alert("Gagal mendaftar: " + (res.message || "Tidak diketahui"));
      }
    } catch (error) {
      console.error("Error di frontend:", error);
      alert("Terjadi kesalahan saat registrasi (frontend). Lihat console log.");
    }
  }
}
