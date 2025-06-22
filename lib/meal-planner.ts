import { DailyTargets, Food } from './types';
import axios from 'axios';

/**
 * Recommends a meal by calling the dedicated API endpoint.
 * @param mealType - The type of meal (e.g., 'Breakfast', 'Lunch', 'Dinner').
 * @param dailyTargets - The user's daily nutritional targets.
 * @param currentTotals - The user's current total nutrient intake for the day.
 * @returns A promise that resolves to an array of Food items representing the meal.
 */
export async function recommendMeal(
  mealType: 'Breakfast' | 'Lunch' | 'Dinner',
  dailyTargets: DailyTargets,
  currentTotals: { [key: string]: number }
): Promise<Food[]> {
  
  const remaining = (Object.keys(dailyTargets) as Array<keyof DailyTargets>).reduce((acc, key) => {
    acc[key] = Math.max(0, dailyTargets[key] - (currentTotals[key] || 0));
    return acc;
  }, {} as { [key: string]: number });


  const response = await axios.get('/api/recommend-meal', {
    params: {
      mealType,
      ...remaining,
      dailyTargets: JSON.stringify(dailyTargets)
    },
  });

  return response.data;
}