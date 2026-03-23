/**
 * Inventory Service
 *
 * Encapsulates all stock management logic including reservation, release,
 * deduction, and restocking. Reservations prevent overselling by temporarily
 * holding stock for orders that have not yet shipped. Stock is only
 * permanently deducted when an order transitions to SHIPPED status.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { InventoryItem, Product } = require('../models');

/**
 * Reserves stock for a list of order items.
 * Called when a new order is placed to ensure products are available.
 * Throws an error if any product has insufficient available stock.
 *
 * @param {Array} items - Array of { productId, quantity }
 * @param {Object} [transaction] - Sequelize transaction for atomicity
 */
const reserveStock = async (items, transaction = null) => {
  for (const item of items) {
    const inventory = await InventoryItem.findOne({
      where: { productId: item.productId },
      transaction,
    });

    if (!inventory) {
      throw new Error(`No inventory record found for product ID ${item.productId}`);
    }

    // Available stock is total stock minus already-reserved stock
    const availableStock = inventory.quantityInStock - inventory.quantityReserved;

    if (availableStock < item.quantity) {
      const product = await Product.findByPk(item.productId, { transaction });
      throw new Error(
        `Insufficient stock for "${product ? product.name : item.productId}". ` +
        `Available: ${availableStock}, Requested: ${item.quantity}`
      );
    }

    // Increase reserved count — stock is now allocated to this order
    await inventory.update(
      { quantityReserved: inventory.quantityReserved + item.quantity },
      { transaction }
    );

    console.log(`[Inventory] Reserved ${item.quantity} units of product ${item.productId}`);

    // Check if remaining available stock is below reorder threshold
    checkReorderPoint(inventory, item.quantity);
  }
};

/**
 * Releases previously reserved stock back to available pool.
 * Called when an order is cancelled before shipping.
 *
 * @param {Array} items - Array of { productId, quantity }
 * @param {Object} [transaction] - Sequelize transaction for atomicity
 */
const releaseReservation = async (items, transaction = null) => {
  for (const item of items) {
    const inventory = await InventoryItem.findOne({
      where: { productId: item.productId },
      transaction,
    });

    if (inventory) {
      // Decrease reserved count — stock is returned to the available pool
      const newReserved = Math.max(0, inventory.quantityReserved - item.quantity);
      await inventory.update(
        { quantityReserved: newReserved },
        { transaction }
      );

      console.log(`[Inventory] Released reservation of ${item.quantity} units for product ${item.productId}`);
    }
  }
};

/**
 * Permanently deducts stock when an order is shipped.
 * Converts reserved stock into actual stock reduction.
 *
 * @param {Array} items - Array of { productId, quantity }
 * @param {Object} [transaction] - Sequelize transaction for atomicity
 */
const deductStock = async (items, transaction = null) => {
  for (const item of items) {
    const inventory = await InventoryItem.findOne({
      where: { productId: item.productId },
      transaction,
    });

    if (inventory) {
      // Remove from both physical stock and reserved counts
      await inventory.update(
        {
          quantityInStock: Math.max(0, inventory.quantityInStock - item.quantity),
          quantityReserved: Math.max(0, inventory.quantityReserved - item.quantity),
        },
        { transaction }
      );

      console.log(`[Inventory] Deducted ${item.quantity} units of product ${item.productId} from stock`);
    }
  }
};

/**
 * Logs a warning if available stock has dropped below the reorder threshold.
 *
 * @param {Object} inventory - InventoryItem instance
 * @param {number} justReserved - Quantity just reserved
 */
const checkReorderPoint = (inventory, justReserved) => {
  const availableAfter = inventory.quantityInStock - (inventory.quantityReserved + justReserved);
  if (availableAfter <= inventory.reorderPoint) {
    console.log(
      `[Inventory] LOW STOCK WARNING: Product ${inventory.productId} ` +
      `has ${availableAfter} available units (reorder point: ${inventory.reorderPoint}). ` +
      `Suggested reorder quantity: ${inventory.reorderQuantity}`
    );
  }
};

/**
 * Adds stock to an inventory item (e.g., after a supplier delivery).
 *
 * @param {number} productId - The product to restock
 * @param {number} quantity - Number of units to add
 * @param {Object} [transaction] - Sequelize transaction
 * @returns {Object} Updated inventory item
 */
const restockProduct = async (productId, quantity, transaction = null) => {
  const inventory = await InventoryItem.findOne({
    where: { productId },
    transaction,
  });

  if (!inventory) {
    throw new Error(`No inventory record found for product ID ${productId}`);
  }

  await inventory.update(
    {
      quantityInStock: inventory.quantityInStock + quantity,
      lastRestockedAt: new Date(),
    },
    { transaction }
  );

  console.log(`[Inventory] Restocked product ${productId} with ${quantity} units. New total: ${inventory.quantityInStock + quantity}`);

  return inventory;
};

module.exports = {
  reserveStock,
  releaseReservation,
  deductStock,
  restockProduct,
};
