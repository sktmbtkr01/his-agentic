/**
 * InventoryCategory Model (PostgreSQL)
 * Categories and subcategories for inventory items
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InventoryCategory = sequelize.define('InventoryCategory', {
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
        parent_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'inventory_categories',
                key: 'id',
            },
        },
        description: {
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
        tableName: 'inventory_categories',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['parent_id'] },
            { fields: ['is_active'] },
            { fields: ['mongo_id'] },
        ],
    });

    return InventoryCategory;
};
