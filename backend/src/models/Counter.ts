import { Schema, model, Types } from "mongoose";

export interface ICounter {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  key: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  key: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 }
});

CounterSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const Counter = model<ICounter>("Counter", CounterSchema);
