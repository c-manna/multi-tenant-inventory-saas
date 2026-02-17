import { Schema, model, Types } from "mongoose";

export type Role = "OWNER" | "MANAGER" | "STAFF";

export interface IUser {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["OWNER", "MANAGER", "STAFF"], required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export const User = model<IUser>("User", UserSchema);
