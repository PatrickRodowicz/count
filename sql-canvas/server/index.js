import express from 'express';
import cors from 'cors';
import { initDatabase, executeSQL, runQuery } from './database.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large datasets

// Initialize database on server start
initDatabase()
  .then(() => {
    console.log('Database ready');
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// API endpoint to execute SQL queries
app.post('/api/query/local', async (req, res) => {
  try {
    const { sql } = req.body;

    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    const results = await executeSQL(sql);
    res.json({ data: results, error: null });
  } catch (error) {
    console.error('Query error:', error);
    res.json({ data: null, error: error.message });
  }
});

// API endpoint to execute SQL with node references
app.post('/api/query/local/with-references', async (req, res) => {
  try {
    const { sql, references } = req.body;

    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    // Find all {label} references in the SQL
    const referencePattern = /\{([^}]+)\}/g;
    const matches = [...sql.matchAll(referencePattern)];

    const tempTables = [];

    try {
      // Create temporary tables for each reference
      for (const match of matches) {
        const nodeLabel = match[1].trim();
        const referencedData = references[nodeLabel];

        if (!referencedData || !referencedData.results || referencedData.results.length === 0) {
          throw new Error(`Node "${nodeLabel}" has no results`);
        }

        // Create a safe table name
        const tempTableName = `temp_${nodeLabel.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        tempTables.push(tempTableName);

        // Get columns from first row
        const columns = Object.keys(referencedData.results[0]);

        // Create temporary table using CREATE TABLE AS SELECT FROM VALUES
        const values = referencedData.results.map(row => {
          const rowValues = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            return `'${String(val).replace(/'/g, "''")}'`; // Escape single quotes
          });
          return `(${rowValues.join(', ')})`;
        }).join(',\n');

        const columnAliases = columns.map(col => `"${col}"`).join(', ');
        const createTableSQL = `CREATE TEMP TABLE ${tempTableName} AS SELECT * FROM (VALUES ${values}) AS t(${columnAliases})`;

        await runQuery(createTableSQL);
      }

      // Replace {label} with temp table names in SQL
      let modifiedSQL = sql;
      for (const match of matches) {
        const nodeLabel = match[1].trim();
        const tempTableName = `temp_${nodeLabel.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        modifiedSQL = modifiedSQL.replace(match[0], tempTableName);
      }

      // Execute the modified query
      const results = await executeSQL(modifiedSQL);

      // Clean up temporary tables
      for (const tempTable of tempTables) {
        try {
          await runQuery(`DROP TABLE ${tempTable}`);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      res.json({ data: results, error: null });
    } catch (error) {
      // Clean up temporary tables on error
      for (const tempTable of tempTables) {
        try {
          await runQuery(`DROP TABLE ${tempTable}`);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Query error:', error);
    res.json({ data: null, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`SQL Canvas API server running on http://localhost:${PORT}`);
});
