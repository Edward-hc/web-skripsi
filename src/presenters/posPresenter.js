export default class PosPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async getCatalog(userID) {
    const params = new URLSearchParams();
    params.append("userID", String(userID));
    return await this.api.get(`/pos_catalog.php?${params.toString()}`);
  }

  async processSale(payload) {
    return await this.api.post("/pos_sales.php", payload);
  }

  async getSalesInvoiceDetail(penjualanID) {
    const params = new URLSearchParams();
    params.append("penjualanID", String(penjualanID));
    return await this.api.get(`/sales_invoice_detail.php?${params.toString()}`);
  }

  async getBranches() {
    return await this.api.get("/manage_branches.php");
  }

  async getReturInvoices(userID) {
    return await this.api.get(`/retur_penjualan_catalog.php?userID=${encodeURIComponent(userID)}`);
  }

  async getReturInvoiceItems(penjualanID, userID) {
    const params = new URLSearchParams();
    params.append("penjualanID", String(penjualanID));
    params.append("userID", String(userID));
    return await this.api.get(`/retur_penjualan_items.php?${params.toString()}`);
  }

  async submitReturPenjualan(payload) {
    return await this.api.post("/retur_penjualan_input.php", payload);
  }
}

