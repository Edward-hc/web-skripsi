export default class ManageAccountsPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async getAccounts() {
    return await this.api.get("/manage_accounts.php");
  }

  async addAccount(data) {
    return await this.api.post("/manage_accounts.php", data);
  }

  async updateAccount(data) {
    return await this.api.put("/manage_accounts.php", data);
  }

  async deleteAccount(userID) {
    return await this.api.delete("/manage_accounts.php", { userID });
  }

  async getBranches() {
    return await this.api.get("/manage_branches.php");
  }
}
