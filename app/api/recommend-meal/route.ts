import { NextResponse } from 'next/server';
import { searchRecipes } from '../food-data/route';
import { Food, DailyTargets } from '@/lib/types';

// This is a simplified version of the nutrient structure from the food-data route
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


function extractNutrients(totalNutrients: FoodNutrients, totalWeight: number, yieldCount: number): Partial<Food> {
    const scale = 1 / (yieldCount || 1);
    
    return {
        calories: (totalNutrients.ENERC_KCAL?.quantity || 0) * scale,
        protein: (totalNutrients.PROCNT?.quantity || 0) * scale,
        carbs: (totalNutrients.CHOCDF?.quantity || 0) * scale,
        fats: (totalNutrients.FAT?.quantity || 0) * scale,
        fiber: (totalNutrients.FIBTG?.quantity || 0) * scale,
        sodium: (totalNutrients.NA?.quantity || 0) * scale,
        sugar: (totalNutrients.SUGAR?.quantity || 0) * scale,
        vitaminA: (totalNutrients.VITA_RAE?.quantity || 0) * scale,
        vitaminC: (totalNutrients.VITC?.quantity || 0) * scale,
        calcium: (totalNutrients.CA?.quantity || 0) * scale,
        iron: (totalNutrients.FE?.quantity || 0) * scale,
        potassium: (totalNutrients.K?.quantity || 0) * scale
    };
}


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mealType = searchParams.get('mealType') || 'Lunch'; // Default to Lunch
    const remainingCalories = parseFloat(searchParams.get('calories') || '2000');
    const remainingProtein = parseFloat(searchParams.get('protein') || '50');
    const dailyProteinTarget = parseFloat(searchParams.get('dailyProteinTarget') || '100');

    if (isNaN(remainingCalories) || isNaN(remainingProtein) || isNaN(dailyProteinTarget)) {
        return NextResponse.json({ error: 'Invalid nutrient values provided.' }, { status: 400 });
    }

    try {
        const mealsLeft = mealType === 'Breakfast' ? 3 : (mealType === 'Lunch' ? 2 : 1);
        const calorieTarget = remainingCalories / mealsLeft;
        const calorieRange = `${Math.max(0, calorieTarget * 0.8)}-${calorieTarget * 1.2}`;
        
        const options: any = { // Using `any` because SearchRecipeOptions is in another file
            mealType: mealType,
            calories: calorieRange,
            to: 100, // Fetch up to 100 recipes
        };

        const proteinIntakeRatio = (dailyProteinTarget - remainingProtein) / dailyProteinTarget;
        if (remainingProtein > 0 && (proteinIntakeRatio < 0.3 || remainingProtein / dailyProteinTarget < 0.5) ) {
            options.diet = 'high-protein';
        }

        const recipeHits = await searchRecipes(options);
        
        const meals: Food[] = recipeHits.map(hit => {
            const recipe = hit.recipe;
            const nutrientsPerServing = extractNutrients(recipe.totalNutrients, recipe.totalWeight, recipe.yield);
            
            const processedNutrients = Object.fromEntries(
                Object.entries(nutrientsPerServing).map(([key, value]) => {
                    const numValue = typeof value === 'number' ? value : 0;
                    if (key === 'calories') {
                        return [key, Math.round(numValue)];
                    }
                    return [key, parseFloat(numValue.toFixed(1))];
                })
            );

            return {
                name: recipe.label,
                portion: `1 serving (${Math.round(recipe.totalWeight / recipe.yield)}g)`,
                quantity: 1,
                unit: 'serving',
                ...processedNutrients
            } as Food;
        });

        return NextResponse.json(meals);

    } catch (error) {
        console.error("Error in /api/recommend-meal:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to generate meal recommendation.', details: errorMessage }, { status: 500 });
    }
} 