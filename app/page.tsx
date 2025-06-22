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
import { parseInput, formatDateKey } from '@/lib/utils';
import FoodList from './components/FoodList';
import { Food, DailyTargets } from '@/lib/types';
import RecommendationDialog from './components/RecommendationDialog';

const queryClient = new QueryClient();

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

const unitOptions = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'mg', label: 'mg' },
  { value: 'lb', label: 'lb' },
  { value: 'oz', label: 'oz' },
  { value: 'cup', label: 'cup' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'tsp', label: 'tsp' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'pt', label: 'pt' },
  { value: 'qt', label: 'qt' },
  { value: 'gal', label: 'gal' },
  { value: 'slice', label: 'slice' },
  { value: 'piece', label: 'piece' },
  { value: 'clove', label: 'clove' },
  { value: 'pinch', label: 'pinch' },
  { value: 'dash', label: 'dash' },
];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [foods, setFoods] = useState<Food[]>([]);
  const [dailyTargets, setDailyTargets] = useState<DailyTargets>(defaultTargets);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editFood, setEditFood] = useState<Food | null>(null);
  const [editPortionValue, setEditPortionValue] = useState('');
  const [editPortionUnit, setEditPortionUnit] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [foodSearchInput, setFoodSearchInput] = useState('');

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
    setFoods(prevFoods => [...prevFoods, food]);
    setFoodSearchInput(''); // Clear input after adding food
  };

  const handleAddMeal = (newFoods: Food[]) => {
    setFoods(prevFoods => [...prevFoods, ...newFoods]);
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
    const foodToEdit = foods[index];
    setEditFood(foodToEdit);

    // Handle both new data format (with quantity/unit) and old format
    if (typeof foodToEdit.quantity === 'number' && foodToEdit.unit) {
      // New format: quantity and unit are stored separately
      const displayQuantity = parseFloat(foodToEdit.quantity.toFixed(3));
      setEditPortionValue(String(displayQuantity));
      setEditPortionUnit(foodToEdit.unit);
    } else {
      // Old format: parse the portion string (e.g., "1 cup")
      const parsedPortion = parseInput(foodToEdit.portion);
      if (parsedPortion) {
        setEditPortionValue(String(parsedPortion.quantity));
        setEditPortionUnit(parsedPortion.unit);
      } else {
        // Ultimate fallback if parsing fails
        setEditPortionValue('1');
        setEditPortionUnit('piece');
      }
    }
  };

  const cancelEditFood = () => {
    setEditIndex(null);
    setEditFood(null);
    setEditPortionValue('');
    setEditPortionUnit('');
  };

  const handleEditFoodChange = (key: keyof Food, value: string) => {
    if (!editFood) return;
    setEditFood({ ...editFood, [key]: key === 'name' || key === 'portion' ? value : parseFloat(value) || 0 });
  };

  const fetchFoodData = async (query: string) => {
    const response = await axios.get('/api/food-data', {
      params: { query },
    });
    return response.data;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="xl:text-3xl md:text-2xl  text-xl font-bold text-foreground">
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
            
              <FoodSearch 
                input={foodSearchInput}
                setInput={setFoodSearchInput}
                onSelect={addFood} 
              />

              <FoodList
                foods={foods}
                selectedDate={selectedDate}
                onRemoveFood={removeFood}
                onStartEditFood={startEditFood}
              />
            </div>

            {/* Nutrients Chart Section */}
            <div className="bg-card text-card-foreground rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Daily Nutrition</h2>
              <NutrientChart nutrients={totals} dailyTargets={dailyTargets} />
              {/* <RecommendationDialog 
                dailyTargets={dailyTargets}
                currentTotals={totals}
                onAddMeal={handleAddMeal}
              /> */}
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

                    const quantity = parseFloat(editPortionValue);
                    if (isNaN(quantity)) {
                      setEditError('Invalid quantity. Please enter a valid number.');
                      setEditLoading(false);
                      return;
                    }

                    try {
                      const query = `${quantity} ${editPortionUnit} ${editFood.name}`;
                      const foodData = await fetchFoodData(query);
                      const updatedFoods = foods.map((f, i) => (i === editIndex ? foodData : f));
                      setFoods(updatedFoods);
                      setEditIndex(null);
                      setEditFood(null);
                      setEditPortionValue('');
                      setEditPortionUnit('');
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
                    <div className="flex items-center gap-2">
                      <Input
                        value={editPortionValue}
                        onChange={e => setEditPortionValue(e.target.value)}
                        placeholder="e.g., 0.5"
                        required
                        disabled={editLoading}
                        type="number"
                        step="any"
                        aria-label="Portion quantity"
                      />
                      <select
                        value={editPortionUnit}
                        onChange={e => setEditPortionUnit(e.target.value)}
                        disabled={editLoading}
                        className="border rounded px-2 py-2 bg-background text-foreground"
                        aria-label="Portion unit"
                      >
                        {unitOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
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