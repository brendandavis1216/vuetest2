"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ContractStatusPieChartProps {
  signedContractsCount: number;
  pendingContractsCount: number;
}

const COLORS = ['#22c55e', '#eab308']; // Green for signed, Yellow for pending

const ContractStatusPieChart: React.FC<ContractStatusPieChartProps> = ({
  signedContractsCount,
  pendingContractsCount,
}) => {
  const data = [
    { name: 'Signed Contracts', value: signedContractsCount },
    { name: 'Pending Contracts', value: pendingContractsCount },
  ];

  // Filter out categories with 0 value to avoid displaying them in the chart
  const filteredData = data.filter(entry => entry.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No contract data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ContractStatusPieChart;