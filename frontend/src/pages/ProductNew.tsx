import React, { useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function ProductNew() {
  const nav = useNavigate();
  const [name, setName] = useState("New Tee");
  const [sku, setSku] = useState("NEW-TEE-RED-M");
  const [err, setErr] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api("/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          category: "Apparel",
          baseUnit: "pcs",
          variants: [
            { sku, options: { color: "Red", size: "M" }, price: 499, cost: 200, stockOnHand: 0, lowStockThreshold: 5 }
          ]
        })
      });
      nav("/products");
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="card">
      <h2>New Product</h2>
      {err && <div className="error">{err}</div>}
      <form onSubmit={submit}>
        <label>Name</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} />
        <label>Variant SKU</label>
        <input value={sku} onChange={(e)=>setSku(e.target.value)} />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
