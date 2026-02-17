import mongoose from "mongoose";
import { Product } from "../models/Product";
import { SalesOrder } from "../models/SalesOrder";
import { StockMovement } from "../models/StockMovement";
import { getLowStockSmart } from "./alerts.service";

export async function getDashboard(tenantId: string) {
  const tid = new mongoose.Types.ObjectId(tenantId);

  const [inventoryValueAgg, lowStock, topSellers, movement7d] = await Promise.all([
    Product.aggregate([
      { $match: { tenantId: tid } },
      { $unwind: "$variants" },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$variants.stockOnHand", "$variants.cost"] } },
          skuCount: { $sum: 1 }
        }
      }
    ]),
    getLowStockSmart(tenantId),
    SalesOrder.aggregate([
      {
        $match: {
          tenantId: tid,
          createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) },
          status: { $in: ["FULFILLED","PARTIALLY_FULFILLED","CONFIRMED"] }
        }
      },
      { $unwind: "$items" },
      { $group: { _id: "$items.sku", soldQty: { $sum: "$items.fulfilledQty" } } },
      { $sort: { soldQty: -1 } },
      { $limit: 5 }
    ]),
    StockMovement.aggregate([
      { $match: { tenantId: tid, createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
      {
        $group: {
          _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, type: "$type" },
          qty: { $sum: "$qty" }
        }
      },
      { $sort: { "_id.day": 1 } }
    ])
  ]);

  return {
    inventoryValue: inventoryValueAgg?.[0]?.totalValue ?? 0,
    skuCount: inventoryValueAgg?.[0]?.skuCount ?? 0,
    lowStock,
    topSellers,
    movement7d
  };
}
