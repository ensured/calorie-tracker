'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FoodSearch from './components/FoodSearch';
import NutrientChart from './components/NutrientChart';
import DailySummary from './components/DailySummary';
import { ThemeToggle } from './components/theme-toggle';
import { Button } from '@/components/ui/button';

const queryClient = new QueryClient();

interface Food {
  name: string;
  portion: string;
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

export default function Home() {
  const [foods, setFoods] = useState<Food[]>([]);

  const addFood = (food: Food) => {
    setFoods([...foods, food]);
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const totals = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fats: acc.fats + food.fats,
      vitaminA: acc.vitaminA + food.vitaminA,
      vitaminC: acc.vitaminC + food.vitaminC,
      calcium: acc.calcium + food.calcium,
      iron: acc.iron + food.iron,
      potassium: acc.potassium + food.potassium,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0, potassium: 0 }
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-foreground">
              🥗 Calorie & Nutrient Tracker
            </h1>
            <ThemeToggle />
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Food Input Section */}
            <div className="bg-card text-card-foreground rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Add Food</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                💬 Use your keyboard&apos;s microphone to speak: &quot;half cup of blueberries&quot;
              </p>
              <FoodSearch onSelect={addFood} />
              
              {/* Food List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Today&apos;s Foods</h3>
                {foods.length === 0 ? (
                  <p className="text-muted-foreground">No foods logged yet</p>
                ) : (
                  <ul className="space-y-2">
                    {foods.map((food, index) => (
                      <li key={index} className="flex justify-between items-center bg-secondary/50 p-2 rounded">
                        <span className="text-sm">
                          {food.name} ({food.portion}) - {Math.round(food.calories)} kcal
                        </span>
                        <Button
                          onClick={() => removeFood(index)}
                          variant="destructive"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Nutrients Chart Section */}
            <div className="bg-card text-card-foreground rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Daily Nutrition</h2>
              <NutrientChart nutrients={totals} />
            </div>
          </div>

          {/* Daily Summary */}
          <div className="mt-8">
            <DailySummary totals={totals} />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
} 