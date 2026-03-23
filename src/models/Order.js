/**
 * Order Model
 *
 * Represents a customer order with shipping details, financial totals,
 * and a status workflow (PLACED -> PAID -> SHIPPED -> DELIVERED or CANCELLED).
 * The statusHistory JSONB field tracks every status transition with timestamps.
 * Order numbers are auto-generated in the format ORD-YYYYMMDD-NNNN.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { DataTypes } = require('sequelize');

// Allowed order statuses representing the order lifecycle
const ORDER_STATUSES = ['PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Unique human-readable order number (e.g., ORD-20260301-0001)
    orderNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    // Foreign key to the customer who placed this order
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    // Current status in the order lifecycle
    status: {
      type: DataTypes.ENUM(...ORDER_STATUSES),
      allowNull: false,
      defaultValue: 'PLACED',
    },
    // Shipping address fields — copied from customer at order time
    shippingStreet: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingCity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingState: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingPostcode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingCountry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Financial breakdown — calculated from order items
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    // Payment details — populated after successful payment processing
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // JSONB array tracking every status transition with timestamp and notes
    statusHistory: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  }, {
    tableName: 'orders',
    timestamps: true,
  });

  return Order;
};

module.exports.ORDER_STATUSES = ORDER_STATUSES;
