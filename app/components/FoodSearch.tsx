'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
// import { parseInput } from '@/lib/utils';
import { Food } from '@/lib/types';
import axios from 'axios';

interface FoodSearchProps {
  input: string;
  setInput: (value: string) => void;
  onSelect: (food: Food) => void;
}

interface SearchResult {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sodium: number;
  sugar: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
  potassium: number;
  quantity: number;
  unit: string;
}

export default function FoodSearch({ input, setInput, onSelect }: FoodSearchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchFood = async () => {
      if (!input.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get('/api/food-data', {
          params: { query: input },
        });

        if (response.data.error) {
          setError(response.data.error);
          setResults([]);
        } else {
          setResults([response.data]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search for food';
        setError(errorMessage);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchFood, 500);
    return () => clearTimeout(timeoutId);
  }, [input]);

  const handleSelect = (result: SearchResult) => {
    onSelect(result as Food);
    setInput('');
    setResults([]);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search for food (e.g., '1 cup oatmeal', '2 eggs')"
          className="pl-10"
          disabled={isLoading}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-3 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => handleSelect(result)}
            >
              <div className="font-medium">{result.name}</div>
              <div className="text-sm text-muted-foreground">
                {result.portion} • {Math.round(result.calories)} kcal
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                P: {result.protein}g • C: {result.carbs}g • F: {result.fats}g
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 