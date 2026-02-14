const API_BASE_URL = 'http://localhost:3001';

// Execute SQL query via API
export async function executeSQL(sql: string): Promise<any[]> {
  const trimmedSQL = sql.trim();
  if (!trimmedSQL) {
    throw new Error('Empty query');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/query/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: trimmedSQL }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return result.data || [];
  } catch (error: any) {
    throw new Error(error.message || 'SQL execution error');
  }
}

// Execute SQL query with node references via API
export async function executeSQLWithReferences(
  sql: string,
  getNodeByLabel: (label: string) => { results: any[] | null; label: string } | null
): Promise<any[]> {
  const trimmedSQL = sql.trim();
  if (!trimmedSQL) {
    throw new Error('Empty query');
  }

  // Find all {label} references in the SQL
  const referencePattern = /\{([^}]+)\}/g;
  const matches = [...trimmedSQL.matchAll(referencePattern)];

  // Build references object with node data
  const references: Record<string, { results: any[] | null; label: string }> = {};
  for (const match of matches) {
    const nodeLabel = match[1].trim();
    const referencedNode = getNodeByLabel(nodeLabel);

    if (!referencedNode) {
      throw new Error(`Node with label "${nodeLabel}" not found`);
    }

    if (!referencedNode.results || referencedNode.results.length === 0) {
      throw new Error(`Node "${nodeLabel}" has no results`);
    }

    references[nodeLabel] = referencedNode;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/query/local/with-references`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: trimmedSQL,
        references,
      }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return result.data || [];
  } catch (error: any) {
    throw new Error(error.message || 'SQL execution error');
  }
}

// No initialization needed - backend handles it
export async function initDatabase() {
  // Check if backend is running
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Backend not responding');
    }
  } catch (error) {
    throw new Error('Cannot connect to backend server. Make sure it is running on port 3001.');
  }
}
