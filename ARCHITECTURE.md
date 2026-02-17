# Architecture — Multi-Tenant Inventory Management System

## 1) Multi-Tenant Isolation Approach (Row-Level Isolation)

**Chosen approach:** Row-level multi-tenancy using `tenantId` field on every business entity (Products, Suppliers, PurchaseOrders, SalesOrders, StockMovements, Users).

### Why this choice
- Fastest to ship and easiest to operate for a SaaS MVP.
- One MongoDB cluster to manage (backups, monitoring, scaling).
- Indexing can keep tenant queries fast even at high product counts.

### Pros
- Single DB connection pool, simpler deployments.
- Easy to shard by `tenantId` later.
- Lower operational overhead vs per-tenant DB.

### Cons / Risks
- Must enforce tenantId filter in every query.
- A bug can cause data leakage if tenant filter is missed.
- Some indexes grow larger due to multi-tenant cardinality.

### Mitigations in this project
- JWT includes `tenantId`; middleware injects `req.tenantId`.
- Controllers always query by tenantId.
- Composite unique indexes use `(tenantId, ...)`.

**Alternatives considered**
- Separate DB per tenant: strongest isolation; higher provisioning/ops cost.
- Separate schema/collection per tenant: isolation is good; many collections becomes unwieldy.

---

## 2) Product Variants Modeling in MongoDB

**Decision:** One `Product` document with embedded `variants[]`.

Variant fields:
- `sku` (unique per tenant)
- `options` e.g. `{ "size":"M", "color":"Red" }`
- `price`, `cost`
- `stockOnHand`, `stockReserved`
- `lowStockThreshold`

### Why
- Typical variant counts are small-to-moderate.
- UI reads want product + variants together.
- Atomic updates on a single variant using positional operator.
- SKU uniqueness enforced by index `{ tenantId, "variants.sku" }`.

---

## 3) Concurrency Handling — Preventing Race Conditions

### Risks
- Two users ordering last unit.
- Stock going negative due to read-check-write.

### Implemented solution
- **MongoDB transactions** + **conditional atomic updates**.
- When reserving stock, update with condition `variants.stockOnHand >= qty`.
- If any line fails, abort transaction -> no partial corruption.

### Order flow
1. Create SalesOrder (CONFIRMED) in transaction
2. Reserve stock for each SKU (onHand -= qty, reserved += qty)
3. Commit transaction
4. Fulfillment decreases reserved (reserved -= qty) and records SALE movement
5. Cancel releases remaining reserved back to onHand

**Guarantee:** Stock never negative.

---

## 4) Stock Movement Ledger

All stock changes are recorded to `StockMovement` with:
- tenantId, sku, type, qty (+/-), timestamp, references (PO/Order)

This enables:
- Full audit history
- Stock movement charts

---

## 5) Purchase Orders & Receiving

PurchaseOrder supports:
- Status workflow: Draft -> Sent -> Confirmed -> Received (or Cancelled)
- Multiple items
- Partial receipts: `items.received[]` array
- Price variance allowed at receipt (each receipt has actual unitCost)
- Receipt updates stock (PURCHASE movement) in a transaction
- Prevent over-receipt beyond ordered qty

---

## 6) Smart Low-Stock Alerts

Alert only if:
- `stockOnHand <= threshold`
- AND `(stockOnHand + inboundFromPendingPO) <= threshold`

Inbound computed from POs in Sent/Confirmed:
- inbound = ordered - already received

Avoids false alerts when replenishment is already coming.

---

## 7) Dashboard & Analytics Performance (<2s for 10k+ products)

### Techniques
- Proper compound indexes (tenantId + status + createdAt + sku)
- Aggregations that minimize scanned fields
- Bulk computations (no N+1)
- Projections only needed fields

Widgets:
- Inventory value (sum stockOnHand * cost)
- Smart low stock list
- Top 5 sellers (30 days)
- Stock movement aggregation (7 days)

Scaling:
- Optional caching (Redis) for dashboard at high load
- Shard by tenantId at very high scale

---

## 8) Trade-offs
- Embedded variants simplify reads, but very large variant counts can increase doc size.
- Row-level tenancy needs strict query discipline.
- Reserved stock adds complexity but matches real-world order lifecycle.
