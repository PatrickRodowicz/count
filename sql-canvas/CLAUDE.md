# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SQL Canvas is a visual SQL analytics platform inspired by count.co. It's a single-page React application that provides an infinite canvas interface where users can create SQL query nodes, execute them against a DuckDB database, and visualize results as tables or charts.

**Key Technology Stack:**
- React 18 + TypeScript + Vite
- React Flow (v11) for canvas and node/edge management
- Monaco Editor for SQL editing
- **Native DuckDB** (duckdb npm package) with Node.js Express backend for analytics query execution
- Recharts for data visualization
- Tailwind CSS v4 with @tailwindcss/postcss plugin

**Architecture:**
- Frontend: React + Vite dev server (http://localhost:5173)
- Backend: Node.js Express API server (http://localhost:3001)
- Database: Native DuckDB with persistent file storage at `data/analytics.duckdb`

## Development Commands

```bash
# Start backend server (runs on http://localhost:3001)
cd server && node index.js

# Start frontend development server (runs on http://localhost:5173)
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Canvas & Node System (React Flow)

The application is built on React Flow, which manages:
- **App.tsx**: Root component containing the `<ReactFlow>` wrapper with canvas state management
- **Node state**: Managed via `useNodesState` and `useEdgesState` hooks
- **Node types**: Three custom node types registered in `nodeTypes` object:
  - `sqlNode` - SQL query editor with results visualization
  - `noteNode` - Text note for documentation/annotations
  - `rectangleNode` - Background rectangle for visual grouping (renders behind other nodes with `zIndex: -1`)
- **Edge types**: Default edges (no custom edge component)
- **Toolbar buttons** (top-left of canvas):
  - `+ Add SQL Node` - Creates new SQL query node
  - `+ Add Note` - Creates new note/annotation node
  - `+ Add Rectangle` - Creates new background rectangle for grouping
  - `Save Canvas` - Export canvas to JSON file
  - `Load Canvas` - Import canvas from JSON file
  - `Clear Canvas` - Remove all nodes and edges (with confirmation)
- **Node data**:
  - SQLNode: `{ sql, results, error, label, onDelete, getNodeByLabel, onLabelChange, onResultsChange }`
  - NoteNode: `{ text, label, onDelete }`
  - RectangleNode: `{ color, onDelete }`
- **Node handles**: Eight handles (2 per side) for bidirectional any-to-any connections on SQLNode and NoteNode:
  - Top: `top-source` (source) and `top-target` (target)
  - Bottom: `bottom-source` (source) and `bottom-target` (target)
  - Left: `left-source` (source) and `left-target` (target)
  - Right: `right-source` (source) and `right-target` (target)
  - RectangleNode has no handles (background element only)

### Critical React Flow Patterns

**`nodrag` className**: Interactive elements inside React Flow nodes (buttons, editors, form inputs) **must** have the `nodrag` className to prevent the drag handler from intercepting their events. Without this:
- Buttons won't be clickable
- Text editors won't be editable
- The node will drag instead of allowing interaction

Example from SQLNode.tsx:
```tsx
<button className="nodrag px-3 py-1 ...">Run Query</button>
<div className="nodrag border ...">
  <Editor ... />
</div>
```

**Handle IDs**: When a node has multiple handles of the same type (e.g., multiple target handles), each handle **must** have a unique `id` prop. Without unique IDs, React Flow cannot distinguish between handles and connections may snap to the wrong one.

**Bidirectional handles**: To allow any-to-any connections (e.g., right-to-right, left-to-left), place BOTH a source and target handle at each position. They overlap visually but enable flexible connections.

Example from SQLNode.tsx:
```tsx
{/* Top handles - both source and target for bidirectional connections */}
<Handle type="source" position={Position.Top} id="top-source" />
<Handle type="target" position={Position.Top} id="top-target" />

{/* Repeat for all 4 sides */}
<Handle type="source" position={Position.Left} id="left-source" />
<Handle type="target" position={Position.Left} id="left-target" />
```

### Backend Database (Native DuckDB)

**Database architecture**:
- Backend Express server (`server/index.js`) on port 3001
- Native DuckDB database (`server/database.js`) with persistent file at `data/analytics.duckdb`
- Frontend makes HTTP POST requests to backend API endpoints for query execution
- Pre-populated with sample tables: `users` (10,000 rows), `orders` (10,000 rows), `products` (10,000 rows)

**API Endpoints**:
- `POST /api/query/local` - Execute SQL query directly
  - Body: `{ sql: string }`
  - Returns: `{ data: any[], error: string | null }`
- `POST /api/query/local/with-references` - Execute SQL with node references
  - Body: `{ sql: string, references: { [label: string]: { results: any[], label: string } } }`
  - Returns: `{ data: any[], error: string | null }`
  - Backend creates temporary tables from referenced node results
  - Increased JSON body limit to 50MB to support large datasets

**Why Native DuckDB over WASM:**
- **Better performance** - native code is faster than WASM
- **Persistent storage** - database file survives server restarts
- **Larger datasets** - no browser memory constraints
- **File access** - can load CSV/Parquet files from filesystem
- Better debugging and error handling on backend

**Why DuckDB over PostgreSQL/SQLite:**
- **Built for analytics (OLAP)** - designed for aggregations, joins, complex analytical queries
- Better performance for analytical workloads
- More advanced SQL features (window functions, QUALIFY, PIVOT, etc.)
- Can read files directly (Parquet, CSV, JSON) without loading into tables
- Native Parquet support for columnar analytics

**Query execution flow**:
1. Frontend calls `executeSQL(sql)` or `executeSQLWithReferences(sql, getNodeByLabel)` in `src/utils/database.ts`
2. Frontend makes HTTP POST request to backend API
3. Backend executes query in DuckDB and returns results as JSON
4. Frontend stores results in node state
5. Each node executes queries independently via local state
6. Nodes can reference other nodes' results using `{node_label}` syntax

**Node Referencing System**:
SQL nodes can reference the results of other nodes using `{node_label}` syntax:

```sql
-- Node named "product_agg":
SELECT product, SUM(amount) as total_sales
FROM orders
GROUP BY product

-- Another node can reference it:
SELECT * FROM {product_agg}
WHERE total_sales > 500
ORDER BY total_sales DESC
```

**How it works:**
1. Nodes have editable labels (click label to rename)
2. When a query contains `{label}`, the frontend:
   - Finds the node with that label using `getNodeByLabel()`
   - Sends the SQL and referenced node results to backend via `POST /api/query/local/with-references`
3. Backend processes the references:
   - Creates temporary DuckDB tables from referenced node results
   - Replaces `{label}` with temp table names in the SQL
   - Executes the modified query
   - Cleans up temp tables after execution (using `DROP TABLE`)
   - Returns results as JSON
4. Node labels and results are synced to App state via callbacks:
   - `onLabelChange(nodeId, newLabel)` - updates label in App state
   - `onResultsChange(nodeId, results)` - updates results in App state
5. `getNodeByLabel` uses a ref to always access current node state
6. Works with any number of references in a single query

**Error handling:**
- `Node with label "..." not found` - referenced node doesn't exist
- `Node "..." has no results` - referenced node hasn't been executed yet
- Backend payload limit is 50MB to support large referenced datasets

**Example workflow:**
```sql
-- Node "users_ny":
SELECT * FROM users WHERE city = 'New York'

-- Node "ny_orders":
SELECT o.* FROM orders o
WHERE user_id IN (SELECT id FROM {users_ny})

-- Node "ny_summary":
SELECT
  COUNT(*) as order_count,
  SUM(amount) as total_amount
FROM {ny_orders}
```

### Component Structure

**SQLNode.tsx** (main node component):
- Contains Monaco Editor for SQL input
- Manages query execution state (loading, results, errors)
- Toggleable table/chart views (clicking active view closes it, viewMode can be null)
- **Chart customization panel** (collapsible with ▼/▲ chevron):
  - Chart type selector: Bar, Line, Area, Pie
  - Dimension (X-axis) dropdown: Auto-detect or manual selection
  - Metrics (Y-axis) multi-select: Hold Ctrl/Cmd for multiple
  - Panel hidden by default, shown via chevron button
- Editable label (click to rename) - syncs to App state via `onLabelChange`
- Delete button (X) with spacing to prevent accidental clicks
- Has 8 React Flow handles (2 per side) for bidirectional connections
- Receives callbacks via node data: `onDelete`, `onLabelChange`, `onResultsChange`, `getNodeByLabel`

**NoteNode.tsx** (text annotation node):
- Yellow sticky-note styled background (`#fefce8`)
- Large textarea for writing notes/documentation
- Editable label (click to rename)
- Resizable (minimum 250x150px)
- Delete button (X)
- Has 8 handles for connections (same as SQLNode)

**RectangleNode.tsx** (background grouping element):
- Semi-transparent colored rectangle (60% opacity)
- Renders behind other nodes (`zIndex: -1`)
- **Color customization** via chevron button (▼):
  - Compact dropdown with 8 preset colors
  - Custom color picker for any color
  - Dropdown positioned directly under chevron
- Resizable (minimum 200x150px)
- No delete button (remove by selecting and pressing Delete key)
- No handles (background decoration only)

**ResultsTable.tsx**:
- Renders query results as scrollable HTML table
- **Sticky horizontal scrollbar** - stays at bottom of visible viewport using JavaScript sync
  - Uses React refs and event listeners to sync scroll between table and sticky scrollbar
  - ResizeObserver automatically updates scrollbar width when table changes
  - Solves common issue of horizontal scrollbar being hidden at bottom of large tables
- **Zebra striping** - alternating white and light gray row backgrounds for readability
- **Cell borders** - visible borders on all cells to distinguish columns
- **Enhanced hover effect** - light blue background on hovered row using state tracking
- White background with explicit inline styles
- Sticky header row with thicker bottom border

**ResultsChart.tsx**:
- Supports multiple chart types: Bar, Line, Area, Pie
- Auto-detects numeric vs string columns (or uses user selection)
- Filters out X-axis column from Y-axis data
- Uses first string column as X-axis, numeric columns as Y-axis
- Pie charts use first metric only
- White background with explicit inline styles
- Receives props: `data`, `chartType`, `dimension`, `metrics`

### Styling Notes

**Tailwind CSS v4**:
- Uses new `@tailwindcss/postcss` plugin (not old `tailwindcss` plugin)
- Configuration in `postcss.config.js` must use `@tailwindcss/postcss`
- CSS imports order matters: `@import` statements must come before `@tailwind` directives

**CSS import order in index.css**:
```css
@import 'reactflow/dist/style.css';  /* Must be first */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Inline styles for reliability**:
- Background colors use inline styles (`style={{ backgroundColor: '#ffffff' }}`) instead of Tailwind classes
- This ensures backgrounds are not transparent due to CSS specificity issues
- Examples: SQLNode header, ResultsTable, ResultsChart, NoteNode backgrounds
- Tailwind classes sometimes don't apply in complex React Flow node structures

**Custom scrollbars** (defined in index.css):
- Wider 12px scrollbars for easier visibility and interaction
- Semi-transparent gray track and thumb with darker color on hover
- Uses both webkit (Chrome/Safari) and standard scrollbar properties
- Applies to all scrollable elements with `*` selector

### Sample Data Schema

Three tables pre-loaded in DuckDB database with 10,000 rows each:

**users** (10,000 rows, 17 columns):
- id, first_name, last_name, email, phone, age, city, state, country, postal_code, address
- signup_date, last_login, account_status, subscription_tier, monthly_spend, total_orders, loyalty_points

**orders** (10,000 rows, 16 columns):
- id, user_id, product_id, product_name, category, quantity, unit_price, total_amount
- discount_percent, tax_amount, shipping_cost, order_date, ship_date, delivery_date
- order_status, payment_method

**products** (10,000 rows, 15 columns):
- id, name, category, subcategory, brand, price, cost, stock, reorder_level
- supplier, weight_kg, dimensions, color, rating, review_count

Users can query these tables immediately without setup. The database file persists at `data/analytics.duckdb`.

**DuckDB-specific features available:**
- Advanced window functions: `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `NTILE()`, `LAG()`, `LEAD()`
- `QUALIFY` clause for filtering window function results
- `PIVOT` and `UNPIVOT` for reshaping data
- `CASE WHEN` with more complex logic
- Regex functions: `regexp_matches()`, `regexp_replace()`
- JSON functions (future: when loading JSON data)
- Date/time functions: `CURRENT_DATE`, `date_diff()`, `date_trunc()`

## Common Development Patterns

### Adding a new node type
1. Create component in `src/components/`
2. Add to `nodeTypes` object in App.tsx
3. Use `nodrag` className on all interactive elements
4. Add handles for connections if needed (ensure unique `id` props if multiple handles of same type)
5. Include `onDelete` in node data interface if deletion is needed

### Node deletion pattern
- `deleteNode` callback created in App.tsx with empty deps (setNodes/setEdges are stable from React Flow)
- Passed to nodes via `data.onDelete` prop
- Filters out node and any connected edges
- Initialized in useEffect to avoid closure issues

### Edge deletion
- Edges can be deleted by selecting them and pressing Delete/Backspace key (default React Flow behavior)
- Or via React Flow's built-in edge selection and removal

### Adding database functionality
- Modify `createTablesAndData()` in `server/database.js` to add tables
- Database persists to file at `data/analytics.duckdb` (survives server restarts)
- **Can import CSV/Parquet files** - DuckDB supports `READ_CSV()`, `READ_PARQUET()`, `READ_JSON()`
- **Can query remote data** - DuckDB can query HTTP URLs and S3 buckets directly (requires httpfs extension)

### Adding new visualization types
- Create new component similar to `ResultsChart.tsx`
- Add toggle button in SQLNode.tsx
- Auto-detect data shape to choose visualization

## Canvas Persistence

The application supports saving and loading canvas state to JSON files:

**Save Canvas** button:
- Exports entire canvas to a JSON file (`canvas-state.json`)
- Saves: node positions, sizes, types, SQL queries, note text, labels, colors, edges, node IDs
- Does NOT save: query results (set to null on load to avoid large file sizes)
- All editor contents (SQL and notes) are preserved

**Load Canvas** button:
- Imports a previously saved JSON file
- Restores all nodes, edges, and their positions
- Preserves SQL queries and note text
- Reconnects all callbacks and handlers
- Query results are cleared - you need to re-run queries

**Clear Canvas** button:
- Removes all nodes and edges from the canvas
- Shows confirmation dialog to prevent accidental deletion
- Resets node ID counter

**Implementation details** (SQLNode.tsx, NoteNode.tsx):
- Components use `useEffect` to sync local state with props when data changes
- This ensures that when a canvas is loaded, editor contents update correctly
- Without this, React's `useState` would only use the initial prop value and ignore subsequent updates

## Known Issues & Constraints

- **No auto-save**: Must manually save canvas before refresh (localStorage auto-save is a future enhancement)
- **No collaborative features** (by design - single user application)
- **Results not persisted**: Query results are not saved to JSON (must re-run queries after loading)
- **Single database instance**: All nodes share the same DuckDB database
- **Backend required**: Frontend requires backend server running on port 3001
- Vite cache issues: If dependencies change, may need to `rm -rf node_modules/.vite`

## Future Enhancements

### Remote Database Support (Redshift/PostgreSQL/etc.)

The current backend architecture makes it straightforward to add support for remote databases:

**Approach:**
1. Add "Data Source" selector to SQLNode: `DuckDB Local | Redshift | PostgreSQL | BigQuery`
2. Add connection configuration UI (host, port, database, credentials)
3. Create new backend endpoints for each database type
4. Backend connects to remote DB, executes query, returns results as JSON
5. Node referencing continues to work unchanged - frontend sends referenced results to backend

**Benefits:**
- ✅ Backend already handles query execution and node references
- ✅ Can query production databases without exposing credentials in frontend
- ✅ Can mix local DuckDB with remote database queries in same canvas
- ✅ Backend can handle connection pooling, authentication, query optimization

### Other Enhancements

- **Auto-save to localStorage**: Automatically save canvas state every few seconds to prevent data loss on refresh
- **Data export**: Export query results to CSV, Excel, or Parquet formats
- **File import UI**: Add file upload to load CSV/Parquet/JSON files into DuckDB
- **Remote data**: Query data from HTTP URLs or S3 buckets directly (requires httpfs extension)
- **DuckDB extensions**: Load additional extensions (spatial, httpfs, json, etc.)
- **Query history**: Track and replay previous queries
- **Keyboard shortcuts**: Add shortcuts for common operations
- **More chart types**: Scatter plots, histograms, heatmaps, dual-axis charts
- **SQL auto-completion**: Configure Monaco editor with table/column completion
