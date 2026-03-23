/**
 * Product Controller
 *
 * Handles HTTP requests for product CRUD operations.
 * Supports pagination, search by name/category, and filtering by active status.
 * All database errors are forwarded to the centralised error handler.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { Product, InventoryItem } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/products
 * Retrieves a paginated list of products with optional search and filter.
 * Query params: page, limit, search (name), category, isActive
 */
const getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause based on query parameters
    const where = {};

    if (req.query.search) {
      where.name = { [Op.iLike]: `%${req.query.search}%` };
    }

    if (req.query.category) {
      where.category = req.query.category;
    }

    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{ model: InventoryItem, as: 'inventory' }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: products,
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
 * GET /api/products/:id
 * Retrieves a single product by its primary key, including inventory data.
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: InventoryItem, as: 'inventory' }],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 * Creates a new product. Request body is validated by middleware.
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    console.log(`[Product] Created product "${product.name}" (ID: ${product.id})`);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 * Updates an existing product. Only provided fields are modified.
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.update(req.body);

    console.log(`[Product] Updated product "${product.name}" (ID: ${product.id})`);

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Soft-deletes a product by setting isActive to false.
 * Hard deletion is avoided to preserve order history integrity.
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Soft delete — mark as inactive rather than removing the record
    await product.update({ isActive: false });

    console.log(`[Product] Deactivated product "${product.name}" (ID: ${product.id})`);

    return res.json({
      success: true,
      message: 'Product deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
