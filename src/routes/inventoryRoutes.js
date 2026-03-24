/**
 * Inventory Routes
 *
 * Defines REST API endpoints for inventory management.
 * Role-based access: admin/manager can create/update/restock, only admin can delete.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authorize } = require('../middleware/auth');
const {
  inventoryCreateRules,
  inventoryUpdateRules,
  idParamRule,
  paginationRules,
} = require('../middleware/validators');

// GET    /api/inventory          — All authenticated users
router.get('/', paginationRules, inventoryController.getAllInventory);

// GET    /api/inventory/:id      — All authenticated users
router.get('/:id', idParamRule, inventoryController.getInventoryById);

// POST   /api/inventory          — Admin and Manager only
router.post('/', authorize('admin', 'manager'), inventoryCreateRules, inventoryController.createInventory);

// PUT    /api/inventory/:id      — Admin and Manager only
router.put('/:id', authorize('admin', 'manager'), idParamRule, inventoryUpdateRules, inventoryController.updateInventory);

// DELETE /api/inventory/:id      — Admin only
router.delete('/:id', authorize('admin'), idParamRule, inventoryController.deleteInventory);

// POST   /api/inventory/:id/restock — Admin and Manager only
router.post('/:id/restock', authorize('admin', 'manager'), idParamRule, inventoryController.restockInventory);

module.exports = router;
