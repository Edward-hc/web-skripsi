export default class ManageBranchesPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async getBranches() {
    return await this.api.get("/manage_branches.php");
  }

  async addBranch(data) {
    return await this.api.post("/manage_branches.php", data);
  }

  async updateBranch(data) {
    return await this.api.put("/manage_branches.php", data);
  }

  async deleteBranch(cabangID) {
    return await this.api.delete("/manage_branches.php", { cabangID });
  }

  async toggleBranchStatus(cabangID, currentStatus) {
    const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    // Untuk toggle status, kita hanya perlu mengirim cabangID dan status baru
    return await this.api.put("/manage_branches.php", {
      cabangID: cabangID,
      status: newStatus
    });
  }
}

