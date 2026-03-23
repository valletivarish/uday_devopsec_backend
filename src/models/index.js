/**
 * Model Loader and Association Setup
 *
 * Initialises all Sequelize models and defines the relationships between them.
 * This centralised file ensures that associations are set up exactly once
 * and that every part of the application imports models from the same source.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { sequelize } = require('../config/database');

// Import model definition functions and initialise them with the sequelize instance
const Product = require('./Product')(sequelize);
const Customer = require('./Customer')(sequelize);
const Order = require('./Order')(sequelize);
const OrderItem = require('./OrderItem')(sequelize);
const InventoryItem = require('./InventoryItem')(sequelize);

// ── Association Definitions ──────────────────────────────────────────
// Each association is defined in both directions so Sequelize can
// generate the correct JOIN queries and provide eager-loading helpers.

// A customer can place many orders; each order belongs to one customer
Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// An order contains many line items; each line item belongs to one order
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Each order item references a product; a product can appear in many order items
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Each product has exactly one inventory record; inventory belongs to one product
Product.hasOne(InventoryItem, { foreignKey: 'productId', as: 'inventory' });
InventoryItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  Product,
  Customer,
  Order,
  OrderItem,
  InventoryItem,
};
