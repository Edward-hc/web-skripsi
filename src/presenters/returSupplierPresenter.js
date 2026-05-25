export default class ReturSupplierPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async getInvoices(userID) {
    return await this.api.get(`/retur_supplier_catalog.php?userID=${encodeURIComponent(userID)}`);
  }

  async getInvoiceItems(pembelianID, userID) {
    const params = new URLSearchParams();
    params.append("pembelianID", String(pembelianID));
    params.append("userID", String(userID));
    return await this.api.get(`/retur_supplier_items.php?${params.toString()}`);
  }

  async submitRetur(payload) {
    return await this.api.post("/retur_supplier_input.php", payload);
  }
}

