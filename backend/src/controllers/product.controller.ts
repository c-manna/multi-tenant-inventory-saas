import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { Product } from "../models/Product";
import { emitTenant } from "../socket/events";

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  baseUnit: z.string().default("pcs"),
  variants: z.array(z.object({
    sku: z.string().min(2),
    options: z.record(z.string()),
    price: z.number().nonnegative(),
    cost: z.number().nonnegative(),
    stockOnHand: z.number().int().nonnegative().default(0),
    lowStockThreshold: z.number().int().nonnegative().default(0)
  })).min(1)
});

export const listProducts = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(100, Number(req.query.limit ?? 25));
  const q = String(req.query.q ?? "").trim();

  const filter: any = { tenantId };
  if (q) filter.name = { $regex: q, $options: "i" };

  const [items, total] = await Promise.all([
    Product.find(filter, { name: 1, category: 1, variants: 1 })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);

  res.json({ items, total, page, limit });
});

export const createProduct = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const body = createSchema.parse(req.body);
  const doc = await Product.create({ tenantId, ...body });

  emitTenant(tenantId, "product:created", { id: doc._id, name: doc.name });
  res.status(201).json(doc);
});
