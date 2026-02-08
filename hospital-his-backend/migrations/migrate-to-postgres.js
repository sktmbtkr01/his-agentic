/**
 * MongoDB to PostgreSQL Data Migration Script
 * Migrates billing and inventory data from MongoDB to PostgreSQL
 * 
 * RUN: node migrations/migrate-to-postgres.js
 * 
 * This script should be run once after setting up PostgreSQL.
 * It's idempotent - running it multiple times won't create duplicates.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

// MongoDB Models
const BillingMongo = require('../models/Billing');
const PaymentMongo = require('../models/Payment');
const InventoryItemMongo = require('../models/InventoryItem');
const InventoryStockMongo = require('../models/InventoryStock');
const InventoryTransactionMongo = require('../models/InventoryTransaction');
const InventoryCategoryMongo = require('../models/InventoryCategory');
const LocationMongo = require('../models/Location');

// PostgreSQL connection
const postgresConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'lifeline_his',
    username: process.env.POSTGRES_USER || 'lifeline',
    password: process.env.POSTGRES_PASSWORD || '',
    dialect: 'postgres',
    logging: false,
};

let sequelize;
let pgModels;

// Migration statistics
const stats = {
    bills: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    payments: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    categories: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    locations: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    items: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    stocks: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    transactions: { total: 0, migrated: 0, skipped: 0, errors: 0 },
};

/**
 * Connect to both databases
 */
async function connectDatabases() {
    // MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // PostgreSQL
    console.log('🐘 Connecting to PostgreSQL...');
    sequelize = new Sequelize(
        postgresConfig.database,
        postgresConfig.username,
        postgresConfig.password,
        postgresConfig
    );
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    // Initialize models directly with our sequelize instance
    const Bill = require('../models/postgres/Bill.model')(sequelize);
    const BillItem = require('../models/postgres/BillItem.model')(sequelize);
    const BillAuditTrail = require('../models/postgres/BillAuditTrail.model')(sequelize);
    const Payment = require('../models/postgres/Payment.model')(sequelize);
    const InventoryCategory = require('../models/postgres/InventoryCategory.model')(sequelize);
    const InventoryItem = require('../models/postgres/InventoryItem.model')(sequelize);
    const InventoryLocation = require('../models/postgres/InventoryLocation.model')(sequelize);
    const InventoryStock = require('../models/postgres/InventoryStock.model')(sequelize);
    const InventoryTransaction = require('../models/postgres/InventoryTransaction.model')(sequelize);

    // Set up associations
    Bill.hasMany(BillItem, { foreignKey: 'bill_id', as: 'items' });
    BillItem.belongsTo(Bill, { foreignKey: 'bill_id', as: 'bill' });
    Bill.hasMany(BillAuditTrail, { foreignKey: 'bill_id', as: 'auditTrail' });
    Bill.hasMany(Payment, { foreignKey: 'bill_id', as: 'payments' });
    Payment.belongsTo(Bill, { foreignKey: 'bill_id', as: 'bill' });

    pgModels = {
        Bill, BillItem, BillAuditTrail, Payment,
        InventoryCategory, InventoryItem, InventoryLocation, InventoryStock, InventoryTransaction
    };
    
    // Sync tables (force: true on first run to create clean tables)
    await sequelize.sync({ force: true });
    console.log('✅ PostgreSQL tables created');
}

/**
 * Migrate inventory categories
 */
async function migrateCategories() {
    console.log('\n📁 Migrating Inventory Categories...');
    
    const categories = await InventoryCategoryMongo.find({}).lean();
    stats.categories.total = categories.length;

    for (const cat of categories) {
        try {
            // Check if already migrated
            const existing = await pgModels.InventoryCategory.findOne({
                where: { mongo_id: cat._id.toString() }
            });

            if (existing) {
                stats.categories.skipped++;
                continue;
            }

            await pgModels.InventoryCategory.create({
                name: cat.categoryName || cat.name,
                code: cat.categoryCode || cat.code || `CAT${Date.now()}`,
                description: cat.description,
                is_active: cat.isActive !== false,
                mongo_id: cat._id.toString(),
            });
            
            stats.categories.migrated++;
        } catch (error) {
            console.error(`  ❌ Category ${cat.categoryName || cat.name}: ${error.message}`);
            stats.categories.errors++;
        }
    }

    console.log(`  ✅ Categories: ${stats.categories.migrated} migrated, ${stats.categories.skipped} skipped, ${stats.categories.errors} errors`);
}

/**
 * Migrate inventory locations
 */
async function migrateLocations() {
    console.log('\n📍 Migrating Inventory Locations...');
    
    const locations = await LocationMongo.find({}).lean();
    stats.locations.total = locations.length;

    for (const loc of locations) {
        try {
            const existing = await pgModels.InventoryLocation.findOne({
                where: { mongo_id: loc._id.toString() }
            });

            if (existing) {
                stats.locations.skipped++;
                continue;
            }

            await pgModels.InventoryLocation.create({
                name: loc.locationName || loc.name,
                code: loc.locationCode || loc.code || `LOC${Date.now()}`,
                type: loc.locationType || loc.type || 'store',
                address: loc.address,
                is_active: loc.isActive !== false,
                mongo_id: loc._id.toString(),
            });
            
            stats.locations.migrated++;
        } catch (error) {
            console.error(`  ❌ Location ${loc.locationName || loc.name}: ${error.message}`);
            stats.locations.errors++;
        }
    }

    console.log(`  ✅ Locations: ${stats.locations.migrated} migrated, ${stats.locations.skipped} skipped, ${stats.locations.errors} errors`);
}

/**
 * Migrate inventory items
 */
async function migrateInventoryItems() {
    console.log('\n📦 Migrating Inventory Items...');
    
    const items = await InventoryItemMongo.find({}).lean();
    stats.items.total = items.length;

    for (const item of items) {
        try {
            const existing = await pgModels.InventoryItem.findOne({
                where: { mongo_id: item._id.toString() }
            });

            if (existing) {
                stats.items.skipped++;
                continue;
            }

            // Find category in PostgreSQL
            let categoryId = null;
            if (item.category) {
                const pgCat = await pgModels.InventoryCategory.findOne({
                    where: { mongo_id: item.category.toString() }
                });
                categoryId = pgCat?.id;
            }

            // Find location in PostgreSQL
            let locationId = null;
            if (item.defaultLocation) {
                const pgLoc = await pgModels.InventoryLocation.findOne({
                    where: { mongo_id: item.defaultLocation.toString() }
                });
                locationId = pgLoc?.id;
            }

            await pgModels.InventoryItem.create({
                item_code: item.itemCode,
                item_name: item.itemName,
                description: item.description,
                category_id: categoryId,
                uom: item.uom || 'PCS',
                reorder_level: item.reorderLevel || 0,
                max_stock_level: item.maxStockLevel || 0,
                batch_tracking: item.batchTracking || false,
                expiry_tracking: item.expiryTracking || false,
                hsn_code: item.hsnCode,
                gst_rate: item.gstRate || 0,
                specifications: item.specifications,
                default_location_id: locationId,
                status: item.status || 'available',
                is_active: item.isActive !== false,
                policy_min_level: item.policy?.minLevel || 0,
                policy_max_level: item.policy?.maxLevel || 0,
                policy_reorder_qty: item.policy?.reorderQty || 0,
                policy_lead_time_days: item.policy?.leadTimeDays || 7,
                policy_auto_reorder: item.policy?.autoReorder || false,
                created_by: item.createdBy?.toString(),
                mongo_id: item._id.toString(),
            });
            
            stats.items.migrated++;
        } catch (error) {
            console.error(`  ❌ Item ${item.itemCode}: ${error.message}`);
            stats.items.errors++;
        }
    }

    console.log(`  ✅ Items: ${stats.items.migrated} migrated, ${stats.items.skipped} skipped, ${stats.items.errors} errors`);
}

/**
 * Migrate inventory stock
 */
async function migrateInventoryStock() {
    console.log('\n📊 Migrating Inventory Stock...');
    
    const stocks = await InventoryStockMongo.find({}).lean();
    stats.stocks.total = stocks.length;

    for (const stock of stocks) {
        try {
            const existing = await pgModels.InventoryStock.findOne({
                where: { mongo_id: stock._id.toString() }
            });

            if (existing) {
                stats.stocks.skipped++;
                continue;
            }

            // Find item in PostgreSQL
            const pgItem = await pgModels.InventoryItem.findOne({
                where: { mongo_id: stock.item?.toString() }
            });
            if (!pgItem) {
                console.error(`  ⚠️ Stock skipped - item not found: ${stock.item}`);
                stats.stocks.errors++;
                continue;
            }

            // Find location in PostgreSQL
            const pgLoc = await pgModels.InventoryLocation.findOne({
                where: { mongo_id: stock.location?.toString() }
            });
            if (!pgLoc) {
                console.error(`  ⚠️ Stock skipped - location not found: ${stock.location}`);
                stats.stocks.errors++;
                continue;
            }

            await pgModels.InventoryStock.create({
                item_id: pgItem.id,
                location_id: pgLoc.id,
                batch_number: stock.batchNumber,
                expiry_date: stock.expiryDate,
                manufacturing_date: stock.manufacturingDate,
                quantity: stock.quantity || 0,
                reserved_quantity: stock.reservedQuantity || 0,
                purchase_rate: stock.purchaseRate || 0,
                selling_rate: stock.sellingRate || 0,
                status: stock.status || 'available',
                is_blocked: stock.isBlocked || false,
                block_reason: stock.blockReason,
                blocked_by: stock.blockedBy?.toString(),
                blocked_at: stock.blockedAt,
                last_movement_date: stock.lastMovementDate,
                last_movement_type: stock.lastMovementType,
                created_by: stock.createdBy?.toString() || 'migration',
                mongo_id: stock._id.toString(),
            });
            
            stats.stocks.migrated++;
        } catch (error) {
            console.error(`  ❌ Stock ${stock._id}: ${error.message}`);
            stats.stocks.errors++;
        }
    }

    console.log(`  ✅ Stock: ${stats.stocks.migrated} migrated, ${stats.stocks.skipped} skipped, ${stats.stocks.errors} errors`);
}

/**
 * Migrate bills
 */
async function migrateBills() {
    console.log('\n💰 Migrating Bills...');
    
    const bills = await BillingMongo.find({}).lean();
    stats.bills.total = bills.length;

    for (const bill of bills) {
        try {
            const existing = await pgModels.Bill.findOne({
                where: { mongo_id: bill._id.toString() }
            });

            if (existing) {
                stats.bills.skipped++;
                continue;
            }

            // Create bill
            const pgBill = await pgModels.Bill.create({
                bill_number: bill.billNumber,
                patient_id: bill.patient?.toString(),
                visit_id: bill.visit?.toString(),
                visit_model: bill.visitModel,
                visit_type: bill.visitType || 'opd',
                bill_date: bill.billDate,
                status: bill.status || 'draft',
                subtotal: bill.subtotal || 0,
                total_discount: bill.totalDiscount || 0,
                total_tax: bill.totalTax || 0,
                grand_total: bill.grandTotal || 0,
                paid_amount: bill.paidAmount || 0,
                balance_amount: bill.balanceAmount || 0,
                payment_status: bill.paymentStatus || 'pending',
                insurance_claim_id: bill.insuranceClaim?.toString(),
                insurance_status: bill.insuranceStatus || 'none',
                patient_responsibility: bill.paymentResponsibility?.patientAmount || 0,
                insurance_responsibility: bill.paymentResponsibility?.insuranceAmount || 0,
                discount_request_amount: bill.discountRequest?.amount || 0,
                discount_request_reason: bill.discountRequest?.reason,
                discount_requested_by: bill.discountRequest?.requestedBy?.toString(),
                discount_requested_at: bill.discountRequest?.requestedAt,
                discount_status: bill.discountRequest?.status || 'none',
                discount_approved_by: bill.discountApprovedBy?.toString(),
                discount_approval_date: bill.discountApprovalDate,
                discount_rejection_reason: bill.discountRejectionReason,
                is_locked: bill.isLocked || false,
                locked_at: bill.lockedAt,
                locked_by: bill.lockedBy?.toString(),
                generated_by: bill.generatedBy?.toString() || 'migration',
                mongo_id: bill._id.toString(),
            });

            // Migrate bill items
            if (bill.items && bill.items.length > 0) {
                for (const item of bill.items) {
                    await pgModels.BillItem.create({
                        bill_id: pgBill.id,
                        item_type: item.itemType,
                        item_reference: item.itemReference?.toString(),
                        description: item.description,
                        quantity: item.quantity || 1,
                        rate: item.rate || 0,
                        amount: item.amount || 0,
                        discount: item.discount || 0,
                        tax: item.tax || 0,
                        net_amount: item.netAmount || item.amount || 0,
                        is_billed: item.isBilled !== false,
                        billed_at: item.billedAt,
                        is_system_generated: item.isSystemGenerated || false,
                    });
                }
            }

            // Migrate audit trail
            if (bill.auditTrail && bill.auditTrail.length > 0) {
                for (const audit of bill.auditTrail) {
                    await pgModels.BillAuditTrail.create({
                        bill_id: pgBill.id,
                        action: audit.action,
                        performed_by: audit.performedBy?.toString() || 'migration',
                        performed_at: audit.performedAt,
                        previous_status: audit.previousStatus,
                        new_status: audit.newStatus,
                        details: audit.details,
                    });
                }
            }

            stats.bills.migrated++;
        } catch (error) {
            console.error(`  ❌ Bill ${bill.billNumber}: ${error.message}`);
            stats.bills.errors++;
        }
    }

    console.log(`  ✅ Bills: ${stats.bills.migrated} migrated, ${stats.bills.skipped} skipped, ${stats.bills.errors} errors`);
}

/**
 * Migrate payments
 */
async function migratePayments() {
    console.log('\n💳 Migrating Payments...');
    
    const payments = await PaymentMongo.find({}).lean();
    stats.payments.total = payments.length;

    for (const payment of payments) {
        try {
            const existing = await pgModels.Payment.findOne({
                where: { mongo_id: payment._id.toString() }
            });

            if (existing) {
                stats.payments.skipped++;
                continue;
            }

            // Find bill in PostgreSQL
            const pgBill = await pgModels.Bill.findOne({
                where: { mongo_id: payment.bill?.toString() }
            });

            if (!pgBill) {
                console.error(`  ⚠️ Payment skipped - bill not found: ${payment.bill}`);
                stats.payments.errors++;
                continue;
            }

            await pgModels.Payment.create({
                receipt_number: payment.receiptNumber,
                bill_id: pgBill.id,
                patient_id: payment.patient?.toString(),
                amount: payment.amount || 0,
                payment_mode: payment.paymentMode,
                transaction_id: payment.paymentDetails?.transactionId,
                card_last4: payment.paymentDetails?.cardLast4,
                bank_name: payment.paymentDetails?.bankName,
                cheque_number: payment.paymentDetails?.chequeNumber,
                upi_id: payment.paymentDetails?.upiId,
                payment_date: payment.paymentDate,
                collected_by: payment.collectedBy?.toString() || 'migration',
                remarks: payment.remarks,
                is_refunded: payment.isRefunded || false,
                refunded_at: payment.refundedAt,
                refund_reason: payment.refundReason,
                mongo_id: payment._id.toString(),
            });

            stats.payments.migrated++;
        } catch (error) {
            console.error(`  ❌ Payment ${payment.receiptNumber}: ${error.message}`);
            stats.payments.errors++;
        }
    }

    console.log(`  ✅ Payments: ${stats.payments.migrated} migrated, ${stats.payments.skipped} skipped, ${stats.payments.errors} errors`);
}

/**
 * Print final report
 */
function printReport() {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    MIGRATION REPORT                            ');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const collections = ['categories', 'locations', 'items', 'stocks', 'bills', 'payments'];
    let totalMigrated = 0;
    let totalErrors = 0;

    for (const col of collections) {
        const s = stats[col];
        console.log(`${col.padEnd(15)} | Total: ${String(s.total).padStart(5)} | Migrated: ${String(s.migrated).padStart(5)} | Skipped: ${String(s.skipped).padStart(5)} | Errors: ${String(s.errors).padStart(5)}`);
        totalMigrated += s.migrated;
        totalErrors += s.errors;
    }

    console.log('───────────────────────────────────────────────────────────────');
    console.log(`Total Migrated: ${totalMigrated} | Total Errors: ${totalErrors}`);
    console.log('═══════════════════════════════════════════════════════════════');
}

/**
 * Main migration runner
 */
async function runMigration() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('     MongoDB → PostgreSQL Migration Script                     ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Started at: ${new Date().toISOString()}`);

    try {
        await connectDatabases();

        // Run migrations in order (dependencies first)
        await migrateCategories();
        await migrateLocations();
        await migrateInventoryItems();
        await migrateInventoryStock();
        await migrateBills();
        await migratePayments();

        printReport();
        
        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
    } finally {
        // Cleanup
        await mongoose.disconnect();
        if (sequelize) await sequelize.close();
        console.log('\n🔌 Database connections closed');
    }
}

// Run migration
runMigration();
