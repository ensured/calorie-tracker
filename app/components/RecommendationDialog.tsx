'use client';

import React, { useState, useMemo } from 'react';
import { DailyTargets, Food } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { recommendMeal } from '@/lib/meal-planner';

const ITEMS_PER_PAGE = 5;

interface RecommendationDialogProps {
  dailyTargets: DailyTargets;
  currentTotals: { [key: string]: number };
  onAddMeal: (meal: Food[]) => void;
}

export default function RecommendationDialog({ dailyTargets, currentTotals, onAddMeal }: RecommendationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedMeals, setRecommendedMeals] = useState<Food[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<Food | null>(null);

  const paginatedMeals = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return recommendedMeals.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [recommendedMeals, currentPage]);

  const handleRecommendMeal = async (type: 'Breakfast' | 'Lunch' | 'Dinner') => {
    setIsLoading(true);
    setError(null);
    setRecommendedMeals([]);
    setCurrentPage(0);
    setSelectedMeal(null);
    try {
      const meals = await recommendMeal(type, dailyTargets, currentTotals);
      setRecommendedMeals(meals);
    } catch (error) {
      console.error("Failed to recommend meal:", error);
      setError('Could not find any recipes. Please try again later!');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => (prev + 1) * ITEMS_PER_PAGE < recommendedMeals.length ? prev + 1 : 0);
  }

  const handleAddMealClick = () => {
    if (!selectedMeal) return;
    onAddMeal([selectedMeal]);
    setIsOpen(false);
  };
  
  const onOpenChange = (open: boolean) => {
    if (!open) {
      setRecommendedMeals([]);
      setError(null);
      setCurrentPage(0);
      setSelectedMeal(null);
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full mt-6">
            <Sparkles className="mr-2 h-4 w-4" /> Get Meal Recommendation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Get a Meal Recommendation</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => handleRecommendMeal('Breakfast')} disabled={isLoading}>Breakfast</Button>
                <Button onClick={() => handleRecommendMeal('Lunch')} disabled={isLoading}>Lunch</Button>
                <Button onClick={() => handleRecommendMeal('Dinner')} disabled={isLoading}>Dinner</Button>
            </div>
            
            {isLoading && (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Finding recipes...</p>
              </div>
            )}

            {error && !isLoading && (
                <div className="text-center text-destructive py-10">{error}</div>
            )}

            {!isLoading && recommendedMeals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Here are some ideas:</h4>
                <ul className="space-y-2">
                  {paginatedMeals.map(food => (
                    <li 
                      key={food.name} 
                      className={`p-3 rounded-md text-sm border cursor-pointer transition-colors ${selectedMeal?.name === food.name ? 'bg-primary/20 border-primary' : 'bg-secondary/50 hover:bg-secondary'}`}
                      onClick={() => setSelectedMeal(food)}
                    >
                      <p className="font-bold">{food.name}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(food.calories)} kcal &bull; {food.protein}g Protein</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        <DialogFooter className="mt-4 sm:justify-between gap-2">
            <Button onClick={handleNextPage} variant="outline" className="w-full sm:w-auto" disabled={isLoading || recommendedMeals.length <= ITEMS_PER_PAGE}>
               <RefreshCw className="mr-2 h-4 w-4" /> More Ideas
            </Button>
            <Button onClick={handleAddMealClick} disabled={!selectedMeal || isLoading} className="w-full sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" /> Add Selected Meal
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
