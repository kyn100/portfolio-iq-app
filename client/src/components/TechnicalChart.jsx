import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const TechnicalChart = ({ data, movingAverages, bollingerBands, mini = false }) => {
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: d.close,
  }));

  const prices = data.map((d) => d.close);
  const minPrice = Math.min(...prices) * 0.98;
  const maxPrice = Math.max(...prices) * 1.02;

  if (mini) {
    return (
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[minPrice, maxPrice]}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v.toFixed(0)}`}
        />
        <Tooltip
          formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
        {movingAverages?.sma20 && (
          <ReferenceLine
            y={movingAverages.sma20}
            stroke="#10b981"
            strokeDasharray="3 3"
            label={{ value: 'SMA20', position: 'right', fontSize: 10 }}
          />
        )}
        {movingAverages?.sma50 && (
          <ReferenceLine
            y={movingAverages.sma50}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{ value: 'SMA50', position: 'right', fontSize: 10 }}
          />
        )}
        {bollingerBands && (
          <>
            <ReferenceLine
              y={bollingerBands.upper}
              stroke="#ef4444"
              strokeDasharray="5 5"
            />
            <ReferenceLine
              y={bollingerBands.lower}
              stroke="#ef4444"
              strokeDasharray="5 5"
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TechnicalChart;
