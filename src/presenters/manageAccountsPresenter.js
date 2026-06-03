import UserModel from "../models/userModel.js";

export default class ManageAccountsPresenter {
  constructor(apiService) {
    this.api = apiService;
    this.userModel = new UserModel(apiService);
  }

  async getAccounts() {
    return await this.userModel.getAllAccounts();
  }

  async addAccount(data) {
    return await this.userModel.createAccount(data);
  }

  async updateAccount(data) {
    return await this.userModel.updateAccount(data);
  }

  async deleteAccount(userID) {
    return await this.userModel.deleteAccount(userID);
  }

  async getBranches() {
    return await this.api.get("/manage_branches.php");
  }
}
