import { Schema, model, Types } from "mongoose";

export interface IVariant {
  _id: Types.ObjectId;
  sku: string;
  options: Record<string, string>;
  price: number;
  cost: number;
  stockOnHand: number;
  stockReserved: number;
  lowStockThreshold: number;
  isActive: boolean;
}

export interface IProduct {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  baseUnit: string;
  category?: string;
  variants: IVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    sku: { type: String, required: true },
    options: { type: Schema.Types.Mixed, required: true },
    price: { type: Number, required: true },
    cost: { type: Number, required: true },
    stockOnHand: { type: Number, required: true, min: 0, default: 0 },
    stockReserved: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, index: true },
    description: String,
    baseUnit: { type: String, default: "pcs" },
    category: { type: String, index: true },
    variants: { type: [VariantSchema], default: [] }
  },
  { timestamps: true }
);

ProductSchema.index({ tenantId: 1, "variants.sku": 1 }, { unique: true, sparse: true });
ProductSchema.index({ tenantId: 1, "variants.stockOnHand": 1, "variants.lowStockThreshold": 1 });

export const Product = model<IProduct>("Product", ProductSchema);
