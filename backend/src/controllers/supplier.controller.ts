import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { Supplier } from "../models/Supplier";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  pricing: z.array(z.object({
    sku: z.string().min(2),
    price: z.number().nonnegative(),
    leadDays: z.number().int().nonnegative().default(7)
  })).default([])
});

export const listSuppliers = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const items = await Supplier.find({ tenantId }).sort({ updatedAt: -1 }).lean();
  res.json({ items });
});

export const createSupplier = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const body = createSchema.parse(req.body);
  const doc = await Supplier.create({ tenantId, ...body });
  res.status(201).json(doc);
});
