// Shared types for the calorie tracker

export interface Food {
  name: string;
  portion: string;
  quantity: number;
  unit: string;
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

export interface DailyTargets {
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

export interface FoodData {
  name: string;
  query: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
  potassium: number;
  [key: string]: string | number; // Allow string indexing for nutrient properties
}

// Type guard to ensure nutrient values are numbers
export function isNutrientValue(value: string | number): value is number {
  return typeof value === "number";
}

export interface Deficit {
  name: string;
  percentage: number;
  suggestions: FoodSuggestion[];
}

export interface FoodSuggestion {
  name: string;
  query: string;
  category: "quick" | "cooking" | "snack" | "meal";
  estimatedDeficitFill: number;
  multiNutrient?: string[];
  description?: string;
  impact?: string;
}
