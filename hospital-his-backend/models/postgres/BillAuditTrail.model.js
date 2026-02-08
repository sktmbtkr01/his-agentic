/**
 * BillAuditTrail Model (PostgreSQL)
 * Immutable audit log for billing actions
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const BillAuditTrail = sequelize.define('BillAuditTrail', {
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
        action: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'created, updated, finalized, discount_requested, discount_approved, discount_rejected, payment_received, cancelled',
        },
        performed_by: {
            type: DataTypes.STRING(30),
            allowNull: false,
            comment: 'MongoDB User ObjectId',
        },
        performed_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        previous_status: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        new_status: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        details: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Additional action details',
        },
    }, {
        tableName: 'bill_audit_trail',
        timestamps: false,  // Use performed_at instead
        underscored: true,
        indexes: [
            { fields: ['bill_id'] },
            { fields: ['performed_at'] },
            { fields: ['action'] },
        ],
    });

    return BillAuditTrail;
};
