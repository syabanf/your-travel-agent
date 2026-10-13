import { createContext, useContext, useState } from "react";
import { readStaffSession } from "@/lib/staffAuth";

const RoleCtx = createContext(null);
const PREVIEW_KEY = "ich_role";
const readPreview = () => { try { return localStorage.getItem(PREVIEW_KEY); } catch { return null; } };

/**
 * The dashboard role comes from the signed-in staff account. An administrator
 * may preview the dashboard as a lower role; nobody else can change theirs.
 */
export function RoleProvider({ children }) {
  const staff = readStaffSession();
  const isAdmin = staff?.role === "admin";
  const [preview, setPreview] = useState(() => (isAdmin ? readPreview() : null));
  const setRole = (r) => {
    if (!isAdmin) return;
    try { localStorage.setItem(PREVIEW_KEY, r); } catch { /* ignore */ }
    setPreview(r);
  };
  const role = isAdmin ? preview || "admin" : staff?.role || "viewer";
  return <RoleCtx.Provider value={{ role, setRole, staff, canPreview: isAdmin }}>{children}</RoleCtx.Provider>;
}

export const useRole = () => useContext(RoleCtx) || { role: "viewer", setRole: () => {}, staff: null, canPreview: false };
