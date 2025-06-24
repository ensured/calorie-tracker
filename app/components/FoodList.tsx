'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { formatPortion } from '@/lib/utils';
import { Food } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton"

interface FoodListProps {
  foods: Food[];
  onRemoveFood: (index: number) => void;
  onStartEditFood: (index: number) => void;
  loading?: boolean;
}

export default function FoodList({ foods, onRemoveFood, onStartEditFood, loading }: FoodListProps) {

  return (
    <div className='relative'>
      <div className="h-100 overflow-y-auto" >

        {loading ? (
          <Skeleton className='h-100' />
        ) : foods.length === 0 ? (
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


    </div>
  );
} 