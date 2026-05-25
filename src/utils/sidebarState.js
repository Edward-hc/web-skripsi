const KEY = "web-skripsi.sidebarCollapsed";

export function isSidebarCollapsedPersisted() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setSidebarCollapsedPersisted(collapsed) {
  try {
    localStorage.setItem(KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function getSidebarWidthPx() {
  return isSidebarCollapsedPersisted() ? 80 : 256;
}

/**
 * Sinkronkan lebar sidebar, teks menu, ikon toggle, topbar, dan area konten utama.
 */
export function applySidebarCollapsedLayout(collapsed, withoutAnimation = false) {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  const width = collapsed ? 80 : 256;
  const sidebarTexts = sidebar.querySelectorAll(".sidebar-text");
  const toggleIcon = sidebar.querySelector("#sidebarToggle svg path");
  const mainContent = document.querySelector(".main-content");
  const compactContents = Array.from(document.querySelectorAll(".ml-64"));
  const topbar = document.getElementById("topbar");
  const animatedElements = [sidebar, mainContent, topbar, ...compactContents].filter(Boolean);

  if (withoutAnimation) {
    animatedElements.forEach((el) => {
      el.style.transition = "none";
    });
  }

  sidebar.style.width = `${width}px`;
  sidebarTexts.forEach((el) => {
    el.style.display = collapsed ? "none" : "block";
  });
  if (toggleIcon) {
    toggleIcon.setAttribute(
      "d",
      collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"
    );
  }

  if (mainContent) {
    mainContent.style.marginLeft = `${width}px`;
    mainContent.style.width = `calc(100% - ${width}px)`;
  }

  compactContents.forEach((el) => {
    el.style.marginLeft = `${width}px`;
    el.style.width = `calc(100% - ${width}px)`;
  });

  if (topbar) {
    topbar.style.marginLeft = `${width}px`;
    topbar.style.width = `calc(100% - ${width}px)`;
  }

  if (withoutAnimation) {
    requestAnimationFrame(() => {
      animatedElements.forEach((el) => {
        el.style.transition = "";
      });
    });
  }
}
