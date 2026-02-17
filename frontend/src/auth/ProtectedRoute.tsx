import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  if (!state.token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
