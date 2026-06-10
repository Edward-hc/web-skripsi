import "./style.css";
import LoginPage from "./views/pages/login-page.js";
import LoginPresenter from "./presenters/loginPresenter.js";
import RegisterPage from "./views/pages/register-page.js";
import RegisterPresenter from "./presenters/registerPresenter.js";
import ManageAccountsPage from "./views/pages/manage-accounts-page.js";
import ManageAccountsPresenter from "./presenters/manageAccountsPresenter.js";
import ManageProductsPage from "./views/pages/manage-products-page.js";
import ManageProductsPresenter from "./presenters/manageProductsPresenter.js";
import ManageBranchesPage from "./views/pages/manage-branches-page.js";
import ManageBranchesPresenter from "./presenters/manageBranchesPresenter.js";
import StockMonitoringPage from "./views/pages/stock-monitoring-page.js";
import StockPresenter from "./presenters/stockPresenter.js";
import SalesReportPage from "./views/pages/sales-report-page.js";
import SalesReportPresenter from "./presenters/salesReportPresenter.js";
import PurchaseReportPage from "./views/pages/purchase-report-page.js";
import PurchaseReportPresenter from "./presenters/purchaseReportPresenter.js";
import PosPage from "./views/pages/pos-page.js";
import PosPresenter from "./presenters/posPresenter.js";
import DashboardPage from "./views/pages/dashboard-page.js";
import PurchaseInputPage from "./views/pages/purchase-input-page.js";
import PurchaseInputPresenter from "./presenters/purchaseInputPresenter.js";
import ManageSuppliersPage from "./views/pages/manage-suppliers-page.js";
import ManageSuppliersPresenter from "./presenters/manageSuppliersPresenter.js";
import ReturSupplierPage from "./views/pages/retur-supplier-page.js";
import ReturSupplierPresenter from "./presenters/returSupplierPresenter.js";
import StockCheckPage from "./views/pages/stock-check-page.js";
import ApiService from "./utils/apiService.js";
import { clearCurrentUser, getCurrentUser } from "./utils/authStorage.js";
import { applySidebarCollapsedLayout, isSidebarCollapsedPersisted } from "./utils/sidebarState.js";
import { enableZeroReplaceBehavior } from "./utils/zeroInputBehavior.js";

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  const apiService = new ApiService("http://localhost/web-skripsi/backend/routes");

  const hasRole = (user, expectedRole) => {
    const role = String(user?.role || "").toLowerCase();
    const expected = String(expectedRole || "").toLowerCase();
    if (expected === "pemilik") return role === "pemilik" || role === "owner";
    if (expected === "karyawan") return role === "karyawan" || role === "employee";
    return role === expected;
  };

  const renderPage = async () => {
    app.innerHTML = "";
    const route = window.location.hash;
    const applySidebarLayoutIfAny = () => {
      if (document.getElementById("sidebar")) {
        applySidebarCollapsedLayout(isSidebarCollapsedPersisted(), true);
      }
    };

    switch (route) {
      case "#/register": {
        const registerPresenter = new RegisterPresenter(apiService);
        const registerPage = new RegisterPage(registerPresenter);
        app.appendChild(registerPage.render());
        break;
      }

      case "#/logout": {
        clearCurrentUser();
        window.location.hash = "#/login";
        break;
      }

      case "#/dashboard": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        const page = new DashboardPage();
        app.appendChild(page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/manage-accounts": {
        const user = getCurrentUser();
        if (!user || !hasRole(user, "pemilik")) {
          alert("Anda tidak memiliki akses ke halaman ini.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new ManageAccountsPresenter(apiService);
        const page = new ManageAccountsPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/products": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new ManageProductsPresenter(apiService);
        const page = new ManageProductsPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/branches": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new ManageBranchesPresenter(apiService);
        const page = new ManageBranchesPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/stock": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        if (!hasRole(user, "pemilik")) {
          alert("Anda tidak memiliki akses ke halaman ini.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new StockPresenter(apiService);
        const page = new StockMonitoringPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/sales-report": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new SalesReportPresenter(apiService);
        const page = new SalesReportPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/purchase-report": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new PurchaseReportPresenter(apiService);
        const page = new PurchaseReportPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/suppliers": {
        const user = getCurrentUser();
        if (!user || !hasRole(user, "pemilik")) {
          alert("Anda tidak memiliki akses ke halaman ini.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new ManageSuppliersPresenter(apiService);
        const page = new ManageSuppliersPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/pos": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        if (!hasRole(user, "karyawan")) {
          alert("Anda tidak memiliki akses ke halaman ini.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new PosPresenter(apiService);
        const page = new PosPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/purchase-input": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        if (!hasRole(user, "karyawan")) {
          alert("Anda tidak memiliki akses ke halaman ini.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new PurchaseInputPresenter(apiService);
        const page = new PurchaseInputPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/retur-supplier": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        if (!hasRole(user, "karyawan")) {
          alert("Anda tidak memiliki akses ke halaman ini.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new ReturSupplierPresenter(apiService);
        const page = new ReturSupplierPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      case "#/stock-check": {
        const user = getCurrentUser();
        if (!user) {
          alert("Silakan login terlebih dahulu.");
          window.location.hash = "#/login";
          return;
        }
        if (!hasRole(user, "karyawan")) {
          alert("Anda tidak memiliki akses ke halaman ini.");
          window.location.hash = "#/login";
          return;
        }
        const presenter = new StockPresenter(apiService);
        const page = new StockCheckPage(presenter);
        app.appendChild(await page.render());
        applySidebarLayoutIfAny();
        break;
      }

      default: {
        // Default -> login page
        const loginPresenter = new LoginPresenter(apiService);
        const loginPage = new LoginPage(loginPresenter);
        app.appendChild(loginPage.render());
        break;
      }
    }

    // Global UX: input number default 0 langsung terganti saat mengetik
    enableZeroReplaceBehavior(document);
  };

  // render awal & saat hash berubah
  window.addEventListener("hashchange", renderPage);
  renderPage();
});
