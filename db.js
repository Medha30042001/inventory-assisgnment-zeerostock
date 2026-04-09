const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dataDir = process.env.DB_DIR || __dirname;

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "inventory.db");
const db = new Database(dbPath);

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity >= 0),
      price REAL NOT NULL CHECK(price > 0),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
  `);

  const supplierCount = db.prepare("SELECT COUNT(*) as count FROM suppliers").get().count;

  if (supplierCount === 0) {
    const insertSupplier = db.prepare("INSERT INTO suppliers (name, city) VALUES (?, ?)");
    const insertInventory = db.prepare(
      "INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)"
    );

    const s1 = insertSupplier.run("Alpha Supplies", "Hyderabad").lastInsertRowid;
    const s2 = insertSupplier.run("Beta Traders", "Bangalore").lastInsertRowid;
    const s3 = insertSupplier.run("Gamma Wholesale", "Mumbai").lastInsertRowid;

    insertInventory.run(s1, "Steel Water Bottle", 50, 450);
    insertInventory.run(s1, "Ceramic Coffee Mug", 80, 220);
    insertInventory.run(s2, "LED Desk Lamp", 25, 1100);
    insertInventory.run(s2, "Wireless Mouse", 60, 700);
    insertInventory.run(s3, "Office Chair", 15, 5000);
    insertInventory.run(s3, "Study Table", 10, 4200);
  }
}

module.exports = { db, initDB };