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
import { Lightbulb, Clock, Utensils, Zap } from 'lucide-react';

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
  protein: [
    // Quick options
    { name: 'Greek Yogurt (1 cup)', query: '1 cup greek yogurt', category: 'quick', estimatedDeficitFill: 15 },
    { name: 'Protein Shake', query: '1 scoop protein powder', category: 'quick', estimatedDeficitFill: 25 },
    { name: 'Cottage Cheese', query: '1 cup cottage cheese', category: 'quick', estimatedDeficitFill: 20 },
    { name: 'Hard Boiled Eggs (2)', query: '2 hard boiled eggs', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Tuna Packet', query: '1 packet tuna', category: 'quick', estimatedDeficitFill: 18 },
    { name: 'Edamame (1 cup)', query: '1 cup edamame', category: 'quick', estimatedDeficitFill: 16 },
    
    // Cooking options
    { name: 'Chicken Breast (6oz)', query: '6 oz chicken breast', category: 'cooking', estimatedDeficitFill: 35 },
    { name: 'Salmon Fillet (4oz)', query: '4 oz salmon', category: 'cooking', estimatedDeficitFill: 28 },
    { name: 'Lean Beef (4oz)', query: '4 oz lean beef', category: 'cooking', estimatedDeficitFill: 30 },
    { name: 'Tofu (1/2 block)', query: '1/2 block tofu', category: 'cooking', estimatedDeficitFill: 22 },
    { name: 'Lentils (1 cup)', query: '1 cup lentils', category: 'cooking', estimatedDeficitFill: 18 },
    { name: 'Quinoa (1 cup)', query: '1 cup quinoa', category: 'cooking', estimatedDeficitFill: 16 },
    
    // Snacks
    { name: 'Almonds (1/4 cup)', query: '1/4 cup almonds', category: 'snack', estimatedDeficitFill: 8 },
    { name: 'Peanut Butter (2 tbsp)', query: '2 tbsp peanut butter', category: 'snack', estimatedDeficitFill: 10 },
    { name: 'String Cheese', query: '1 string cheese', category: 'snack', estimatedDeficitFill: 6 },
    { name: 'Hummus (1/4 cup)', query: '1/4 cup hummus', category: 'snack', estimatedDeficitFill: 5 },
  ],
  carbs: [
    // Quick options
    { name: 'Banana', query: '1 medium banana', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Apple', query: '1 medium apple', category: 'quick', estimatedDeficitFill: 10 },
    { name: 'Orange', query: '1 medium orange', category: 'quick', estimatedDeficitFill: 8 },
    { name: 'Berries (1 cup)', query: '1 cup mixed berries', category: 'quick', estimatedDeficitFill: 15 },
    { name: 'Dates (3 pieces)', query: '3 dates', category: 'quick', estimatedDeficitFill: 18 },
    { name: 'Raisins (1/4 cup)', query: '1/4 cup raisins', category: 'quick', estimatedDeficitFill: 20 },
    
    // Cooking options
    { name: 'Oatmeal (1 cup)', query: '1 cup oatmeal', category: 'cooking', estimatedDeficitFill: 25 },
    { name: 'Brown Rice (1 cup)', query: '1 cup brown rice', category: 'cooking', estimatedDeficitFill: 30 },
    { name: 'Sweet Potato (1 medium)', query: '1 medium sweet potato', category: 'cooking', estimatedDeficitFill: 28 },
    { name: 'Whole Wheat Pasta (1 cup)', query: '1 cup whole wheat pasta', category: 'cooking', estimatedDeficitFill: 35 },
    { name: 'Quinoa (1 cup)', query: '1 cup quinoa', category: 'cooking', estimatedDeficitFill: 22 },
    { name: 'Corn (1 cup)', query: '1 cup corn', category: 'cooking', estimatedDeficitFill: 18 },
    
    // Snacks
    { name: 'Popcorn (3 cups)', query: '3 cups popcorn', category: 'snack', estimatedDeficitFill: 15 },
    { name: 'Crackers (10 pieces)', query: '10 whole grain crackers', category: 'snack', estimatedDeficitFill: 12 },
    { name: 'Granola (1/2 cup)', query: '1/2 cup granola', category: 'snack', estimatedDeficitFill: 20 },
    { name: 'Tortilla Chips (1 oz)', query: '1 oz tortilla chips', category: 'snack', estimatedDeficitFill: 14 },
  ],
  fats: [
    // Quick options
    { name: 'Avocado (1/2)', query: '1/2 avocado', category: 'quick', estimatedDeficitFill: 25 },
    { name: 'Olive Oil (1 tbsp)', query: '1 tbsp olive oil', category: 'quick', estimatedDeficitFill: 15 },
    { name: 'Coconut Oil (1 tbsp)', query: '1 tbsp coconut oil', category: 'quick', estimatedDeficitFill: 18 },
    { name: 'Flax Seeds (2 tbsp)', query: '2 tbsp flax seeds', category: 'quick', estimatedDeficitFill: 12 },
    { name: 'Chia Seeds (2 tbsp)', query: '2 tbsp chia seeds', category: 'quick', estimatedDeficitFill: 10 },
    
    // Nuts & Seeds
    { name: 'Almonds (1/4 cup)', query: '1/4 cup almonds', category: 'snack', estimatedDeficitFill: 20 },
    { name: 'Walnuts (1/4 cup)', query: '1/4 cup walnuts', category: 'snack', estimatedDeficitFill: 22 },
    { name: 'Pistachios (1/4 cup)', query: '1/4 cup pistachios', category: 'snack', estimatedDeficitFill: 18 },
    { name: 'Sunflower Seeds (1/4 cup)', query: '1/4 cup sunflower seeds', category: 'snack', estimatedDeficitFill: 16 },
    { name: 'Peanut Butter (2 tbsp)', query: '2 tbsp peanut butter', category: 'snack', estimatedDeficitFill: 24 },
    
    // Dairy & Other
    { name: 'Cheese (1 oz)', query: '1 oz cheddar cheese', category: 'snack', estimatedDeficitFill: 12 },
    { name: 'Dark Chocolate (1 oz)', query: '1 oz dark chocolate', category: 'snack', estimatedDeficitFill: 14 },
    { name: 'Salmon (3 oz)', query: '3 oz salmon', category: 'cooking', estimatedDeficitFill: 16 },
    { name: 'Eggs (2 whole)', query: '2 whole eggs', category: 'cooking', estimatedDeficitFill: 10 },
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
  ]
};

function formatNutrientName(name: string) {
    const formatted = name.replace(/([A-Z])/g, ' $1');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// function getCategoryIcon(category: string) {
//   switch (category) {
//     case 'quick': return <Zap className="h-3 w-3" />;
//     case 'cooking': return <Utensils className="h-3 w-3" />;
//     case 'snack': return <Clock className="h-3 w-3" />;
//     default: return <Zap className="h-3 w-3" />;
//   }
// }

export default function RecommendationDialog({ totals, dailyTargets, onSuggest }: RecommendationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const deficits = Object.keys(dailyTargets)
    .map((key) => {
      const nutrientKey = key as keyof Totals;
      const target = dailyTargets[nutrientKey as keyof DailyTargets] || 0;
      const current = totals[nutrientKey] || 0;
      
      if (target > 0) {
        const percentage = (current / target) * 100;
        return {
          name: nutrientKey,
          percentage,
          suggestions: foodSuggestions[nutrientKey],
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null && item.percentage < 95 && !!item.suggestions)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 4);

  const handleSuggestionClick = (query: string) => {
    onSuggest(query);
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full mt-6">
          <Lightbulb className="mr-2 h-4 w-4" /> Get Food Recommendations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Smart Food Recommendations</DialogTitle>
        </DialogHeader>
        {deficits.length > 0 ? (
          <div className="py-4 space-y-6">
            <p className="text-sm text-muted-foreground">
              Here are personalized suggestions to help you meet your daily nutrition goals. 
              Click any food to add it to your daily intake.
            </p>
            {deficits.map((deficit) => (
              <div key={deficit.name} className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">
                  Need more {formatNutrientName(String(deficit.name))}
                  <span className="text-sm text-muted-foreground ml-2 font-normal">
                    ({Math.round(deficit.percentage)}% of goal)
                  </span>
                </h3>
                
                {/* Quick Options */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Quick & Easy
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
                          className="text-xs"
                        >
                          {suggestion.name}
                          <span className="ml-1 text-xs text-muted-foreground">
                            (~{suggestion.estimatedDeficitFill}%)
                          </span>
                        </Button>
                      ))}
                  </div>
                </div>

                {/* Cooking Options */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Utensils className="h-3 w-3" /> Cooking Required
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
                          className="text-xs"
                        >
                          {suggestion.name}
                          <span className="ml-1 text-xs text-muted-foreground">
                            (~{suggestion.estimatedDeficitFill}%)
                          </span>
                        </Button>
                      ))}
                  </div>
                </div>

                {/* Snacks */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Snacks & Nuts
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
                          className="text-xs"
                        >
                          {suggestion.name}
                          <span className="ml-1 text-xs text-muted-foreground">
                            (~{suggestion.estimatedDeficitFill}%)
                          </span>
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p>You&apos;re doing great! No major deficits found.</p>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 