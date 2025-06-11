'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';

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

// Daily Value references (for adults)
const dailyValues = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fats: 78,
  vitaminA: 900, // mcg
  vitaminC: 90, // mg
  calcium: 1000, // mg
  iron: 18, // mg
  potassium: 2500, // mg
};

export default function NutrientChart({ nutrients }: { nutrients: Nutrients }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = [
    {
      name: 'Calories',
      value: Math.round((nutrients.calories / dailyValues.calories) * 100),
      actual: Math.round(nutrients.calories),
      unit: 'kcal',
      dv: dailyValues.calories,
    },
    {
      name: 'Protein',
      value: Math.round((nutrients.protein / dailyValues.protein) * 100),
      actual: Math.round(nutrients.protein * 10) / 10,
      unit: 'g',
      dv: dailyValues.protein,
    },
    {
      name: 'Carbs',
      value: Math.round((nutrients.carbs / dailyValues.carbs) * 100),
      actual: Math.round(nutrients.carbs * 10) / 10,
      unit: 'g',
      dv: dailyValues.carbs,
    },
    {
      name: 'Fats',
      value: Math.round((nutrients.fats / dailyValues.fats) * 100),
      actual: Math.round(nutrients.fats * 10) / 10,
      unit: 'g',
      dv: dailyValues.fats,
    },
    {
      name: 'Vitamin A',
      value: Math.round((nutrients.vitaminA / dailyValues.vitaminA) * 100),
      actual: Math.round(nutrients.vitaminA * 10) / 10,
      unit: 'mcg',
      dv: dailyValues.vitaminA,
    },
    {
      name: 'Vitamin C',
      value: Math.round((nutrients.vitaminC / dailyValues.vitaminC) * 100),
      actual: Math.round(nutrients.vitaminC * 10) / 10,
      unit: 'mg',
      dv: dailyValues.vitaminC,
    },
    {
      name: 'Calcium',
      value: Math.round((nutrients.calcium / dailyValues.calcium) * 100),
      actual: Math.round(nutrients.calcium * 10) / 10,
      unit: 'mg',
      dv: dailyValues.calcium,
    },
    {
      name: 'Iron',
      value: Math.round((nutrients.iron / dailyValues.iron) * 100),
      actual: Math.round(nutrients.iron * 10) / 10,
      unit: 'mg',
      dv: dailyValues.iron,
    },
    {
      name: 'Potassium',
      value: Math.round((nutrients.potassium / dailyValues.potassium) * 100),
      actual: Math.round(nutrients.potassium * 10) / 10,
      unit: 'mg',
      dv: dailyValues.potassium,
    },
  ];

  const getBarColor = (value: number) => {
    if (value < 25) return isDark ? '#ef4444' : '#ef4444'; // red
    if (value < 50) return isDark ? '#f97316' : '#f97316'; // orange
    if (value < 75) return isDark ? '#eab308' : '#eab308'; // yellow
    if (value < 100) return isDark ? '#22c55e' : '#22c55e'; // green
    return isDark ? '#15803d' : '#15803d'; // dark green
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
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
          <div key={item.name} className="bg-secondary/50 p-2 rounded text-center">
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