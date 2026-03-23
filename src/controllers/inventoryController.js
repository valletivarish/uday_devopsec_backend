/**
 * Inventory Controller
 *
 * Handles HTTP requests for inventory management including CRUD operations,
 * restocking, and low-stock reporting. Each inventory item is linked
 * one-to-one with a product.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { InventoryItem, Product } = require('../models');
const { Op } = require('sequelize');
const inventoryService = require('../services/inventoryService');

/**
 * GET /api/inventory
 * Retrieves a paginated list of inventory items with product details.
 * Query params: page, limit, lowStock (boolean), search (product name)
 */
const getAllInventory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};
    const includeWhere = {};

    // Filter to show only items where available stock is at or below reorder point
    if (req.query.lowStock === 'true') {
      where[Op.and] = [
        require('sequelize').where(
          require('sequelize').col('quantityInStock'),
          '<=',
          require('sequelize').col('reorderPoint')
        ),
      ];
    }

    // Search by associated product name
    if (req.query.search) {
      includeWhere.name = { [Op.iLike]: `%${req.query.search}%` };
    }

    const { count, rows: inventory } = await InventoryItem.findAndCountAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined,
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: inventory,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/:id
 * Retrieves a single inventory item by ID, including product details.
 */
const getInventoryById = async (req, res, next) => {
  try {
    const inventory = await InventoryItem.findByPk(req.params.id, {
      include: [{ model: Product, as: 'product' }],
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    return res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/inventory
 * Creates a new inventory record for a product.
 * Each product can only have one inventory record (enforced by unique constraint).
 */
const createInventory = async (req, res, next) => {
  try {
    // Verify the product exists before creating an inventory record
    const product = await Product.findByPk(req.body.productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Product not found',
      });
    }

    const inventory = await InventoryItem.create(req.body);

    console.log(`[Inventory] Created inventory for product "${product.name}" with ${inventory.quantityInStock} units`);

    return res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/inventory/:id
 * Updates an existing inventory record (stock levels, reorder settings, etc.).
 */
const updateInventory = async (req, res, next) => {
  try {
    const inventory = await InventoryItem.findByPk(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    await inventory.update(req.body);

    console.log(`[Inventory] Updated inventory item ID ${inventory.id}`);

    return res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/inventory/:id
 * Deletes an inventory record. This is a hard delete since inventory
 * records do not need to be preserved for historical purposes.
 */
const deleteInventory = async (req, res, next) => {
  try {
    const inventory = await InventoryItem.findByPk(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    await inventory.destroy();

    console.log(`[Inventory] Deleted inventory item ID ${req.params.id}`);

    return res.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/inventory/:id/restock
 * Adds stock to an existing inventory item (e.g., after a supplier delivery).
 * Body: { quantity: <number> }
 */
const restockInventory = async (req, res, next) => {
  try {
    const inventory = await InventoryItem.findByPk(req.params.id, {
      include: [{ model: Product, as: 'product' }],
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const quantity = parseInt(req.body.quantity);
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    await inventoryService.restockProduct(inventory.productId, quantity);

    // Reload to get updated values
    await inventory.reload();

    return res.json({
      success: true,
      message: `Restocked ${quantity} units successfully`,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  restockInventory,
};
