export default class PurchaseReportPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async getPurchaseReports(filterType = "Harian", filterValue = null) {
    const params = new URLSearchParams();
    params.append("filterType", filterType);
    if (filterValue) {
      params.append("filterValue", filterValue);
    }
    return await this.api.get(`/purchase_report.php?${params.toString()}`);
  }

  async getPurchaseInvoiceDetail(pembelianID) {
    const params = new URLSearchParams();
    params.append("pembelianID", String(pembelianID));
    return await this.api.get(`/purchase_invoice_detail.php?${params.toString()}`);
  }

  async getBranches() {
    return await this.api.get("/manage_branches.php");
  }
}

