import { connectDB } from "../config/db";
import { Tenant } from "../models/Tenant";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { Supplier } from "../models/Supplier";
import { hashPassword } from "../utils/password";

async function seed() {
  await connectDB();

  await Promise.all([
    Tenant.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    Supplier.deleteMany({})
  ]);

  const [t1, t2] = await Tenant.create([
    { name: "Alpha Retail", slug: "alpha" },
    { name: "Beta Outfitters", slug: "beta" }
  ]);

  const pw = await hashPassword("Password@123");

  await User.create([
    { tenantId: t1._id, name: "Alice Owner", email: "owner@alpha.com", passwordHash: pw, role: "OWNER" },
    { tenantId: t1._id, name: "Mark Manager", email: "manager@alpha.com", passwordHash: pw, role: "MANAGER" },
    { tenantId: t1._id, name: "Sam Staff", email: "staff@alpha.com", passwordHash: pw, role: "STAFF" },

    { tenantId: t2._id, name: "Bob Owner", email: "owner@beta.com", passwordHash: pw, role: "OWNER" },
    { tenantId: t2._id, name: "Nina Manager", email: "manager@beta.com", passwordHash: pw, role: "MANAGER" }
  ]);

  await Product.create([
    {
      tenantId: t1._id,
      name: "T-Shirt",
      category: "Apparel",
      variants: [
        { sku: "TS-RED-S", options: { color: "Red", size: "S" }, price: 499, cost: 200, stockOnHand: 15, stockReserved: 0, lowStockThreshold: 5, isActive: true },
        { sku: "TS-RED-M", options: { color: "Red", size: "M" }, price: 499, cost: 200, stockOnHand: 3, stockReserved: 0, lowStockThreshold: 5, isActive: true }
      ]
    },
    {
      tenantId: t2._id,
      name: "Hoodie",
      category: "Apparel",
      variants: [
        { sku: "HD-BLK-M", options: { color: "Black", size: "M" }, price: 1299, cost: 650, stockOnHand: 9, stockReserved: 0, lowStockThreshold: 3, isActive: true }
      ]
    }
  ]);

  await Supplier.create([
    {
      tenantId: t1._id,
      name: "Textile Supplier A",
      email: "sales@textilea.com",
      pricing: [
        { sku: "TS-RED-S", price: 190, leadDays: 7 },
        { sku: "TS-RED-M", price: 195, leadDays: 7 }
      ]
    }
  ]);

  console.log("Seed completed.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
