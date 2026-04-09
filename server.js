const express = require("express");
const path = require("path");
const fs = require("fs");
const { db, initDB } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

initDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// -----------------------------
// Part A: Search API
// -----------------------------
const productsPath = path.join(__dirname, "data", "products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

app.get("/search", (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  const min = minPrice !== undefined ? Number(minPrice) : undefined;
  const max = maxPrice !== undefined ? Number(maxPrice) : undefined;

  if (
    (minPrice !== undefined && Number.isNaN(min)) ||
    (maxPrice !== undefined && Number.isNaN(max))
  ) {
    return res.status(400).json({ message: "minPrice and maxPrice must be valid numbers" });
  }

  if (min !== undefined && max !== undefined && min > max) {
    return res.status(400).json({ message: "minPrice cannot be greater than maxPrice" });
  }

  let results = [...products];

  if (q && q.trim() !== "") {
    const searchText = q.trim().toLowerCase();
    results = results.filter((item) =>
      item.name.toLowerCase().includes(searchText)
    );
  }

  if (category && category.trim() !== "") {
    results = results.filter(
      (item) => item.category.toLowerCase() === category.trim().toLowerCase()
    );
  }

  if (min !== undefined) {
    results = results.filter((item) => item.price >= min);
  }

  if (max !== undefined) {
    results = results.filter((item) => item.price <= max);
  }

  res.json(results);
});

app.get("/categories", (req, res) => {
  const categories = [...new Set(products.map((p) => p.category))];
  res.json(categories);
});

// -----------------------------
// Part B: Database APIs
// -----------------------------

// POST /supplier
app.post("/supplier", (req, res) => {
  const { name, city } = req.body;

  if (!name || !city) {
    return res.status(400).json({ message: "name and city are required" });
  }

  const stmt = db.prepare("INSERT INTO suppliers (name, city) VALUES (?, ?)");
  const result = stmt.run(name, city);

  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(supplier);
});

// POST /inventory
app.post("/inventory", (req, res) => {
  const { supplier_id, product_name, quantity, price } = req.body;

  if (!supplier_id || !product_name || quantity === undefined || price === undefined) {
    return res.status(400).json({
      message: "supplier_id, product_name, quantity and price are required"
    });
  }

  if (Number(quantity) < 0) {
    return res.status(400).json({ message: "Quantity must be greater than or equal to 0" });
  }

  if (Number(price) <= 0) {
    return res.status(400).json({ message: "Price must be greater than 0" });
  }

  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(supplier_id);

  if (!supplier) {
    return res.status(400).json({ message: "Invalid supplier_id. Supplier does not exist" });
  }

  const stmt = db.prepare(`
    INSERT INTO inventory (supplier_id, product_name, quantity, price)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(supplier_id, product_name, quantity, price);

  const item = db.prepare("SELECT * FROM inventory WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

// GET /inventory
app.get("/inventory", (req, res) => {
  const items = db.prepare(`
    SELECT 
      inventory.id,
      inventory.product_name,
      inventory.quantity,
      inventory.price,
      suppliers.id as supplier_id,
      suppliers.name as supplier_name,
      suppliers.city as supplier_city
    FROM inventory
    JOIN suppliers ON inventory.supplier_id = suppliers.id
    ORDER BY inventory.id DESC
  `).all();

  res.json(items);
});

// Required grouped query
app.get("/inventory/grouped", (req, res) => {
  const suppliers = db.prepare(`
    SELECT 
      s.id,
      s.name,
      s.city,
      COALESCE(SUM(i.quantity * i.price), 0) as total_inventory_value
    FROM suppliers s
    LEFT JOIN inventory i ON s.id = i.supplier_id
    GROUP BY s.id
    ORDER BY total_inventory_value DESC
  `).all();

  const inventoryBySupplier = db.prepare(`
    SELECT 
      s.id as supplier_id,
      i.id,
      i.product_name,
      i.quantity,
      i.price,
      (i.quantity * i.price) as item_total_value
    FROM suppliers s
    LEFT JOIN inventory i ON s.id = i.supplier_id
    ORDER BY s.id, i.id
  `).all();

  const grouped = suppliers.map((supplier) => ({
    ...supplier,
    items: inventoryBySupplier.filter(
      (item) => item.supplier_id === supplier.id && item.id !== null
    )
  }));

  res.json(grouped);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});