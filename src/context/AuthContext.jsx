import { useCallback, useEffect, useMemo, useState } from "react";
import AuthContext from "./auth-context";
import {
  clearAuthSession,
  getAccessToken,
  getStoredAdmin,
  isAccessTokenUsable,
  saveAdmin,
  saveAuthSession,
} from "../utils/authStorage";


export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = getAccessToken();
    return isAccessTokenUsable(stored) ? stored : null;
  });
  const [admin, setAdminState] = useState(() => getStoredAdmin());

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setAdminState(null);
  }, []);

  const login = useCallback((accessToken, profile) => {
    if (!isAccessTokenUsable(accessToken)) {
      throw new Error("The server returned an invalid access token.");
    }
    saveAuthSession(accessToken, profile);
    setToken(accessToken);
    setAdminState(profile || null);
  }, []);

  const updateAdmin = useCallback((profile) => {
    saveAdmin(profile);
    setAdminState(profile);
  }, []);

  useEffect(() => {
    if (!token) clearAuthSession();
    const handleUnauthorized = () => logout();
    window.addEventListener("carspar:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("carspar:unauthorized", handleUnauthorized);
  }, [logout, token]);

  const value = useMemo(
    () => ({ token, admin, isAuthenticated: isAccessTokenUsable(token), login, logout, updateAdmin }),
    [admin, login, logout, token, updateAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
