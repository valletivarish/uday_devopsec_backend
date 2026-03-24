/**
 * Customer Controller
 *
 * Handles HTTP requests for customer CRUD operations.
 * Supports pagination and search by name or email.
 * Customers are soft-deleted to preserve order history.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { Customer, Order } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/customers
 * Retrieves a paginated list of customers with optional search.
 * Query params: page, limit, search (matches first name, last name, or email)
 */
const getAllCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Default to showing only active customers unless explicitly requested
    const where = { isActive: true };

    // Search across multiple name/email fields simultaneously
    if (req.query.search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${req.query.search}%` } },
        { lastName: { [Op.iLike]: `%${req.query.search}%` } },
        { email: { [Op.iLike]: `%${req.query.search}%` } },
      ];
    }

    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: customers,
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
 * GET /api/customers/:id
 * Retrieves a single customer by ID, including their order history.
 */
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [{ model: Order, as: 'orders' }],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    return res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customers
 * Creates a new customer record. Email uniqueness is enforced at the model level.
 */
const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);

    console.log(`[Customer] Created customer "${customer.firstName} ${customer.lastName}" (ID: ${customer.id})`);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/customers/:id
 * Updates an existing customer. Only provided fields are modified.
 */
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    await customer.update(req.body);

    console.log(`[Customer] Updated customer "${customer.firstName} ${customer.lastName}" (ID: ${customer.id})`);

    return res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/customers/:id
 * Soft-deletes a customer by setting isActive to false.
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    await customer.update({ isActive: false });
    await customer.destroy(); // Soft delete via paranoid — sets deletedAt

    console.log(`[Customer] Soft-deleted customer "${customer.firstName} ${customer.lastName}" (ID: ${customer.id})`);

    return res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
