import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { socket } from "../socket/socket";

export default function PurchaseOrders() {
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [sku, setSku] = useState("TS-RED-M");
  const [qty, setQty] = useState(5);
  const [cost, setCost] = useState(195);
  const [err, setErr] = useState<string|null>(null);

  async function load() {
    const [a, b] = await Promise.all([api<any>("/purchase-orders"), api<any>("/suppliers")]);
    setPos(a.items); setSuppliers(b.items);
    if (!supplierId && b.items[0]) setSupplierId(b.items[0]._id);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const fn = () => load();
    socket.on("po:created", fn);
    socket.on("po:status", fn);
    socket.on("stock:changed", fn);
    return () => { socket.off("po:created", fn); socket.off("po:status", fn); socket.off("stock:changed", fn); };
  }, []);

  async function createPO() {
    setErr(null);
    try {
      await api("/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          supplierId,
          items: [{ sku, orderedQty: qty, expectedUnitCost: cost }]
        })
      });
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  async function setStatus(id: string, status: string) {
    await api(`/purchase-orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }

  async function receive(id: string) {
    await api(`/purchase-orders/${id}/receive`, {
      method: "POST",
      body: JSON.stringify({ receipts: [{ sku, receivedQty: 1, unitCost: cost }] })
    });
    await load();
  }

  return (
    <div>
      <h2>Purchase Orders</h2>
      {err && <div className="error">{err}</div>}

      <div className="card">
        <h3>Create PO</h3>
        <div className="row">
          <select value={supplierId} onChange={(e)=>setSupplierId(e.target.value)}>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <input value={sku} onChange={(e)=>setSku(e.target.value)} />
          <input type="number" value={qty} onChange={(e)=>setQty(Number(e.target.value))} />
          <input type="number" value={cost} onChange={(e)=>setCost(Number(e.target.value))} />
          <button onClick={createPO}>Create</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>PO</th><th>Status</th><th>Items</th><th>Actions</th></tr></thead>
          <tbody>
            {pos.map(po => (
              <tr key={po._id}>
                <td><b>{po.poNumber}</b></td>
                <td>{po.status}</td>
                <td className="muted">{po.items.map((i:any)=>`${i.sku} x${i.orderedQty}`).join(", ")}</td>
                <td>
                  <button onClick={()=>setStatus(po._id,"SENT")}>Send</button>
                  <button onClick={()=>setStatus(po._id,"CONFIRMED")}>Confirm</button>
                  <button onClick={()=>receive(po._id)}>Receive +1</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
