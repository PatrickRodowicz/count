import { memo, useState, useEffect } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import Editor from '@monaco-editor/react';
import { executeSQL, executeSQLWithReferences } from '../utils/database';
import ResultsTable from './ResultsTable';
import ResultsChart from './ResultsChart';

interface SQLNodeData {
  sql: string;
  results: any[] | null;
  error: string | null;
  onDelete?: (nodeId: string) => void;
  label?: string;
  getNodeByLabel?: (label: string) => { results: any[] | null; label: string } | null;
  onLabelChange?: (nodeId: string, newLabel: string) => void;
  onResultsChange?: (nodeId: string, results: any[] | null) => void;
  onSQLChange?: (nodeId: string, sql: string) => void;
  locked?: boolean;
  onLockChange?: (nodeId: string, locked: boolean) => void;
}

function SQLNode({ data, id }: NodeProps<SQLNodeData>) {
  const [sql, setSQL] = useState(data.sql || '');
  const [results, setResults] = useState<any[] | null>(data.results);
  const [error, setError] = useState<string | null>(data.error);
  const [isExecuting, setIsExecuting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart' | null>(null);
  const [label, setLabel] = useState(data.label || `SQL Node #${id}`);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [showSQL, setShowSQL] = useState(true);
  const [locked, setLocked] = useState(data.locked || false);

  const handleLockToggle = () => {
    const newLocked = !locked;
    setLocked(newLocked);
    if (data.onLockChange) {
      data.onLockChange(id, newLocked);
    }
  };

  // Update local state when data.sql changes (e.g., when loading a canvas)
  useEffect(() => {
    if (data.sql !== undefined) {
      setSQL(data.sql);
    }
  }, [data.sql]);

  // Update local state when data.label changes (e.g., when loading a canvas)
  useEffect(() => {
    if (data.label !== undefined) {
      setLabel(data.label);
    }
  }, [data.label]);

  // Reset chart configuration when results change
  useEffect(() => {
    if (results && results.length > 0) {
      const columns = Object.keys(results[0]);

      // Clear selected dimension if it no longer exists
      setSelectedDimension(prevDim => {
        if (prevDim && !columns.includes(prevDim)) {
          return null;
        }
        return prevDim;
      });

      // Clear selected metrics that no longer exist
      setSelectedMetrics(prevMetrics => {
        const validMetrics = prevMetrics.filter(metric => columns.includes(metric));
        if (validMetrics.length !== prevMetrics.length) {
          return validMetrics;
        }
        return prevMetrics;
      });
    }
  }, [results]);

  // Update label in parent when it changes
  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    if (data.onLabelChange) {
      data.onLabelChange(id, newLabel);
    }
  };

  // Update SQL in parent when it changes
  const handleSQLChange = (newSQL: string) => {
    setSQL(newSQL);
    if (data.onSQLChange) {
      data.onSQLChange(id, newSQL);
    }
  };

  // Chart configuration state
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [showChartOptions, setShowChartOptions] = useState(true);

  const executeQuery = async () => {
    setIsExecuting(true);
    setError(null);
    try {
      let queryResults: any[];

      // Check if the query contains node references
      if (sql.includes('{') && data.getNodeByLabel) {
        queryResults = await executeSQLWithReferences(sql, data.getNodeByLabel);
      } else {
        queryResults = await executeSQL(sql);
      }

      setResults(queryResults);
      setViewMode('table'); // Automatically show table on successful query

      // Update results in parent
      if (data.onResultsChange) {
        data.onResultsChange(id, queryResults);
      }
    } catch (err: any) {
      setError(err.message);
      setResults(null);

      // Update results in parent (set to null on error)
      if (data.onResultsChange) {
        data.onResultsChange(id, null);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 w-full h-full flex flex-col overflow-hidden">
      <NodeResizer
        minWidth={300}
        minHeight={200}
        isVisible={true}
        lineClassName="border-blue-500"
        handleClassName="h-3 w-3 bg-blue-500 rounded-full"
      />

      {/* Header */}
      <div className="px-4 py-2 rounded-t-lg border-b border-gray-200 flex justify-between items-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          {isEditingLabel ? (
            <input
              type="text"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              onBlur={() => setIsEditingLabel(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingLabel(false);
              }}
              className="nodrag text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded px-2 py-1"
              autoFocus
            />
          ) : (
            <div
              className="nodrag text-sm font-semibold text-gray-700 cursor-pointer hover:text-blue-600 truncate"
              onClick={() => setIsEditingLabel(true)}
              title={label}
            >
              {label}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleLockToggle}
            className={`nodrag px-2 py-1 rounded text-sm font-medium border ${
              locked
                ? 'bg-red-100 border-red-300 hover:bg-red-200'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
            title={locked ? 'Unlock (currently locked)' : 'Lock (currently unlocked)'}
          >
            {locked ? '🔒' : '🔓'}
          </button>
          <button
            onClick={() => setShowSQL(!showSQL)}
            className={`nodrag px-3 py-1 rounded text-sm font-medium ${
              showSQL
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Editor
          </button>
          <button
            onClick={executeQuery}
            disabled={isExecuting}
            className={`nodrag px-3 py-1 rounded text-sm font-medium ${
              isExecuting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isExecuting ? 'Running...' : 'Run Query'}
          </button>
          {data.onDelete && (
            <>
              <div className="flex-shrink-0" style={{ width: '24px' }} />
              <button
                onClick={() => data.onDelete?.(id)}
                className="nodrag px-3 py-1 rounded text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                X
              </button>
            </>
          )}
        </div>
      </div>

      {/* SQL Editor */}
      {showSQL && (
        <div
          className={`p-4 border-b border-gray-200 overflow-hidden ${
            viewMode !== null ? 'flex-shrink-0' : 'flex-1'
          }`}
          style={viewMode !== null ? { height: '250px' } : undefined}
        >
          <div className="nodrag border border-gray-300 rounded overflow-hidden h-full w-full">
            <Editor
              height="100%"
              width="100%"
              defaultLanguage="sql"
              value={sql}
              onChange={(value) => handleSQLChange(value || '')}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                wrappingStrategy: 'advanced',
              }}
            />
          </div>
        </div>
      )}

      {/* Results Section */}
      {(results || error) && (
        <div className={`p-4 overflow-auto flex flex-col ${viewMode !== null ? 'flex-1' : 'flex-shrink-0'}`} style={{ backgroundColor: '#ffffff' }}>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              <div className="font-semibold">Error:</div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          {results && results.length > 0 && (
            <>
              {/* View Mode Toggle */}
              <div className="flex gap-2 mb-3 flex-shrink-0 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'table' ? null : 'table')}
                    className={`nodrag px-3 py-1 rounded text-sm font-medium ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode(viewMode === 'chart' ? null : 'chart')}
                    className={`nodrag px-3 py-1 rounded text-sm font-medium ${
                      viewMode === 'chart'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Chart
                  </button>
                </div>
                {viewMode === 'chart' && (
                  <button
                    onClick={() => setShowChartOptions(!showChartOptions)}
                    className="nodrag px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                    style={{ marginRight: '16px' }}
                    title="Chart Options"
                  >
                    {showChartOptions ? '▶' : '◀'}
                  </button>
                )}
              </div>

              {/* Results Display */}
              {viewMode === 'table' && (
                <div className="nodrag flex-1 min-h-0">
                  <ResultsTable data={results} />
                </div>
              )}
              {viewMode === 'chart' && (
                <div className="nodrag flex-1 flex gap-3 min-h-0 overflow-hidden">
                  {/* Chart Display */}
                  <div className="flex-1 p-3 min-w-0">
                    <ResultsChart
                      data={results}
                      chartType={chartType}
                      dimension={selectedDimension}
                      metrics={selectedMetrics}
                    />
                  </div>

                  {/* Chart Configuration Sidebar */}
                  {showChartOptions && (
                    <div className="w-56 flex-shrink-0 border-l border-gray-200 overflow-y-auto p-4" style={{ backgroundColor: '#f9fafb' }}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-6">Chart Options</h3>

                      {/* Chart Type */}
                      <div className="mb-6">
                        <label className="block text-xs font-medium text-gray-600 mb-2">Chart Type</label>
                        <select
                          value={chartType}
                          onChange={(e) => setChartType(e.target.value as any)}
                          className="nodrag w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white"
                        >
                          <option value="bar">Bar</option>
                          <option value="line">Line</option>
                          <option value="area">Area</option>
                          <option value="pie">Pie</option>
                        </select>
                      </div>

                      {/* X-axis */}
                      <div className="mb-6">
                        <label className="block text-xs font-medium text-gray-600 mb-2">X-axis</label>
                        <select
                          value={selectedDimension || ''}
                          onChange={(e) => setSelectedDimension(e.target.value || null)}
                          className="nodrag w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white"
                        >
                          <option value="">Auto-detect</option>
                          {results && results.length > 0 && Object.keys(results[0]).map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      {/* Y-axis */}
                      <div className="mb-6">
                        <label className="block text-xs font-medium text-gray-600 mb-2">Y-axis</label>
                        <div className="space-y-1 border border-gray-200 rounded p-2 bg-white" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {results && results.length > 0 && Object.keys(results[0])
                            .filter(col => col !== selectedDimension)
                            .filter(col => {
                              // Only show numeric columns
                              const value = results[0][col];
                              return typeof value === 'number' || !isNaN(Number(value));
                            })
                            .map(col => (
                              <label key={col} className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 p-1 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedMetrics.includes(col)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedMetrics([...selectedMetrics, col]);
                                    } else {
                                      setSelectedMetrics(selectedMetrics.filter(m => m !== col));
                                    }
                                  }}
                                  className="nodrag"
                                />
                                <span className="truncate">{col}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {results && results.length === 0 && (
            <div className="text-gray-500 text-sm">Query executed successfully. No results returned.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(SQLNode);
