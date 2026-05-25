function parseUser(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function getCurrentUser() {
  const fromSession = parseUser(sessionStorage.getItem("user"));
  if (fromSession) return fromSession;

  // Fallback lama agar sesi lama tetap terbaca sekali
  const fromLocal = parseUser(localStorage.getItem("user"));
  if (fromLocal) {
    sessionStorage.setItem("user", JSON.stringify(fromLocal));
    return fromLocal;
  }
  return null;
}

export function setCurrentUser(user) {
  sessionStorage.setItem("user", JSON.stringify(user));
  // Hindari bentrok antar-tab
  localStorage.removeItem("user");
}

export function clearCurrentUser() {
  sessionStorage.removeItem("user");
  localStorage.removeItem("user");
}

