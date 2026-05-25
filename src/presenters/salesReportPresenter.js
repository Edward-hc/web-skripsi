export default class SalesReportPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async getSalesReports(periode = null, filterValue = null) {
    const params = new URLSearchParams();
    if (periode) {
      params.append("periode", periode);
    }
    if (filterValue) {
      params.append("filterValue", filterValue);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return await this.api.get(`/sales_report.php${query}`);
  }

  async getSalesInvoiceDetail(penjualanID) {
    const params = new URLSearchParams();
    params.append("penjualanID", String(penjualanID));
    return await this.api.get(`/sales_invoice_detail.php?${params.toString()}`);
  }

  async getBranches() {
    return await this.api.get("/manage_branches.php");
  }
}

