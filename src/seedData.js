/**
 * Seed Data
 *
 * Seeds the database with demo users, products, customers, and inventory
 * on application startup if the data does not already exist.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { User, Product, Customer, InventoryItem } = require('./models');

const seedUsers = async () => {
  const count = await User.count();
  if (count > 0) return;

  console.log('[Seed] Creating demo users...');
  await User.bulkCreate([
    { name: 'Admin User', email: 'admin@opm.com', password: 'admin123', role: 'admin' },
    { name: 'Manager User', email: 'manager@opm.com', password: 'manager123', role: 'manager' },
    { name: 'Viewer User', email: 'viewer@opm.com', password: 'viewer123', role: 'viewer' },
  ], { individualHooks: true });
  console.log('[Seed] 3 demo users created');
};

const seedProducts = async () => {
  const count = await Product.count();
  if (count > 0) return;

  console.log('[Seed] Creating demo products...');
  const products = await Product.bulkCreate([
    { name: 'MacBook Pro 16"', description: 'Apple M3 Pro chip, 18GB RAM, 512GB SSD', price: 2499.00, category: 'ELECTRONICS', sku: 'ELEC-MBP16-001' },
    { name: 'Sony WH-1000XM5', description: 'Premium noise-cancelling wireless headphones', price: 349.99, category: 'ELECTRONICS', sku: 'ELEC-SNY-002' },
    { name: 'Nike Air Max 90', description: 'Classic running shoes, white/black', price: 129.99, category: 'CLOTHING', sku: 'CLO-NIKE-003' },
    { name: 'The Pragmatic Programmer', description: '20th Anniversary Edition by David Thomas', price: 49.99, category: 'BOOKS', sku: 'BOOK-PP-004' },
    { name: 'Organic Green Tea', description: '100 bags premium Japanese matcha blend', price: 24.99, category: 'FOOD', sku: 'FOOD-TEA-005' },
    { name: 'Standing Desk Pro', description: 'Electric height-adjustable desk, 60x30 inches', price: 599.00, category: 'HOME', sku: 'HOME-DSK-006' },
    { name: 'Yoga Mat Premium', description: 'Non-slip eco-friendly 6mm thick', price: 39.99, category: 'SPORTS', sku: 'SPT-YGA-007' },
    { name: 'Mechanical Keyboard', description: 'Cherry MX Blue switches, RGB backlit', price: 149.99, category: 'ELECTRONICS', sku: 'ELEC-KB-008' },
  ]);
  console.log(`[Seed] ${products.length} demo products created`);
  return products;
};

const seedCustomers = async () => {
  const count = await Customer.count();
  if (count > 0) return;

  console.log('[Seed] Creating demo customers...');
  const customers = await Customer.bulkCreate([
    { firstName: 'John', lastName: 'Murphy', email: 'john.murphy@email.com', phone: '+353-1-234-5678', shippingStreet: '42 Grafton Street', shippingCity: 'Dublin', shippingState: 'Leinster', shippingPostcode: 'D02 Y234', shippingCountry: 'Ireland' },
    { firstName: 'Sarah', lastName: 'OBrien', email: 'sarah.obrien@email.com', phone: '+353-1-345-6789', shippingStreet: '15 Patrick Street', shippingCity: 'Cork', shippingState: 'Munster', shippingPostcode: 'T12 AB34', shippingCountry: 'Ireland' },
    { firstName: 'Liam', lastName: 'Kelly', email: 'liam.kelly@email.com', phone: '+353-91-456-7890', shippingStreet: '8 Shop Street', shippingCity: 'Galway', shippingState: 'Connacht', shippingPostcode: 'H91 XY56', shippingCountry: 'Ireland' },
    { firstName: 'Emma', lastName: 'Walsh', email: 'emma.walsh@email.com', phone: '+44-20-7946-0958', shippingStreet: '221B Baker Street', shippingCity: 'London', shippingState: 'England', shippingPostcode: 'NW1 6XE', shippingCountry: 'UK' },
  ]);
  console.log(`[Seed] ${customers.length} demo customers created`);
};

const seedInventory = async () => {
  const count = await InventoryItem.count();
  if (count > 0) return;

  const products = await Product.findAll();
  if (products.length === 0) return;

  console.log('[Seed] Creating demo inventory...');
  const inventoryData = products.map((p, i) => ({
    productId: p.id,
    quantityInStock: [50, 120, 75, 200, 300, 30, 150, 85][i] || 50,
    warehouseLocation: ['Aisle A, Shelf 1', 'Aisle A, Shelf 2', 'Aisle B, Shelf 1', 'Aisle C, Shelf 1', 'Aisle D, Shelf 1', 'Aisle E, Shelf 1', 'Aisle B, Shelf 3', 'Aisle A, Shelf 3'][i] || 'Warehouse A',
    reorderPoint: 10,
    reorderQuantity: 50,
  }));
  await InventoryItem.bulkCreate(inventoryData);
  console.log(`[Seed] ${inventoryData.length} inventory records created`);
};

const seedAll = async () => {
  try {
    await seedUsers();
    await seedProducts();
    await seedCustomers();
    await seedInventory();
    console.log('[Seed] Database seeding complete');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error.message);
  }
};

module.exports = { seedAll };
