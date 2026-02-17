import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { socket } from "./socket/socket";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductNew from "./pages/ProductNew";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import Orders from "./pages/Orders";
import Layout from "./components/Layout";

export default function App() {
  const { state } = useAuth();

  useEffect(() => {
    if (state.token && state.tenantId) {
      socket.connect();
      socket.emit("joinTenant", state.tenantId);
    } else {
      socket.disconnect();
    }
    return () => {};
  }, [state.token, state.tenantId]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductNew />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="orders" element={<Orders />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
