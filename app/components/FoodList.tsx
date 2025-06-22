'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { formatPortion, formatDateKey } from '@/lib/utils';
import { Food } from '@/lib/types';

interface FoodListProps {
  foods: Food[];
  selectedDate: Date;
  onRemoveFood: (index: number) => void;
  onStartEditFood: (index: number) => void;
}

export default function FoodList({ foods, selectedDate, onRemoveFood, onStartEditFood }: FoodListProps) {
  return (
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
                <Button onClick={() => onStartEditFood(index)} variant="outline" size="sm">Edit</Button>
                <Button onClick={() => onRemoveFood(index)} variant="destructive" size="sm">Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 