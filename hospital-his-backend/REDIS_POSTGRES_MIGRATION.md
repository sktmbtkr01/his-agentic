# Redis & PostgreSQL Migration Documentation

**Migration Date:** February 8, 2026  
**Status:** ✅ Completed Successfully  
**Records Migrated:** 154

---

## Overview

This migration introduces two new database technologies to the hospital HIS backend:

1. **Redis Cloud** - For caching, sessions, and rate limiting
2. **PostgreSQL** - For billing and inventory (ACID transactions, complex queries)

MongoDB remains the primary database for patients, EMR, appointments, and labs.

---

## Architecture After Migration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hospital HIS Backend                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MongoDB    │  │  PostgreSQL  │  │ Redis Cloud  │          │
│  │  (Primary)   │  │  (Billing)   │  │  (Caching)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│  • Patients        • Bills           • Session tokens           │
│  • EMR             • Bill Items      • Health score cache       │
│  • Appointments    • Payments        • Tariff cache             │
│  • Labs            • Audit Trail     • Rate limiting            │
│  • Users           • Inventory       • Distributed locks        │
│  • etc.            • Stock           │                          │
│                    • Transactions    │                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why This Migration?

### PostgreSQL for Billing & Inventory

| Feature | MongoDB | PostgreSQL |
|---------|---------|------------|
| ACID Transactions | ❌ Limited | ✅ Full support |
| Rollback on error | ❌ Manual | ✅ Automatic |
| Complex JOINs | ❌ $lookup | ✅ Native |
| Financial auditing | ⚠️ Workarounds | ✅ Built-in |
| Decimal precision | ⚠️ Floating point | ✅ DECIMAL type |

### Redis for Caching

| Feature | In-Memory Map | Redis |
|---------|---------------|-------|
| Persistence | ❌ Lost on restart | ✅ Persisted |
| Multi-instance | ❌ Not shared | ✅ Shared cache |
| TTL management | ❌ Manual | ✅ Automatic |
| Distributed locks | ❌ None | ✅ Supported |

---

## Files Created

### Configuration Files

| File | Purpose |
|------|---------|
| `config/redis.js` | Redis connection, key prefixes, TTL constants |
| `config/postgres.js` | PostgreSQL/Sequelize connection pool |

### Services

| File | Purpose |
|------|---------|
| `services/cache.service.js` | Unified caching abstraction with Redis + memory fallback |

### PostgreSQL Models (Billing)

| File | Purpose |
|------|---------|
| `models/postgres/Bill.model.js` | Main bill records with auto-numbering |
| `models/postgres/BillItem.model.js` | Line items (services, medicines, etc.) |
| `models/postgres/BillAuditTrail.model.js` | Immutable audit log for compliance |
| `models/postgres/Payment.model.js` | Payment transactions with refund support |

### PostgreSQL Models (Inventory)

| File | Purpose |
|------|---------|
| `models/postgres/InventoryCategory.model.js` | Item categories (hierarchical) |
| `models/postgres/InventoryLocation.model.js` | Warehouses, stores, wards |
| `models/postgres/InventoryItem.model.js` | Item master with reorder policies |
| `models/postgres/InventoryStock.model.js` | Batch-wise stock ledger |
| `models/postgres/InventoryTransaction.model.js` | Immutable stock movement audit |

### Model Index

| File | Purpose |
|------|---------|
| `models/postgres/index.js` | Model initialization and associations |

### Migration Script

| File | Purpose |
|------|---------|
| `migrations/migrate-to-postgres.js` | One-time data migration from MongoDB |

### Environment

| File | Purpose |
|------|---------|
| `.env.example` | Template with all environment variables |

---

## Files Modified

### Server Initialization

**`server.js`**
- Added Redis connection on startup
- Added PostgreSQL connection on startup
- Added graceful shutdown for both connections

```javascript
// Added imports
const { connectRedis, closeRedis } = require('./config/redis');
const { connectPostgres, closePostgres } = require('./config/postgres');

// In startServer():
await connectRedis();
await connectPostgres();
```

### Patient Authentication

**`controllers/patient/patientAuth.controller.js`**
- Changed from in-memory Map to Redis for refresh tokens
- Added memory fallback if Redis unavailable

```javascript
// Before:
const patientRefreshTokens = new Map();

// After:
const cacheService = require('../../services/cache.service');
// Uses cacheService.patientTokens.set/get/delete
```

### Environment Variables

**`.env`**
- Added Redis Cloud credentials
- Added PostgreSQL credentials
- Added feature flags

```env
# Redis
USE_REDIS_CACHE=true
REDIS_HOST=redis-10130.c17.us-east-1-4.ec2.cloud.redislabs.com
REDIS_PORT=10130
REDIS_PASSWORD=****

# PostgreSQL
USE_POSTGRES_BILLING=true
USE_POSTGRES_INVENTORY=true
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=lifeline_his
POSTGRES_USER=postgres
POSTGRES_PASSWORD=****
```

---

## Database Schema (PostgreSQL)

### Bills Table
```sql
CREATE TABLE bills (
    id UUID PRIMARY KEY,
    bill_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id VARCHAR(30),
    visit_id VARCHAR(30),
    visit_type ENUM('opd', 'ipd', 'emergency', 'daycare'),
    status ENUM('draft', 'pending', 'approved', 'paid', 'cancelled'),
    subtotal DECIMAL(12,2),
    total_discount DECIMAL(12,2),
    total_tax DECIMAL(12,2),
    grand_total DECIMAL(12,2),
    paid_amount DECIMAL(12,2),
    balance_amount DECIMAL(12,2),
    ...
);
```

### Inventory Items Table
```sql
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY,
    item_code VARCHAR(30) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES inventory_categories(id),
    uom VARCHAR(20),
    reorder_level INTEGER,
    batch_tracking BOOLEAN,
    expiry_tracking BOOLEAN,
    ...
);
```

---

## Migration Results

| Collection | Source (MongoDB) | Target (PostgreSQL) | Status |
|------------|------------------|---------------------|--------|
| Categories | 15 | 15 | ✅ |
| Locations | 11 | 11 | ✅ |
| Items | 23 | 23 | ✅ |
| Stocks | 24 | 24 | ✅ |
| Bills | 81 | 81 | ✅ |
| Payments | 0 | 0 | ✅ |
| **Total** | **154** | **154** | ✅ |

---

## Feature Flags

The migration uses feature flags for safe rollout:

```env
USE_REDIS_CACHE=true       # Enable Redis caching
USE_POSTGRES_BILLING=true  # Use PostgreSQL for billing
USE_POSTGRES_INVENTORY=true # Use PostgreSQL for inventory
DUAL_WRITE_MODE=true       # Write to both MongoDB and PostgreSQL
```

**Rollback:** Set flags to `false` to revert to MongoDB-only.

---

## Redis Key Structure

```
patient:token:{patientId}     - Refresh tokens (TTL: 7 days)
patient:health:{patientId}    - Health score cache (TTL: 10 min)
tariff:{tariffId}             - Tariff cache (TTL: 1 hour)
ratelimit:{ip}:{endpoint}     - Rate limiting (TTL: 1 min)
lock:{resource}               - Distributed locks (TTL: 30 sec)
```

---

## Connection Details

### Redis Cloud
- **Host:** redis-10130.c17.us-east-1-4.ec2.cloud.redislabs.com
- **Port:** 10130
- **TLS:** No
- **Memory:** 30MB (free tier)

### PostgreSQL
- **Host:** localhost
- **Port:** 5432
- **Database:** lifeline_his
- **User:** postgres

---

## Testing the Migration

```bash
# Test Redis connection
node -e "const Redis = require('ioredis'); const r = new Redis({...}); r.ping().then(console.log);"

# Test PostgreSQL connection
node -e "const {Sequelize} = require('sequelize'); const s = new Sequelize(...); s.authenticate().then(() => console.log('OK'));"

# Start the server
npm run dev
```

---

## Next Steps

1. **Update billing controllers** to use PostgreSQL models
2. **Update inventory controllers** to use PostgreSQL models
3. **Add health score caching** to patient endpoints
4. **Monitor Redis memory usage** in Redis Cloud dashboard
5. **Set up PostgreSQL backups** for production

---

## Rollback Plan

If issues arise:

1. Set feature flags to `false` in `.env`:
   ```env
   USE_REDIS_CACHE=false
   USE_POSTGRES_BILLING=false
   USE_POSTGRES_INVENTORY=false
   ```

2. Restart the server - it will use MongoDB and in-memory caching

3. Data remains in MongoDB (dual-write mode ensures consistency)

---

## Support

For issues with this migration, check:
- `logs/` directory for error logs
- Redis Cloud dashboard for connection issues
- PostgreSQL logs at `C:\Program Files\PostgreSQL\18\data\log\`
