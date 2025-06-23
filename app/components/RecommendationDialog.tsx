'use client';

import React, { useState } from 'react';
import { DailyTargets } from '@/lib/types';
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
import { Lightbulb, Clock, Utensils, Zap, Info, HelpCircle, TrendingUp, Target } from 'lucide-react';

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
}

const foodSuggestions: { [key: string]: FoodSuggestion[] } = {
  calories: [
    // Quick options
    { name: 'Banana (1 medium)', query: '1 medium banana', category: 'quick', estimatedDeficitFill: 8 },
    { name: 'Apple (1 medium)', query: '1 medium apple', category: 'quick', estimatedDeficitFill: 6 },
    { name: 'Orange (1 medium)', query: '1 medium orange', category: 'quick', estimatedDeficitFill: 5 },
    { name: 'Greek Yogurt (1 cup)', query: '1 cup greek yogurt', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Cottage Cheese (1 cup)', query: '1 cup cottage cheese', category: 'quick', estimatedDeficitFill: 10 },
    { name: 'Hard Boiled Eggs (2)', query: '2 hard boiled eggs', category: 'quick', estimatedDeficitFill: 9 },
    { name: 'Tuna Packet', query: '1 packet tuna', category: 'quick', estimatedDeficitFill: 11 },
    { name: 'Edamame (1 cup)', query: '1 cup edamame', category: 'quick', estimatedDeficitFill: 13 },
    { name: 'Skyr Yogurt (1 cup)', query: '1 cup skyr yogurt', category: 'quick', estimatedDeficitFill: 14 },
    { name: 'Turkey Slices (3 oz)', query: '3 oz turkey slices', category: 'quick', estimatedDeficitFill: 15 },
    { name: 'Canned Salmon (3 oz)', query: '3 oz canned salmon', category: 'quick', estimatedDeficitFill: 16 },
    { name: 'Tempeh (1/2 cup)', query: '1/2 cup tempeh', category: 'quick', estimatedDeficitFill: 12 },
    
    // Cooking options
    { name: 'Chicken Breast (6oz)', query: '6 oz chicken breast', category: 'cooking', estimatedDeficitFill: 25 },
    { name: 'Salmon Fillet (4oz)', query: '4 oz salmon', category: 'cooking', estimatedDeficitFill: 22 },
    { name: 'Lean Beef (4oz)', query: '4 oz lean beef', category: 'cooking', estimatedDeficitFill: 28 },
    { name: 'Tofu (1/2 block)', query: '1/2 block tofu', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Lentils (1 cup)', query: '1 cup lentils', category: 'cooking', estimatedDeficitFill: 20 },
    { name: 'Quinoa (1 cup)', query: '1 cup quinoa', category: 'cooking', estimatedDeficitFill: 16 },
    { name: 'Pork Tenderloin (4oz)', query: '4 oz pork tenderloin', category: 'cooking', estimatedDeficitFill: 26 },
    { name: 'Cod Fillet (4oz)', query: '4 oz cod fillet', category: 'cooking', estimatedDeficitFill: 20 },
    { name: 'Black Beans (1 cup)', query: '1 cup black beans', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Chickpeas (1 cup)', query: '1 cup chickpeas', category: 'cooking', estimatedDeficitFill: 16 },
    { name: 'Shrimp (4oz)', query: '4 oz shrimp', category: 'cooking', estimatedDeficitFill: 19 },
    { name: 'Turkey Breast (4oz)', query: '4 oz turkey breast', category: 'cooking', estimatedDeficitFill: 24 },
    
    // Snacks
    { name: 'Almonds (1/4 cup)', query: '1/4 cup almonds', category: 'snack', estimatedDeficitFill: 14 },
    { name: 'Peanut Butter (2 tbsp)', query: '2 tbsp peanut butter', category: 'snack', estimatedDeficitFill: 16 },
    { name: 'String Cheese', query: '1 string cheese', category: 'snack', estimatedDeficitFill: 8 },
    { name: 'Hummus (1/4 cup)', query: '1/4 cup hummus', category: 'snack', estimatedDeficitFill: 10 },
    { name: 'Pistachios (1/4 cup)', query: '1/4 cup pistachios', category: 'snack', estimatedDeficitFill: 12 },
    { name: 'Cashews (1/4 cup)', query: '1/4 cup cashews', category: 'snack', estimatedDeficitFill: 13 },
    { name: 'Sunflower Seeds (1/4 cup)', query: '1/4 cup sunflower seeds', category: 'snack', estimatedDeficitFill: 11 },
    { name: 'Pumpkin Seeds (1/4 cup)', query: '1/4 cup pumpkin seeds', category: 'snack', estimatedDeficitFill: 15 },
    { name: 'Beef Jerky (1 oz)', query: '1 oz beef jerky', category: 'snack', estimatedDeficitFill: 17 },
  ],
  protein: [
    // Quick options
    { name: 'Greek Yogurt (1 cup)', query: '1 cup greek yogurt', category: 'quick', estimatedDeficitFill: 15 },
    { name: 'Protein Shake', query: '1 scoop protein powder', category: 'quick', estimatedDeficitFill: 25 },
    { name: 'Cottage Cheese', query: '1 cup cottage cheese', category: 'quick', estimatedDeficitFill: 20 },
    { name: 'Hard Boiled Eggs (2)', query: '2 hard boiled eggs', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Tuna Packet', query: '1 packet tuna', category: 'quick', estimatedDeficitFill: 18 },
    { name: 'Edamame (1 cup)', query: '1 cup edamame', category: 'quick', estimatedDeficitFill: 16 },
    { name: 'Skyr Yogurt (1 cup)', query: '1 cup skyr yogurt', category: 'quick', estimatedDeficitFill: 22 },
    { name: 'Turkey Slices (3 oz)', query: '3 oz turkey slices', category: 'quick', estimatedDeficitFill: 20 },
    { name: 'Canned Salmon (3 oz)', query: '3 oz canned salmon', category: 'quick', estimatedDeficitFill: 24 },
    { name: 'Tempeh (1/2 cup)', query: '1/2 cup tempeh', category: 'quick', estimatedDeficitFill: 18 },
    
    // Cooking options
    { name: 'Chicken Breast (6oz)', query: '6 oz chicken breast', category: 'cooking', estimatedDeficitFill: 35 },
    { name: 'Salmon Fillet (4oz)', query: '4 oz salmon', category: 'cooking', estimatedDeficitFill: 28 },
    { name: 'Lean Beef (4oz)', query: '4 oz lean beef', category: 'cooking', estimatedDeficitFill: 30 },
    { name: 'Tofu (1/2 block)', query: '1/2 block tofu', category: 'cooking', estimatedDeficitFill: 22 },
    { name: 'Lentils (1 cup)', query: '1 cup lentils', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Quinoa (1 cup)', query: '1 cup quinoa', category: 'cooking', estimatedDeficitFill: 16 },
    { name: 'Pork Tenderloin (4oz)', query: '4 oz pork tenderloin', category: 'cooking', estimatedDeficitFill: 32 },
    { name: 'Cod Fillet (4oz)', query: '4 oz cod fillet', category: 'cooking', estimatedDeficitFill: 26 },
    { name: 'Black Beans (1 cup)', query: '1 cup black beans', category: 'cooking', estimatedDeficitFill: 16 },
    { name: 'Chickpeas (1 cup)', query: '1 cup chickpeas', category: 'cooking', estimatedDeficitFill: 14 },
    { name: 'Shrimp (4oz)', query: '4 oz shrimp', category: 'cooking', estimatedDeficitFill: 24 },
    { name: 'Turkey Breast (4oz)', query: '4 oz turkey breast', category: 'cooking', estimatedDeficitFill: 28 },
    
    // Snacks
    { name: 'Almonds (1/4 cup)', query: '1/4 cup almonds', category: 'snack', estimatedDeficitFill: 8 },
    { name: 'Peanut Butter (2 tbsp)', query: '2 tbsp peanut butter', category: 'snack', estimatedDeficitFill: 10 },
    { name: 'String Cheese', query: '1 string cheese', category: 'snack', estimatedDeficitFill: 6 },
    { name: 'Hummus (1/4 cup)', query: '1/4 cup hummus', category: 'snack', estimatedDeficitFill: 5 },
    { name: 'Pistachios (1/4 cup)', query: '1/4 cup pistachios', category: 'snack', estimatedDeficitFill: 9 },
    { name: 'Cashews (1/4 cup)', query: '1/4 cup cashews', category: 'snack', estimatedDeficitFill: 7 },
    { name: 'Sunflower Seeds (1/4 cup)', query: '1/4 cup sunflower seeds', category: 'snack', estimatedDeficitFill: 6 },
    { name: 'Pumpkin Seeds (1/4 cup)', query: '1/4 cup pumpkin seeds', category: 'snack', estimatedDeficitFill: 8 },
    { name: 'Beef Jerky (1 oz)', query: '1 oz beef jerky', category: 'snack', estimatedDeficitFill: 12 },
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
  if (percentage >= 100) return 'text-green-600';
  if (percentage >= 80) return 'text-yellow-600';
  if (percentage >= 60) return 'text-orange-600';
  return 'text-red-500';
}

// function getProgressColor(percentage: number) {
//   if (percentage >= 100) return 'bg-green-500';
//   if (percentage >= 80) return 'bg-yellow-500';
//   if (percentage >= 60) return 'bg-orange-500';
//   return 'bg-red-500';
// }

// function getCategoryColor(category: string) {
//   switch (category) {
//     case 'quick': return 'border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary-foreground cursor-pointer active:scale-95 transition-transform';
//     case 'cooking': return 'border border-secondary/20 bg-secondary/5 hover:bg-secondary/10 text-secondary-foreground cursor-pointer active:scale-95 transition-transform';
//     case 'snack': return 'border border-muted/20 bg-muted/5 hover:bg-muted/10 text-muted-foreground cursor-pointer active:scale-95 transition-transform';
//     default: return 'border border-border bg-background hover:bg-accent text-foreground cursor-pointer active:scale-95 transition-transform';
//   }
// }

export default function RecommendationDialog({ totals, dailyTargets, onSuggest }: RecommendationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMacroInfo, setShowMacroInfo] = useState(false);
  const [showMicroInfo, setShowMicroInfo] = useState(false);

  // Separate macros and micros for better prioritization
  const macroNutrients = ['calories', 'protein', 'carbs', 'fats'];

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
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mt-6">
            <Lightbulb className="mr-2 h-4 w-4" /> Get Smart Recommendations
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
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
                  </span>
                </p>
              </div>
              
              {deficits.map((deficit) => (
                <div key={deficit.name} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  {/* Header with progress */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <TrendingUp className={`h-5 w-5 ${getNutrientColor(deficit.percentage)}`} />
                        {formatNutrientName(String(deficit.name))}
                        {deficit.isMacro && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ">
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
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium y">
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
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Quick & Easy
                      <span className="text-xs text-muted-foreground font-normal">(Ready to eat)</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {deficit.suggestions
                        .filter(s => s.category === 'quick')
                        .slice(0, 4)
                        .map((suggestion) => (
                          <Button
                            key={suggestion.query}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion.query)}
                            className={`text-xs border-2 transition-all duration-200`}
                          >
                            {suggestion.name}
                            <span className="ml-1 text-xs opacity-75">
                              (+{suggestion.estimatedDeficitFill}%)
                            </span>
                          </Button>
                        ))}
                    </div>
                  </div>

                  {/* Cooking Options */}
                  <div className="space-y-3 mb-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Utensils className="h-4 w-4" /> Cooking Required
                      <span className="text-xs text-muted-foreground font-normal">(Need preparation)</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {deficit.suggestions
                        .filter(s => s.category === 'cooking')
                        .slice(0, 3)
                        .map((suggestion) => (
                          <Button
                            key={suggestion.query}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion.query)}
                            className={`text-xs border-2 transition-all duration-200 `}
                          >
                            {suggestion.name}
                            <span className="ml-1 text-xs opacity-75">
                              (+{suggestion.estimatedDeficitFill}%)
                            </span>
                          </Button>
                        ))}
                    </div>
                  </div>

                  {/* Snacks */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Snacks & Nuts
                      <span className="text-xs text-muted-foreground font-normal">(Portable options)</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {deficit.suggestions
                        .filter(s => s.category === 'snack')
                        .slice(0, 3)
                        .map((suggestion) => (
                          <Button
                            key={suggestion.query}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion.query)}
                            className={`text-xs border-2 transition-all duration-200 `}
                          >
                            {suggestion.name}
                            <span className="ml-1 text-xs opacity-75">
                              (+{suggestion.estimatedDeficitFill}%)
                            </span>
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              ))}

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