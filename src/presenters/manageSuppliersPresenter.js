export default class ManageSuppliersPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  async getSuppliers() {
    return await this.api.get("/manage_suppliers.php");
  }

  async addSupplier(data) {
    return await this.api.post("/manage_suppliers.php", data);
  }

  async updateSupplier(data) {
    return await this.api.put("/manage_suppliers.php", data);
  }

  async deleteSupplier(supplierID) {
    return await this.api.delete("/manage_suppliers.php", { supplierID });
  }
}

