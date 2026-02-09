/**
 * Billing PostgreSQL Service
 * Handles dual-write synchronization between MongoDB and PostgreSQL for billing
 */

const { getModels } = require('../models/postgres');
const { isPostgresConnected, withTransaction } = require('../config/postgres');
const logger = require('../utils/logger');

/**
 * Check if dual-write is enabled
 */
const isDualWriteEnabled = () => {
    const usePostgresBilling = process.env.USE_POSTGRES_BILLING === 'true';
    const dualWriteMode = process.env.DUAL_WRITE_MODE === 'true';
    const pgConnected = isPostgresConnected();

    logger.info(`🔍 Dual-write check: USE_POSTGRES_BILLING=${usePostgresBilling}, DUAL_WRITE_MODE=${dualWriteMode}, isPostgresConnected=${pgConnected}`);

    return usePostgresBilling && dualWriteMode && pgConnected;
};

/**
 * Map MongoDB billing document to PostgreSQL Bill format
 */
const mapBillToPostgres = (mongoBill) => {
    return {
        bill_number: mongoBill.billNumber,
        patient_id: mongoBill.patient?.toString() || mongoBill.patient,
        visit_id: mongoBill.visit?.toString() || null,
        visit_model: mongoBill.visitModel || null,
        visit_type: mongoBill.visitType || 'opd',
        bill_date: mongoBill.billDate || new Date(),
        status: mongoBill.status || 'draft',
        subtotal: mongoBill.subtotal || 0,
        total_discount: mongoBill.totalDiscount || 0,
        total_tax: mongoBill.totalTax || 0,
        grand_total: mongoBill.grandTotal || 0,
        paid_amount: mongoBill.paidAmount || 0,
        balance_amount: mongoBill.balanceAmount || 0,
        payment_status: mongoBill.paymentStatus || 'pending',
        insurance_claim_id: mongoBill.insuranceClaim?.toString() || null,
        insurance_status: mongoBill.insuranceStatus || 'none',
        patient_responsibility: mongoBill.paymentResponsibility?.patientAmount || 0,
        insurance_responsibility: mongoBill.paymentResponsibility?.insuranceAmount || 0,
        discount_request_amount: mongoBill.discountRequest?.amount || 0,
        discount_request_reason: mongoBill.discountRequest?.reason || null,
        discount_requested_by: mongoBill.discountRequest?.requestedBy?.toString() || null,
        discount_requested_at: mongoBill.discountRequest?.requestedAt || null,
        discount_status: mongoBill.discountRequest?.status || 'none',
        discount_approved_by: mongoBill.discountApprovedBy?.toString() || null,
        discount_approval_date: mongoBill.discountApprovalDate || null,
        discount_rejection_reason: mongoBill.discountRejectionReason || null,
        is_locked: mongoBill.isLocked || false,
        locked_at: mongoBill.lockedAt || null,
        locked_by: mongoBill.lockedBy?.toString() || null,
        generated_by: mongoBill.generatedBy?.toString() || mongoBill.generatedBy,
        mongo_id: mongoBill._id?.toString() || mongoBill.id,
    };
};

/**
 * Map MongoDB billing item to PostgreSQL BillItem format
 */
const mapBillItemToPostgres = (item, pgBillId) => {
    return {
        bill_id: pgBillId,
        item_type: item.itemType,
        item_reference: item.itemReference?.toString() || null,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        discount: item.discount || 0,
        tax: item.tax || 0,
        net_amount: item.netAmount,
        is_billed: item.isBilled !== false,
        billed_at: item.billedAt || new Date(),
        is_system_generated: item.isSystemGenerated || false,
    };
};

/**
 * Sync a bill to PostgreSQL (create or update)
 */
const syncBillToPostgres = async (mongoBill) => {
    if (!isDualWriteEnabled()) {
        return null;
    }

    try {
        const { Bill, BillItem, BillAuditTrail } = getModels();

        if (!Bill) {
            logger.warn('PostgreSQL models not initialized');
            return null;
        }

        const mongoId = mongoBill._id?.toString() || mongoBill.id;
        const billData = mapBillToPostgres(mongoBill);

        // Use transaction for atomicity
        const result = await withTransaction(async (transaction) => {
            // Check if bill already exists in PostgreSQL
            let pgBill = await Bill.findOne({
                where: { mongo_id: mongoId },
                transaction
            });

            if (pgBill) {
                // Update existing bill
                await pgBill.update(billData, { transaction });
            } else {
                // Create new bill
                pgBill = await Bill.create(billData, { transaction });
            }

            // Sync bill items - delete existing and recreate
            await BillItem.destroy({
                where: { bill_id: pgBill.id },
                transaction
            });

            if (mongoBill.items && mongoBill.items.length > 0) {
                const itemsData = mongoBill.items.map(item =>
                    mapBillItemToPostgres(item, pgBill.id)
                );
                await BillItem.bulkCreate(itemsData, { transaction });
            }

            // Sync audit trail entries (append new ones)
            if (mongoBill.auditTrail && mongoBill.auditTrail.length > 0) {
                const existingAuditCount = await BillAuditTrail.count({
                    where: { bill_id: pgBill.id },
                    transaction
                });

                // Only add new audit entries
                const newAuditEntries = mongoBill.auditTrail.slice(existingAuditCount);

                if (newAuditEntries.length > 0) {
                    const auditData = newAuditEntries.map(entry => ({
                        bill_id: pgBill.id,
                        action: entry.action,
                        performed_by: entry.performedBy?.toString() || 'system',
                        performed_at: entry.performedAt || new Date(),
                        details: entry.details ? JSON.stringify(entry.details) : null,
                        previous_status: entry.previousStatus || null,
                        new_status: entry.newStatus || null,
                    }));
                    await BillAuditTrail.bulkCreate(auditData, { transaction });
                }
            }

            logger.debug(`Bill ${mongoBill.billNumber} synced to PostgreSQL (id: ${pgBill.id})`);
            return pgBill;
        });

        return result;
    } catch (error) {
        logger.error(`Failed to sync bill to PostgreSQL: ${error.message}`);
        // Don't throw - allow MongoDB operation to succeed even if PostgreSQL fails
        return null;
    }
};

/**
 * Sync a payment to PostgreSQL
 */
const syncPaymentToPostgres = async (mongoBill, paymentData) => {
    if (!isDualWriteEnabled()) {
        return null;
    }

    try {
        const { Bill, Payment } = getModels();

        if (!Bill || !Payment) {
            logger.warn('PostgreSQL models not initialized');
            return null;
        }

        const mongoId = mongoBill._id?.toString() || mongoBill.id;

        // Find the PostgreSQL bill
        const pgBill = await Bill.findOne({ where: { mongo_id: mongoId } });

        if (!pgBill) {
            logger.warn(`PostgreSQL bill not found for mongo_id: ${mongoId}`);
            // Try to sync the bill first
            await syncBillToPostgres(mongoBill);
            return null;
        }

        // Create payment in PostgreSQL
        const result = await withTransaction(async (transaction) => {
            const pgPayment = await Payment.create({
                bill_id: pgBill.id,
                patient_id: mongoBill.patient?.toString() || mongoBill.patient,
                amount: paymentData.amount,
                payment_mode: paymentData.mode || 'cash',
                transaction_id: paymentData.reference || null,
                remarks: paymentData.notes || null,
                collected_by: paymentData.receivedBy?.toString() || 'system',
                payment_date: new Date(),
            }, { transaction });

            // Update bill totals (hooks should handle this, but be explicit)
            pgBill.paid_amount = parseFloat(pgBill.paid_amount) + parseFloat(paymentData.amount);
            pgBill.balance_amount = parseFloat(pgBill.grand_total) - parseFloat(pgBill.paid_amount);

            if (pgBill.paid_amount >= pgBill.grand_total) {
                pgBill.payment_status = 'paid';
            } else if (pgBill.paid_amount > 0) {
                pgBill.payment_status = 'partial';
            }

            await pgBill.save({ transaction });

            logger.debug(`Payment synced to PostgreSQL (receipt: ${pgPayment.receipt_number})`);
            return pgPayment;
        });

        return result;
    } catch (error) {
        logger.error(`Failed to sync payment to PostgreSQL: ${error.message}`);
        return null;
    }
};

/**
 * Delete a bill from PostgreSQL
 */
const deleteBillFromPostgres = async (mongoId) => {
    if (!isDualWriteEnabled()) {
        return;
    }

    try {
        const { Bill, BillItem, BillAuditTrail, Payment } = getModels();

        const pgBill = await Bill.findOne({ where: { mongo_id: mongoId } });

        if (pgBill) {
            await withTransaction(async (transaction) => {
                await Payment.destroy({ where: { bill_id: pgBill.id }, transaction });
                await BillAuditTrail.destroy({ where: { bill_id: pgBill.id }, transaction });
                await BillItem.destroy({ where: { bill_id: pgBill.id }, transaction });
                await pgBill.destroy({ transaction });
            });

            logger.debug(`Bill deleted from PostgreSQL (mongo_id: ${mongoId})`);
        }
    } catch (error) {
        logger.error(`Failed to delete bill from PostgreSQL: ${error.message}`);
    }
};

module.exports = {
    isDualWriteEnabled,
    syncBillToPostgres,
    syncPaymentToPostgres,
    deleteBillFromPostgres,
    mapBillToPostgres,
    mapBillItemToPostgres,
};
