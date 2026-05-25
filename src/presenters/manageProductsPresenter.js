export default class ManageProductsPresenter {
  constructor(apiService) {
    this.api = apiService;
  }

  // ============ KATEGORI ============
  async getCategories() {
    return await this.api.get("/manage_categories.php");
  }

  async addCategory(data) {
    return await this.api.post("/manage_categories.php", data);
  }

  async updateCategory(data) {
    return await this.api.put("/manage_categories.php", data);
  }

  async deleteCategory(kategoriID) {
    return await this.api.delete("/manage_categories.php", { kategoriID });
  }

  // ============ PRODUK ============
  async getProducts() {
    return await this.api.get("/manage_products.php");
  }

  async addProduct(data) {
    return await this.api.post("/manage_products.php", data);
  }

  async updateProduct(data) {
    return await this.api.put("/manage_products.php", data);
  }

  async deleteProduct(produkID) {
    return await this.api.delete("/manage_products.php", { produkID });
  }

  // ============ VARIAN ============
  async getVariants() {
    return await this.api.get("/manage_variants.php");
  }

  async addVariant(data) {
    return await this.api.post("/manage_variants.php", data);
  }

  async updateVariant(data) {
    return await this.api.put("/manage_variants.php", data);
  }

  async deleteVariant(varianID) {
    return await this.api.delete("/manage_variants.php", { varianID });
  }
}