import mongoose from "mongoose";
import { PurchaseOrder } from "../models/PurchaseOrder";
import { Product } from "../models/Product";

export async function getLowStockSmart(tenantId: string) {
  const tid = new mongoose.Types.ObjectId(tenantId);

  const inbound = await PurchaseOrder.aggregate([
    { $match: { tenantId: tid, status: { $in: ["SENT","CONFIRMED"] } } },
    { $unwind: "$items" },
    { $addFields: { receivedTotal: { $sum: "$items.received.receivedQty" } } },
    {
      $project: {
        sku: "$items.sku",
        remaining: { $max: [0, { $subtract: ["$items.orderedQty", "$receivedTotal"] }] }
      }
    },
    { $group: { _id: "$sku", inboundQty: { $sum: "$remaining" } } }
  ]);

  const inboundMap = new Map<string, number>();
  for (const row of inbound) inboundMap.set(row._id, row.inboundQty);

  const products = await Product.find(
    { tenantId, "variants.isActive": true },
    { name: 1, variants: 1 }
  ).lean();

  const low: Array<any> = [];
  for (const p of products) {
    for (const v of p.variants) {
      const inboundQty = inboundMap.get(v.sku) ?? 0;
      const projected = v.stockOnHand + inboundQty;
      if (v.stockOnHand <= v.lowStockThreshold && projected <= v.lowStockThreshold) {
        low.push({
          productName: p.name,
          sku: v.sku,
          onHand: v.stockOnHand,
          inboundQty,
          threshold: v.lowStockThreshold
        });
      }
    }
  }
  return low;
}
