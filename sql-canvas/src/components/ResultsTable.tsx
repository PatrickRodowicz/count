import { memo, useRef, useEffect, useState } from 'react';

interface ResultsTableProps {
  data: any[];
}

const ROWS_PER_PAGE = 100;

function ResultsTable({ data }: ResultsTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
  const endIdx = startIdx + ROWS_PER_PAGE;
  const paginatedData = data.slice(startIdx, endIdx);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const horizontalScroll = horizontalScrollRef.current;
    const scrollContent = scrollContentRef.current;

    if (!tableContainer || !horizontalScroll || !scrollContent) return;

    // Sync horizontal scroll from table to scrollbar
    const handleTableScroll = () => {
      if (horizontalScroll && tableContainer) {
        horizontalScroll.scrollLeft = tableContainer.scrollLeft;
      }
    };

    // Sync horizontal scroll from scrollbar to table
    const handleScrollbarScroll = () => {
      if (tableContainer && horizontalScroll) {
        tableContainer.scrollLeft = horizontalScroll.scrollLeft;
      }
    };

    // Update scrollbar width to match table content width
    const updateScrollbarWidth = () => {
      if (scrollContent && tableContainer) {
        const table = tableContainer.querySelector('table');
        if (table) {
          // Account for padding (12px on each side = 24px total)
          scrollContent.style.width = `${table.scrollWidth + 24}px`;
        }
      }
    };

    tableContainer.addEventListener('scroll', handleTableScroll);
    horizontalScroll.addEventListener('scroll', handleScrollbarScroll);

    // Update scrollbar width on mount and when data changes
    updateScrollbarWidth();

    // Use ResizeObserver to update scrollbar width when table size changes
    const resizeObserver = new ResizeObserver(updateScrollbarWidth);
    const table = tableContainer.querySelector('table');
    if (table) {
      resizeObserver.observe(table);
    }

    return () => {
      tableContainer.removeEventListener('scroll', handleTableScroll);
      horizontalScroll.removeEventListener('scroll', handleScrollbarScroll);
      resizeObserver.disconnect();
    };
  }, [paginatedData]);

  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-sm">No results</div>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div style={{ backgroundColor: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
      {/* Table container - vertical scroll only */}
      <div
        ref={tableContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '12px',
          minHeight: 0
        }}
      >
        <table style={{ width: 'max-content', minWidth: '100%', backgroundColor: '#ffffff', borderCollapse: 'collapse' }}>
          <thead className="bg-gray-50" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                  style={{ borderBottom: '2px solid #d1d5db', borderRight: '1px solid #e5e7eb' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {paginatedData.map((row, rowIdx) => {
              const isHovered = hoveredRow === rowIdx;
              const backgroundColor = isHovered
                ? '#dbeafe'  // blue-100
                : rowIdx % 2 === 0
                  ? '#ffffff'
                  : '#f9fafb';

              return (
                <tr
                  key={rowIdx}
                  onMouseEnter={() => setHoveredRow(rowIdx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ backgroundColor, cursor: 'default' }}
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                      style={{ borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}
                    >
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          padding: '12px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            Showing {startIdx + 1}-{Math.min(endIdx, data.length)} of {data.length} rows
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="nodrag px-2 py-1 rounded text-xs border"
              style={{
                backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                borderColor: '#d1d5db',
                color: currentPage === 1 ? '#9ca3af' : '#374151',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="nodrag px-2 py-1 rounded text-xs border"
              style={{
                backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                borderColor: '#d1d5db',
                color: currentPage === 1 ? '#9ca3af' : '#374151',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: '13px', color: '#374151', padding: '0 8px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="nodrag px-2 py-1 rounded text-xs border"
              style={{
                backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                borderColor: '#d1d5db',
                color: currentPage === totalPages ? '#9ca3af' : '#374151',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="nodrag px-2 py-1 rounded text-xs border"
              style={{
                backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                borderColor: '#d1d5db',
                color: currentPage === totalPages ? '#9ca3af' : '#374151',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Sticky horizontal scrollbar at bottom */}
      <div
        ref={horizontalScrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '12px',
          flexShrink: 0,
          marginTop: '-12px',
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb'
        }}
      >
        <div ref={scrollContentRef} style={{ height: '1px' }} />
      </div>
    </div>
  );
}

export default memo(ResultsTable);
