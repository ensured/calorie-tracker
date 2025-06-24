'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { DailyTargets } from '@/lib/types';

interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
  potassium: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      actual: number;
      unit: string;
      dv: number;
    };
  }>;
  label?: string;
}

export default function NutrientChart({ nutrients, dailyTargets }: { nutrients: Nutrients; dailyTargets: DailyTargets }) {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  // Skeleton loading state for client-only rendering
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) {
    return (
      <div className="w-full">
        <div className="h-64 mb-4 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-md w-full" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded h-16" />
          ))}
        </div>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Calories',
      value: Math.round((nutrients.calories / dailyTargets.calories) * 100),
      actual: Math.round(nutrients.calories),
      unit: 'kcal',
      dv: dailyTargets.calories,
    },
    {
      name: 'Protein',
      value: Math.round((nutrients.protein / dailyTargets.protein) * 100),
      actual: Math.round(nutrients.protein * 10) / 10,
      unit: 'g',
      dv: dailyTargets.protein,
    },
    {
      name: 'Carbs',
      value: Math.round((nutrients.carbs / dailyTargets.carbs) * 100),
      actual: Math.round(nutrients.carbs * 10) / 10,
      unit: 'g',
      dv: dailyTargets.carbs,
    },
    {
      name: 'Fats',
      value: Math.round((nutrients.fats / dailyTargets.fats) * 100),
      actual: Math.round(nutrients.fats * 10) / 10,
      unit: 'g',
      dv: dailyTargets.fats,
    },
    {
      name: 'Vitamin A',
      value: Math.round((nutrients.vitaminA / dailyTargets.vitaminA) * 100),
      actual: Math.round(nutrients.vitaminA * 10) / 10,
      unit: 'mcg',
      dv: dailyTargets.vitaminA,
    },
    {
      name: 'Vitamin C',
      value: Math.round((nutrients.vitaminC / dailyTargets.vitaminC) * 100),
      actual: Math.round(nutrients.vitaminC * 10) / 10,
      unit: 'mg',
      dv: dailyTargets.vitaminC,
    },
    {
      name: 'Calcium',
      value: Math.round((nutrients.calcium / dailyTargets.calcium) * 100),
      actual: Math.round(nutrients.calcium * 10) / 10,
      unit: 'mg',
      dv: dailyTargets.calcium,
    },
    {
      name: 'Iron',
      value: Math.round((nutrients.iron / dailyTargets.iron) * 100),
      actual: Math.round(nutrients.iron * 10) / 10,
      unit: 'mg',
      dv: dailyTargets.iron,
    },
    {
      name: 'Potassium',
      value: Math.round((nutrients.potassium / dailyTargets.potassium) * 100),
      actual: Math.round(nutrients.potassium * 10) / 10,
      unit: 'mg',
      dv: dailyTargets.potassium,
    },
  ];

  const getBarColor = (value: number) => {
    if (value < 25) return isDark ? '#ef4444' : '#ef4444'; // red
    if (value < 50) return isDark ? '#f97316' : '#f97316'; // orange
    if (value < 75) return isDark ? '#eab308' : '#eab308'; // yellow
    if (value < 100) return isDark ? '#22c55e' : '#22c55e'; // green
    return isDark ? '#15803d' : '#15803d'; // dark green
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">
            {data.actual} {data.unit} ({data.value}% DV)
          </p>
          <p className="text-xs text-muted-foreground">
            Daily Value: {data.dv} {data.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              tick={{ fill: isDark ? 'white' : 'black' }}
            />
            <YAxis
              label={{ value: '% Daily Value', angle: -90, position: 'insideLeft', fill: isDark ? 'white' : 'black' }}
              fontSize={12}
              tick={{ fill: isDark ? 'white' : 'black' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        {chartData.slice(0, 4).map((item) => (
          <div key={item.name} className="bg-secondary/50 p-2 rounded text-center h-16">
            <div className="text-xs text-muted-foreground">{item.name}</div>
            <div className="font-semibold text-sm">
              {item.actual} {item.unit}
            </div>
            <div className="text-xs" style={{ color: getBarColor(item.value) }}>
              {item.value}% DV
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 