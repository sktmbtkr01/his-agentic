/**
 * InventoryStock Model (PostgreSQL)
 * Batch-wise stock ledger at each location
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InventoryStock = sequelize.define('InventoryStock', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        item_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'inventory_items',
                key: 'id',
            },
        },
        location_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'inventory_locations',
                key: 'id',
            },
        },
        batch_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        manufacturing_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
        },
        reserved_quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: 0 },
        },
        // Virtual field - computed
        available_quantity: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.quantity - this.reserved_quantity;
            },
        },
        purchase_rate: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0,
        },
        selling_rate: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0,
        },
        grn_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'GRN reference if received via GRN',
        },
        status: {
            type: DataTypes.ENUM('available', 'low_stock', 'out_of_stock', 'expired', 'blocked'),
            defaultValue: 'available',
        },
        is_blocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        block_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        blocked_by: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        blocked_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_movement_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_movement_type: {
            type: DataTypes.ENUM('receipt', 'issue', 'return', 'transfer-in', 'transfer-out', 'adjustment'),
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
        tableName: 'inventory_stock',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['item_id'] },
            { fields: ['location_id'] },
            { fields: ['expiry_date'] },
            { fields: ['status'] },
            { fields: ['mongo_id'] },
            {
                unique: true,
                fields: ['item_id', 'location_id', 'batch_number'],
                name: 'idx_stock_unique_batch',
            },
        ],
        hooks: {
            beforeSave: (stock) => {
                // Update status based on quantity and expiry
                const today = new Date();
                const expiryDate = stock.expiry_date ? new Date(stock.expiry_date) : null;
                
                if (stock.is_blocked) {
                    stock.status = 'blocked';
                } else if (expiryDate && expiryDate < today) {
                    stock.status = 'expired';
                } else if (stock.quantity === 0) {
                    stock.status = 'out_of_stock';
                } else if (stock.quantity <= 10) { // Configurable threshold
                    stock.status = 'low_stock';
                } else {
                    stock.status = 'available';
                }
            },
        },
    });

    /**
     * Issue stock (reduce quantity)
     * @param {number} qty - Quantity to issue
     * @param {object} transaction - Sequelize transaction
     */
    InventoryStock.prototype.issueStock = async function(qty, transaction = null) {
        if (qty > this.available_quantity) {
            throw new Error(`Insufficient stock. Available: ${this.available_quantity}, Requested: ${qty}`);
        }
        
        this.quantity -= qty;
        this.last_movement_date = new Date();
        this.last_movement_type = 'issue';
        await this.save({ transaction });
    };

    /**
     * Receive stock (increase quantity)
     * @param {number} qty - Quantity to receive
     * @param {object} transaction - Sequelize transaction
     */
    InventoryStock.prototype.receiveStock = async function(qty, transaction = null) {
        this.quantity += qty;
        this.last_movement_date = new Date();
        this.last_movement_type = 'receipt';
        await this.save({ transaction });
    };

    /**
     * Reserve stock for pending operations
     * @param {number} qty - Quantity to reserve
     * @param {object} transaction - Sequelize transaction
     */
    InventoryStock.prototype.reserveStock = async function(qty, transaction = null) {
        if (qty > this.available_quantity) {
            throw new Error(`Cannot reserve. Available: ${this.available_quantity}, Requested: ${qty}`);
        }
        
        this.reserved_quantity += qty;
        await this.save({ transaction });
    };

    /**
     * Release reserved stock
     * @param {number} qty - Quantity to release
     * @param {object} transaction - Sequelize transaction
     */
    InventoryStock.prototype.releaseReservation = async function(qty, transaction = null) {
        this.reserved_quantity = Math.max(0, this.reserved_quantity - qty);
        await this.save({ transaction });
    };

    return InventoryStock;
};
