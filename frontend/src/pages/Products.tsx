import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Link } from "react-router-dom";
import { socket } from "../socket/socket";

export default function Products() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string|null>(null);

  async function load() {
    setErr(null);
    try {
      const res = await api<any>(`/products?q=${encodeURIComponent(q)}&limit=50&page=1`);
      setItems(res.items);
    } catch (e: any) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const onCreated = () => load();
    socket.on("product:created", onCreated);
    return () => { socket.off("product:created", onCreated); };
  }, [q]);

  return (
    <div>
      <div className="row">
        <h2>Products</h2>
        <Link className="button" to="/products/new">New Product</Link>
      </div>

      <div className="row">
        <input placeholder="Search..." value={q} onChange={(e)=>setQ(e.target.value)} />
        <button onClick={load}>Search</button>
      </div>

      {err && <div className="error">{err}</div>}

      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Category</th><th>Variants</th></tr></thead>
          <tbody>
            {items.map(p => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td className="muted">{p.category ?? "-"}</td>
                <td>{p.variants?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
