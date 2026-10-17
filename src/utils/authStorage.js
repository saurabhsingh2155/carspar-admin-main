const TOKEN_KEY = "carspar_admin_token";
const ADMIN_KEY = "carspar_admin_profile";

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = decodeURIComponent(
      window
        .atob(normalized)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function isAccessTokenUsable(token = getAccessToken()) {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  return !payload.exp || payload.exp * 1000 > Date.now() + 5_000;
}

export function getStoredAdmin() {
  try {
    return JSON.parse(sessionStorage.getItem(ADMIN_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveAuthSession(token, admin) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin || null));
}

export function saveAdmin(admin) {
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin || null));
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("admin");
}
