/**
 * InventoryLocation Model (PostgreSQL)
 * Stores, wards, and departments for inventory
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InventoryLocation = sequelize.define('InventoryLocation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(20),
            unique: true,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('store', 'warehouse', 'sub-store', 'ward', 'department', 'pharmacy', 'ot'),
            allowNull: false,
        },
        parent_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'inventory_locations',
                key: 'id',
            },
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        // MongoDB reference for migration
        mongo_id: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
    }, {
        tableName: 'inventory_locations',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['type'] },
            { fields: ['parent_id'] },
            { fields: ['is_active'] },
            { fields: ['mongo_id'] },
        ],
    });

    return InventoryLocation;
};
