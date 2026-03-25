/**
 * Order Controller
 *
 * Handles HTTP requests for order CRUD and workflow operations.
 * Order creation orchestrates inventory reservation and total calculation.
 * Workflow endpoints delegate to orderService for status transitions.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { Order, OrderItem, Customer, Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const orderService = require('../services/orderService');
const inventoryService = require('../services/inventoryService');
const notificationService = require('../services/notificationService');

/**
 * GET /api/orders
 * Retrieves a paginated list of orders with optional filters.
 * Query params: page, limit, status, customerId, search (order number)
 */
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.customerId) {
      where.customerId = req.query.customerId;
    }

    // Allow searching by order number prefix
    if (req.query.search) {
      where.orderNumber = { [Op.iLike]: `%${req.query.search}%` };
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'items' },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: orders,
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
 * GET /api/orders/:id
 * Retrieves a single order with customer info, line items, and product details.
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders
 * Creates a new order with line items. This is a multi-step process:
 * 1. Validate customer exists and is active
 * 2. Validate all products exist and are active
 * 3. Reserve inventory for each item
 * 4. Calculate totals (subtotal, tax, shipping)
 * 5. Create order and order items in a single transaction
 * 6. Send order confirmation notification
 */
const createOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  let order, customer, orderNumber;

  try {
    const { customerId, items, shippingStreet, shippingCity, shippingState, shippingPostcode, shippingCountry } = req.body;

    // Step 1: Verify customer exists and is active
    customer = await Customer.findByPk(customerId, { transaction });
    if (!customer || !customer.isActive) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Customer not found or inactive',
      });
    }

    // Step 2: Fetch and validate all products referenced in the order items
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product || !product.isActive) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.productId} not found or inactive`,
        });
      }

      // Build the order item with snapshot data from the product
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: parseFloat((item.quantity * parseFloat(product.price)).toFixed(2)),
      });
    }

    // Step 3: Reserve stock for all items — rolls back if any product has insufficient stock
    await inventoryService.reserveStock(
      items.map(item => ({ productId: item.productId, quantity: item.quantity })),
      transaction
    );

    // Step 4: Calculate financial totals
    const totals = orderService.calculateOrderTotals(orderItems);

    // Step 5: Generate a unique order number and create the order record
    orderNumber = await orderService.generateOrderNumber();

    // Use customer's default shipping address if none was provided with the order
    order = await Order.create({
      orderNumber,
      customerId,
      status: 'PLACED',
      shippingStreet: shippingStreet || customer.shippingStreet,
      shippingCity: shippingCity || customer.shippingCity,
      shippingState: shippingState || customer.shippingState,
      shippingPostcode: shippingPostcode || customer.shippingPostcode,
      shippingCountry: shippingCountry || customer.shippingCountry,
      ...totals,
      statusHistory: [{
        status: 'PLACED',
        timestamp: new Date().toISOString(),
        notes: 'Order placed successfully',
      }],
    }, { transaction });

    // Create all line items linked to the new order
    for (const item of orderItems) {
      await OrderItem.create(
        { ...item, orderId: order.id },
        { transaction }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();

    // Return business logic errors (e.g., insufficient stock) as 400 with clear message
    if (error.message && (error.message.includes('Insufficient stock') || error.message.includes('No inventory record'))) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }

  // Step 6: Send confirmation notification (non-blocking, outside transaction)
  try {
    await notificationService.sendOrderStatusNotification(order, 'PLACED', customer);
  } catch (notifErr) {
    console.error('[Order] Notification failed (non-blocking):', notifErr.message);
  }

  // Reload the order with all associations for the response
  const fullOrder = await Order.findByPk(order.id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: OrderItem, as: 'items' },
    ],
  });

  console.log(`[Order] Created order ${orderNumber} for customer ${customer.firstName} ${customer.lastName}`);

  return res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: fullOrder,
  });
};

/**
 * PUT /api/orders/:id
 * Updates non-workflow order fields (e.g., shipping address).
 * Status changes must go through the dedicated workflow endpoints.
 */
const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Prevent direct status manipulation — enforce use of workflow endpoints
    const { status, statusHistory, ...updateData } = req.body;

    await order.update(updateData);

    return res.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/orders/:id
 * Cancels an order (delegates to the cancel workflow).
 * Orders that have been shipped or delivered cannot be deleted.
 */
const deleteOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(parseInt(req.params.id));

    return res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ── Workflow Endpoints ───────────────────────────────────────────────

/**
 * POST /api/orders/:id/process-payment
 * Processes payment for a PLACED order, transitioning it to PAID.
 */
const processPayment = async (req, res, next) => {
  try {
    const paymentMethod = req.body?.paymentMethod || 'credit_card';
    const order = await orderService.processOrderPayment(parseInt(req.params.id), paymentMethod);

    return res.json({
      success: true,
      message: 'Payment processed successfully',
      data: order,
    });
  } catch (error) {
    if (error.message && error.message.includes('Payment declined')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * POST /api/orders/:id/ship
 * Ships a PAID order, transitioning it to SHIPPED and deducting inventory.
 */
const shipOrder = async (req, res, next) => {
  try {
    const order = await orderService.shipOrder(parseInt(req.params.id));

    return res.json({
      success: true,
      message: 'Order shipped successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/deliver
 * Marks a SHIPPED order as DELIVERED.
 */
const deliverOrder = async (req, res, next) => {
  try {
    const order = await orderService.deliverOrder(parseInt(req.params.id));

    return res.json({
      success: true,
      message: 'Order delivered successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/cancel
 * Cancels a PLACED or PAID order and releases reserved inventory.
 */
const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(parseInt(req.params.id));

    return res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  processPayment,
  shipOrder,
  deliverOrder,
  cancelOrder,
};
