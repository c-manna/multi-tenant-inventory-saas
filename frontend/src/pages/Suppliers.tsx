import React, { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Suppliers() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("New Supplier");
  const [err, setErr] = useState<string|null>(null);

  async function load() {
    const res = await api<any>("/suppliers");
    setItems(res.items);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    setErr(null);
    try {
      await api("/suppliers", { method: "POST", body: JSON.stringify({ name, pricing: [] }) });
      setName("New Supplier");
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div>
      <h2>Suppliers</h2>
      {err && <div className="error">{err}</div>}

      <div className="row">
        <input value={name} onChange={(e)=>setName(e.target.value)} />
        <button onClick={create}>Add</button>
      </div>

      <div className="card">
        <ul>
          {items.map(s => <li key={s._id}><b>{s.name}</b> <span className="muted">({s.pricing?.length ?? 0} pricing rows)</span></li>)}
        </ul>
      </div>
    </div>
  );
}
