import duckdb from 'duckdb';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let conn = null;

// Initialize the DuckDB database with sample data
export async function initDatabase() {
  if (db && conn) return { db, conn };

  const dbPath = path.join(__dirname, '..', 'data', 'analytics.duckdb');
  const dbExists = fs.existsSync(dbPath);

  return new Promise((resolve, reject) => {
    db = new duckdb.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      conn = db.connect();

      if (!dbExists) {
        console.log('Initializing database with sample data...');
        createTablesAndData()
          .then(() => {
            console.log('Database initialization complete!');
            resolve({ db, conn });
          })
          .catch(reject);
      } else {
        console.log('Database already exists, skipping initialization.');
        resolve({ db, conn });
      }
    });
  });
}

// Create tables and generate data
async function createTablesAndData() {
  await runQuery(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      first_name VARCHAR,
      last_name VARCHAR,
      email VARCHAR,
      phone VARCHAR,
      age INTEGER,
      city VARCHAR,
      state VARCHAR,
      country VARCHAR,
      postal_code VARCHAR,
      address VARCHAR,
      signup_date DATE,
      last_login TIMESTAMP,
      account_status VARCHAR,
      subscription_tier VARCHAR,
      monthly_spend DECIMAL(10,2),
      total_orders INTEGER,
      loyalty_points INTEGER
    );
  `);

  await runQuery(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      product_id INTEGER,
      product_name VARCHAR,
      category VARCHAR,
      quantity INTEGER,
      unit_price DECIMAL(10,2),
      total_amount DECIMAL(10,2),
      discount_percent DECIMAL(5,2),
      tax_amount DECIMAL(10,2),
      shipping_cost DECIMAL(10,2),
      order_date DATE,
      ship_date DATE,
      delivery_date DATE,
      order_status VARCHAR,
      payment_method VARCHAR
    );
  `);

  await runQuery(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name VARCHAR,
      category VARCHAR,
      subcategory VARCHAR,
      brand VARCHAR,
      price DECIMAL(10,2),
      cost DECIMAL(10,2),
      stock INTEGER,
      reorder_level INTEGER,
      supplier VARCHAR,
      weight_kg DECIMAL(8,2),
      dimensions VARCHAR,
      color VARCHAR,
      rating DECIMAL(3,2),
      review_count INTEGER
    );
  `);

  console.log('Generating 10,000 users...');
  await generateUsers();

  console.log('Generating 10,000 products...');
  await generateProducts();

  console.log('Generating 10,000 orders...');
  await generateOrders();
}

// Helper function to run a query
export function runQuery(sql) {
  return new Promise((resolve, reject) => {
    conn.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Generate users data
async function generateUsers() {
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston'];
  const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA', 'TX', 'FL', 'TX', 'OH', 'NC', 'CA', 'IN', 'WA', 'CO', 'MA'];
  const statuses = ['active', 'inactive', 'suspended', 'pending'];
  const tiers = ['free', 'basic', 'premium', 'enterprise'];

  for (let batch = 0; batch < 10; batch++) {
    const values = [];
    for (let i = 0; i < 1000; i++) {
      const id = batch * 1000 + i + 1;
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const cityIndex = Math.floor(Math.random() * cities.length);
      const age = 18 + Math.floor(Math.random() * 60);
      const signupDaysAgo = Math.floor(Math.random() * 1000);
      const loginDaysAgo = Math.floor(Math.random() * 30);

      values.push(`(
        ${id},
        '${firstName}',
        '${lastName}',
        '${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com',
        '${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}',
        ${age},
        '${cities[cityIndex]}',
        '${states[cityIndex]}',
        'USA',
        '${Math.floor(Math.random() * 90000) + 10000}',
        '${Math.floor(Math.random() * 9999) + 1} Main St',
        '${new Date(Date.now() - signupDaysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}',
        '${new Date(Date.now() - loginDaysAgo * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0]}',
        '${statuses[Math.floor(Math.random() * statuses.length)]}',
        '${tiers[Math.floor(Math.random() * tiers.length)]}',
        ${(Math.random() * 500).toFixed(2)},
        ${Math.floor(Math.random() * 100)},
        ${Math.floor(Math.random() * 10000)}
      )`);
    }

    await runQuery(`INSERT INTO users VALUES ${values.join(',')}`);
  }
}

// Generate products data
async function generateProducts() {
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Food', 'Beauty'];
  const subcategories = {
    'Electronics': ['Laptops', 'Phones', 'Tablets', 'Accessories', 'Audio'],
    'Clothing': ['Shirts', 'Pants', 'Dresses', 'Shoes', 'Accessories'],
    'Home & Garden': ['Furniture', 'Decor', 'Kitchen', 'Bedding', 'Tools'],
    'Sports': ['Equipment', 'Apparel', 'Footwear', 'Accessories', 'Outdoor'],
    'Books': ['Fiction', 'Non-Fiction', 'Educational', 'Comics', 'Magazines'],
    'Toys': ['Action Figures', 'Dolls', 'Games', 'Puzzles', 'Educational'],
    'Food': ['Snacks', 'Beverages', 'Organic', 'Frozen', 'Canned'],
    'Beauty': ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Tools']
  };
  const brands = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE', 'Premium', 'Budget', 'Luxury', 'Generic', 'ProLine'];
  const suppliers = ['Supplier Inc', 'Global Wholesale', 'Direct Imports', 'MegaCorp', 'Local Distributor'];
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Silver', 'Gold', 'Multi', 'Natural', 'Gray'];

  for (let batch = 0; batch < 10; batch++) {
    const values = [];
    for (let i = 0; i < 1000; i++) {
      const id = batch * 1000 + i + 1;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const subcategory = subcategories[category][Math.floor(Math.random() * subcategories[category].length)];
      const price = (Math.random() * 990 + 10).toFixed(2);
      const cost = (parseFloat(price) * (0.4 + Math.random() * 0.3)).toFixed(2);
      const stock = Math.floor(Math.random() * 1000);

      values.push(`(
        ${id},
        '${category} ${subcategory} ${id}',
        '${category}',
        '${subcategory}',
        '${brands[Math.floor(Math.random() * brands.length)]}',
        ${price},
        ${cost},
        ${stock},
        ${Math.floor(stock * 0.2)},
        '${suppliers[Math.floor(Math.random() * suppliers.length)]}',
        ${(Math.random() * 20).toFixed(2)},
        '${Math.floor(Math.random() * 50)}x${Math.floor(Math.random() * 50)}x${Math.floor(Math.random() * 50)}cm',
        '${colors[Math.floor(Math.random() * colors.length)]}',
        ${(Math.random() * 5).toFixed(2)},
        ${Math.floor(Math.random() * 1000)}
      )`);
    }

    await runQuery(`INSERT INTO products VALUES ${values.join(',')}`);
  }
}

// Generate orders data
async function generateOrders() {
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'];
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Food', 'Beauty'];

  for (let batch = 0; batch < 10; batch++) {
    const values = [];
    for (let i = 0; i < 1000; i++) {
      const id = batch * 1000 + i + 1;
      const userId = Math.floor(Math.random() * 10000) + 1;
      const productId = Math.floor(Math.random() * 10000) + 1;
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = (Math.random() * 990 + 10).toFixed(2);
      const discountPercent = (Math.random() * 30).toFixed(2);
      const subtotal = parseFloat(unitPrice) * quantity;
      const discount = subtotal * (parseFloat(discountPercent) / 100);
      const totalAmount = (subtotal - discount).toFixed(2);
      const taxAmount = (parseFloat(totalAmount) * 0.08).toFixed(2);
      const shippingCost = (Math.random() * 20).toFixed(2);
      const orderDaysAgo = Math.floor(Math.random() * 365);
      const shipDaysAfter = Math.floor(Math.random() * 3) + 1;
      const deliveryDaysAfter = Math.floor(Math.random() * 7) + 2;
      const category = categories[Math.floor(Math.random() * categories.length)];

      const orderDate = new Date(Date.now() - orderDaysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const shipDate = new Date(Date.now() - (orderDaysAgo - shipDaysAfter) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const deliveryDate = new Date(Date.now() - (orderDaysAgo - shipDaysAfter - deliveryDaysAfter) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      values.push(`(
        ${id},
        ${userId},
        ${productId},
        'Product ${productId}',
        '${category}',
        ${quantity},
        ${unitPrice},
        ${totalAmount},
        ${discountPercent},
        ${taxAmount},
        ${shippingCost},
        '${orderDate}',
        '${shipDate}',
        '${deliveryDate}',
        '${statuses[Math.floor(Math.random() * statuses.length)]}',
        '${paymentMethods[Math.floor(Math.random() * paymentMethods.length)]}'
      )`);
    }

    await runQuery(`INSERT INTO orders VALUES ${values.join(',')}`);
  }
}

// Execute SQL query
export async function executeSQL(sql) {
  if (!conn) {
    await initDatabase();
  }

  const trimmedSQL = sql.trim();
  if (!trimmedSQL) {
    throw new Error('Empty query');
  }

  return runQuery(trimmedSQL);
}
