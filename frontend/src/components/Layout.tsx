import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { state, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Inventory SaaS</div>
        <div className="muted small">Tenant: {state.tenantSlug}</div>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/suppliers">Suppliers</NavLink>
          <NavLink to="/purchase-orders">Purchase Orders</NavLink>
          <NavLink to="/orders">Orders</NavLink>
        </nav>
        <button className="secondary" onClick={logout}>Logout</button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
