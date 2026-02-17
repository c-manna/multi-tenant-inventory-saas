# Interview Preparation Notes — Multi-Tenant Inventory SaaS

Use this as your talking document in interviews.

## 1) Key Design Decisions (What to emphasize)
### Multi-tenancy
- **Row-level isolation** using `tenantId` in every document.
- JWT contains `tenantId` and role; middleware injects `req.tenantId`.
- Composite unique indexes ensure per-tenant uniqueness (SKU, orderNumber, poNumber).

**Trade-off discussion**
- Row-level tenancy is fastest and easiest to operate.
- Stronger isolation options: per-tenant DB (best isolation, more ops cost).

### Variants modeling
- Product holds `variants[]` embedded array.
- Pros: single read for UI, easy variant updates, fewer joins.
- Cons: doc size growth if variants explode; alternative is separate Variant collection.

## 2) Concurrency & Data Integrity (Most important section)
### Problem
Two users try to buy the last unit at the same time.

### Solution
- MongoDB transaction + conditional atomic update:
  - reserve step uses `findOneAndUpdate` with condition `stockOnHand >= qty`.
- One transaction commits; the other fails with 409 -> no oversell.
- Stock never goes negative.

### Why reserve stock?
- Real-world: orders are confirmed before shipping.
- Reserve lets you support cancellation and partial fulfillment properly.

## 3) Purchase Orders & Receiving
- PO status workflow: Draft -> Sent -> Confirmed -> Received.
- Partial deliveries: multiple receipts per item.
- Price variance: receipt unitCost can differ from expected cost.
- Receipt updates stock with a PURCHASE movement in a transaction.

## 4) Smart Low Stock Alerts
- Alert suppressed if inbound qty from pending PO covers threshold.
- Inbound derived from (ordered - received) on Sent/Confirmed POs.

## 5) Performance Strategy (10k+ products, <2s)
- Indexes:
  - tenantId + variants.sku unique
  - tenantId + createdAt for orders
  - tenantId + status for POs
  - tenantId + sku + createdAt for stock movements
- Dashboard uses aggregation and projections; avoids N+1.
- If needed at scale: caching dashboard per tenant with TTL, and event-based invalidation.

## 6) Typical Interview Questions & Answers
### Q: How do you enforce tenant isolation?
A: TenantId is inside JWT and injected by middleware. All DB queries include tenantId in filters. Composite indexes ensure tenant-specific uniqueness.

### Q: How do you prevent overselling?
A: In a transaction, reserve stock using conditional updates `stockOnHand >= qty`. If any item fails, abort transaction and return 409.

### Q: Why use transactions if updates are atomic?
A: Multi-line orders require all-or-nothing behavior across multiple SKUs + order creation + stock movements. Transactions ensure consistency.

### Q: How do you audit stock changes?
A: StockMovement ledger captures every change with type, qty, timestamp, and reference to PO/Order. Enables audit and analytics.

### Q: How does low-stock alert avoid false positives?
A: It considers inbound stock from pending POs (Sent/Confirmed) minus received quantities.

## 7) Demo Script (5 minutes)
1. Login tenant alpha owner
2. Dashboard shows low stock for TS-RED-M (if below threshold)
3. Create PO for TS-RED-M, mark Sent -> Confirmed
4. Dashboard low-stock alert disappears (inbound covers threshold)
5. Receive partial delivery -> stock updates + movements
6. Create order for same SKU; show concurrency safety explanation
