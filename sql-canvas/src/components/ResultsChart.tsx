import { memo, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ResultsChartProps {
  data: any[];
  chartType?: 'bar' | 'line' | 'area' | 'pie';
  dimension?: string | null;
  metrics?: string[];
}

function ResultsChart({ data, chartType = 'bar', dimension = null, metrics = [] }: ResultsChartProps) {
  const chartConfig = useMemo(() => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    // Identify numeric columns (columns where ALL values are numbers or null)
    const numericColumns = columns.filter((col) => {
      return data.every((row) => {
        const val = row[col];
        return val === null || val === undefined || typeof val === 'number';
      });
    });

    const stringColumns = columns.filter((col) => !numericColumns.includes(col));

    // Use provided dimension, or auto-detect: first string column as X-axis, or first column if none
    let xAxisKey: string;
    if (dimension) {
      xAxisKey = dimension;
    } else {
      xAxisKey = stringColumns[0] || columns[0];
    }

    // Use provided metrics, or auto-detect
    let yAxisKeys: string[];
    if (metrics && metrics.length > 0) {
      yAxisKeys = metrics;
    } else {
      // Filter out the x-axis key from numeric columns for y-axis
      const autoNumericKeys = numericColumns.filter(col => col !== xAxisKey).slice(0, 3);
      // If no numeric columns for Y axis, use all columns except X axis
      yAxisKeys = autoNumericKeys.length > 0 ? autoNumericKeys : columns.filter(col => col !== xAxisKey).slice(0, 3);
    }

    return {
      xAxisKey,
      yAxisKeys,
    };
  }, [data, dimension, metrics]);

  if (!data || data.length === 0 || !chartConfig) {
    return <div className="text-gray-500 text-sm">No data to visualize</div>;
  }

  if (chartConfig.yAxisKeys.length === 0) {
    return <div className="text-gray-500 text-sm">No numeric data to chart</div>;
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Render different chart types
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 20 },
    };

    if (chartType === 'pie') {
      // For pie chart, we need to transform data differently
      // Use the first metric only
      const metricKey = chartConfig.yAxisKeys[0];
      if (!metricKey) return null;

      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={metricKey}
            nameKey={chartConfig.xAxisKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );
    }

    // For bar, line, and area charts
    return (
      <>
        {chartType === 'bar' && (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {chartConfig.yAxisKeys.map((key, idx) => (
              <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} />
            ))}
          </BarChart>
        )}
        {chartType === 'line' && (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {chartConfig.yAxisKeys.map((key, idx) => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[idx % colors.length]} strokeWidth={2} />
            ))}
          </LineChart>
        )}
        {chartType === 'area' && (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {chartConfig.yAxisKeys.map((key, idx) => (
              <Area key={key} type="monotone" dataKey={key} fill={colors[idx % colors.length]} stroke={colors[idx % colors.length]} />
            ))}
          </AreaChart>
        )}
      </>
    );
  };

  return (
    <div className="w-full h-full rounded border border-gray-300 p-4" style={{ backgroundColor: '#ffffff' }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

export default memo(ResultsChart);
