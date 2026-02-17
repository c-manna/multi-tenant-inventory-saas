import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { PurchaseOrder } from "../models/PurchaseOrder";
import { Counter } from "../models/Counter";
import { adjustStockTx } from "../services/stock.service";
import { emitTenant } from "../socket/events";
import { ApiError } from "../utils/apiError";

const createSchema = z.object({
  supplierId: z.string().min(8),
  notes: z.string().optional(),
  items: z.array(z.object({
    sku: z.string().min(2),
    orderedQty: z.number().int().positive(),
    expectedUnitCost: z.number().nonnegative()
  })).min(1)
});

async function nextSeq(tenantId: string, key: string, session: mongoose.ClientSession) {
  const c = await Counter.findOneAndUpdate(
    { tenantId, key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );
  return c!.seq;
}

export const listPOs = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const items = await PurchaseOrder.find({ tenantId }).sort({ updatedAt: -1 }).lean();
  res.json({ items });
});

export const createPO = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const body = createSchema.parse(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const seq = await nextSeq(tenantId, "PO", session);
    const poNumber = `PO-${String(seq).padStart(6, "0")}`;

    const doc = await PurchaseOrder.create([{
      tenantId,
      supplierId: body.supplierId,
      poNumber,
      status: "DRAFT",
      items: body.items.map(i => ({ ...i, received: [] })),
      notes: body.notes
    }], { session });

    await session.commitTransaction();
    emitTenant(tenantId, "po:created", { poNumber });
    res.status(201).json(doc[0]);
  } finally {
    session.endSession();
  }
});

export const updatePOStatus = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const schema = z.object({ status: z.enum(["DRAFT","SENT","CONFIRMED","RECEIVED","CANCELLED"]) });
  const { status } = schema.parse(req.body);

  const po = await PurchaseOrder.findOne({ _id: id, tenantId });
  if (!po) throw new ApiError(404, "PO not found");

  const allowed: Record<string, string[]> = {
    "DRAFT": ["SENT","CANCELLED"],
    "SENT": ["CONFIRMED","CANCELLED"],
    "CONFIRMED": ["RECEIVED","CANCELLED"],
    "RECEIVED": [],
    "CANCELLED": []
  };

  if (!allowed[po.status].includes(status)) {
    throw new ApiError(400, `Invalid transition ${po.status} -> ${status}`);
  }

  po.status = status;
  await po.save();
  emitTenant(tenantId, "po:status", { id, status });
  res.json(po);
});

export const receivePO = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const schema = z.object({
    receipts: z.array(z.object({
      sku: z.string().min(2),
      receivedQty: z.number().int().positive(),
      unitCost: z.number().nonnegative()
    })).min(1)
  });
  const { receipts } = schema.parse(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const po = await PurchaseOrder.findOne({ _id: id, tenantId }).session(session);
    if (!po) throw new ApiError(404, "PO not found");
    if (!["CONFIRMED","SENT"].includes(po.status)) throw new ApiError(400, "PO must be Sent/Confirmed to receive");

    const now = new Date();
    for (const r of receipts) {
      const item = po.items.find(i => i.sku === r.sku);
      if (!item) throw new ApiError(400, `SKU ${r.sku} not in PO`);

      const receivedSoFar = item.received.reduce((s, x) => s + x.receivedQty, 0);
      if (receivedSoFar + r.receivedQty > item.orderedQty) {
        throw new ApiError(409, `Receiving more than ordered for ${r.sku}`);
      }

      item.received.push({ receivedQty: r.receivedQty, receivedAt: now, unitCost: r.unitCost });

      await adjustStockTx({
        tenantId,
        sku: r.sku,
        deltaOnHand: r.receivedQty,
        movementType: "PURCHASE",
        refType: "PO",
        refId: po._id,
        note: `PO receipt ${po.poNumber} (variance allowed)`,
        session
      });
    }

    const allDone = po.items.every(i => i.received.reduce((s, x) => s + x.receivedQty, 0) >= i.orderedQty);
    if (allDone) po.status = "RECEIVED";

    await po.save({ session });
    await session.commitTransaction();

    emitTenant(tenantId, "stock:changed", { ref: "PO", id: po._id });
    res.json(po);
  } finally {
    session.endSession();
  }
});
