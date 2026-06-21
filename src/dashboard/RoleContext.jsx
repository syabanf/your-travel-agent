import { createContext, useContext, useState } from "react";

const RoleCtx = createContext(null);
const read = () => { try { return localStorage.getItem("mora_role") || "admin"; } catch { return "admin"; } };

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(read);
  const setRole = (r) => {
    try { localStorage.setItem("mora_role", r); } catch { /* ignore */ }
    setRoleState(r);
  };
  return <RoleCtx.Provider value={{ role, setRole }}>{children}</RoleCtx.Provider>;
}

export const useRole = () => useContext(RoleCtx) || { role: "admin", setRole: () => {} };
