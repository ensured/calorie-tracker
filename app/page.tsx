'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FoodSearch from './components/FoodSearch';
import NutrientChart from './components/NutrientChart';
import DailySummary from './components/DailySummary';
import Settings from './components/Settings';
import { ThemeToggle } from './components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import axios from 'axios';

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

const defaultTargets: DailyTargets = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fats: 78,
  vitaminA: 900,
  vitaminC: 90,
  calcium: 1000,
  iron: 18,
  potassium: 2500,
};

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatPortion(portion: string) {
  const match = portion.match(/^([0-9.]+)/);
  if (match) {
    const num = parseFloat(match[1]);
    // If the number has more than 2 decimals, round to 2. If the second decimal is 0, show 1 decimal.
    let rounded = num.toFixed(2);
    if (rounded.endsWith('0')) {
      rounded = num.toFixed(1);
    }
    // Remove trailing .0 if present
    if (rounded.endsWith('.0')) {
      rounded = rounded.slice(0, -2);
    }
    return portion.replace(match[1], rounded);
  }
  return portion;
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [foods, setFoods] = useState<Food[]>([]);
  const [dailyTargets, setDailyTargets] = useState<DailyTargets>(defaultTargets);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editFood, setEditFood] = useState<Food | null>(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Load foods and targets from localStorage on component mount or when selectedDate changes
  useEffect(() => {
    const key = `foods_${formatDateKey(selectedDate)}`;
    const savedFoods = localStorage.getItem(key);
    if (savedFoods) {
      setFoods(JSON.parse(savedFoods));
    } else {
      setFoods([]);
    }

    // Load daily targets
    const savedTargets = localStorage.getItem('dailyTargets');
    if (savedTargets) {
      setDailyTargets(JSON.parse(savedTargets));
    }
  }, [selectedDate]);

  // Save foods to localStorage whenever foods or selectedDate change
  useEffect(() => {
    const key = `foods_${formatDateKey(selectedDate)}`;
    localStorage.setItem(key, JSON.stringify(foods));
  }, [foods, selectedDate]);

  const addFood = (food: Food) => {
    setFoods([...foods, food]);
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const handleTargetsChange = useCallback((targets: DailyTargets) => {
    setDailyTargets(targets);
  }, []);

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

  // Date navigation handlers
  const goToPrevDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };
  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
  };

  const startEditFood = (index: number) => {
    setEditIndex(index);
    setEditFood(foods[index]);
  };
  const cancelEditFood = () => {
    setEditIndex(null);
    setEditFood(null);
  };
  const handleEditFoodChange = (key: keyof Food, value: string) => {
    if (!editFood) return;
    setEditFood({ ...editFood, [key]: key === 'name' || key === 'portion' ? value : parseFloat(value) || 0 });
  };

  const parseInput = (text: string) => {
    const patterns = [
      /(\d*\.?\d*|\w+)\s*(cup|cups|tbsp|tablespoon|tsp|teaspoon|ounce|oz|gram|g|pound|lb)\s*(?:of\s+)?([\w\s]+)/i,
      /(\w+)\s*(cup|cups|tbsp|tablespoon|tsp|teaspoon|ounce|oz|gram|g|pound|lb)\s*(?:of\s+)?([\w\s]+)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const [, quantityStr, unit, food] = match;
        const wordToNumber: { [key: string]: number } = {
          'half': 0.5, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'a': 1, 'an': 1, 'quarter': 0.25, 'third': 0.33, 'three-quarters': 0.75
        };
        let quantity = parseFloat(quantityStr) || wordToNumber[quantityStr.toLowerCase()] || 1;
        quantity = Math.round(quantity * 100) / 100; // round to 2 decimal places
        return { quantity, unit: unit.toLowerCase(), food: food.trim().toLowerCase() };
      }
    }
    return null;
  };

  const fetchFoodData = async (query: string, quantity: number, unit: string) => {
    const response = await axios.get('/api/food-data', {
      params: { query, quantity, unit },
    });
    return response.data;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-xl text-lg font-bold text-foreground">
              🥗 Calorie/Macros Tracker
            </h1>
            <div className="flex gap-2">
              <Settings onTargetsChange={handleTargetsChange} />
              <ThemeToggle />
            </div>
          </div>

          {/* Date Picker & Navigation */}
          <div className="flex items-center gap-2 mb-6">
            <Button variant="outline" size="icon" onClick={goToPrevDay}>&lt;</Button>
            <input
              type="date"
              value={formatDateKey(selectedDate)}
              onChange={handleDateChange}
              className="border rounded px-2 py-1 bg-background text-foreground"
            />
            <Button variant="outline" size="icon" onClick={goToNextDay}>&gt;</Button>
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
                <h3 className="text-lg font-semibold mb-2">Foods for {formatDateKey(selectedDate)}</h3>
                {foods.length === 0 ? (
                  <p className="text-muted-foreground">No foods logged yet</p>
                ) : (
                  <ul className="space-y-2">
                    {foods.map((food, index) => (
                      <li key={index} className="flex justify-between items-center bg-secondary/50 p-2 rounded gap-2">
                        <span className="text-sm">
                          {food.name} ({formatPortion(food.portion)}) - {Math.round(food.calories)} kcal
                        </span>
                        <div className="flex gap-1">
                          <Button onClick={() => startEditFood(index)} variant="outline" size="sm">Edit</Button>
                          <Button onClick={() => removeFood(index)} variant="destructive" size="sm">Remove</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Nutrients Chart Section */}
            <div className="bg-card text-card-foreground rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Daily Nutrition</h2>
              <NutrientChart nutrients={totals} dailyTargets={dailyTargets} />
            </div>
          </div>

          {/* Edit Food Modal */}
          <Dialog open={editIndex !== null} onOpenChange={cancelEditFood}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Food</DialogTitle>
              </DialogHeader>
              {editFood && (
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    setEditError('');
                    setEditLoading(true);
                    if (!editFood) return;
                    const parsed = parseInput(`${editFood.portion} ${editFood.name}`);
                    if (!parsed) {
                      setEditError('Could not parse input. Try: "half cup of blueberries" or "1 tbsp peanut butter"');
                      setEditLoading(false);
                      return;
                    }
                    try {
                      const foodData = await fetchFoodData(parsed.food, parsed.quantity, parsed.unit);
                      const updatedFoods = foods.map((f, i) => (i === editIndex ? foodData : f));
                      setFoods(updatedFoods);
                      setEditIndex(null);
                      setEditFood(null);
                    } catch {
                      setEditError('Failed to fetch food data. Please try again.');
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                  className="space-y-2"
                >
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={editFood.name}
                      onChange={e => handleEditFoodChange('name', e.target.value)}
                      placeholder="Name"
                      required
                      disabled={editLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Portion</label>
                    <Input
                      value={formatPortion(editFood.portion)}
                      onChange={e => handleEditFoodChange('portion', e.target.value)}
                      placeholder="Portion"
                      required
                      disabled={editLoading}
                    />
                  </div>
                  {editError && <div className="text-destructive text-sm">{editError}</div>}
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</Button>
                    <Button type="button" variant="outline" onClick={cancelEditFood} disabled={editLoading}>Cancel</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Daily Summary */}
          <div className="mt-8">
            <DailySummary totals={totals} dailyTargets={dailyTargets} />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
} 