import mongoose from "mongoose";
import { Product } from "../models/Product";
import { StockMovement } from "../models/StockMovement";
import { ApiError } from "../utils/apiError";

export async function adjustStockTx(params: {
  tenantId: string;
  sku: string;
  deltaOnHand: number;
  movementType: "PURCHASE"|"SALE"|"RETURN"|"ADJUSTMENT";
  refType?: "PO"|"ORDER";
  refId?: any;
  note?: string;
  session: mongoose.ClientSession;
}) {
  const { tenantId, sku, deltaOnHand, session } = params;

  const filter: any = { tenantId, "variants.sku": sku };
  if (deltaOnHand < 0) {
    filter["variants.stockOnHand"] = { $gte: Math.abs(deltaOnHand) };
  }

  const updated = await Product.findOneAndUpdate(
    filter,
    { $inc: { "variants.$.stockOnHand": deltaOnHand } },
    { new: true, session }
  );

  if (!updated) throw new ApiError(409, `Insufficient stock for SKU ${sku}`);

  await StockMovement.create(
    [{
      tenantId,
      sku,
      type: params.movementType,
      qty: deltaOnHand,
      refType: params.refType,
      refId: params.refId,
      note: params.note
    }],
    { session }
  );
}

export async function reserveStockTx(params: {
  tenantId: string;
  sku: string;
  qty: number;
  refId: any;
  session: mongoose.ClientSession;
}) {
  const { tenantId, sku, qty, session } = params;

  const updated = await Product.findOneAndUpdate(
    { tenantId, "variants.sku": sku, "variants.stockOnHand": { $gte: qty } },
    { $inc: { "variants.$.stockOnHand": -qty, "variants.$.stockReserved": qty } },
    { new: true, session }
  );

  if (!updated) throw new ApiError(409, `Insufficient stock to reserve for ${sku}`);

  await StockMovement.create(
    [{
      tenantId,
      sku,
      type: "RESERVE",
      qty: -qty,
      refType: "ORDER",
      refId
    }],
    { session }
  );
}

export async function releaseReservedTx(params: {
  tenantId: string;
  sku: string;
  qty: number;
  refId: any;
  session: mongoose.ClientSession;
}) {
  const { tenantId, sku, qty, session } = params;

  const updated = await Product.findOneAndUpdate(
    { tenantId, "variants.sku": sku, "variants.stockReserved": { $gte: qty } },
    { $inc: { "variants.$.stockOnHand": qty, "variants.$.stockReserved": -qty } },
    { new: true, session }
  );

  if (!updated) throw new ApiError(409, `Reserved stock mismatch for ${sku}`);

  await StockMovement.create(
    [{
      tenantId,
      sku,
      type: "RELEASE",
      qty,
      refType: "ORDER",
      refId
    }],
    { session }
  );
}
