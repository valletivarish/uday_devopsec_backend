/**
 * OrderItem Model
 *
 * Represents a single line item within an order. Stores a snapshot of the
 * product name and unit price at the time of purchase so that the order
 * record remains accurate even if the product is later modified or deleted.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Foreign key linking this item to its parent order
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    // Foreign key linking this item to the purchased product
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    // Snapshot of the product name at order time — prevents data loss if product changes
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Number of units ordered — must be at least 1
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Quantity must be at least 1',
        },
      },
    },
    // Price per unit at time of order — snapshot for historical accuracy
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // Line total: quantity * unitPrice — pre-calculated for performance
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    tableName: 'order_items',
    timestamps: true,
  });

  return OrderItem;
};
