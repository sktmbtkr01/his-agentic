/**
 * InventoryTransaction Model (PostgreSQL)
 * Immutable audit trail for all stock movements
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InventoryTransaction = sequelize.define('InventoryTransaction', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        transaction_number: {
            type: DataTypes.STRING(30),
            unique: true,
            allowNull: false,
        },
        item_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'inventory_items',
                key: 'id',
            },
        },
        stock_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'inventory_stock',
                key: 'id',
            },
        },
        location_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'inventory_locations',
                key: 'id',
            },
        },
        transaction_type: {
            type: DataTypes.ENUM(
                'stock-in', 'stock-out', 'adjustment', 
                'transfer-in', 'transfer-out', 'return',
                'issue', 'receipt', 'write-off'
            ),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        previous_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        new_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        rate: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        // Reference to source document
        reference_type: {
            type: DataTypes.STRING(30),
            allowNull: true,
            comment: 'prescription, po, grn, return, transfer',
        },
        reference_id: {
            type: DataTypes.STRING(30),
            allowNull: true,
            comment: 'MongoDB ObjectId of source document',
        },
        department_id: {
            type: DataTypes.STRING(30),
            allowNull: true,
            comment: 'MongoDB Department ObjectId',
        },
        issued_to: {
            type: DataTypes.STRING(30),
            allowNull: true,
            comment: 'MongoDB User ObjectId (for issues)',
        },
        supplier: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        invoice_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        batch_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_by: {
            type: DataTypes.STRING(30),
            allowNull: false,
            comment: 'MongoDB User ObjectId',
        },
        // MongoDB reference for migration
        mongo_id: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
    }, {
        tableName: 'inventory_transactions',
        timestamps: true,
        updatedAt: false,  // Transactions are immutable
        underscored: true,
        indexes: [
            { fields: ['item_id'] },
            { fields: ['stock_id'] },
            { fields: ['location_id'] },
            { fields: ['transaction_type'] },
            { fields: ['created_at'] },
            { fields: ['reference_type', 'reference_id'] },
            { fields: ['mongo_id'] },
        ],
        hooks: {
            beforeCreate: async (txn) => {
                // Auto-generate transaction number
                if (!txn.transaction_number) {
                    const today = new Date();
                    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
                    const count = await InventoryTransaction.count();
                    txn.transaction_number = `INV${dateStr}${String(count + 1).padStart(5, '0')}`;
                }
                
                // Calculate total amount
                if (txn.rate && txn.quantity) {
                    txn.total_amount = parseFloat(txn.rate) * Math.abs(txn.quantity);
                }
            },
        },
    });

    /**
     * Static method to create a transaction record
     */
    InventoryTransaction.createRecord = async function(data, transaction = null) {
        return await InventoryTransaction.create(data, { transaction });
    };

    /**
     * Get transaction history for an item
     */
    InventoryTransaction.getItemHistory = async function(itemId, limit = 100) {
        return await InventoryTransaction.findAll({
            where: { item_id: itemId },
            order: [['created_at', 'DESC']],
            limit,
            include: [
                { model: sequelize.models.InventoryItem, as: 'item' },
                { model: sequelize.models.InventoryLocation, as: 'location' },
            ],
        });
    };

    return InventoryTransaction;
};
