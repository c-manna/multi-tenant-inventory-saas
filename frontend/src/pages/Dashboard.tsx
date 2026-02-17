import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { socket } from "../socket/socket";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const d = await api<any>("/dashboard");
      setData(d);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();

    const onRefresh = () => load();
    socket.on("stock:changed", onRefresh);
    socket.on("order:created", onRefresh);
    socket.on("po:created", onRefresh);

    return () => {
      socket.off("stock:changed", onRefresh);
      socket.off("order:created", onRefresh);
      socket.off("po:created", onRefresh);
    };
  }, []);

  if (err) return <div className="error">{err}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>Dashboard</h2>

      <div className="grid">
        <div className="card">
          <div className="muted">Inventory Value</div>
          <div className="big">₹ {Math.round(data.inventoryValue)}</div>
        </div>
        <div className="card">
          <div className="muted">SKU Count</div>
          <div className="big">{data.skuCount}</div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Low Stock (Smart)</h3>
          {data.lowStock.length === 0 ? (
            <div className="muted">No low-stock alerts</div>
          ) : (
            <ul>
              {data.lowStock.slice(0, 10).map((x: any) => (
                <li key={x.sku}>
                  <b>{x.sku}</b> ({x.productName}) — onHand {x.onHand}, inbound {x.inboundQty}, threshold {x.threshold}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Top Sellers (30 days)</h3>
          <ol>
            {data.topSellers.map((x: any) => (
              <li key={x._id}><b>{x._id}</b> — {x.soldQty}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card">
        <h3>Stock Movement (7 days)</h3>
        <pre className="pre">{JSON.stringify(data.movement7d, null, 2)}</pre>
      </div>
    </div>
  );
}
