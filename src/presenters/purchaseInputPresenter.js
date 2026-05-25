export default class PurchaseInputPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async getCatalog(userID) {
    const params = new URLSearchParams();
    params.append("userID", String(userID));
    return await this.api.get(`/purchase_catalog.php?${params.toString()}`);
  }

  async submitPurchase(payload) {
    return await this.api.post("/purchase_input.php", payload);
  }
}

