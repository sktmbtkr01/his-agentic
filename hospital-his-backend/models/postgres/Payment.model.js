/**
 * Payment Model (PostgreSQL)
 * Payment transactions with full ACID support
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        receipt_number: {
            type: DataTypes.STRING(20),
            unique: true,
            allowNull: false,
        },
        bill_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'bills',
                key: 'id',
            },
        },
        patient_id: {
            type: DataTypes.STRING(30),
            allowNull: false,
            comment: 'MongoDB Patient ObjectId',
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        payment_mode: {
            type: DataTypes.ENUM('cash', 'card', 'upi', 'cheque', 'neft', 'rtgs', 'insurance', 'wallet'),
            allowNull: false,
        },
        // Payment details (stored as separate columns for better querying)
        transaction_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        card_last4: {
            type: DataTypes.STRING(4),
            allowNull: true,
        },
        bank_name: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        cheque_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        upi_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        payment_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        collected_by: {
            type: DataTypes.STRING(30),
            allowNull: false,
            comment: 'MongoDB User ObjectId',
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_refunded: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        refunded_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        refund_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // MongoDB reference for backward compatibility
        mongo_id: {
            type: DataTypes.STRING(30),
            allowNull: true,
            comment: 'Original MongoDB ObjectId (for migration)',
        },
    }, {
        tableName: 'payments',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['bill_id'] },
            { fields: ['patient_id'] },
            { fields: ['payment_date'] },
            { fields: ['payment_mode'] },
            { fields: ['mongo_id'] },
        ],
        hooks: {
            beforeCreate: async (payment) => {
                // Auto-generate receipt number
                if (!payment.receipt_number) {
                    const today = new Date();
                    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
                    const count = await Payment.count();
                    payment.receipt_number = `RCP${dateStr}${String(count + 1).padStart(5, '0')}`;
                }
            },
            afterCreate: async (payment, options) => {
                // Update bill's paid amount
                const Bill = sequelize.models.Bill;
                const bill = await Bill.findByPk(payment.bill_id, { transaction: options.transaction });
                
                if (bill) {
                    bill.paid_amount = parseFloat(bill.paid_amount) + parseFloat(payment.amount);
                    await bill.save({ transaction: options.transaction });
                }
            },
        },
    });

    /**
     * Process a refund
     */
    Payment.prototype.processRefund = async function(reason, transaction = null) {
        this.is_refunded = true;
        this.refunded_at = new Date();
        this.refund_reason = reason;
        await this.save({ transaction });

        // Update bill's paid amount
        const Bill = sequelize.models.Bill;
        const bill = await Bill.findByPk(this.bill_id, { transaction });
        
        if (bill) {
            bill.paid_amount = parseFloat(bill.paid_amount) - parseFloat(this.amount);
            await bill.save({ transaction });
        }
    };

    return Payment;
};
