/**
 * Seed Data
 *
 * Seeds the database with demo users, products, customers, inventory,
 * and orders on application startup if the data does not already exist.
 * Provides realistic demo data for presentation and testing.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { User, Product, Customer, InventoryItem, Order, OrderItem } = require('./models');

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
    { firstName: 'Sarah', lastName: "O'Brien", email: 'sarah.obrien@email.com', phone: '+353-1-345-6789', shippingStreet: '15 Patrick Street', shippingCity: 'Cork', shippingState: 'Munster', shippingPostcode: 'T12 AB34', shippingCountry: 'Ireland' },
    { firstName: 'Liam', lastName: 'Kelly', email: 'liam.kelly@email.com', phone: '+353-91-456-7890', shippingStreet: '8 Shop Street', shippingCity: 'Galway', shippingState: 'Connacht', shippingPostcode: 'H91 XY56', shippingCountry: 'Ireland' },
    { firstName: 'Emma', lastName: 'Walsh', email: 'emma.walsh@email.com', phone: '+44-20-7946-0958', shippingStreet: '221B Baker Street', shippingCity: 'London', shippingState: 'England', shippingPostcode: 'NW1 6XE', shippingCountry: 'UK' },
  ]);
  console.log(`[Seed] ${customers.length} demo customers created`);
  return customers;
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

const seedOrders = async () => {
  const count = await Order.count();
  if (count > 0) return;

  const customers = await Customer.findAll();
  const products = await Product.findAll();
  if (customers.length === 0 || products.length === 0) return;

  console.log('[Seed] Creating demo orders...');

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // Helper to build order number
  const orderNum = (date, seq) => {
    const d = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `ORD-${d}-${String(seq).padStart(4, '0')}`;
  };

  // Order 1: Delivered — John bought MacBook + Keyboard (7 days ago)
  const order1 = await Order.create({
    orderNumber: orderNum(daysAgo(7), 1),
    customerId: customers[0].id,
    status: 'DELIVERED',
    shippingStreet: customers[0].shippingStreet,
    shippingCity: customers[0].shippingCity,
    shippingState: customers[0].shippingState,
    shippingPostcode: customers[0].shippingPostcode,
    shippingCountry: customers[0].shippingCountry,
    subtotal: 2648.99,
    tax: 608.27,
    shippingCost: 0,
    totalAmount: 3257.26,
    paymentMethod: 'credit_card',
    transactionId: 'TXN-CC-100001',
    paidAt: daysAgo(7),
    statusHistory: [
      { status: 'PLACED', timestamp: daysAgo(7).toISOString() },
      { status: 'PAID', timestamp: daysAgo(7).toISOString() },
      { status: 'SHIPPED', timestamp: daysAgo(5).toISOString() },
      { status: 'DELIVERED', timestamp: daysAgo(2).toISOString() },
    ],
    createdAt: daysAgo(7),
  });
  await OrderItem.bulkCreate([
    { orderId: order1.id, productId: products[0].id, productName: products[0].name, quantity: 1, unitPrice: 2499.00, subtotal: 2499.00 },
    { orderId: order1.id, productId: products[7].id, productName: products[7].name, quantity: 1, unitPrice: 149.99, subtotal: 149.99 },
  ]);

  // Order 2: Shipped — Sarah bought headphones + yoga mat (4 days ago)
  const order2 = await Order.create({
    orderNumber: orderNum(daysAgo(4), 2),
    customerId: customers[1].id,
    status: 'SHIPPED',
    shippingStreet: customers[1].shippingStreet,
    shippingCity: customers[1].shippingCity,
    shippingState: customers[1].shippingState,
    shippingPostcode: customers[1].shippingPostcode,
    shippingCountry: customers[1].shippingCountry,
    subtotal: 389.98,
    tax: 89.70,
    shippingCost: 5.99,
    totalAmount: 485.67,
    paymentMethod: 'paypal',
    transactionId: 'TXN-PP-100002',
    paidAt: daysAgo(4),
    statusHistory: [
      { status: 'PLACED', timestamp: daysAgo(4).toISOString() },
      { status: 'PAID', timestamp: daysAgo(4).toISOString() },
      { status: 'SHIPPED', timestamp: daysAgo(2).toISOString() },
    ],
    createdAt: daysAgo(4),
  });
  await OrderItem.bulkCreate([
    { orderId: order2.id, productId: products[1].id, productName: products[1].name, quantity: 1, unitPrice: 349.99, subtotal: 349.99 },
    { orderId: order2.id, productId: products[6].id, productName: products[6].name, quantity: 1, unitPrice: 39.99, subtotal: 39.99 },
  ]);

  // Order 3: Paid — Liam bought standing desk + green tea (2 days ago)
  const order3 = await Order.create({
    orderNumber: orderNum(daysAgo(2), 3),
    customerId: customers[2].id,
    status: 'PAID',
    shippingStreet: customers[2].shippingStreet,
    shippingCity: customers[2].shippingCity,
    shippingState: customers[2].shippingState,
    shippingPostcode: customers[2].shippingPostcode,
    shippingCountry: customers[2].shippingCountry,
    subtotal: 648.98,
    tax: 149.27,
    shippingCost: 15.00,
    totalAmount: 813.25,
    paymentMethod: 'credit_card',
    transactionId: 'TXN-CC-100003',
    paidAt: daysAgo(2),
    statusHistory: [
      { status: 'PLACED', timestamp: daysAgo(2).toISOString() },
      { status: 'PAID', timestamp: daysAgo(2).toISOString() },
    ],
    createdAt: daysAgo(2),
  });
  await OrderItem.bulkCreate([
    { orderId: order3.id, productId: products[5].id, productName: products[5].name, quantity: 1, unitPrice: 599.00, subtotal: 599.00 },
    { orderId: order3.id, productId: products[4].id, productName: products[4].name, quantity: 2, unitPrice: 24.99, subtotal: 49.98 },
  ]);

  // Order 4: Placed (awaiting payment) — Emma bought books + shoes (today)
  const order4 = await Order.create({
    orderNumber: orderNum(now, 4),
    customerId: customers[3].id,
    status: 'PLACED',
    shippingStreet: customers[3].shippingStreet,
    shippingCity: customers[3].shippingCity,
    shippingState: customers[3].shippingState,
    shippingPostcode: customers[3].shippingPostcode,
    shippingCountry: customers[3].shippingCountry,
    subtotal: 309.97,
    tax: 71.29,
    shippingCost: 8.99,
    totalAmount: 390.25,
    statusHistory: [
      { status: 'PLACED', timestamp: now.toISOString() },
    ],
  });
  await OrderItem.bulkCreate([
    { orderId: order4.id, productId: products[3].id, productName: products[3].name, quantity: 2, unitPrice: 49.99, subtotal: 99.98 },
    { orderId: order4.id, productId: products[2].id, productName: products[2].name, quantity: 1, unitPrice: 129.99, subtotal: 129.99 },
    { orderId: order4.id, productId: products[6].id, productName: products[6].name, quantity: 2, unitPrice: 39.99, subtotal: 79.98 },
  ]);

  // Order 5: Cancelled — John cancelled an electronics order (5 days ago)
  const order5 = await Order.create({
    orderNumber: orderNum(daysAgo(5), 5),
    customerId: customers[0].id,
    status: 'CANCELLED',
    shippingStreet: customers[0].shippingStreet,
    shippingCity: customers[0].shippingCity,
    shippingState: customers[0].shippingState,
    shippingPostcode: customers[0].shippingPostcode,
    shippingCountry: customers[0].shippingCountry,
    subtotal: 349.99,
    tax: 80.50,
    shippingCost: 0,
    totalAmount: 430.49,
    statusHistory: [
      { status: 'PLACED', timestamp: daysAgo(5).toISOString() },
      { status: 'CANCELLED', timestamp: daysAgo(4).toISOString() },
    ],
    createdAt: daysAgo(5),
  });
  await OrderItem.bulkCreate([
    { orderId: order5.id, productId: products[1].id, productName: products[1].name, quantity: 1, unitPrice: 349.99, subtotal: 349.99 },
  ]);

  // Order 6: Placed — Liam ordered bulk tea + books (today)
  const order6 = await Order.create({
    orderNumber: orderNum(now, 6),
    customerId: customers[2].id,
    status: 'PLACED',
    shippingStreet: customers[2].shippingStreet,
    shippingCity: customers[2].shippingCity,
    shippingState: customers[2].shippingState,
    shippingPostcode: customers[2].shippingPostcode,
    shippingCountry: customers[2].shippingCountry,
    subtotal: 174.94,
    tax: 40.24,
    shippingCost: 5.99,
    totalAmount: 221.17,
    statusHistory: [
      { status: 'PLACED', timestamp: now.toISOString() },
    ],
  });
  await OrderItem.bulkCreate([
    { orderId: order6.id, productId: products[4].id, productName: products[4].name, quantity: 5, unitPrice: 24.99, subtotal: 124.95 },
    { orderId: order6.id, productId: products[3].id, productName: products[3].name, quantity: 1, unitPrice: 49.99, subtotal: 49.99 },
  ]);

  console.log('[Seed] 6 demo orders created (DELIVERED, SHIPPED, PAID, 2x PLACED, CANCELLED)');
};

const seedAll = async () => {
  try {
    await seedUsers();
    await seedProducts();
    await seedCustomers();
    await seedInventory();
    await seedOrders();
    console.log('[Seed] Database seeding complete');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error.message);
  }
};

module.exports = { seedAll };
