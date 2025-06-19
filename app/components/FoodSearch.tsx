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
    // Enhanced regex to handle various formats
    const patterns = [
      /(\d*\.?\d*|\w+)\s*(cup|cups|tbsp|tablespoon|tsp|teaspoon|ounce|oz|gram|g|pound|lb)\s*(?:of\s+)?([\w\s]+)/i,
      /(\w+)\s*(cup|cups|tbsp|tablespoon|tsp|teaspoon|ounce|oz|gram|g|pound|lb)\s*(?:of\s+)?([\w\s]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const [, quantityStr, unit, food] = match;
        
        // Convert word numbers to digits
        const wordToNumber: { [key: string]: number } = {
          'half': 0.5, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'a': 1, 'an': 1, 'quarter': 0.25, 'third': 0.33, 'three-quarters': 0.75
        };
        
        const quantity = parseFloat(quantityStr) || wordToNumber[quantityStr.toLowerCase()] || 1;
        
        return { quantity, unit: unit.toLowerCase(), food: food.trim().toLowerCase() };
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