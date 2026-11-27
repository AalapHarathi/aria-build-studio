import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, WorkspaceId } from "./aria-data";

type Ctx = {
  role: Role;
  setRole: (r: Role) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  workspace: WorkspaceId;
  setWorkspace: (workspace: WorkspaceId) => void;
};
const AppCtx = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("builder");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [workspace, setWorkspace] = useState<WorkspaceId>("all");
  useEffect(() => {
    const t = localStorage.getItem("aria-theme");
    if (t === "dark" || t === "light") setTheme(t);
    const w = localStorage.getItem("aria-workspace");
    if (w === "all" || w === "claims" || w === "risk" || w === "finance") setWorkspace(w);
    const r = localStorage.getItem("aria-role");
    if (r === "builder" || r === "reviewer" || r === "operator") setRole(r);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("aria-theme", theme);
  }, [theme]);
  useEffect(() => localStorage.setItem("aria-role", role), [role]);
  useEffect(() => localStorage.setItem("aria-workspace", workspace), [workspace]);
  return (
    <AppCtx.Provider
      value={{
        role,
        setRole,
        theme,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        workspace,
        setWorkspace,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}
export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
