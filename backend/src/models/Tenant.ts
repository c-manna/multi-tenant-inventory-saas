import { Schema, model, Types } from "mongoose";

export interface ITenant {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  createdAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Tenant = model<ITenant>("Tenant", TenantSchema);
