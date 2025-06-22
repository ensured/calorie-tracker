import { NextResponse } from 'next/server';
import axios from 'axios';
import Fraction from 'fraction.js';
import { parseInput } from '@/lib/utils';

// TypeScript interfaces
interface NutrientData {
  quantity: number;
  unit?: string;
}

interface FoodNutrients {
  ENERC_KCAL?: NutrientData;
  PROCNT?: NutrientData;
  CHOCDF?: NutrientData;
  FAT?: NutrientData;
  FIBTG?: NutrientData;
  NA?: NutrientData;
  SUGAR?: NutrientData;
  VITA_RAE?: NutrientData;
  VITC?: NutrientData;
  CA?: NutrientData;
  FE?: NutrientData;
  K?: NutrientData;
}

interface EdamamFood {
  foodId: string;
  label: string;
  measures?: Array<{
    uri: string;
    label: string;
  }>;
}

interface EdamamMeasure {
  uri: string;
  label: string;
}

interface EdamamParsed {
  food: EdamamFood;
  quantity: number;
  measure: EdamamMeasure;
}

interface EdamamHint {
  food: EdamamFood;
}

interface EdamamSearchResponse {
  parsed?: EdamamParsed[];
  hints?: EdamamHint[];
}

interface EdamamNutrientsResponse {
  totalNutrients?: FoodNutrients;
}

// New types for Recipe Search API
interface Recipe {
  label: string;
  image: string;
  source: string;
  url: string;
  yield: number;
  dietLabels: string[];
  healthLabels: string[];
  ingredientLines: string[];
  ingredients: RecipeIngredient[];
  calories: number;
  totalWeight: number;
  totalNutrients: FoodNutrients;
}

interface RecipeIngredient {
  text: string;
  quantity: number;
  measure: string | null;
  food: string;
  weight: number;
  foodCategory: string;
  foodId: string;
  image: string | null;
}

interface RecipeHit {
  recipe: Recipe;
}

interface EdamamRecipeSearchResponse {
  from: number;
  to: number;
  count: number;
  _links: { next?: { href: string; title: string; } };
  hits: RecipeHit[];
}

interface SearchRecipeOptions {
  mealType: string;
  calories?: string;
  diet?: string;
  to?: number;
}

const unitNormalizationMap: { [key: string]: string } = {
  'cup': 'cup', 'cups': 'cup', 'c': 'cup',
  'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tbsp': 'tbsp', 'tbsps': 'tbsp', 'tb': 'tbsp',
  'teaspoon': 'tsp', 'teaspoons': 'tsp', 'tsp': 'tsp', 'tsps': 'tsp', 't': 'tsp',
  'ounce': 'oz', 'ounces': 'oz', 'oz': 'oz',
  'gram': 'g', 'grams': 'g', 'g': 'g',
  'kilogram': 'kg', 'kilograms': 'kg', 'kg': 'kg', 'kgs': 'kg',
  'pound': 'lb', 'pounds': 'lb', 'lb': 'lb', 'lbs': 'lb',
  'milligram': 'mg', 'mg': 'mg',
  'milliliter': 'ml', 'milliliters': 'ml', 'millilitre': 'ml', 'ml': 'ml', 'cc': 'ml',
  'liter': 'l', 'liters': 'l', 'litre': 'l', 'l': 'l',
  'fluid ounce': 'fl oz', 'fl oz': 'fl oz',
  'pint': 'pt', 'pints': 'pt', 'pt': 'pt',
  'quart': 'qt', 'quarts': 'qt', 'qt': 'qt',
  'gallon': 'gal', 'gallons': 'gal', 'gal': 'gal',
  'slice': 'slice', 'slices': 'slice',
  'piece': 'piece', 'pieces': 'piece', 'pc': 'piece',
  'clove': 'clove', 'cloves': 'clove',
  'pinch': 'pinch', 'pinches': 'pinch',
  'dash': 'dash', 'dashes': 'dash',
};

function normalizeUnit(unit: string): string {
  const lowerUnit = unit.toLowerCase();
  return unitNormalizationMap[lowerUnit] || lowerUnit;
}

// New function to search for recipes
export async function searchRecipes(options: SearchRecipeOptions) {
  if (!process.env.EDAMAM_RECIPE_SEARCH_APP_ID || !process.env.EDAMAM_RECIPE_SEARCH_KEY) {
    throw new Error("Missing Edamam API credentials in environment variables.");
  }

  const params = {
    type: 'public',
    app_id: process.env.EDAMAM_RECIPE_SEARCH_APP_ID,
    app_key: process.env.EDAMAM_RECIPE_SEARCH_KEY,
    ...options
  };

  const searchResponse = await axios.get<EdamamRecipeSearchResponse>('https://api.edamam.com/api/recipes/v2', { params });

  if (searchResponse.data.hits.length === 0) {
    throw new Error('No recipes found for the given criteria.');
  }
  
  return searchResponse.data.hits;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('query')?.trim() || '';

  if (!rawQuery) {
    return NextResponse.json({ error: 'Query parameter is missing' }, { status: 400 });
  }

  try {
    if (process.env.EDAMAM_RECIPE_SEARCH_APP_ID && process.env.EDAMAM_RECIPE_SEARCH_KEY) {
      // Create a tiered list of query variants
      const queryVariants = [rawQuery];
      const parsed = parseInput(rawQuery);
      const quantity = parsed?.quantity || 1;
      const unit = parsed?.unit || 'piece';

      if (parsed) {
        const { food } = parsed;
        const frac = new Fraction(quantity);
        const quantityString = frac.d < 100 ? frac.toFraction(true) : quantity.toFixed(3);

        // Add more specific variants if parsing was successful
        queryVariants.push(`${quantityString} ${unit} ${food}`);
        if (quantityString !== String(quantity)) {
           queryVariants.push(`${quantity} ${unit} ${food}`);
        }
        queryVariants.push(food); // Also try searching for just the food name
      }

      // Remove duplicates and filter out empty strings
      const uniqueQueryVariants = [...new Set(queryVariants)].filter(Boolean);

      for (const searchQuery of uniqueQueryVariants) {
        try {
          // Step 1: Search for the food using parser endpoint
          const searchResponse = await axios.get<EdamamSearchResponse>('https://api.edamam.com/api/food-database/v2/parser', {
            params: {
              app_id: process.env.EDAMAM_RECIPE_SEARCH_APP_ID,
              app_key: process.env.EDAMAM_RECIPE_SEARCH_KEY,
              ingr: searchQuery,
              'nutrition-type': 'logging',
            },
          });

          // Try parsed results first (most accurate)
          if (searchResponse.data.parsed && searchResponse.data.parsed.length > 0) {
            const parsedResponse = searchResponse.data.parsed[0];
            const food = parsedResponse.food;
            const measure = parsedResponse.measure;
            const parsedQuantity = parsedResponse.quantity || quantity;

            // Step 2: Get detailed nutrition using nutrients endpoint
            const nutrientsResponse = await axios.post<EdamamNutrientsResponse>('https://api.edamam.com/api/food-database/v2/nutrients', {
              ingredients: [{
                quantity: parsedQuantity,
                measureURI: measure?.uri || "http://www.edamam.com/ontologies/edamam.owl#Measure_gram",
                foodId: food.foodId
              }]
            }, {
              params: {
                app_id: process.env.EDAMAM_RECIPE_SEARCH_APP_ID,
                app_key: process.env.EDAMAM_RECIPE_SEARCH_KEY,
              },
              headers: {
                'Content-Type': 'application/json',
              }
            });

            if (nutrientsResponse.data && nutrientsResponse.data.totalNutrients) {
              const nutrients = nutrientsResponse.data.totalNutrients;
              const unnormalizedUnit = measure?.label || unit;
              const scaledData = {
                name: food.label || searchQuery,
                portion: measure?.label ? `${parsedQuantity} ${measure.label}` : searchQuery,
                quantity: parsedQuantity,
                unit: normalizeUnit(unnormalizedUnit),
                calories: Math.round(nutrients.ENERC_KCAL?.quantity || 0),
                protein: Math.round((nutrients.PROCNT?.quantity || 0) * 10) / 10,
                carbs: Math.round((nutrients.CHOCDF?.quantity || 0) * 10) / 10,
                fats: Math.round((nutrients.FAT?.quantity || 0) * 10) / 10,
                fiber: Math.round((nutrients.FIBTG?.quantity || 0) * 10) / 10,
                sodium: Math.round((nutrients.NA?.quantity || 0) * 10) / 10,
                sugar: Math.round((nutrients.SUGAR?.quantity || 0) * 10) / 10,
                vitaminA: Math.round((nutrients.VITA_RAE?.quantity || 0) * 10) / 10,
                vitaminC: Math.round((nutrients.VITC?.quantity || 0) * 10) / 10,
                calcium: Math.round((nutrients.CA?.quantity || 0) * 10) / 10,
                iron: Math.round((nutrients.FE?.quantity || 0) * 10) / 10,
                potassium: Math.round((nutrients.K?.quantity || 0) * 10) / 10,
              };
              
              console.log('🎯 Final result:', scaledData);
              return NextResponse.json(scaledData);
            }
          }

          // Try hints if parsed didn't work
          if (searchResponse.data.hints && searchResponse.data.hints.length > 0) {
            const food = searchResponse.data.hints[0].food;
            
            // Smart measure selection
            let estimatedQuantity = quantity;
            let measureURI = "http://www.edamam.com/ontologies/edamam.owl#Measure_gram";
            let measureLabel = 'gram'; // Default unit label

            if (food.measures && food.measures.length > 0) {
              // Look for specific measures based on the query
              let selectedMeasure = null;
              
              if (searchQuery.includes('medium') || rawQuery.includes('apple')) {
                selectedMeasure = food.measures.find((m) => m.label.toLowerCase().includes('medium'));
              } else if (searchQuery.includes('slice')) {
                selectedMeasure = food.measures.find((m) => m.label.toLowerCase().includes('slice'));
              } else if (searchQuery.includes('cup')) {
                selectedMeasure = food.measures.find((m) => m.label.toLowerCase().includes('cup'));
              } else if (searchQuery.includes('tbsp')) {
                selectedMeasure = food.measures.find((m) => m.label.toLowerCase().includes('tablespoon'));
              } else if (searchQuery.includes('tsp')) {
                selectedMeasure = food.measures.find((m) => m.label.toLowerCase().includes('teaspoon'));
              }
              
              if (selectedMeasure) {
                measureURI = selectedMeasure.uri;
                measureLabel = selectedMeasure.label;
              } else {
                // Use first available measure
                const firstMeasure = food.measures[0];
                measureURI = firstMeasure?.uri || measureURI;
                measureLabel = firstMeasure?.label || measureLabel;
              }
            } else {
              // Convert to grams
              let grams = quantity;
              if (unit !== 'gram' && unit !== 'g') {
                const conversions: { [key: string]: number } = {
                  'cup': 240, 'tbsp': 15, 'tsp': 5, 'oz': 28, 'lb': 454, 'pound': 454,
                };
                
                if (rawQuery.includes('oat')) conversions['cup'] = 81;
                grams = quantity * (conversions[unit] || 100);
              }
              estimatedQuantity = grams;
              console.log(`📐 Converted to ${grams}g`);
            }

            // Get detailed nutrition
            const nutrientsResponse = await axios.post<EdamamNutrientsResponse>('https://api.edamam.com/api/food-database/v2/nutrients', {
              ingredients: [{
                quantity: estimatedQuantity,
                measureURI: measureURI,
                foodId: food.foodId
              }]
            }, {
              params: {
                app_id: process.env.EDAMAM_RECIPE_SEARCH_APP_ID,
                app_key: process.env.EDAMAM_RECIPE_SEARCH_KEY,
              },
              headers: {
                'Content-Type': 'application/json',
              }
            });

            if (nutrientsResponse.data && nutrientsResponse.data.totalNutrients) {
              const nutrients = nutrientsResponse.data.totalNutrients;
              const scaledData = {
                name: food.label || searchQuery,
                portion: searchQuery,
                quantity: estimatedQuantity,
                unit: normalizeUnit(measureLabel),
                calories: Math.round(nutrients.ENERC_KCAL?.quantity || 0),
                protein: Math.round((nutrients.PROCNT?.quantity || 0) * 10) / 10,
                carbs: Math.round((nutrients.CHOCDF?.quantity || 0) * 10) / 10,
                fats: Math.round((nutrients.FAT?.quantity || 0) * 10) / 10,
                fiber: Math.round((nutrients.FIBTG?.quantity || 0) * 10) / 10,
                sodium: Math.round((nutrients.NA?.quantity || 0) * 10) / 10,
                sugar: Math.round((nutrients.SUGAR?.quantity || 0) * 10) / 10,
                vitaminA: Math.round((nutrients.VITA_RAE?.quantity || 0) * 10) / 10,
                vitaminC: Math.round((nutrients.VITC?.quantity || 0) * 10) / 10,
                calcium: Math.round((nutrients.CA?.quantity || 0) * 10) / 10,
                iron: Math.round((nutrients.FE?.quantity || 0) * 10) / 10,
                potassium: Math.round((nutrients.K?.quantity || 0) * 10) / 10,
              };
              
              console.log('🎯 Hints result:', scaledData);
              return NextResponse.json(scaledData);
            }
          }
        } catch (variantError: unknown) {
          console.log(`❌ Query variant "${searchQuery}" failed:`, variantError);
          continue; // Try next variant
        }
      }
    }

    // Fallback estimation logic if API fails
    const parsedForFallback = parseInput(rawQuery);
    const fallbackQuantity = parsedForFallback?.quantity || 1;
    const fallbackUnit = parsedForFallback?.unit || 'piece';
    const originalQuery = parsedForFallback?.food || rawQuery;

    // Improved estimates
    const estimates: { [key: string]: { calories: number; protein: number; carbs: number; fats: number } } = {
      apple: { calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
      pizza: { calories: 285, protein: 12, carbs: 36, fats: 10 },
      blueberries: { calories: 84, protein: 1.1, carbs: 21, fats: 0.5 }, // per cup
      'peanut butter': { calories: 94, protein: 4, carbs: 3, fats: 8 }, // per tbsp
      oats: { calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9 }, // per 100g
      banana: { calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
    };
    
    const foodKey = originalQuery.toLowerCase().split(' ').find(word => estimates[word]) || 'default';
    const estimate = estimates[foodKey] || { calories: 100, protein: 3, carbs: 15, fats: 2 };
    
    // Apply scaling for structured input
    let multiplier = 1;
    if (fallbackUnit !== 'gram') {
      if (fallbackUnit === 'cup' && originalQuery.includes('oat')) multiplier = fallbackQuantity * 0.81;
      else if (fallbackUnit === 'cup') multiplier = fallbackQuantity;
      else if (fallbackUnit === 'tbsp') multiplier = fallbackQuantity;
      else multiplier = fallbackQuantity;
    } else {
      multiplier = fallbackQuantity / 100; // Assume per 100g
    }
    
    const estimatedData = {
      name: `${originalQuery} (estimated)`,
      portion: rawQuery,
      quantity: fallbackQuantity,
      unit: normalizeUnit(fallbackUnit),
      calories: Math.round(estimate.calories * multiplier),
      protein: Math.round(estimate.protein * multiplier * 10) / 10,
      carbs: Math.round(estimate.carbs * multiplier * 10) / 10,
      fats: Math.round(estimate.fats * multiplier * 10) / 10,
      fiber: 2,
      sodium: 5,
      sugar: Math.round(estimate.carbs * 0.1 * multiplier * 10) / 10,
      vitaminA: 10,
      vitaminC: 5,
      calcium: 20,
      iron: 1,
      potassium: 100,
    };
    
    return NextResponse.json(estimatedData);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 API Error:', errorMessage);
    
    // Return helpful error message with examples
    return NextResponse.json(
      { 
        error: 'Could not parse input. Try formats like: "1 medium apple", "half cup blueberries", "1 tbsp peanut butter", or "2 slices pizza"',
        examples: [
          "1 medium apple",
          "half cup blueberries", 
          "1 tbsp peanut butter",
          "2 slices pizza",
          "1 cup oats"
        ]
      },
      { status: 422 }
    );
  }
} 