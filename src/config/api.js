const DEFAULT_API_BASE_URL = "/api/v1/admin";

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
export const API_TIMEOUT_MS = 20_000;
