import { Schema, model, Types } from "mongoose";

export type OrderStatus = "DRAFT" | "CONFIRMED" | "PARTIALLY_FULFILLED" | "FULFILLED" | "CANCELLED";

export interface IOrderItem {
  sku: string;
  qty: number;
  unitPrice: number;
  fulfilledQty: number;
}

export interface ISalesOrder {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  items: IOrderItem[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SalesOrderSchema = new Schema<ISalesOrder>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    orderNumber: { type: String, required: true },
    status: { type: String, enum: ["DRAFT","CONFIRMED","PARTIALLY_FULFILLED","FULFILLED","CANCELLED"], required: true, index: true },
    items: {
      type: [
        {
          sku: { type: String, required: true },
          qty: { type: Number, required: true, min: 1 },
          unitPrice: { type: Number, required: true, min: 0 },
          fulfilledQty: { type: Number, required: true, min: 0, default: 0 }
        }
      ],
      default: []
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

SalesOrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
SalesOrderSchema.index({ tenantId: 1, createdAt: -1 });

export const SalesOrder = model<ISalesOrder>("SalesOrder", SalesOrderSchema);
