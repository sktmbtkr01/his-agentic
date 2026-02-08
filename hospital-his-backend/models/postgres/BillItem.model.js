/**
 * BillItem Model (PostgreSQL)
 * Line items for each bill
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const BillItem = sequelize.define('BillItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        bill_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'bills',
                key: 'id',
            },
        },
        item_type: {
            type: DataTypes.ENUM(
                'consultation', 'procedure', 'lab', 'radiology', 
                'medicine', 'bed', 'surgery', 'nursing', 'other'
            ),
            allowNull: false,
        },
        item_reference: {
            type: DataTypes.STRING(30),
            allowNull: true,
            comment: 'MongoDB ObjectId reference to source item',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        rate: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        discount: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0,
        },
        tax: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0,
        },
        net_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        is_billed: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        billed_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        is_system_generated: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        tableName: 'bill_items',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['bill_id'] },
            { fields: ['item_type'] },
        ],
        hooks: {
            beforeSave: (item) => {
                // Calculate amount and net_amount
                item.amount = parseFloat(item.quantity) * parseFloat(item.rate);
                item.net_amount = item.amount - parseFloat(item.discount || 0) + parseFloat(item.tax || 0);
            },
        },
    });

    return BillItem;
};
