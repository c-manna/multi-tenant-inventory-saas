import React, { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [slug, setSlug] = useState("alpha");
  const [email, setEmail] = useState("owner@alpha.com");
  const [password, setPassword] = useState("Password@123");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    try {
      const res = await api<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ slug, email, password })
      });

      login(res);
      navigate("/"); // ✅ redirect after login

    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="center">
      <form className="card" onSubmit={onSubmit}>
        <h2>Login</h2>
        {err && <div className="error">{err}</div>}

        <label>Tenant Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} />

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit">Sign in</button>

        <p className="muted small">
          Seed creds: alpha / owner@alpha.com / Password@123
        </p>
      </form>
    </div>
  );
}
