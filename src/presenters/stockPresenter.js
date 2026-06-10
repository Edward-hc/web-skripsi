export default class StockPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async getStocks() {
    return await this.api.get("/manage_stock.php");
  }

  async getBranches() {
    return await this.api.get("/manage_branches.php");
  }

  async mutateStock(data) {
    return await this.api.post("/stock_mutation.php", data);
  }

  async getStockMutations() {
    return await this.api.get("/stock_mutation.php");
  }

  async generateMutationInvoice() {
    return await this.api.get("/stock_mutation.php?action=generate_invoice");
  }

  async getVariants() {
    return await this.api.get("/manage_variants.php");
  }

  async addStock(data) {
    return await this.api.post("/manage_stock.php", data);
  }

  /** Memindahkan qty dari stok layak ke barang rusak (kerusakan di toko, bukan lewat retur). */
  async moveStockToDamaged(payload) {
    return await this.api.post("/stok_move_to_rusak.php", payload);
  }

  /** Buang qty dari catatan rusak, atau kembalikan ke stok layak. action: dispose | restore */
  async manageRusakStock(payload) {
    return await this.api.post("/stok_rusak_manage.php", payload);
  }

  async getRusakDisposals(userID) {
    const q = userID ?  `?userID=${encodeURIComponent(userID)}` : "";
    return await this.api.get(`/stok_rusak_manage.php${q}`);
  }
}

