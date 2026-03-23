/**
 * Inventory Routes
 *
 * Defines REST API endpoints for inventory management.
 * Includes a restock endpoint for adding stock to existing items.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const {
  inventoryCreateRules,
  inventoryUpdateRules,
  idParamRule,
  paginationRules,
} = require('../middleware/validators');

// GET    /api/inventory          — List all inventory items (paginated, filterable)
router.get('/', paginationRules, inventoryController.getAllInventory);

// GET    /api/inventory/:id      — Get a single inventory item
router.get('/:id', idParamRule, inventoryController.getInventoryById);

// POST   /api/inventory          — Create a new inventory record for a product
router.post('/', inventoryCreateRules, inventoryController.createInventory);

// PUT    /api/inventory/:id      — Update inventory settings
router.put('/:id', idParamRule, inventoryUpdateRules, inventoryController.updateInventory);

// DELETE /api/inventory/:id      — Remove an inventory record
router.delete('/:id', idParamRule, inventoryController.deleteInventory);

// POST   /api/inventory/:id/restock — Add stock to an inventory item
router.post('/:id/restock', idParamRule, inventoryController.restockInventory);

module.exports = router;
