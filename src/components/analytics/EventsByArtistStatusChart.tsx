"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EventsByArtistStatusChartProps {
  eventsWithArtist: number;
  eventsWithoutArtist: number;
}

const EventsByArtistStatusChart: React.FC<EventsByArtistStatusChartProps> = ({
  eventsWithArtist,
  eventsWithoutArtist,
}) => {
  const data = [
    { name: 'With Artist', count: eventsWithArtist, fill: '#3b82f6' }, // Blue
    { name: 'Without Artist', count: eventsWithoutArtist, fill: '#6b7280' }, // Gray
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
        <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
        <YAxis stroke="hsl(var(--foreground))" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend />
        <Bar dataKey="count" name="Number of Events" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EventsByArtistStatusChart;