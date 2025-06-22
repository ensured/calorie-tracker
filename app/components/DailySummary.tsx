'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { DailyTargets } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface Totals {
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

const nutrientSuggestions: { [key: string]: string } = {
  Calories: 'High-calorie foods like nuts, seeds, or whole grains',
  Protein: 'lean meats, eggs, dairy, or legumes',
  Carbs: 'whole grains, fruits, or starchy vegetables',
  Fats: 'avocado, nuts, seeds, or olive oil',
  'Vitamin A': 'carrots, sweet potatoes, or leafy greens',
  'Vitamin C': 'citrus fruits, berries, or bell peppers',
  Calcium: 'dairy products, fortified foods, or leafy greens',
  Iron: 'red meat, spinach, or lentils',
  Potassium: 'bananas, potatoes, or spinach',
};

export default function DailySummary({
  totals,
  dailyTargets,
}: {
  totals: Totals;
  dailyTargets: DailyTargets;
}) {
  const macroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fats * 9;
  const proteinPercent = Math.round((totals.protein * 4) / Math.max(macroCalories, 1) * 100);
  const carbPercent = Math.round((totals.carbs * 4) / Math.max(macroCalories, 1) * 100);
  const fatPercent = Math.round((totals.fats * 9) / Math.max(macroCalories, 1) * 100);

  const mainNutrients = [
    { name: 'Calories', value: totals.calories, target: dailyTargets.calories, unit: 'kcal' },
    { name: 'Protein', value: totals.protein, target: dailyTargets.protein, unit: 'g' },
    { name: 'Carbs', value: totals.carbs, target: dailyTargets.carbs, unit: 'g' },
    { name: 'Fats', value: totals.fats, target: dailyTargets.fats, unit: 'g' },
  ];

  const microNutrients = [
    { name: 'Vitamin A', value: totals.vitaminA, target: dailyTargets.vitaminA, unit: 'mcg' },
    { name: 'Vitamin C', value: totals.vitaminC, target: dailyTargets.vitaminC, unit: 'mg' },
    { name: 'Calcium', value: totals.calcium, target: dailyTargets.calcium, unit: 'mg' },
    { name: 'Iron', value: totals.iron, target: dailyTargets.iron, unit: 'mg' },
    { name: 'Potassium', value: totals.potassium, target: dailyTargets.potassium, unit: 'mg' },
  ];

  const NutrientRow = ({ name, value, target, unit }: { name: string; value: number; target: number; unit: string; }) => {
    const percentage = target > 0 ? (value / target) * 100 : 0;
    const suggestion = nutrientSuggestions[name];
    
    return (
      <div>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{name}</span>
            {suggestion && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Try eating: {suggestion}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {Math.round(value)} / {target} {unit}
          </span>
        </div>
        <Progress value={percentage} />
      </div>
    );
  };

  return (
    <div className="p-6 bg-card text-card-foreground rounded-lg shadow-md">
      {macroCalories > 0 && (
          <div className="mb-6">
           <h3 className="text-lg font-semibold">Macros Breakdown</h3>
           <div className="text-sm text-muted-foreground">
             {proteinPercent}% Protein | {carbPercent}% Carbs | {fatPercent}% Fats
           </div>
          </div>
      )}

      <div className="space-y-4">
        {mainNutrients.map((nutrient) => (
          <NutrientRow key={nutrient.name} {...nutrient} />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {microNutrients.map((nutrient) => (
          <NutrientRow key={nutrient.name} {...nutrient} />
        ))}
      </div>
    </div>
  );
} 