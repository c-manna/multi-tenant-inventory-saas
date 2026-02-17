# Multi-Tenant Inventory Management SaaS

A SaaS platform where multiple businesses (tenants) manage inventory, suppliers, purchase orders, and sales orders with strict data isolation and concurrency safety.

## Tech Stack
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, Socket.io
- Frontend: React (hooks), Context API, React Router, Socket.io client
- Data integrity: MongoDB transactions + conditional atomic updates (stock never negative)
- Analytics: MongoDB aggregation + indexes designed for 10,000+ products

---

## 1) Prerequisites
- Node.js 18+ (recommended 20+)
- MongoDB 6+ **Replica Set** (transactions require replica set)
- Git

---

## 2) Start MongoDB as Replica Set (Local)

### Option A: Local mongod (Linux/macOS)
```bash
mongod --replSet rs0 --dbpath ./mongo-data --port 27017
```
In another terminal:
```bash
mongosh --port 27017
rs.initiate()
```

### Option B: Docker Mongo Replica Set (Quick)
```bash
docker run -d --name mongo-rs -p 27017:27017 mongo:6   --replSet rs0 --bind_ip_all
docker exec -it mongo-rs mongosh --eval "rs.initiate()"
```

---

## 3) Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Backend: http://localhost:5000

---

## 4) Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: http://localhost:5173

---

## 5) Seed Credentials (2 Tenants)

Tenant slug: **alpha**
- OWNER: owner@alpha.com / Password@123
- MANAGER: manager@alpha.com / Password@123
- STAFF: staff@alpha.com / Password@123

Tenant slug: **beta**
- OWNER: owner@beta.com / Password@123
- MANAGER: manager@beta.com / Password@123

---

## 6) Features Implemented

### Multi-Tenant + RBAC
- JWT carries tenantId and role
- Middleware scopes all requests by tenantId
- Roles: OWNER / MANAGER / STAFF

### Products & Variants
- Embedded variants, SKU-level stock
- SKU uniqueness per tenant
- Low-stock thresholds per variant

### Stock Ledger
- Stock movements for purchase/sale/return/adjustment/reserve/release

### Concurrency-Safe Orders
- Create order + reserve stock in a transaction
- Prevent oversell under concurrency
- Partial fulfillment supported
- Cancel releases remaining reserved

### Suppliers & Purchase Orders
- Supplier pricing list
- PO workflow: Draft -> Sent -> Confirmed -> Received
- Partial deliveries supported
- Price variance supported at receipt
- Receipt auto-updates stock

### Smart Low-Stock Alerts
- Suppress alert if pending inbound PO will keep stock above threshold

### Dashboard & Analytics
- Inventory value
- Smart low-stock list
- Top 5 sellers (30 days)
- Stock movement aggregation (7 days)
- Real-time refresh triggers via Socket.io events

---

## 7) API Docs
- OpenAPI spec: `backend/src/docs/openapi.yaml`
- Import into Postman/Insomnia/Swagger UI

---

## 8) What you must configure yourself
1. **MongoDB Replica Set** (required for transactions)
2. Create `.env` files from `.env.example` for:
   - `backend/.env`
   - `frontend/.env`
3. Ensure CORS origin matches your frontend URL
4. If running on different hosts/ports, update:
   - `backend/.env` -> `CORS_ORIGIN`
   - `frontend/.env` -> `VITE_API_BASE` and `VITE_SOCKET_URL`

---

## 9) Known limitations (for interview honesty)
- UI is intentionally minimal (assignment-focused); full CRUD edit forms can be added.
- Dashboard chart is shown as JSON; can be replaced with a chart library.
- No Redis caching by default; add it if dashboard queries become heavy.

---

## 10) Scripts
- Backend:
  - `npm run dev` (dev server)
  - `npm run seed` (seed tenants/users/data)
  - `npm run build` + `npm start` (prod)
- Frontend:
  - `npm run dev`
  - `npm run build` + `npm run preview`
