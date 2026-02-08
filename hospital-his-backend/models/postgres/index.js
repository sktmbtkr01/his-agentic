/**
 * PostgreSQL Models Index
 * Exports all Sequelize models for billing and inventory
 */

const { getSequelize } = require('../../config/postgres');
const logger = require('../../utils/logger');

// Model definitions
let Bill, BillItem, BillAuditTrail, Payment;
let InventoryCategory, InventoryItem, InventoryLocation, InventoryStock, InventoryTransaction;

/**
 * Initialize all PostgreSQL models
 * Must be called after PostgreSQL connection is established
 */
const initializeModels = () => {
    const sequelize = getSequelize();
    
    if (!sequelize) {
        logger.warn('PostgreSQL not connected - models not initialized');
        return null;
    }

    // Import model definitions
    Bill = require('./Bill.model')(sequelize);
    BillItem = require('./BillItem.model')(sequelize);
    BillAuditTrail = require('./BillAuditTrail.model')(sequelize);
    Payment = require('./Payment.model')(sequelize);
    
    InventoryCategory = require('./InventoryCategory.model')(sequelize);
    InventoryItem = require('./InventoryItem.model')(sequelize);
    InventoryLocation = require('./InventoryLocation.model')(sequelize);
    InventoryStock = require('./InventoryStock.model')(sequelize);
    InventoryTransaction = require('./InventoryTransaction.model')(sequelize);

    // ═══════════════════════════════════════════════════════════════════
    // ASSOCIATIONS
    // ═══════════════════════════════════════════════════════════════════

    // Bill -> BillItems (one-to-many)
    Bill.hasMany(BillItem, { foreignKey: 'bill_id', as: 'items' });
    BillItem.belongsTo(Bill, { foreignKey: 'bill_id', as: 'bill' });

    // Bill -> BillAuditTrail (one-to-many)
    Bill.hasMany(BillAuditTrail, { foreignKey: 'bill_id', as: 'auditTrail' });
    BillAuditTrail.belongsTo(Bill, { foreignKey: 'bill_id', as: 'bill' });

    // Bill -> Payments (one-to-many)
    Bill.hasMany(Payment, { foreignKey: 'bill_id', as: 'payments' });
    Payment.belongsTo(Bill, { foreignKey: 'bill_id', as: 'bill' });

    // InventoryCategory self-referential (parent-child)
    InventoryCategory.hasMany(InventoryCategory, { foreignKey: 'parent_id', as: 'children' });
    InventoryCategory.belongsTo(InventoryCategory, { foreignKey: 'parent_id', as: 'parent' });

    // InventoryLocation self-referential (parent-child)
    InventoryLocation.hasMany(InventoryLocation, { foreignKey: 'parent_id', as: 'children' });
    InventoryLocation.belongsTo(InventoryLocation, { foreignKey: 'parent_id', as: 'parent' });

    // InventoryItem -> InventoryCategory
    InventoryItem.belongsTo(InventoryCategory, { foreignKey: 'category_id', as: 'category' });
    InventoryItem.belongsTo(InventoryCategory, { foreignKey: 'sub_category_id', as: 'subCategory' });
    InventoryCategory.hasMany(InventoryItem, { foreignKey: 'category_id', as: 'items' });

    // InventoryItem -> InventoryLocation (default)
    InventoryItem.belongsTo(InventoryLocation, { foreignKey: 'default_location_id', as: 'defaultLocation' });

    // InventoryStock -> InventoryItem
    InventoryStock.belongsTo(InventoryItem, { foreignKey: 'item_id', as: 'item' });
    InventoryItem.hasMany(InventoryStock, { foreignKey: 'item_id', as: 'stocks' });

    // InventoryStock -> InventoryLocation
    InventoryStock.belongsTo(InventoryLocation, { foreignKey: 'location_id', as: 'location' });
    InventoryLocation.hasMany(InventoryStock, { foreignKey: 'location_id', as: 'stocks' });

    // InventoryTransaction -> InventoryItem
    InventoryTransaction.belongsTo(InventoryItem, { foreignKey: 'item_id', as: 'item' });
    InventoryItem.hasMany(InventoryTransaction, { foreignKey: 'item_id', as: 'transactions' });

    // InventoryTransaction -> InventoryStock
    InventoryTransaction.belongsTo(InventoryStock, { foreignKey: 'stock_id', as: 'stock' });
    
    // InventoryTransaction -> InventoryLocation
    InventoryTransaction.belongsTo(InventoryLocation, { foreignKey: 'location_id', as: 'location' });

    logger.info('PostgreSQL models initialized with associations');

    return {
        Bill,
        BillItem,
        BillAuditTrail,
        Payment,
        InventoryCategory,
        InventoryItem,
        InventoryLocation,
        InventoryStock,
        InventoryTransaction,
    };
};

/**
 * Get models (must call initializeModels first)
 */
const getModels = () => ({
    Bill,
    BillItem,
    BillAuditTrail,
    Payment,
    InventoryCategory,
    InventoryItem,
    InventoryLocation,
    InventoryStock,
    InventoryTransaction,
});

module.exports = {
    initializeModels,
    getModels,
};
