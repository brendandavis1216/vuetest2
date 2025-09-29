"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BudgetByContractStatusChartProps {
  totalSignedBudget: number;
  totalPendingBudget: number;
}

const BudgetByContractStatusChart: React.FC<BudgetByContractStatusChartProps> = ({
  totalSignedBudget,
  totalPendingBudget,
}) => {
  const data = [
    { name: 'Signed Contracts', budget: totalSignedBudget, fill: '#22c55e' }, // Green
    { name: 'Pending Contracts', budget: totalPendingBudget, fill: '#eab308' }, // Yellow
  ];

  // Filter out categories with 0 value to avoid displaying them in the chart
  const filteredData = data.filter(entry => entry.budget > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No budget data available for contracts.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={filteredData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
        <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
        <YAxis stroke="hsl(var(--foreground))" tickFormatter={(value) => `$${value.toLocaleString()}`} />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Budget']}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend />
        <Bar dataKey="budget" name="Total Budget" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BudgetByContractStatusChart;