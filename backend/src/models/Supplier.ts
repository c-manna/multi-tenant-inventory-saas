import { Schema, model, Types } from "mongoose";

export interface ISupplierPrice {
  sku: string;
  price: number;
  leadDays: number;
}

export interface ISupplier {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  pricing: ISupplierPrice[];
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, index: true },
    email: String,
    phone: String,
    pricing: {
      type: [
        {
          sku: { type: String, required: true },
          price: { type: Number, required: true },
          leadDays: { type: Number, required: true, default: 7 }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

SupplierSchema.index({ tenantId: 1, name: 1 });

export const Supplier = model<ISupplier>("Supplier", SupplierSchema);
