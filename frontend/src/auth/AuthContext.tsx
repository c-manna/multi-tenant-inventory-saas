import React, { createContext, useContext, useMemo, useReducer } from "react";

type Role = "OWNER"|"MANAGER"|"STAFF";
type State = {
  token: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  role: Role | null;
  name: string | null;
};

type Action =
  | { type: "LOGIN"; payload: { token: string; tenantId: string; tenantSlug: string; role: Role; name: string } }
  | { type: "LOGOUT" };

const AuthCtx = createContext<{
  state: State;
  login: (p: any) => void;
  logout: () => void;
} | null>(null);

const initial: State = {
  token: localStorage.getItem("token"),
  tenantId: localStorage.getItem("tenantId"),
  tenantSlug: localStorage.getItem("tenantSlug"),
  role: (localStorage.getItem("role") as Role) || null,
  name: localStorage.getItem("name")
};

function reducer(s: State, a: Action): State {
  if (a.type === "LOGIN") return { ...s, ...a.payload };
  if (a.type === "LOGOUT") return { token: null, tenantId: null, tenantSlug: null, role: null, name: null };
  return s;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const login = (p: any) => {
    localStorage.setItem("token", p.token);
    localStorage.setItem("tenantId", p.tenant.id);
    localStorage.setItem("tenantSlug", p.tenant.slug);
    localStorage.setItem("role", p.user.role);
    localStorage.setItem("name", p.user.name);

    dispatch({
      type: "LOGIN",
      payload: { token: p.token, tenantId: p.tenant.id, tenantSlug: p.tenant.slug, role: p.user.role, name: p.user.name }
    });
  };

  const logout = () => {
    localStorage.clear();
    dispatch({ type: "LOGOUT" });
  };

  const value = useMemo(() => ({ state, login, logout }), [state]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
}
