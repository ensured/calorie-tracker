'use client';

import React, { useState } from 'react';
import { DailyTargets, Deficit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Clock, Utensils, Zap, Info, HelpCircle, TrendingUp, Target, ChevronDown, ChevronUp, Search, Star } from 'lucide-react';

interface Totals {
  [key: string]: number;
}

interface RecommendationDialogProps {
  totals: Totals;
  dailyTargets: DailyTargets;
  onSuggest: (suggestion: string) => void;
}

interface FoodSuggestion {
  name: string;
  query: string;
  category: 'quick' | 'cooking' | 'snack' | 'meal';
  estimatedDeficitFill: number; // percentage of deficit this would fill
  multiNutrient?: string[]; // other nutrients this food helps with
  description?: string; // brief description of the food
  impact?: string; // what this food will help with
}

const foodSuggestions: { [key: string]: FoodSuggestion[] } = {
  calories: [
    // Quick options
    { name: 'Banana (1 medium)', query: '1 medium banana', category: 'quick', estimatedDeficitFill: 8, multiNutrient: ['potassium'], description: 'Natural energy boost', impact: 'Quick calories + potassium' },
    { name: 'Apple (1 medium)', query: '1 medium apple', category: 'quick', estimatedDeficitFill: 6, multiNutrient: ['vitaminC'], description: 'Fiber-rich fruit', impact: 'Calories + vitamin C' },
    { name: 'Orange (1 medium)', query: '1 medium orange', category: 'quick', estimatedDeficitFill: 5, multiNutrient: ['vitaminC', 'potassium'], description: 'Vitamin C powerhouse', impact: 'Calories + vitamin C + potassium' },
    { name: 'Greek Yogurt (1 cup)', query: '1 cup greek yogurt', category: 'quick', estimatedDeficitFill: 12, multiNutrient: ['protein', 'calcium'], description: 'High protein dairy', impact: 'Calories + protein + calcium' },
    { name: 'Cottage Cheese (1 cup)', query: '1 cup cottage cheese', category: 'quick', estimatedDeficitFill: 10, multiNutrient: ['protein', 'calcium'], description: 'Slow-digesting protein', impact: 'Calories + protein + calcium' },
    { name: 'Hard Boiled Eggs (2)', query: '2 hard boiled eggs', category: 'quick', estimatedDeficitFill: 9, multiNutrient: ['protein', 'fats'], description: 'Complete protein source', impact: 'Calories + protein + healthy fats' },
    { name: 'Tuna Packet', query: '1 packet tuna', category: 'quick', estimatedDeficitFill: 11, multiNutrient: ['protein'], description: 'Lean protein on-the-go', impact: 'Calories + protein' },
    { name: 'Edamame (1 cup)', query: '1 cup edamame', category: 'quick', estimatedDeficitFill: 13, multiNutrient: ['protein', 'iron'], description: 'Plant-based protein', impact: 'Calories + protein + iron' },
    { name: 'Skyr Yogurt (1 cup)', query: '1 cup skyr yogurt', category: 'quick', estimatedDeficitFill: 14, multiNutrient: ['protein', 'calcium'], description: 'Icelandic high-protein yogurt', impact: 'Calories + protein + calcium' },
    { name: 'Turkey Slices (3 oz)', query: '3 oz turkey slices', category: 'quick', estimatedDeficitFill: 15, multiNutrient: ['protein'], description: 'Lean deli meat', impact: 'Calories + protein' },
    { name: 'Canned Salmon (3 oz)', query: '3 oz canned salmon', category: 'quick', estimatedDeficitFill: 16, multiNutrient: ['protein', 'fats'], description: 'Omega-3 rich fish', impact: 'Calories + protein + healthy fats' },
    { name: 'Tempeh (1/2 cup)', query: '1/2 cup tempeh', category: 'quick', estimatedDeficitFill: 12, multiNutrient: ['protein', 'iron'], description: 'Fermented soy protein', impact: 'Calories + protein + iron' },
    { name: 'Avocado (1/2)', query: '1/2 avocado', category: 'quick', estimatedDeficitFill: 18, multiNutrient: ['fats', 'potassium'], description: 'Healthy fat source', impact: 'Calories + healthy fats + potassium' },
    { name: 'Nuts Mix (1/4 cup)', query: '1/4 cup mixed nuts', category: 'quick', estimatedDeficitFill: 20, multiNutrient: ['fats', 'protein'], description: 'Nutrient-dense snack', impact: 'Calories + healthy fats + protein' },

    // Cooking options
    { name: 'Chicken Breast (6oz)', query: '6 oz chicken breast', category: 'cooking', estimatedDeficitFill: 25, multiNutrient: ['protein'], description: 'Lean protein staple', impact: 'High calories + protein' },
    { name: 'Salmon Fillet (4oz)', query: '4 oz salmon', category: 'cooking', estimatedDeficitFill: 22, multiNutrient: ['protein', 'fats'], description: 'Omega-3 rich fish', impact: 'Calories + protein + healthy fats' },
    { name: 'Lean Beef (4oz)', query: '4 oz lean beef', category: 'cooking', estimatedDeficitFill: 28, multiNutrient: ['protein', 'iron'], description: 'Iron-rich protein', impact: 'High calories + protein + iron' },
    { name: 'Tofu (1/2 block)', query: '1/2 block tofu', category: 'cooking', estimatedDeficitFill: 18, multiNutrient: ['protein', 'calcium'], description: 'Versatile plant protein', impact: 'Calories + protein + calcium' },
    { name: 'Lentils (1 cup)', query: '1 cup lentils', category: 'cooking', estimatedDeficitFill: 20, multiNutrient: ['protein', 'iron'], description: 'Fiber-rich legumes', impact: 'Calories + protein + iron' },
    { name: 'Quinoa (1 cup)', query: '1 cup quinoa', category: 'cooking', estimatedDeficitFill: 16, multiNutrient: ['protein', 'iron'], description: 'Complete grain protein', impact: 'Calories + protein + iron' },
    { name: 'Pork Tenderloin (4oz)', query: '4 oz pork tenderloin', category: 'cooking', estimatedDeficitFill: 26, multiNutrient: ['protein'], description: 'Lean pork option', impact: 'High calories + protein' },
    { name: 'Cod Fillet (4oz)', query: '4 oz cod fillet', category: 'cooking', estimatedDeficitFill: 20, multiNutrient: ['protein'], description: 'Mild white fish', impact: 'Calories + protein' },
    { name: 'Black Beans (1 cup)', query: '1 cup black beans', category: 'cooking', estimatedDeficitFill: 18, multiNutrient: ['protein', 'iron'], description: 'Fiber-rich beans', impact: 'Calories + protein + iron' },
    { name: 'Chickpeas (1 cup)', query: '1 cup chickpeas', category: 'cooking', estimatedDeficitFill: 16, multiNutrient: ['protein', 'iron'], description: 'Versatile legumes', impact: 'Calories + protein + iron' },
    { name: 'Shrimp (4oz)', query: '4 oz shrimp', category: 'cooking', estimatedDeficitFill: 19, multiNutrient: ['protein'], description: 'Low-calorie protein', impact: 'Calories + protein' },
    { name: 'Turkey Breast (4oz)', query: '4 oz turkey breast', category: 'cooking', estimatedDeficitFill: 24, multiNutrient: ['protein'], description: 'Lean poultry protein', impact: 'Calories + protein' },
    { name: 'Sweet Potato (1 medium)', query: '1 medium sweet potato', category: 'cooking', estimatedDeficitFill: 22, multiNutrient: ['carbs', 'vitaminA'], description: 'Nutrient-rich carb', impact: 'Calories + carbs + vitamin A' },
    { name: 'Brown Rice (1 cup)', query: '1 cup brown rice', category: 'cooking', estimatedDeficitFill: 25, multiNutrient: ['carbs'], description: 'Whole grain carb', impact: 'Calories + complex carbs' },

    // Snacks
    { name: 'Almonds (1/4 cup)', query: '1/4 cup almonds', category: 'snack', estimatedDeficitFill: 14, multiNutrient: ['fats', 'protein'], description: 'Nutrient-dense nuts', impact: 'Calories + healthy fats + protein' },
    { name: 'Peanut Butter (2 tbsp)', query: '2 tbsp peanut butter', category: 'snack', estimatedDeficitFill: 16, multiNutrient: ['fats', 'protein'], description: 'Protein-rich spread', impact: 'Calories + healthy fats + protein' },
    { name: 'String Cheese', query: '1 string cheese', category: 'snack', estimatedDeficitFill: 8, multiNutrient: ['protein', 'calcium'], description: 'Portable dairy snack', impact: 'Calories + protein + calcium' },
    { name: 'Hummus (1/4 cup)', query: '1/4 cup hummus', category: 'snack', estimatedDeficitFill: 10, multiNutrient: ['protein'], description: 'Chickpea-based dip', impact: 'Calories + protein' },
    { name: 'Pistachios (1/4 cup)', query: '1/4 cup pistachios', category: 'snack', estimatedDeficitFill: 12, multiNutrient: ['fats', 'protein'], description: 'Shelled green nuts', impact: 'Calories + healthy fats + protein' },
    { name: 'Cashews (1/4 cup)', query: '1/4 cup cashews', category: 'snack', estimatedDeficitFill: 13, multiNutrient: ['fats', 'protein'], description: 'Creamy tree nuts', impact: 'Calories + healthy fats + protein' },
    { name: 'Sunflower Seeds (1/4 cup)', query: '1/4 cup sunflower seeds', category: 'snack', estimatedDeficitFill: 11, multiNutrient: ['fats', 'protein'], description: 'Vitamin E rich seeds', impact: 'Calories + healthy fats + protein' },
    { name: 'Pumpkin Seeds (1/4 cup)', query: '1/4 cup pumpkin seeds', category: 'snack', estimatedDeficitFill: 15, multiNutrient: ['fats', 'protein', 'iron'], description: 'Iron-rich seeds', impact: 'Calories + healthy fats + protein + iron' },
    { name: 'Beef Jerky (1 oz)', query: '1 oz beef jerky', category: 'snack', estimatedDeficitFill: 17, multiNutrient: ['protein'], description: 'Portable protein', impact: 'Calories + protein' },
    { name: 'Trail Mix (1/4 cup)', query: '1/4 cup trail mix', category: 'snack', estimatedDeficitFill: 19, multiNutrient: ['fats', 'protein'], description: 'Mixed nuts and dried fruit', impact: 'Calories + healthy fats + protein' },
    { name: 'Dark Chocolate (1 oz)', query: '1 oz dark chocolate', category: 'snack', estimatedDeficitFill: 12, multiNutrient: ['fats'], description: 'Antioxidant-rich treat', impact: 'Calories + healthy fats' },
  ],
  protein: [
    // Quick options
    { name: 'Greek Yogurt (1 cup)', query: '1 cup greek yogurt', category: 'quick', estimatedDeficitFill: 15, multiNutrient: ['calcium'], description: 'High protein dairy', impact: 'Protein + calcium' },
    { name: 'Protein Shake', query: '1 scoop protein powder', category: 'quick', estimatedDeficitFill: 25, description: 'Concentrated protein', impact: 'High protein boost' },
    { name: 'Cottage Cheese', query: '1 cup cottage cheese', category: 'quick', estimatedDeficitFill: 20, multiNutrient: ['calcium'], description: 'Slow-digesting protein', impact: 'Protein + calcium' },
    { name: 'Hard Boiled Eggs (2)', query: '2 hard boiled eggs', category: 'quick', estimatedDeficitFill: 12, multiNutrient: ['fats'], description: 'Complete protein source', impact: 'Protein + healthy fats' },
    { name: 'Tuna Packet', query: '1 packet tuna', category: 'quick', estimatedDeficitFill: 18, description: 'Lean protein on-the-go', impact: 'Lean protein' },
    { name: 'Edamame (1 cup)', query: '1 cup edamame', category: 'quick', estimatedDeficitFill: 16, multiNutrient: ['iron'], description: 'Plant-based protein', impact: 'Protein + iron' },
    { name: 'Skyr Yogurt (1 cup)', query: '1 cup skyr yogurt', category: 'quick', estimatedDeficitFill: 22, multiNutrient: ['calcium'], description: 'Icelandic high-protein yogurt', impact: 'High protein + calcium' },
    { name: 'Turkey Slices (3 oz)', query: '3 oz turkey slices', category: 'quick', estimatedDeficitFill: 20, description: 'Lean deli meat', impact: 'Lean protein' },
    { name: 'Canned Salmon (3 oz)', query: '3 oz canned salmon', category: 'quick', estimatedDeficitFill: 24, multiNutrient: ['fats'], description: 'Omega-3 rich fish', impact: 'Protein + healthy fats' },
    { name: 'Tempeh (1/2 cup)', query: '1/2 cup tempeh', category: 'quick', estimatedDeficitFill: 18, multiNutrient: ['iron'], description: 'Fermented soy protein', impact: 'Protein + iron' },
    { name: 'Protein Bar', query: '1 protein bar', category: 'quick', estimatedDeficitFill: 20, multiNutrient: ['carbs'], description: 'Convenient protein snack', impact: 'Protein + carbs' },

    // Cooking options
    { name: 'Chicken Breast (6oz)', query: '6 oz chicken breast', category: 'cooking', estimatedDeficitFill: 35, description: 'Lean protein staple', impact: 'High protein' },
    { name: 'Salmon Fillet (4oz)', query: '4 oz salmon', category: 'cooking', estimatedDeficitFill: 28, multiNutrient: ['fats'], description: 'Omega-3 rich fish', impact: 'Protein + healthy fats' },
    { name: 'Lean Beef (4oz)', query: '4 oz lean beef', category: 'cooking', estimatedDeficitFill: 30, multiNutrient: ['iron'], description: 'Iron-rich protein', impact: 'Protein + iron' },
    { name: 'Tofu (1/2 block)', query: '1/2 block tofu', category: 'cooking', estimatedDeficitFill: 22, multiNutrient: ['calcium'], description: 'Versatile plant protein', impact: 'Protein + calcium' },
    { name: 'Lentils (1 cup)', query: '1 cup lentils', category: 'cooking', estimatedDeficitFill: 18, multiNutrient: ['iron'], description: 'Fiber-rich legumes', impact: 'Protein + iron' },
    { name: 'Quinoa (1 cup)', query: '1 cup quinoa', category: 'cooking', estimatedDeficitFill: 16, multiNutrient: ['iron'], description: 'Complete grain protein', impact: 'Protein + iron' },
    { name: 'Pork Tenderloin (4oz)', query: '4 oz pork tenderloin', category: 'cooking', estimatedDeficitFill: 32, description: 'Lean pork option', impact: 'High protein' },
    { name: 'Cod Fillet (4oz)', query: '4 oz cod fillet', category: 'cooking', estimatedDeficitFill: 26, description: 'Mild white fish', impact: 'Lean protein' },
    { name: 'Black Beans (1 cup)', query: '1 cup black beans', category: 'cooking', estimatedDeficitFill: 16, multiNutrient: ['iron'], description: 'Fiber-rich beans', impact: 'Protein + iron' },
    { name: 'Chickpeas (1 cup)', query: '1 cup chickpeas', category: 'cooking', estimatedDeficitFill: 14, multiNutrient: ['iron'], description: 'Versatile legumes', impact: 'Protein + iron' },
    { name: 'Shrimp (4oz)', query: '4 oz shrimp', category: 'cooking', estimatedDeficitFill: 24, description: 'Low-calorie protein', impact: 'Lean protein' },
    { name: 'Turkey Breast (4oz)', query: '4 oz turkey breast', category: 'cooking', estimatedDeficitFill: 28, description: 'Lean poultry protein', impact: 'Lean protein' },
    { name: 'Eggs (3 whole)', query: '3 whole eggs', category: 'cooking', estimatedDeficitFill: 18, multiNutrient: ['fats'], description: 'Complete protein source', impact: 'Protein + healthy fats' },
    { name: 'Seitan (3 oz)', query: '3 oz seitan', category: 'cooking', estimatedDeficitFill: 25, description: 'Wheat protein', impact: 'High protein' },

    // Snacks
    { name: 'Almonds (1/4 cup)', query: '1/4 cup almonds', category: 'snack', estimatedDeficitFill: 8, multiNutrient: ['fats'], description: 'Nutrient-dense nuts', impact: 'Protein + healthy fats' },
    { name: 'Peanut Butter (2 tbsp)', query: '2 tbsp peanut butter', category: 'snack', estimatedDeficitFill: 10, multiNutrient: ['fats'], description: 'Protein-rich spread', impact: 'Protein + healthy fats' },
    { name: 'String Cheese', query: '1 string cheese', category: 'snack', estimatedDeficitFill: 6, multiNutrient: ['calcium'], description: 'Portable dairy snack', impact: 'Protein + calcium' },
    { name: 'Hummus (1/4 cup)', query: '1/4 cup hummus', category: 'snack', estimatedDeficitFill: 5, description: 'Chickpea-based dip', impact: 'Plant protein' },
    { name: 'Pistachios (1/4 cup)', query: '1/4 cup pistachios', category: 'snack', estimatedDeficitFill: 9, multiNutrient: ['fats'], description: 'Shelled green nuts', impact: 'Protein + healthy fats' },
    { name: 'Cashews (1/4 cup)', query: '1/4 cup cashews', category: 'snack', estimatedDeficitFill: 7, multiNutrient: ['fats'], description: 'Creamy tree nuts', impact: 'Protein + healthy fats' },
    { name: 'Sunflower Seeds (1/4 cup)', query: '1/4 cup sunflower seeds', category: 'snack', estimatedDeficitFill: 6, multiNutrient: ['fats'], description: 'Vitamin E rich seeds', impact: 'Protein + healthy fats' },
    { name: 'Pumpkin Seeds (1/4 cup)', query: '1/4 cup pumpkin seeds', category: 'snack', estimatedDeficitFill: 8, multiNutrient: ['fats', 'iron'], description: 'Iron-rich seeds', impact: 'Protein + healthy fats + iron' },
    { name: 'Beef Jerky (1 oz)', query: '1 oz beef jerky', category: 'snack', estimatedDeficitFill: 12, description: 'Portable protein', impact: 'Lean protein' },
    { name: 'Protein Chips', query: '1 oz protein chips', category: 'snack', estimatedDeficitFill: 8, multiNutrient: ['carbs'], description: 'Crispy protein snack', impact: 'Protein + carbs' },
  ],
  carbs: [
    // Quick options
    { name: 'Banana', query: '1 medium banana', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Apple', query: '1 medium apple', category: 'quick', estimatedDeficitFill: 10 },
    { name: 'Orange', query: '1 medium orange', category: 'quick', estimatedDeficitFill: 8 },
    { name: 'Berries (1 cup)', query: '1 cup mixed berries', category: 'quick', estimatedDeficitFill: 15 },
    { name: 'Dates (3 pieces)', query: '3 dates', category: 'quick', estimatedDeficitFill: 18 },
    { name: 'Raisins (1/4 cup)', query: '1/4 cup raisins', category: 'quick', estimatedDeficitFill: 20 },
    { name: 'Pear', query: '1 medium pear', category: 'quick', estimatedDeficitFill: 11 },
    { name: 'Mango (1 cup)', query: '1 cup mango', category: 'quick', estimatedDeficitFill: 16 },
    { name: 'Pineapple (1 cup)', query: '1 cup pineapple', category: 'quick', estimatedDeficitFill: 14 },
    { name: 'Grapes (1 cup)', query: '1 cup grapes', category: 'quick', estimatedDeficitFill: 13 },
    { name: 'Kiwi (2 medium)', query: '2 medium kiwi', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Dried Apricots (1/4 cup)', query: '1/4 cup dried apricots', category: 'quick', estimatedDeficitFill: 22 },

    // Cooking options
    { name: 'Oatmeal (1 cup)', query: '1 cup oatmeal', category: 'cooking', estimatedDeficitFill: 25 },
    { name: 'Brown Rice (1 cup)', query: '1 cup brown rice', category: 'cooking', estimatedDeficitFill: 30 },
    { name: 'Sweet Potato (1 medium)', query: '1 medium sweet potato', category: 'cooking', estimatedDeficitFill: 28 },
    { name: 'Whole Wheat Pasta (1 cup)', query: '1 cup whole wheat pasta', category: 'cooking', estimatedDeficitFill: 35 },
    { name: 'Quinoa (1 cup)', query: '1 cup quinoa', category: 'cooking', estimatedDeficitFill: 22 },
    { name: 'Corn (1 cup)', query: '1 cup corn', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Farro (1 cup)', query: '1 cup farro', category: 'cooking', estimatedDeficitFill: 26 },
    { name: 'Barley (1 cup)', query: '1 cup barley', category: 'cooking', estimatedDeficitFill: 24 },
    { name: 'Bulgur (1 cup)', query: '1 cup bulgur', category: 'cooking', estimatedDeficitFill: 20 },
    { name: 'Wild Rice (1 cup)', query: '1 cup wild rice', category: 'cooking', estimatedDeficitFill: 28 },
    { name: 'Butternut Squash (1 cup)', query: '1 cup butternut squash', category: 'cooking', estimatedDeficitFill: 16 },
    { name: 'Acorn Squash (1 cup)', query: '1 cup acorn squash', category: 'cooking', estimatedDeficitFill: 18 },

    // Snacks
    { name: 'Popcorn (3 cups)', query: '3 cups popcorn', category: 'snack', estimatedDeficitFill: 15 },
    { name: 'Crackers (10 pieces)', query: '10 whole grain crackers', category: 'snack', estimatedDeficitFill: 12 },
    { name: 'Granola (1/2 cup)', query: '1/2 cup granola', category: 'snack', estimatedDeficitFill: 20 },
    { name: 'Tortilla Chips (1 oz)', query: '1 oz tortilla chips', category: 'snack', estimatedDeficitFill: 14 },
    { name: 'Rice Cakes (2 pieces)', query: '2 rice cakes', category: 'snack', estimatedDeficitFill: 10 },
    { name: 'Whole Wheat Bread (2 slices)', query: '2 slices whole wheat bread', category: 'snack', estimatedDeficitFill: 16 },
    { name: 'Pita Bread (1 piece)', query: '1 whole wheat pita', category: 'snack', estimatedDeficitFill: 18 },
    { name: 'Pretzels (1 oz)', query: '1 oz pretzels', category: 'snack', estimatedDeficitFill: 12 },
    { name: 'Dried Cranberries (1/4 cup)', query: '1/4 cup dried cranberries', category: 'snack', estimatedDeficitFill: 24 },
  ],
  fats: [
    // Quick options
    { name: 'Avocado (1/2)', query: '1/2 avocado', category: 'quick', estimatedDeficitFill: 25 },
    { name: 'Olive Oil (1 tbsp)', query: '1 tbsp olive oil', category: 'quick', estimatedDeficitFill: 15 },
    { name: 'Coconut Oil (1 tbsp)', query: '1 tbsp coconut oil', category: 'quick', estimatedDeficitFill: 18 },
    { name: 'Flax Seeds (2 tbsp)', query: '2 tbsp flax seeds', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Chia Seeds (2 tbsp)', query: '2 tbsp chia seeds', category: 'quick', estimatedDeficitFill: 10 },
    { name: 'Hemp Seeds (2 tbsp)', query: '2 tbsp hemp seeds', category: 'quick', estimatedDeficitFill: 14 },
    { name: 'Pumpkin Seeds (2 tbsp)', query: '2 tbsp pumpkin seeds', category: 'quick', estimatedDeficitFill: 11 },
    { name: 'Sesame Seeds (2 tbsp)', query: '2 tbsp sesame seeds', category: 'quick', estimatedDeficitFill: 9 },

    // Nuts & Seeds
    { name: 'Almonds (1/4 cup)', query: '1/4 cup almonds', category: 'snack', estimatedDeficitFill: 20 },
    { name: 'Walnuts (1/4 cup)', query: '1/4 cup walnuts', category: 'snack', estimatedDeficitFill: 22 },
    { name: 'Pistachios (1/4 cup)', query: '1/4 cup pistachios', category: 'snack', estimatedDeficitFill: 18 },
    { name: 'Sunflower Seeds (1/4 cup)', query: '1/4 cup sunflower seeds', category: 'snack', estimatedDeficitFill: 16 },
    { name: 'Peanut Butter (2 tbsp)', query: '2 tbsp peanut butter', category: 'snack', estimatedDeficitFill: 24 },
    { name: 'Cashews (1/4 cup)', query: '1/4 cup cashews', category: 'snack', estimatedDeficitFill: 19 },
    { name: 'Macadamia Nuts (1/4 cup)', query: '1/4 cup macadamia nuts', category: 'snack', estimatedDeficitFill: 26 },
    { name: 'Pecans (1/4 cup)', query: '1/4 cup pecans', category: 'snack', estimatedDeficitFill: 24 },
    { name: 'Almond Butter (2 tbsp)', query: '2 tbsp almond butter', category: 'snack', estimatedDeficitFill: 22 },
    { name: 'Cashew Butter (2 tbsp)', query: '2 tbsp cashew butter', category: 'snack', estimatedDeficitFill: 20 },

    // Dairy & Other
    { name: 'Cheese (1 oz)', query: '1 oz cheddar cheese', category: 'snack', estimatedDeficitFill: 12 },
    { name: 'Dark Chocolate (1 oz)', query: '1 oz dark chocolate', category: 'snack', estimatedDeficitFill: 14 },
    { name: 'Salmon (3 oz)', query: '3 oz salmon', category: 'cooking', estimatedDeficitFill: 16 },
    { name: 'Eggs (2 whole)', query: '2 whole eggs', category: 'cooking', estimatedDeficitFill: 10 },
    { name: 'Greek Yogurt (1 cup)', query: '1 cup full fat greek yogurt', category: 'quick', estimatedDeficitFill: 8 },
    { name: 'Coconut Milk (1/2 cup)', query: '1/2 cup coconut milk', category: 'quick', estimatedDeficitFill: 20 },
    { name: 'Tahini (1 tbsp)', query: '1 tbsp tahini', category: 'quick', estimatedDeficitFill: 16 },
  ],
  vitaminA: [
    { name: 'Carrots (1 cup)', query: '1 cup carrots', category: 'quick', estimatedDeficitFill: 30 },
    { name: 'Sweet Potato (1 medium)', query: '1 medium sweet potato', category: 'cooking', estimatedDeficitFill: 45 },
    { name: 'Spinach (1 cup)', query: '1 cup spinach', category: 'cooking', estimatedDeficitFill: 25 },
    { name: 'Kale (1 cup)', query: '1 cup kale', category: 'cooking', estimatedDeficitFill: 35 },
    { name: 'Butternut Squash (1 cup)', query: '1 cup butternut squash', category: 'cooking', estimatedDeficitFill: 40 },
    { name: 'Cantaloupe (1 cup)', query: '1 cup cantaloupe', category: 'quick', estimatedDeficitFill: 20 },
    { name: 'Mango (1 medium)', query: '1 medium mango', category: 'quick', estimatedDeficitFill: 25 },
    { name: 'Red Bell Pepper (1 medium)', query: '1 medium red bell pepper', category: 'quick', estimatedDeficitFill: 28 },
    { name: 'Apricots (3 pieces)', query: '3 apricots', category: 'quick', estimatedDeficitFill: 15 },
    { name: 'Pumpkin (1 cup)', query: '1 cup pumpkin', category: 'cooking', estimatedDeficitFill: 35 },
    { name: 'Collard Greens (1 cup)', query: '1 cup collard greens', category: 'cooking', estimatedDeficitFill: 30 },
    { name: 'Swiss Chard (1 cup)', query: '1 cup swiss chard', category: 'cooking', estimatedDeficitFill: 22 },
    { name: 'Romaine Lettuce (2 cups)', query: '2 cups romaine lettuce', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Broccoli (1 cup)', query: '1 cup broccoli', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Peas (1 cup)', query: '1 cup peas', category: 'cooking', estimatedDeficitFill: 20 },
  ],
  vitaminC: [
    { name: 'Orange (1 medium)', query: '1 medium orange', category: 'quick', estimatedDeficitFill: 25 },
    { name: 'Strawberries (1 cup)', query: '1 cup strawberries', category: 'quick', estimatedDeficitFill: 35 },
    { name: 'Bell Pepper (1 medium)', query: '1 medium bell pepper', category: 'quick', estimatedDeficitFill: 40 },
    { name: 'Kiwi (1 medium)', query: '1 medium kiwi', category: 'quick', estimatedDeficitFill: 20 },
    { name: 'Grapefruit (1/2)', query: '1/2 grapefruit', category: 'quick', estimatedDeficitFill: 30 },
    { name: 'Pineapple (1 cup)', query: '1 cup pineapple', category: 'quick', estimatedDeficitFill: 28 },
    { name: 'Broccoli (1 cup)', query: '1 cup broccoli', category: 'cooking', estimatedDeficitFill: 35 },
    { name: 'Brussels Sprouts (1 cup)', query: '1 cup brussels sprouts', category: 'cooking', estimatedDeficitFill: 32 },
    { name: 'Cauliflower (1 cup)', query: '1 cup cauliflower', category: 'cooking', estimatedDeficitFill: 25 },
    { name: 'Tomatoes (1 cup)', query: '1 cup tomatoes', category: 'quick', estimatedDeficitFill: 22 },
    { name: 'Lemon (1 medium)', query: '1 medium lemon', category: 'quick', estimatedDeficitFill: 18 },
    { name: 'Lime (1 medium)', query: '1 medium lime', category: 'quick', estimatedDeficitFill: 16 },
    { name: 'Papaya (1 cup)', query: '1 cup papaya', category: 'quick', estimatedDeficitFill: 30 },
    { name: 'Guava (1 medium)', query: '1 medium guava', category: 'quick', estimatedDeficitFill: 45 },
    { name: 'Acerola Cherries (1/2 cup)', query: '1/2 cup acerola cherries', category: 'quick', estimatedDeficitFill: 50 },
    { name: 'Kale (1 cup)', query: '1 cup kale', category: 'cooking', estimatedDeficitFill: 28 },
    { name: 'Mustard Greens (1 cup)', query: '1 cup mustard greens', category: 'cooking', estimatedDeficitFill: 25 },
  ],
  calcium: [
    { name: 'Milk (1 cup)', query: '1 cup milk', category: 'quick', estimatedDeficitFill: 30 },
    { name: 'Yogurt (1 cup)', query: '1 cup yogurt', category: 'quick', estimatedDeficitFill: 35 },
    { name: 'Cheese (1 oz)', query: '1 oz cheddar cheese', category: 'snack', estimatedDeficitFill: 20 },
    { name: 'Cottage Cheese (1 cup)', query: '1 cup cottage cheese', category: 'quick', estimatedDeficitFill: 25 },
    { name: 'Almonds (1/4 cup)', query: '1/4 cup almonds', category: 'snack', estimatedDeficitFill: 15 },
    { name: 'Spinach (1 cup)', query: '1 cup spinach', category: 'cooking', estimatedDeficitFill: 12 },
    { name: 'Kale (1 cup)', query: '1 cup kale', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Sardines (3 oz)', query: '3 oz sardines', category: 'cooking', estimatedDeficitFill: 28 },
    { name: 'Tofu (1/2 cup)', query: '1/2 cup tofu', category: 'cooking', estimatedDeficitFill: 22 },
    { name: 'Fortified Orange Juice (1 cup)', query: '1 cup fortified orange juice', category: 'quick', estimatedDeficitFill: 25 },
    { name: 'Soy Milk (1 cup)', query: '1 cup soy milk', category: 'quick', estimatedDeficitFill: 30 },
    { name: 'Almond Milk (1 cup)', query: '1 cup almond milk', category: 'quick', estimatedDeficitFill: 20 },
    { name: 'Chia Seeds (2 tbsp)', query: '2 tbsp chia seeds', category: 'quick', estimatedDeficitFill: 18 },
    { name: 'Sesame Seeds (2 tbsp)', query: '2 tbsp sesame seeds', category: 'quick', estimatedDeficitFill: 16 },
    { name: 'Collard Greens (1 cup)', query: '1 cup collard greens', category: 'cooking', estimatedDeficitFill: 20 },
    { name: 'Bok Choy (1 cup)', query: '1 cup bok choy', category: 'cooking', estimatedDeficitFill: 15 },
    { name: 'Figs (3 pieces)', query: '3 dried figs', category: 'quick', estimatedDeficitFill: 12 },
  ],
  iron: [
    { name: 'Spinach (1 cup)', query: '1 cup spinach', category: 'cooking', estimatedDeficitFill: 20 },
    { name: 'Lentils (1 cup)', query: '1 cup lentils', category: 'cooking', estimatedDeficitFill: 25 },
    { name: 'Lean Beef (3 oz)', query: '3 oz lean beef', category: 'cooking', estimatedDeficitFill: 35 },
    { name: 'Chicken (3 oz)', query: '3 oz chicken', category: 'cooking', estimatedDeficitFill: 15 },
    { name: 'Quinoa (1 cup)', query: '1 cup quinoa', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Pumpkin Seeds (1/4 cup)', query: '1/4 cup pumpkin seeds', category: 'snack', estimatedDeficitFill: 22 },
    { name: 'Dark Chocolate (1 oz)', query: '1 oz dark chocolate', category: 'snack', estimatedDeficitFill: 12 },
    { name: 'Kidney Beans (1 cup)', query: '1 cup kidney beans', category: 'cooking', estimatedDeficitFill: 20 },
    { name: 'Chickpeas (1 cup)', query: '1 cup chickpeas', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Tofu (1/2 cup)', query: '1/2 cup tofu', category: 'cooking', estimatedDeficitFill: 15 },
    { name: 'Oysters (3 oz)', query: '3 oz oysters', category: 'cooking', estimatedDeficitFill: 40 },
    { name: 'Sardines (3 oz)', query: '3 oz sardines', category: 'cooking', estimatedDeficitFill: 25 },
    { name: 'Turkey (3 oz)', query: '3 oz turkey', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Cashews (1/4 cup)', query: '1/4 cup cashews', category: 'snack', estimatedDeficitFill: 16 },
    { name: 'Sunflower Seeds (1/4 cup)', query: '1/4 cup sunflower seeds', category: 'snack', estimatedDeficitFill: 14 },
    { name: 'Blackstrap Molasses (1 tbsp)', query: '1 tbsp blackstrap molasses', category: 'quick', estimatedDeficitFill: 20 },
    { name: 'Dried Apricots (1/2 cup)', query: '1/2 cup dried apricots', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Raisins (1/2 cup)', query: '1/2 cup raisins', category: 'quick', estimatedDeficitFill: 10 },
  ],
  potassium: [
    { name: 'Banana (1 medium)', query: '1 medium banana', category: 'quick', estimatedDeficitFill: 15 },
    { name: 'Potato (1 medium)', query: '1 medium potato', category: 'cooking', estimatedDeficitFill: 25 },
    { name: 'Sweet Potato (1 medium)', query: '1 medium sweet potato', category: 'cooking', estimatedDeficitFill: 20 },
    { name: 'Spinach (1 cup)', query: '1 cup spinach', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Avocado (1/2)', query: '1/2 avocado', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Coconut Water (1 cup)', query: '1 cup coconut water', category: 'quick', estimatedDeficitFill: 10 },
    { name: 'Orange (1 medium)', query: '1 medium orange', category: 'quick', estimatedDeficitFill: 8 },
    { name: 'Tomato (1 medium)', query: '1 medium tomato', category: 'quick', estimatedDeficitFill: 6 },
    { name: 'Yogurt (1 cup)', query: '1 cup yogurt', category: 'quick', estimatedDeficitFill: 14 },
    { name: 'Salmon (3 oz)', query: '3 oz salmon', category: 'cooking', estimatedDeficitFill: 16 },
    { name: 'White Beans (1 cup)', query: '1 cup white beans', category: 'cooking', estimatedDeficitFill: 22 },
    { name: 'Lima Beans (1 cup)', query: '1 cup lima beans', category: 'cooking', estimatedDeficitFill: 20 },
    { name: 'Acorn Squash (1 cup)', query: '1 cup acorn squash', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Beets (1 cup)', query: '1 cup beets', category: 'cooking', estimatedDeficitFill: 16 },
    { name: 'Cantaloupe (1 cup)', query: '1 cup cantaloupe', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Honeydew (1 cup)', query: '1 cup honeydew', category: 'quick', estimatedDeficitFill: 10 },
    { name: 'Prunes (1/4 cup)', query: '1/4 cup prunes', category: 'quick', estimatedDeficitFill: 14 },
    { name: 'Raisins (1/4 cup)', query: '1/4 cup raisins', category: 'quick', estimatedDeficitFill: 8 },
    { name: 'Mushrooms (1 cup)', query: '1 cup mushrooms', category: 'cooking', estimatedDeficitFill: 6 },
  ]
};

function formatNutrientName(name: string) {
  const formatted = name.replace(/([A-Z])/g, ' $1');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getNutrientColor(percentage: number) {
  if (percentage >= 100) return 'text-green-600 dark:text-green-400';
  if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400';
  if (percentage >= 60) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

// function getProgressColor(percentage: number) {
//   if (percentage >= 100) return 'bg-green-500';
//   if (percentage >= 80) return 'bg-yellow-500';
//   if (percentage >= 60) return 'bg-orange-500';
//   return 'bg-red-500';
// }

// function getCategoryColor(category: string) {
//   switch (category) {
//     case 'quick': return 'border border-primary/20 bg-primary/5 hover: text-primary-foreground cursor-pointer active:scale-95 transition-transform';
//     case 'cooking': return 'border border-secondary/20 bg-secondary/5 hover:bg-secondary/10 text-secondary-foreground cursor-pointer active:scale-95 transition-transform';
//     case 'snack': return 'border border-muted/20 bg-muted/5 hover:bg-muted/10 text-muted-foreground cursor-pointer active:scale-95 transition-transform';
//     default: return 'border border-border bg-background hover:bg-accent text-foreground cursor-pointer active:scale-95 transition-transform';
//   }
// }

export default function RecommendationDialog({ totals, dailyTargets, onSuggest }: RecommendationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMacroInfo, setShowMacroInfo] = useState(false);
  const [showMicroInfo, setShowMicroInfo] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Separate macros and micros for better prioritization
  const macroNutrients = ['calories', 'protein', 'carbs', 'fats'];

  const toggleCategory = (deficitName: string, category: string) => {
    const key = `${deficitName}-${category}`;
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isCategoryExpanded = (deficitName: string, category: string) => {
    const key = `${deficitName}-${category}`;
    return expandedCategories[key] || false;
  };

  const getDeficits = () => {
    const allDeficits = Object.keys(dailyTargets)
      .map((key) => {
        const nutrientKey = key as keyof Totals;
        const target = dailyTargets[nutrientKey as keyof DailyTargets] || 0;
        const current = totals[nutrientKey] || 0;

        if (target > 0) {
          const percentage = (current / target) * 100;
          return {
            name: String(nutrientKey),
            percentage,
            current,
            target,
            suggestions: foodSuggestions[nutrientKey],
            isMacro: macroNutrients.includes(String(nutrientKey)),
          } as {
            name: string;
            percentage: number;
            current: number;
            target: number;
            suggestions: FoodSuggestion[];
            isMacro: boolean;
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> =>
        item !== null &&
        item.percentage < 100 &&
        !!item.suggestions
      );

    console.log('All deficits before sorting:', allDeficits.map(d => ({
      name: d.name,
      percentage: d.percentage,
      hasSuggestions: !!d.suggestions,
      suggestionCount: d.suggestions?.length || 0
    })));

    // Sort all deficits by percentage (lowest first) - most urgently needed at top
    const sorted = allDeficits
      .sort((a, b) => a.percentage - b.percentage);

    console.log('Sorted deficits:', sorted.map(d => ({
      name: d.name,
      percentage: d.percentage
    })));

    return sorted;
  };

  const deficits = getDeficits();

  const handleSuggestionClick = (query: string) => {
    onSuggest(query);
    setIsOpen(false);
  };

  const filterSuggestions = (suggestions: FoodSuggestion[], searchTerm: string) => {
    if (!searchTerm) return suggestions;
    return suggestions.filter(suggestion =>
      suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.impact?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getMultiNutrientScore = (suggestion: FoodSuggestion, deficits: Deficit[]) => {
    if (!suggestion.multiNutrient) return 0;
    let score = 0;
    suggestion.multiNutrient.forEach(nutrient => {
      const deficit = deficits.find(d => d.name === nutrient);
      if (deficit && deficit.percentage < 100) {
        score += (100 - deficit.percentage) / 100; // Higher score for bigger deficits
      }
    });
    return score;
  };

  const sortSuggestionsByImpact = (suggestions: FoodSuggestion[], deficits: Deficit[]) => {
    return [...suggestions].sort((a, b) => {
      const aScore = getMultiNutrientScore(a, deficits);
      const bScore = getMultiNutrientScore(b, deficits);
      if (aScore !== bScore) return bScore - aScore; // Higher score first
      return b.estimatedDeficitFill - a.estimatedDeficitFill; // Then by deficit fill
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mt-6">
            <Lightbulb className="mr-2 h-4 w-4" /> Get Smart Recommendations
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Target className="h-5 w-5" />
              Smart Food Recommendations
            </DialogTitle>
          </DialogHeader>
          {deficits.length > 0 ? (
            <div className="py-4 space-y-6">
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Smart suggestions</strong> to help you meet your daily nutrition goals.
                    Click any food to add it to your daily intake. Foods are organized by preparation time and impact.
                    <span className="text-primary font-medium"> Foods that help with multiple deficits are prioritized!</span>
                  </span>
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search foods by name, description, or impact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Power Foods Section - Foods that help with multiple deficits */}
              {(() => {
                const allSuggestions = deficits.flatMap(deficit => deficit.suggestions);
                const multiNutrientFoods = allSuggestions.filter(s => s.multiNutrient && s.multiNutrient.length > 0);
                const uniqueMultiFoods = multiNutrientFoods.filter((food, index, self) =>
                  index === self.findIndex(f => f.query === food.query)
                );
                const sortedMultiFoods = sortSuggestionsByImpact(uniqueMultiFoods, deficits);
                const filteredMultiFoods = filterSuggestions(sortedMultiFoods, searchTerm);

                if (filteredMultiFoods.length > 0) {
                  return (
                    <div className="bg-accent/50 border border-accent rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Star className="h-5 w-5 text-primary" />
                          Power Foods
                          <span className="text-xs text-muted-foreground font-normal">(Help with multiple deficits)</span>
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          {filteredMultiFoods.length} options
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filteredMultiFoods.slice(0, 8).map((suggestion) => (
                          <TooltipProvider key={suggestion.query}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  key={suggestion.query}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuggestionClick(suggestion.query)}
                                  className={`text-xs border-2 transition-all duration-200 hover:scale-105 ${suggestion.multiNutrient && suggestion.multiNutrient.length > 0
                                    ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                                    : ''
                                    }`}
                                >
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-primary" />
                                    {suggestion.name}
                                    <span className="ml-1 text-xs opacity-75">
                                      (+{suggestion.estimatedDeficitFill}%)
                                    </span>
                                  </div>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="font-medium">{suggestion.name}</p>
                                  {suggestion.description && (
                                    <p className="text-xs opacity-90">{suggestion.description}</p>
                                  )}
                                  {suggestion.impact && (
                                    <p className="text-xs font-medium opacity-90">{suggestion.impact}</p>
                                  )}
                                  {suggestion.multiNutrient && suggestion.multiNutrient.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      <span className="text-xs opacity-75">Helps with:</span>
                                      {suggestion.multiNutrient.map(nutrient => (
                                        <span key={nutrient} className="text-xs bg-primary-foreground/20 text-primary-foreground px-1 rounded">
                                          {formatNutrientName(nutrient)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                      {filteredMultiFoods.length > 8 && (
                        <div className="mt-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategory('power', 'all')}
                            className="text-xs"
                          >
                            {isCategoryExpanded('power', 'all') ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show Less Power Foods
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show All Power Foods ({filteredMultiFoods.length - 8} more)
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      {isCategoryExpanded('power', 'all') && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {filteredMultiFoods.slice(8).map((suggestion) => (
                            <TooltipProvider key={suggestion.query}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    key={suggestion.query}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion.query)}
                                    className={`text-xs border-2 transition-all duration-200 hover:scale-105 ${suggestion.multiNutrient && suggestion.multiNutrient.length > 0
                                      ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                                      : ''
                                      }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-primary" />
                                      {suggestion.name}
                                      <span className="ml-1 text-xs opacity-75">
                                        (+{suggestion.estimatedDeficitFill}%)
                                      </span>
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">{suggestion.name}</p>
                                    {suggestion.description && (
                                      <p className="text-xs opacity-90">{suggestion.description}</p>
                                    )}
                                    {suggestion.impact && (
                                      <p className="text-xs font-medium opacity-90">{suggestion.impact}</p>
                                    )}
                                    {suggestion.multiNutrient && suggestion.multiNutrient.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-xs opacity-75">Helps with:</span>
                                        {suggestion.multiNutrient.map(nutrient => (
                                          <span key={nutrient} className="text-xs bg-primary-foreground/20 text-primary-foreground px-1 rounded">
                                            {formatNutrientName(nutrient)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {deficits.map((deficit) => {
                const filteredSuggestions = filterSuggestions(deficit.suggestions, searchTerm);
                const sortedSuggestions = sortSuggestionsByImpact(filteredSuggestions, deficits);

                return (
                  <div key={deficit.name} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                    {/* Header with progress */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <TrendingUp className={`h-5 w-5 ${getNutrientColor(deficit.percentage)}`} />
                          {formatNutrientName(String(deficit.name))}
                          {deficit.isMacro && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              Macro
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3 w-3 ml-1 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Macronutrients provide energy and are needed in large amounts</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                          )}
                          {!deficit.isMacro && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground">
                              Micro
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3 w-3 ml-1 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Micronutrients support health and are needed in smaller amounts</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                          )}
                        </h3>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getNutrientColor(deficit.percentage)}`}>
                            {Math.round(deficit.percentage)}% of goal
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(deficit.current)} / {Math.round(deficit.target)}g
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <Progress
                          value={Math.min(deficit.percentage, 100)}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Current</span>
                          <span>Target</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Options */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Zap className="h-4 w-4" /> Quick & Easy
                          <span className="text-xs text-muted-foreground font-normal">(Ready to eat)</span>
                        </h4>
                        {sortedSuggestions.filter(s => s.category === 'quick').length > 4 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategory(deficit.name, 'quick')}
                            className="text-xs"
                          >
                            {isCategoryExpanded(deficit.name, 'quick') ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show More ({sortedSuggestions.filter(s => s.category === 'quick').length - 4})
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sortedSuggestions
                          .filter(s => s.category === 'quick')
                          .slice(0, isCategoryExpanded(deficit.name, 'quick') ? undefined : 4)
                          .map((suggestion) => (
                            <TooltipProvider key={suggestion.query}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    key={suggestion.query}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion.query)}
                                    className={`text-xs border-2 transition-all duration-200 hover:scale-105 ${suggestion.multiNutrient && suggestion.multiNutrient.length > 0
                                      ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                                      : ''
                                      }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      {suggestion.multiNutrient && suggestion.multiNutrient.length > 0 && (
                                        <Star className="h-3 w-3 text-primary" />
                                      )}
                                      {suggestion.name}
                                      <span className="ml-1 text-xs opacity-75">
                                        (+{suggestion.estimatedDeficitFill}%)
                                      </span>
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">{suggestion.name}</p>
                                    {suggestion.description && (
                                      <p className="text-xs opacity-90">{suggestion.description}</p>
                                    )}
                                    {suggestion.impact && (
                                      <p className="text-xs font-medium opacity-90">{suggestion.impact}</p>
                                    )}
                                    {suggestion.multiNutrient && suggestion.multiNutrient.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-xs opacity-75">Also helps with:</span>
                                        {suggestion.multiNutrient.map(nutrient => (
                                          <span key={nutrient} className="text-xs bg-primary-foreground/20 text-primary-foreground px-1 rounded">
                                            {formatNutrientName(nutrient)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                      </div>
                    </div>

                    {/* Cooking Options */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Utensils className="h-4 w-4" /> Cooking Required
                          <span className="text-xs text-muted-foreground font-normal">(Need preparation)</span>
                        </h4>
                        {sortedSuggestions.filter(s => s.category === 'cooking').length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategory(deficit.name, 'cooking')}
                            className="text-xs"
                          >
                            {isCategoryExpanded(deficit.name, 'cooking') ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show More ({sortedSuggestions.filter(s => s.category === 'cooking').length - 3})
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sortedSuggestions
                          .filter(s => s.category === 'cooking')
                          .slice(0, isCategoryExpanded(deficit.name, 'cooking') ? undefined : 3)
                          .map((suggestion) => (
                            <TooltipProvider key={suggestion.query}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    key={suggestion.query}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion.query)}
                                    className={`text-xs border-2 transition-all duration-200 hover:scale-105 ${suggestion.multiNutrient && suggestion.multiNutrient.length > 0
                                      ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                                      : ''
                                      }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      {suggestion.multiNutrient && suggestion.multiNutrient.length > 0 && (
                                        <Star className="h-3 w-3 text-primary" />
                                      )}
                                      {suggestion.name}
                                      <span className="ml-1 text-xs opacity-75">
                                        (+{suggestion.estimatedDeficitFill}%)
                                      </span>
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">{suggestion.name}</p>
                                    {suggestion.description && (
                                      <p className="text-xs opacity-90">{suggestion.description}</p>
                                    )}
                                    {suggestion.impact && (
                                      <p className="text-xs font-medium opacity-90">{suggestion.impact}</p>
                                    )}
                                    {suggestion.multiNutrient && suggestion.multiNutrient.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-xs opacity-75">Also helps with:</span>
                                        {suggestion.multiNutrient.map(nutrient => (
                                          <span key={nutrient} className="text-xs bg-primary-foreground/20 text-primary-foreground px-1 rounded">
                                            {formatNutrientName(nutrient)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                      </div>
                    </div>

                    {/* Snacks */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Snacks & Nuts
                          <span className="text-xs text-muted-foreground font-normal">(Portable options)</span>
                        </h4>
                        {sortedSuggestions.filter(s => s.category === 'snack').length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategory(deficit.name, 'snack')}
                            className="text-xs"
                          >
                            {isCategoryExpanded(deficit.name, 'snack') ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show More ({sortedSuggestions.filter(s => s.category === 'snack').length - 3})
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sortedSuggestions
                          .filter(s => s.category === 'snack')
                          .slice(0, isCategoryExpanded(deficit.name, 'snack') ? undefined : 3)
                          .map((suggestion) => (
                            <TooltipProvider key={suggestion.query}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    key={suggestion.query}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion.query)}
                                    className={`text-xs border-2 transition-all duration-200 hover:scale-105 ${suggestion.multiNutrient && suggestion.multiNutrient.length > 0
                                      ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                                      : ''
                                      }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      {suggestion.multiNutrient && suggestion.multiNutrient.length > 0 && (
                                        <Star className="h-3 w-3 text-primary" />
                                      )}
                                      {suggestion.name}
                                      <span className="ml-1 text-xs opacity-75">
                                        (+{suggestion.estimatedDeficitFill}%)
                                      </span>
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">{suggestion.name}</p>
                                    {suggestion.description && (
                                      <p className="text-xs opacity-90">{suggestion.description}</p>
                                    )}
                                    {suggestion.impact && (
                                      <p className="text-xs font-medium opacity-90">{suggestion.impact}</p>
                                    )}
                                    {suggestion.multiNutrient && suggestion.multiNutrient.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-xs opacity-75">Also helps with:</span>
                                        {suggestion.multiNutrient.map(nutrient => (
                                          <span key={nutrient} className="text-xs bg-primary-foreground/20 text-primary-foreground px-1 rounded">
                                            {formatNutrientName(nutrient)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Summary Section */}
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Daily Progress Summary
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Macros */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Macros</h5>
                    {Object.keys(dailyTargets)
                      .filter(key => macroNutrients.includes(key))
                      .map((key) => {
                        const nutrientKey = key as keyof Totals;
                        const target = dailyTargets[nutrientKey as keyof DailyTargets] || 0;
                        const current = totals[nutrientKey] || 0;
                        const percentage = target > 0 ? (current / target) * 100 : 0;

                        return (
                          <div key={key} className="flex justify-between items-center text-sm">
                            <span className="text-foreground">{formatNutrientName(key)}</span>
                            <span className={`font-medium ${getNutrientColor(percentage)}`}>
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Micros */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Micros</h5>
                    {Object.keys(dailyTargets)
                      .filter(key => !macroNutrients.includes(key))
                      .map((key) => {
                        const nutrientKey = key as keyof Totals;
                        const target = dailyTargets[nutrientKey as keyof DailyTargets] || 0;
                        const current = totals[nutrientKey] || 0;
                        const percentage = target > 0 ? (current / target) * 100 : 0;

                        return (
                          <div key={key} className="flex justify-between items-center text-sm">
                            <span className="text-foreground">{formatNutrientName(key)}</span>
                            <span className={`font-medium ${getNutrientColor(percentage)}`}>
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Great job! 🎉</h3>
              <p className="text-muted-foreground">You&apos;re meeting all your nutrition targets today.</p>
            </div>
          )}
          <DialogFooter className="border-t pt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Macro Info Dialog */}
      <Dialog open={showMacroInfo} onOpenChange={setShowMacroInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              What are Macronutrients?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-sm text-foreground">
                <strong>Macronutrients</strong> are the nutrients your body needs in large amounts to function properly:
              </p>
            </div>
            <ul className="text-sm space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-foreground">Protein:</strong> Builds and repairs muscles, tissues, and cells
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-foreground">Carbohydrates:</strong> Provides energy for daily activities and exercise
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-foreground">Fats:</strong> Supports brain health, hormone production, and nutrient absorption
                </div>
              </li>
            </ul>
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                These are measured in grams and typically make up the majority of your daily calorie intake.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMacroInfo(false)}>Got it!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Micro Info Dialog */}
      <Dialog open={showMicroInfo} onOpenChange={setShowMicroInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              What are Micronutrients?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-sm text-foreground">
                <strong>Micronutrients</strong> are vitamins and minerals your body needs in smaller amounts:
              </p>
            </div>
            <ul className="text-sm space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-foreground">Vitamins:</strong> Support immune function, energy production, and cell health
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-foreground">Minerals:</strong> Help with bone health, oxygen transport, and enzyme function
                </div>
              </li>
            </ul>
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                While needed in smaller amounts, they&apos;re essential for overall health and preventing deficiencies.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMicroInfo(false)}>Got it!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 