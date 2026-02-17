import { Schema, model, Types } from "mongoose";

export type MovementType = "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "RESERVE" | "RELEASE";

export interface IStockMovement {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  sku: string;
  type: MovementType;
  qty: number;
  refType?: "PO" | "ORDER";
  refId?: Types.ObjectId;
  note?: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    sku: { type: String, required: true, index: true },
    type: { type: String, enum: ["PURCHASE","SALE","RETURN","ADJUSTMENT","RESERVE","RELEASE"], required: true, index: true },
    qty: { type: Number, required: true },
    refType: { type: String, enum: ["PO","ORDER"] },
    refId: { type: Schema.Types.ObjectId },
    note: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockMovementSchema.index({ tenantId: 1, createdAt: -1 });
StockMovementSchema.index({ tenantId: 1, sku: 1, createdAt: -1 });

export const StockMovement = model<IStockMovement>("StockMovement", StockMovementSchema);
