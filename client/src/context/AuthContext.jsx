import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());

  useEffect(() => {
    const onUnauthorized = () => {
      setToken("");
      setTokenState("");
    };
    window.addEventListener("tm:unauthorized", onUnauthorized);
    return () => window.removeEventListener("tm:unauthorized", onUnauthorized);
  }, []);

  async function login(email, password) {
    const data = await api("/admin/login", { method: "POST", body: { email, password } });
    setToken(data.token);
    setTokenState(data.token);
    return true;
  }

  function logout() {
    setToken("");
    setTokenState("");
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
