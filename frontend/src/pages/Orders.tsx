import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { socket } from "../socket/socket";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [sku, setSku] = useState("TS-RED-M");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(499);
  const [err, setErr] = useState<string|null>(null);

  async function load() {
    const res = await api<any>("/orders");
    setOrders(res.items);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const fn = () => load();
    socket.on("order:created", fn);
    socket.on("order:fulfilled", fn);
    socket.on("order:cancelled", fn);
    socket.on("stock:changed", fn);
    return () => {
      socket.off("order:created", fn);
      socket.off("order:fulfilled", fn);
      socket.off("order:cancelled", fn);
      socket.off("stock:changed", fn);
    };
  }, []);

  async function create() {
    setErr(null);
    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({ items: [{ sku, qty, unitPrice: price }] })
      });
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function fulfill(id: string) {
    await api(`/orders/${id}/fulfill`, { method: "POST", body: JSON.stringify({ fulfill: [{ sku, qty: 1 }] }) });
    await load();
  }

  async function cancel(id: string) {
    await api(`/orders/${id}/cancel`, { method: "POST" });
    await load();
  }

  return (
    <div>
      <h2>Orders</h2>
      {err && <div className="error">{err}</div>}

      <div className="card">
        <h3>Create Order</h3>
        <div className="row">
          <input value={sku} onChange={(e)=>setSku(e.target.value)} />
          <input type="number" value={qty} onChange={(e)=>setQty(Number(e.target.value))} />
          <input type="number" value={price} onChange={(e)=>setPrice(Number(e.target.value))} />
          <button onClick={create}>Create (reserves stock)</button>
        </div>
        <div className="muted small">
          Concurrency safe: if two users order last unit, one gets 409 conflict.
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Order</th><th>Status</th><th>Items</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id}>
                <td><b>{o.orderNumber}</b></td>
                <td>{o.status}</td>
                <td className="muted">
                  {o.items.map((i:any)=>`${i.sku} ${i.fulfilledQty}/${i.qty}`).join(", ")}
                </td>
                <td>
                  <button onClick={()=>fulfill(o._id)}>Fulfill +1</button>
                  <button onClick={()=>cancel(o._id)}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
