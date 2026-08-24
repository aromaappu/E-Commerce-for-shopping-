import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const ConfigContext = createContext({
  storeName: "Trend Mart",
  whatsappNumber: "",
  trackingPrefix: "TM",
  ready: false
});

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    storeName: "Trend Mart",
    whatsappNumber: "",
    trackingPrefix: "TM",
    ready: false
  });

  useEffect(() => {
    api("/config")
      .then((data) => setConfig({ ...data, ready: true }))
      .catch(() => setConfig((c) => ({ ...c, ready: true })));
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export const useConfig = () => useContext(ConfigContext);
