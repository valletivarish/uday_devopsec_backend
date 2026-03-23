/**
 * Product Model
 *
 * Represents a product in the catalog. Each product has a unique SKU,
 * belongs to a category, and can have multiple image URLs stored as JSONB.
 * Products are linked to inventory items and order items.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { DataTypes } = require('sequelize');

// Valid product categories used across the application
const PRODUCT_CATEGORIES = ['ELECTRONICS', 'CLOTHING', 'FOOD', 'BOOKS', 'HOME', 'SPORTS', 'OTHER'];

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Product display name — must be between 3 and 200 characters
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: {
          args: [3, 200],
          msg: 'Product name must be between 3 and 200 characters',
        },
      },
    },
    // Optional long-form product description
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Unit price — stored as DECIMAL for financial accuracy
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0.01],
          msg: 'Price must be a positive number',
        },
      },
    },
    // Product category — restricted to predefined ENUM values
    category: {
      type: DataTypes.ENUM(...PRODUCT_CATEGORIES),
      allowNull: false,
      defaultValue: 'OTHER',
    },
    // Array of image URLs stored as JSONB for flexible querying
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // Stock Keeping Unit — unique identifier for inventory management
    sku: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    // Soft-delete flag: inactive products are hidden from the storefront
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'products',
    timestamps: true,
  });

  return Product;
};

module.exports.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
