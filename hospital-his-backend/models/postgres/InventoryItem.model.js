/**
 * InventoryItem Model (PostgreSQL)
 * Master data for inventory items
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InventoryItem = sequelize.define('InventoryItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        item_code: {
            type: DataTypes.STRING(30),
            unique: true,
            allowNull: false,
        },
        item_name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        category_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'inventory_categories',
                key: 'id',
            },
        },
        sub_category_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'inventory_categories',
                key: 'id',
            },
        },
        uom: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Unit of Measure: PCS, KG, LTR, BOX, SET',
        },
        reorder_level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: 0 },
        },
        max_stock_level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: 0 },
        },
        batch_tracking: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        expiry_tracking: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        hsn_code: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        gst_rate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
        },
        specifications: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        default_location_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'inventory_locations',
                key: 'id',
            },
        },
        status: {
            type: DataTypes.ENUM('available', 'low_stock', 'out_of_stock', 'discontinued'),
            defaultValue: 'available',
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        // Policy fields for agentic reorder
        policy_min_level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        policy_max_level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        policy_reorder_qty: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        policy_lead_time_days: {
            type: DataTypes.INTEGER,
            defaultValue: 7,
        },
        policy_auto_reorder: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        created_by: {
            type: DataTypes.STRING(30),
            allowNull: true,
            comment: 'MongoDB User ObjectId',
        },
        // MongoDB reference for migration
        mongo_id: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
    }, {
        tableName: 'inventory_items',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['category_id'] },
            { fields: ['status'] },
            { fields: ['is_active'] },
            { fields: ['mongo_id'] },
            { fields: ['item_name'] },
        ],
    });

    /**
     * Calculate total stock across all locations
     */
    InventoryItem.prototype.getTotalStock = async function() {
        const InventoryStock = sequelize.models.InventoryStock;
        const result = await InventoryStock.sum('quantity', {
            where: { item_id: this.id },
        });
        return result || 0;
    };

    /**
     * Check if item needs reorder
     */
    InventoryItem.prototype.needsReorder = async function() {
        const totalStock = await this.getTotalStock();
        return totalStock <= this.reorder_level;
    };

    return InventoryItem;
};
