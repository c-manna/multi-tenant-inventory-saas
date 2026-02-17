import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { SalesOrder } from "../models/SalesOrder";
import { Counter } from "../models/Counter";
import { reserveStockTx, releaseReservedTx, adjustStockTx } from "../services/stock.service";
import { emitTenant } from "../socket/events";
import { ApiError } from "../utils/apiError";
import { Product } from "../models/Product";
import { StockMovement } from "../models/StockMovement";

async function nextSeq(tenantId: string, key: string, session: mongoose.ClientSession) {
  const c = await Counter.findOneAndUpdate(
    { tenantId, key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );
  return c!.seq;
}

const createSchema = z.object({
  items: z.array(z.object({
    sku: z.string().min(2),
    qty: z.number().int().positive(),
    unitPrice: z.number().nonnegative()
  })).min(1)
});

export const createOrder = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.sub;
  const body = createSchema.parse(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const seq = await nextSeq(tenantId, "ORDER", session);
    const orderNumber = `SO-${String(seq).padStart(6, "0")}`;

    const order = await SalesOrder.create([{
      tenantId,
      orderNumber,
      status: "CONFIRMED",
      items: body.items.map(i => ({ ...i, fulfilledQty: 0 })),
      createdBy: userId
    }], { session });

    for (const it of body.items) {
      await reserveStockTx({ tenantId, sku: it.sku, qty: it.qty, refId: order[0]._id, session });
    }

    await session.commitTransaction();
    emitTenant(tenantId, "order:created", { orderNumber });
    res.status(201).json(order[0]);
  } finally {
    session.endSession();
  }
});

export const listOrders = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const items = await SalesOrder.find({ tenantId }).sort({ createdAt: -1 }).lean();
  res.json({ items });
});

export const fulfillOrder = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const schema = z.object({
    fulfill: z.array(z.object({
      sku: z.string().min(2),
      qty: z.number().int().positive()
    })).min(1)
  });
  const { fulfill } = schema.parse(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await SalesOrder.findOne({ _id: id, tenantId }).session(session);
    if (!order) throw new ApiError(404, "Order not found");
    if (!["CONFIRMED","PARTIALLY_FULFILLED"].includes(order.status)) throw new ApiError(400, "Order not fulfillable");

    for (const f of fulfill) {
      const item = order.items.find(i => i.sku === f.sku);
      if (!item) throw new ApiError(400, `SKU ${f.sku} not in order`);

      const remaining = item.qty - item.fulfilledQty;
      if (f.qty > remaining) throw new ApiError(409, `Fulfill exceeds remaining for ${f.sku}`);

      const updated = await Product.findOneAndUpdate(
        { tenantId, "variants.sku": f.sku, "variants.stockReserved": { $gte: f.qty } },
        { $inc: { "variants.$.stockReserved": -f.qty } },
        { new: true, session }
      );
      if (!updated) throw new ApiError(409, `Reserved stock insufficient for ${f.sku}`);

      await StockMovement.create([{
        tenantId,
        sku: f.sku,
        type: "SALE",
        qty: -f.qty,
        refType: "ORDER",
        refId: order._id,
        note: `Fulfilled ${f.qty} units (reserved->sold)`
      }], { session });

      item.fulfilledQty += f.qty;
    }

    const allFulfilled = order.items.every(i => i.fulfilledQty >= i.qty);
    order.status = allFulfilled ? "FULFILLED" : "PARTIALLY_FULFILLED";
    await order.save({ session });

    await session.commitTransaction();
    emitTenant(tenantId, "order:fulfilled", { id, status: order.status });
    emitTenant(tenantId, "stock:changed", { ref: "ORDER", id: order._id });
    res.json(order);
  } finally {
    session.endSession();
  }
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await SalesOrder.findOne({ _id: id, tenantId }).session(session);
    if (!order) throw new ApiError(404, "Order not found");
    if (order.status === "CANCELLED" || order.status === "FULFILLED") throw new ApiError(400, "Cannot cancel");

    for (const it of order.items) {
      const remaining = it.qty - it.fulfilledQty;
      if (remaining > 0) {
        await releaseReservedTx({ tenantId, sku: it.sku, qty: remaining, refId: order._id, session });
      }
    }

    order.status = "CANCELLED";
    await order.save({ session });
    await session.commitTransaction();

    emitTenant(tenantId, "order:cancelled", { id });
    emitTenant(tenantId, "stock:changed", { ref: "ORDER", id: order._id });
    res.json(order);
  } finally {
    session.endSession();
  }
});
