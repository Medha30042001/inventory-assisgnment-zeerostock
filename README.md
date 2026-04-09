# Inventory Assignment

This project covers both parts of the assignment:

## Part A - Search-Focused Assignment

### API
`GET /search`

### Supported query params
- `q` → partial product name match
- `category`
- `minPrice`
- `maxPrice`

### Search logic
- Search is case-insensitive
- Filters can be combined
- If no filters are passed, all products are returned
- Invalid price range is handled
- No results state is shown in the UI

### Frontend
- Search input
- Category dropdown
- Min and max price inputs
- Results displayed in a table
- "No results found" state

### Performance improvement for large datasets
For large datasets, I would add database indexing and server-side pagination so the API does not scan and return too many records at once.

---

## Part B - Database-Focused Assignment

### Database schema

#### Suppliers
- `id`
- `name`
- `city`

#### Inventory
- `id`
- `supplier_id`
- `product_name`
- `quantity`
- `price`

### Relationship
- One supplier can have many inventory items

### APIs
- `POST /supplier`
- `POST /inventory`
- `GET /inventory`

### Rules handled
- Inventory must belong to a valid supplier
- Quantity must be >= 0
- Price must be > 0

### Required query
`GET /inventory/grouped`

This returns all inventory grouped by supplier and sorted by total inventory value (`quantity * price`) in descending order.

### Why I chose SQL
I chose SQL because this data has a clear relationship between suppliers and inventory items, and SQL is good for structured data, joins, constraints, and grouped queries.

### Indexing / optimization suggestion
One improvement would be adding an index on `inventory.supplier_id` to make supplier-based lookups and joins faster.

---

## How to run

```bash
npm install
npm start
