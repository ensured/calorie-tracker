'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

const fetchFoodData = async (query: string, quantity: number, unit: string): Promise<Food> => {
  const response = await axios.get('/api/food-data', {
    params: { query, quantity, unit },
  });
  return response.data;
};

export default function FoodSearch({ onSelect }: { onSelect: (food: Food) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        let quantity: number;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const parsed = parseInput(input);
    if (!parsed) {
      setError('Could not parse input. Try: "half cup of blueberries" or "1 tbsp peanut butter"');
      setIsLoading(false);
      return;
    }

    try {
      const foodData = await fetchFoodData(parsed.food, parsed.quantity, parsed.unit);
      onSelect(foodData);
      setInput('');
    } catch (err) {
      console.error('Food fetch error:', err);
      setError('Failed to fetch food data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., half cup of blueberries, 2 tbsp peanut butter"
            className="w-full"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            💡 Tip: Use your phone&apos;s voice-to-text keyboard feature
          </p>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="w-full"
        >
          {isLoading ? 'Adding Food...' : 'Add Food'}
        </Button>
      </form>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Supported units:</strong> cup, tbsp, tsp, oz, gram, pound</p>
        <p><strong>Example formats:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>&quot;half cup of blueberries&quot;</li>
          <li>&quot;2 tbsp peanut butter&quot;</li>
          <li>&quot;quarter cup of apple&quot;</li>
          <li>&quot;100g chicken breast&quot;</li>
        </ul>
      </div>
    </div>
  );
} 