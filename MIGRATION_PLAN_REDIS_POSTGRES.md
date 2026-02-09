# Migration Plan: Redis + PostgreSQL Integration

## Overview

This document outlines the phased migration strategy to integrate:
- **Redis**: For caching, session management, and real-time data
- **PostgreSQL**: For billing, payments, and inventory (ACID transactions)

MongoDB remains the primary database for patient records, EMR, appointments, and other clinical data.

---

## Architecture After Migration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend Apps                                  │
│              (Patient Portal, HIS Frontend, Voice Agent)                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Node.js Backend                                  │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Patient   │  │   Billing   │  │  Inventory  │  │   Caching   │    │
│  │  Services   │  │  Services   │  │  Services   │  │   Service   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
└─────────┼────────────────┼────────────────┼────────────────┼────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │  MongoDB   │   │ PostgreSQL │   │ PostgreSQL │   │   Redis    │
   │            │   │  (Billing) │   │ (Inventory)│   │  (Cache)   │
   │ - Patients │   │ - Bills    │   │ - Items    │   │ - Sessions │
   │ - EMR      │   │ - Payments │   │ - Stock    │   │ - Tokens   │
   │ - Appts    │   │ - Invoices │   │ - Txns     │   │ - Health   │
   │ - Labs     │   │ - Audit    │   │ - POs      │   │   Scores   │
   └────────────┘   └────────────┘   └────────────┘   └────────────┘
```

---

## Phase 1: Redis Integration (Week 1)

### 1.1 What Moves to Redis

| Data Type | Current Location | TTL | Priority |
|-----------|-----------------|-----|----------|
| Patient refresh tokens | In-memory Map | 7 days | P0 |
| Socket.io user sessions | In-memory Map | Session | P0 |
| Health score cache | None | 10 min | P1 |
| Tariff/department cache | None | 1 hour | P2 |
| Rate limiting counters | None | 1 min | P1 |
| ML prediction cache | None | 5 min | P2 |

### 1.2 Implementation Tasks

- [x] Install `ioredis` package
- [ ] Create `config/redis.js` - Connection config
- [ ] Create `services/cache.service.js` - Cache abstraction
- [ ] Create `middleware/rateLimit.middleware.js` - Redis-based rate limiting
- [ ] Update `patientAuth.controller.js` - Redis tokens
- [ ] Update `socket.service.js` - Redis adapter for Socket.io
- [ ] Add health score caching

### 1.3 Redis Schema

```
Keys:
  patient:refresh:{patientId}     -> refreshToken (TTL: 7d)
  socket:user:{userId}            -> socketId (TTL: session)
  health:score:{patientId}        -> JSON score object (TTL: 10m)
  tariff:list                     -> JSON array (TTL: 1h)
  department:list                 -> JSON array (TTL: 1h)
  rate:limit:{ip}                 -> counter (TTL: 1m)
  nudge:prediction:{patientId}    -> JSON prediction (TTL: 5m)
```

---

## Phase 2: PostgreSQL Integration (Week 2-3)

### 2.1 What Moves to PostgreSQL

| Collection | Records (Est.) | Reason |
|------------|---------------|--------|
| Billing | ~10K/year | ACID, complex queries, audit |
| Payment | ~15K/year | Financial transactions, rollback |
| InventoryItem | ~500 | Master data, referential integrity |
| InventoryStock | ~2K | Stock ledger, atomic operations |
| InventoryTransaction | ~50K/year | Immutable audit trail |

### 2.2 PostgreSQL Schema Design

```sql
-- ═══════════════════════════════════════════════════════════════════
-- BILLING TABLES
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id VARCHAR(30) NOT NULL,  -- MongoDB ObjectId reference
    visit_id VARCHAR(30),              -- MongoDB ObjectId reference
    visit_model VARCHAR(20),           -- 'Appointment', 'Admission', 'Emergency'
    visit_type VARCHAR(10) DEFAULT 'opd',
    bill_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'draft',
    subtotal DECIMAL(12,2) DEFAULT 0,
    total_discount DECIMAL(12,2) DEFAULT 0,
    total_tax DECIMAL(12,2) DEFAULT 0,
    grand_total DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending',
    insurance_claim_id VARCHAR(30),
    insurance_status VARCHAR(20) DEFAULT 'none',
    generated_by VARCHAR(30) NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP,
    locked_by VARCHAR(30),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,
    item_reference VARCHAR(30),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    rate DECIMAL(12,2) NOT NULL CHECK (rate >= 0),
    amount DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    is_billed BOOLEAN DEFAULT TRUE,
    billed_at TIMESTAMP DEFAULT NOW(),
    is_system_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(20) UNIQUE NOT NULL,
    bill_id UUID REFERENCES bills(id),
    patient_id VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    payment_mode VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(50),
    card_last4 VARCHAR(4),
    bank_name VARCHAR(50),
    cheque_number VARCHAR(20),
    upi_id VARCHAR(50),
    payment_date TIMESTAMP DEFAULT NOW(),
    collected_by VARCHAR(30) NOT NULL,
    remarks TEXT,
    is_refunded BOOLEAN DEFAULT FALSE,
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bill_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(30) NOT NULL,
    performed_at TIMESTAMP DEFAULT NOW(),
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    details JSONB
);

-- ═══════════════════════════════════════════════════════════════════
-- INVENTORY TABLES
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    parent_id UUID REFERENCES inventory_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(30) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES inventory_categories(id),
    sub_category_id UUID REFERENCES inventory_categories(id),
    uom VARCHAR(20) NOT NULL,
    reorder_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    batch_tracking BOOLEAN DEFAULT FALSE,
    expiry_tracking BOOLEAN DEFAULT FALSE,
    hsn_code VARCHAR(20),
    gst_rate DECIMAL(5,2) DEFAULT 0,
    specifications JSONB,
    default_location_id UUID,
    status VARCHAR(20) DEFAULT 'available',
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(30),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,  -- 'store', 'ward', 'department'
    parent_id UUID REFERENCES inventory_locations(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES inventory_items(id) NOT NULL,
    location_id UUID REFERENCES inventory_locations(id) NOT NULL,
    batch_number VARCHAR(50),
    expiry_date DATE,
    manufacturing_date DATE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    purchase_rate DECIMAL(12,2) DEFAULT 0,
    selling_rate DECIMAL(12,2) DEFAULT 0,
    grn_id UUID,
    status VARCHAR(20) DEFAULT 'available',
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    blocked_by VARCHAR(30),
    blocked_at TIMESTAMP,
    last_movement_date TIMESTAMP,
    last_movement_type VARCHAR(20),
    created_by VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(item_id, location_id, batch_number)
);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(30) UNIQUE NOT NULL,
    item_id UUID REFERENCES inventory_items(id) NOT NULL,
    stock_id UUID REFERENCES inventory_stock(id),
    location_id UUID REFERENCES inventory_locations(id),
    transaction_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    rate DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    reference_type VARCHAR(30),  -- 'prescription', 'po', 'grn', 'return'
    reference_id VARCHAR(30),
    department_id VARCHAR(30),
    issued_to VARCHAR(30),
    supplier VARCHAR(100),
    invoice_number VARCHAR(50),
    reason TEXT,
    remarks TEXT,
    created_by VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX idx_bills_patient ON bills(patient_id);
CREATE INDEX idx_bills_date ON bills(bill_date DESC);
CREATE INDEX idx_bills_status ON bills(payment_status);
CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
CREATE INDEX idx_stock_item ON inventory_stock(item_id);
CREATE INDEX idx_stock_location ON inventory_stock(location_id);
CREATE INDEX idx_stock_expiry ON inventory_stock(expiry_date);
CREATE INDEX idx_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_transactions_date ON inventory_transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON inventory_transactions(transaction_type);
```

### 2.3 Implementation Tasks

- [ ] Install `pg` and `sequelize` packages
- [ ] Create `config/postgres.js` - Connection pool
- [ ] Create `models/postgres/` directory with models
- [ ] Create migration scripts (MongoDB → PostgreSQL)
- [ ] Update billing service to use PostgreSQL
- [ ] Update inventory services to use PostgreSQL
- [ ] Update payment service to use PostgreSQL
- [ ] Add transaction support for atomic operations
- [ ] Keep MongoDB references for cross-db joins

---

## Phase 3: Dual-Write & Migration (Week 3-4)

### 3.1 Migration Strategy

```
Step 1: Dual-Write Mode
  - Write to both MongoDB and PostgreSQL
  - Read from MongoDB (primary)
  - Validate data consistency

Step 2: Shadow Read Mode  
  - Write to both
  - Read from PostgreSQL
  - Compare with MongoDB reads
  - Log discrepancies

Step 3: PostgreSQL Primary
  - Write to PostgreSQL first
  - Sync to MongoDB (for reporting)
  - Gradually disable MongoDB writes

Step 4: MongoDB Sunset (Billing/Inventory only)
  - Archive MongoDB billing collections
  - Keep MongoDB for other data
```

### 3.2 Rollback Plan

If issues occur:
1. Flip `USE_POSTGRES` env to `false`
2. System falls back to MongoDB
3. Sync PostgreSQL changes back to MongoDB

---

## Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=lifeline_his
POSTGRES_USER=lifeline
POSTGRES_PASSWORD=your_secure_password
POSTGRES_SSL=false

# Feature Flags
USE_REDIS_CACHE=true
USE_POSTGRES_BILLING=false
USE_POSTGRES_INVENTORY=false
DUAL_WRITE_MODE=true
```

---

## File Structure After Migration

```
hospital-his-backend/
├── config/
│   ├── database.js          # MongoDB (existing)
│   ├── redis.js              # NEW: Redis connection
│   └── postgres.js           # NEW: PostgreSQL pool
├── models/
│   ├── Billing.js            # MongoDB (keep for migration)
│   ├── postgres/             # NEW
│   │   ├── index.js          
│   │   ├── Bill.model.js     
│   │   ├── BillItem.model.js
│   │   ├── Payment.model.js
│   │   ├── InventoryItem.model.js
│   │   ├── InventoryStock.model.js
│   │   └── InventoryTransaction.model.js
├── services/
│   ├── cache.service.js      # NEW: Redis cache abstraction
│   ├── billing.service.js    # UPDATE: Use PostgreSQL
│   └── inventory.service.js  # UPDATE: Use PostgreSQL
├── migrations/
│   ├── postgres/             # NEW
│   │   ├── 001_create_billing_tables.js
│   │   ├── 002_create_inventory_tables.js
│   │   └── 003_migrate_mongo_data.js
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Dual-write mode, daily backups |
| Performance regression | Shadow reads, monitoring |
| Breaking cross-collection joins | Keep MongoDB ObjectId references |
| Team unfamiliarity with SQL | Code reviews, Sequelize ORM |

---

## Success Metrics

- [ ] Redis cache hit rate > 80%
- [ ] Billing query time < 50ms (vs current ~200ms)
- [ ] Zero data loss during migration
- [ ] Successful rollback tested
- [ ] All ACID transactions passing

---

## Timeline

| Week | Milestone |
|------|-----------|
| 1 | Redis fully integrated |
| 2 | PostgreSQL schemas created, models ready |
| 3 | Dual-write mode enabled |
| 4 | PostgreSQL primary for billing/inventory |
| 5 | Monitoring, optimization, MongoDB archive |

---

*Last Updated: February 8, 2026*
