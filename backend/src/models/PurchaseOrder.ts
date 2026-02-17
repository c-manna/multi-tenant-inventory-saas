import { Schema, model, Types } from "mongoose";

export type POStatus = "DRAFT" | "SENT" | "CONFIRMED" | "RECEIVED" | "CANCELLED";

export interface IPOItemReceipt {
  receivedQty: number;
  receivedAt: Date;
  unitCost: number;
}

export interface IPOItem {
  sku: string;
  orderedQty: number;
  expectedUnitCost: number;
  received: IPOItemReceipt[];
}

export interface IPurchaseOrder {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  supplierId: Types.ObjectId;
  poNumber: string;
  status: POStatus;
  items: IPOItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    poNumber: { type: String, required: true },
    status: { type: String, enum: ["DRAFT","SENT","CONFIRMED","RECEIVED","CANCELLED"], required: true, index: true },
    items: {
      type: [
        {
          sku: { type: String, required: true },
          orderedQty: { type: Number, required: true, min: 1 },
          expectedUnitCost: { type: Number, required: true, min: 0 },
          received: {
            type: [
              {
                receivedQty: { type: Number, required: true, min: 1 },
                receivedAt: { type: Date, required: true },
                unitCost: { type: Number, required: true, min: 0 }
              }
            ],
            default: []
          }
        }
      ],
      default: []
    },
    notes: String
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ tenantId: 1, poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ tenantId: 1, status: 1 });

export const PurchaseOrder = model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);
