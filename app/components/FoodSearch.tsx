'use client';

import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { parseInput } from '@/lib/utils';
import { Food } from '@/lib/types';
import { Plus, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FoodSearchProps {
  input: string;
  setInput: (value: string) => void;
  onSelect: (food: Food) => void;
}

const fetchFoodData = async (query: string): Promise<Food> => {
  const response = await axios.get('/api/food-data', {
    params: { query },
  });
  return response.data;
};

export default function FoodSearch({ input, setInput, onSelect }: FoodSearchProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!input.trim()) {
      setError('Please enter a food.');
      setIsLoading(false);
      return;
    }

    try {
      const foodData = await fetchFoodData(input);
      onSelect(foodData);
    } catch (err) {
      console.error('Food fetch error:', err);
      let errorMessage = 'Failed to find food. Please try a different query.';
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error?: string }>;
        errorMessage = axiosError.response?.data?.error || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const errorId = 'food-search-error';

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row items-start gap-2">
          <div className="relative w-full">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., 1/2 cup blueberries, 2 tbsp peanut butter..."
              className={cn('pr-10', error && 'border-destructive focus-visible:ring-destructive')}
              disabled={isLoading}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            {error && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />}
          </div>
          <Button type="submit" disabled={isLoading || !input.trim()} className="w-full sm:w-auto shrink-0">
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add
          </Button>
        </div>
      </form>

      {error && (
        <p id={errorId} className="text-sm text-destructive flex items-center gap-2">
          {error}
        </p>
      )}

      <div className="text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={showExamples}
        >
          {showExamples ? 'Hide Examples' : 'Show Examples'}
          <ChevronDown className={cn('h-4 w-4 transition-transform', showExamples && 'rotate-180')} />
        </button>
        {showExamples && (
          <div className="mt-2 space-y-1 pl-2 border-l-2 border-muted/50">
            <p>
              <strong>Supported units:</strong> cup, tbsp, tsp, oz, g, lb, kg, mg, ml, l, pint, qt, gal, slice,
              piece, clove, pinch, dash
            </p>
            <p>
              <strong>Example formats:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>&quot;half cup of blueberries&quot;</li>
              <li>&quot;2 tbsp peanut butter&quot;</li>
              <li>&quot;quarter cup of apple&quot;</li>
              <li>&quot;100g chicken breast&quot;</li>
              <li>&quot;fourth cup of blueberries&quot;</li>
              <li>&quot;1 1/4 cup of blueberries&quot;</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 