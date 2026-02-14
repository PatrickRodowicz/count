# SQL Canvas - Visual SQL Analytics Platform

A canvas-based SQL analytics platform inspired by count.co, allowing you to create, execute, and visualize SQL queries in an infinite canvas interface.

## Features

- **Infinite Canvas Interface**: Drag, zoom, and navigate an unlimited workspace
- **SQL Editor**: Monaco editor (VS Code) with SQL syntax highlighting
- **Visual Query Results**: View results as tables or charts
- **Node-Based Workflow**: Create multiple SQL nodes and connect them with edges
- **Sample Data**: Pre-loaded with sample tables (users, orders, products)
- **Interactive Visualizations**: Automatic chart generation using Recharts

## Tech Stack

- **React + TypeScript**: Modern UI framework
- **React Flow**: Canvas and node/edge management
- **Monaco Editor**: SQL code editor
- **sql.js**: SQLite in the browser (WebAssembly)
- **Recharts**: Data visualization
- **Tailwind CSS**: Styling
- **Vite**: Build tool and dev server

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5173/

### Build for Production

```bash
npm run build
```

## Usage

### Creating Nodes

1. Click the "+ Add SQL Node" button in the top-left corner
2. A new SQL node will appear on the canvas

### Writing SQL Queries

1. Click inside the Monaco editor in any node
2. Write your SQL query (sample tables: `users`, `orders`, `products`)
3. Click "Run Query" to execute

### Viewing Results

- **Table View**: See results in a scrollable table
- **Chart View**: Automatically generated bar charts for numeric data
- Toggle between views using the buttons above the results

### Connecting Nodes

1. Hover over the small circle at the bottom of a node (source handle)
2. Click and drag to another node's top circle (target handle)
3. Release to create a connection edge

### Canvas Navigation

- **Pan**: Click and drag on empty canvas space
- **Zoom**: Use mouse wheel or pinch gesture
- **Move Nodes**: Click and drag nodes to reposition

## Sample Queries

Try these queries with the pre-loaded data:

```sql
-- Get all users
SELECT * FROM users;

-- Users by city
SELECT city, COUNT(*) as count
FROM users
GROUP BY city;

-- Top products by revenue
SELECT p.name, SUM(o.amount) as revenue
FROM orders o
JOIN products p ON o.product = p.name
GROUP BY p.name
ORDER BY revenue DESC;

-- User spending analysis
SELECT u.name, u.city, SUM(o.amount) as total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.city
ORDER BY total_spent DESC;
```

## Sample Data Schema

### users
- id (INTEGER)
- name (TEXT)
- email (TEXT)
- age (INTEGER)
- city (TEXT)

### orders
- id (INTEGER)
- user_id (INTEGER)
- product (TEXT)
- amount (REAL)
- order_date (TEXT)

### products
- id (INTEGER)
- name (TEXT)
- category (TEXT)
- price (REAL)
- stock (INTEGER)

## Project Structure

```
sql-canvas/
├── src/
│   ├── components/
│   │   ├── SQLNode.tsx        # Main node component
│   │   ├── ResultsTable.tsx   # Table view component
│   │   └── ResultsChart.tsx   # Chart view component
│   ├── utils/
│   │   └── database.ts        # SQL.js database setup
│   ├── App.tsx                # Main canvas component
│   ├── main.tsx               # App entry point
│   └── index.css              # Global styles
├── package.json
├── vite.config.ts
└── README.md
```

## Future Enhancements

- Save/load canvas layouts
- Custom database connections
- More chart types (line, pie, scatter)
- Export results to CSV/JSON
- Query history
- Node-to-node data passing
- Custom themes
