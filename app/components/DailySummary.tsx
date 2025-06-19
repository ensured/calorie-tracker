'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';

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

interface DailyTargets {
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

export default function DailySummary({ totals, dailyTargets }: { totals: Nutrients; dailyTargets: DailyTargets }) {
  const macroCalories = (totals.protein * 4) + (totals.carbs * 4) + (totals.fats * 9);
  const proteinPercent = Math.round((totals.protein * 4) / Math.max(macroCalories, 1) * 100);
  const carbPercent = Math.round((totals.carbs * 4) / Math.max(macroCalories, 1) * 100);
  const fatPercent = Math.round((totals.fats * 9) / Math.max(macroCalories, 1) * 100);

  const ProgressBar = ({ current, target, label, unit }: { 
    current: number; 
    target: number; 
    label: string; 
    unit: string; 
  }) => {
    const percent = Math.min((current / target) * 100, 100);
    const displayCurrent = Math.round(current * 10) / 10;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">
            {displayCurrent}/{target} {unit} ({Math.round(percent)}%)
          </span>
        </div>
        <Progress value={percent} className="h-2" />
      </div>
    );
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6">Daily Summary</h2>
      
      {/* Calorie Overview */}
      <div className="mb-6 p-4 bg-primary/10 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">
            {Math.round(totals.calories)}
          </div>
          <div className="text-sm text-muted-foreground">calories consumed</div>
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round(dailyTargets.calories - totals.calories)} remaining of {dailyTargets.calories} goal
          </div>
        </div>
      </div>

      {/* Macro Breakdown */}
      {macroCalories > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Macronutrient Breakdown</h3>
          <div className="flex rounded-lg overflow-hidden h-4 bg-secondary">
            <div 
              className="bg-red-400" 
              style={{ width: `${proteinPercent}%` }}
              title={`Protein: ${proteinPercent}%`}
            />
            <div 
              className="bg-green-400" 
              style={{ width: `${carbPercent}%` }}
              title={`Carbs: ${carbPercent}%`}
            />
            <div 
              className="bg-yellow-400" 
              style={{ width: `${fatPercent}%` }}
              title={`Fat: ${fatPercent}%`}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-red-500 dark:text-red-400">🍖 Protein: {proteinPercent}%</span>
            <span className="text-green-500 dark:text-green-400">🌾 Carbs: {carbPercent}%</span>
            <span className="text-yellow-500 dark:text-yellow-400">🥑 Fat: {fatPercent}%</span>
          </div>
        </div>
      )}

      {/* Detailed Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Daily Value Progress</h3>
        
        <ProgressBar 
          current={totals.calories} 
          target={dailyTargets.calories} 
          label="🔥 Calories" 
          unit="kcal" 
        />
        <ProgressBar 
          current={totals.protein} 
          target={dailyTargets.protein} 
          label="🍖 Protein" 
          unit="g" 
        />
        <ProgressBar 
          current={totals.carbs} 
          target={dailyTargets.carbs} 
          label="🌾 Carbohydrates" 
          unit="g" 
        />
        <ProgressBar 
          current={totals.fats} 
          target={dailyTargets.fats} 
          label="🥑 Fats" 
          unit="g" 
        />
        <ProgressBar 
          current={totals.vitaminA} 
          target={dailyTargets.vitaminA} 
          label="🥕 Vitamin A" 
          unit="mcg" 
        />
        <ProgressBar 
          current={totals.vitaminC} 
          target={dailyTargets.vitaminC} 
          label="🍊 Vitamin C" 
          unit="mg" 
        />
        <ProgressBar 
          current={totals.calcium} 
          target={dailyTargets.calcium} 
          label="🦴 Calcium" 
          unit="mg" 
        />
        <ProgressBar 
          current={totals.iron} 
          target={dailyTargets.iron} 
          label="⚡ Iron" 
          unit="mg" 
        />
        <ProgressBar 
          current={totals.potassium} 
          target={dailyTargets.potassium} 
          label="🍌 Potassium" 
          unit="mg" 
        />
      </div>

      {/* Nutrition Tips */}
      <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
        <h4 className="font-semibold text-sm mb-2">💡 Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          {totals.vitaminC < dailyTargets.vitaminC * 0.5 && (
            <li>• Add citrus fruits, berries, or bell peppers for Vitamin C</li>
          )}
          {totals.calcium < dailyTargets.calcium * 0.5 && (
            <li>• Include dairy, leafy greens, or fortified foods for calcium</li>
          )}
          {totals.iron < dailyTargets.iron * 0.5 && (
            <li>• Add spinach, lean meat, or beans for iron</li>
          )}
          {totals.protein < dailyTargets.protein * 0.8 && (
            <li>• Consider adding more protein sources like eggs, fish, or legumes</li>
          )}
          {totals.potassium < dailyTargets.potassium * 0.5 && (
            <li>• Add bananas, potatoes, or spinach for potassium</li>
          )}
        </ul>
      </div>
    </div>
  );
} 