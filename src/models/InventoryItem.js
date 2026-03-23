/**
 * InventoryItem Model
 *
 * Tracks stock levels for each product. Supports reservation logic where
 * quantityReserved represents stock allocated to pending orders but not yet
 * shipped. Available stock = quantityInStock - quantityReserved.
 * Reorder thresholds trigger low-stock warnings.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InventoryItem = sequelize.define('InventoryItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // One-to-one relationship with Product — each product has exactly one inventory record
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    // Total physical stock in the warehouse
    quantityInStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Quantity in stock cannot be negative',
        },
      },
    },
    // Stock reserved for pending orders — prevents overselling
    quantityReserved: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // When available stock falls below this level, a restock warning is triggered
    reorderPoint: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: {
          args: [0],
          msg: 'Reorder point cannot be negative',
        },
      },
    },
    // Suggested quantity to order when restocking
    reorderQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: {
          args: [1],
          msg: 'Reorder quantity must be at least 1',
        },
      },
    },
    // Physical warehouse location identifier (e.g., "Aisle 5, Shelf B")
    warehouseLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Timestamp of the most recent restocking event
    lastRestockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'inventory_items',
    timestamps: true,
  });

  return InventoryItem;
};
