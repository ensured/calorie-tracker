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
    // If the number has more than 3 decimals, round to 3. If the third decimal is 0, show 2 decimals, etc.
    let rounded = num.toFixed(3);
    if (rounded.endsWith('00')) {
      rounded = num.toFixed(1);
    } else if (rounded.endsWith('0')) {
      rounded = num.toFixed(2);
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
      // Match mixed numbers (e.g., 1 1/2 cup), fractions, decimals, and words
      /(\d+\s+\d+\/\d+|\d*\.?\d+|\d+\/\d+|\w+)\s*(cup|cups|c|tbsp|tbsps|tablespoon|tablespoons|tb|tsp|tsps|teaspoon|teaspoons|t|ounce|ounces|oz|gram|grams|g|kilogram|kilograms|kg|kgs|pound|pounds|lb|lbs)\s*(?:of\s+)?([\w\s]+)/i,
      /(\w+)\s*(cup|cups|c|tbsp|tbsps|tablespoon|tablespoons|tb|tsp|tsps|teaspoon|teaspoons|t|ounce|ounces|oz|gram|grams|g|kilogram|kilograms|kg|kgs|pound|pounds|lb|lbs)\s*(?:of\s+)?([\w\s]+)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let [ , quantityStr, unit, food ] = match;
        const wordToNumber: { [key: string]: number } = {
          'half': 0.5, 'halves': 0.5,
          'third': 1/3, 'thirds': 1/3,
          'fourth': 0.25, 'fourths': 0.25,
          'quarter': 0.25, 'quarters': 0.25,
          'fifth': 0.2, 'fifths': 0.2,
          'sixth': 1/6, 'sixths': 1/6,
          'seventh': 1/7, 'sevenths': 1/7,
          'eighth': 0.125, 'eighths': 0.125,
          'ninth': 1/9, 'ninths': 1/9,
          'tenth': 0.1, 'tenths': 0.1,
          'eleventh': 1/11, 'elevenths': 1/11,
          'twelfth': 1/12, 'twelfths': 1/12,
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
          'a': 1, 'an': 1,
          'three-quarters': 0.75, 'three-fourths': 0.75, 'two-thirds': 2/3, 'three-fifths': 0.6, 'three-eighths': 0.375, 'two-fifths': 0.4, 'five-eighths': 0.625, 'seven-eighths': 0.875
        };
        // --- Mixed number parsing ---
        let quantity: number;
        quantityStr = quantityStr.trim();
        if (/^\d+\s+\d+\/\d+$/.test(quantityStr)) {
          // e.g., "1 1/2"
          const [whole, frac] = quantityStr.split(/\s+/);
          const [num, denom] = frac.split('/').map(Number);
          quantity = parseInt(whole) + num / denom;
        } else if (/^\d+\/\d+$/.test(quantityStr)) {
          // e.g., "1/2", "3/4"
          const [num, denom] = quantityStr.split('/').map(Number);
          quantity = num / denom;
        } else if (/^\d*\.?\d+$/.test(quantityStr)) {
          quantity = parseFloat(quantityStr);
        } else {
          quantity = wordToNumber[quantityStr.toLowerCase()] || 1;
        }
        quantity = Math.round(quantity * 1000) / 1000; // round to 3 decimal places
        // --- Unit normalization ---
        const unitMap: { [key: string]: string } = {
          'cup': 'cup', 'cups': 'cup', 'c': 'cup',
          'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tbsp': 'tbsp', 'tbsps': 'tbsp', 'tb': 'tbsp',
          'teaspoon': 'tsp', 'teaspoons': 'tsp', 'tsp': 'tsp', 'tsps': 'tsp', 't': 'tsp',
          'ounce': 'oz', 'ounces': 'oz', 'oz': 'oz',
          'gram': 'g', 'grams': 'g', 'g': 'g',
          'kilogram': 'kg', 'kilograms': 'kg', 'kg': 'kg', 'kgs': 'kg',
          'pound': 'lb', 'pounds': 'lb', 'lb': 'lb', 'lbs': 'lb'
        };
        const normalizedUnit = unitMap[unit.toLowerCase()] || unit.toLowerCase();
        return { quantity, unit: normalizedUnit, food: food.trim().toLowerCase() };
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
                💬 Use your keyboard&apos;s microphone to speak: &quot;fourth cup of blueberries&quot; or &quot;1 1/4 cup of blueberries&quot;
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