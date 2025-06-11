import { NextResponse } from 'next/server';
import axios from 'axios';

// Unit conversion table (portions to grams)
const unitConversions: { [key: string]: { [key: string]: number } } = {
  cup: {
    blueberries: 148,
    strawberries: 144,
    rice: 195,
    pasta: 220,
    milk: 240,
    water: 240,
    flour: 125,
    sugar: 200,
    oats: 81,
    spinach: 30,
  },
  tbsp: {
    'peanut butter': 16,
    'olive oil': 14,
    honey: 21,
    sugar: 12,
    flour: 8,
    butter: 14,
  },
  tsp: {
    salt: 6,
    sugar: 4,
    'olive oil': 5,
    vanilla: 4,
  },
  oz: {
    'chicken breast': 28,
    'ground beef': 28,
    cheese: 28,
    bread: 28,
  },
  g: {},
  gram: {},
  lb: {
    'chicken breast': 454,
    'ground beef': 454,
  },
  pound: {
    'chicken breast': 454,
    'ground beef': 454,
  },
};

// Common foods database for quick lookup
const commonFoods: { [key: string]: any } = {
  apple: {
    nutrients: {
      ENERC_KCAL: { quantity: 52 },
      PROCNT: { quantity: 0.26 },
      CHOCDF: { quantity: 13.8 },
      FAT: { quantity: 0.17 },
      VITA_RAE: { quantity: 3 },
      VITC: { quantity: 4.6 },
      CA: { quantity: 6 },
      FE: { quantity: 0.12 },
    }
  },
  banana: {
    nutrients: {
      ENERC_KCAL: { quantity: 89 },
      PROCNT: { quantity: 1.1 },
      CHOCDF: { quantity: 22.8 },
      FAT: { quantity: 0.33 },
      VITA_RAE: { quantity: 3 },
      VITC: { quantity: 8.7 },
      CA: { quantity: 5 },
      FE: { quantity: 0.26 },
    }
  },
  blueberries: {
    nutrients: {
      ENERC_KCAL: { quantity: 57 },
      PROCNT: { quantity: 0.74 },
      CHOCDF: { quantity: 14.5 },
      FAT: { quantity: 0.33 },
      VITA_RAE: { quantity: 3 },
      VITC: { quantity: 9.7 },
      CA: { quantity: 6 },
      FE: { quantity: 0.28 },
    }
  },
  'chicken breast': {
    nutrients: {
      ENERC_KCAL: { quantity: 165 },
      PROCNT: { quantity: 31 },
      CHOCDF: { quantity: 0 },
      FAT: { quantity: 3.6 },
      VITA_RAE: { quantity: 6 },
      VITC: { quantity: 0 },
      CA: { quantity: 15 },
      FE: { quantity: 0.89 },
    }
  },
  'peanut butter': {
    nutrients: {
      ENERC_KCAL: { quantity: 588 },
      PROCNT: { quantity: 25 },
      CHOCDF: { quantity: 20 },
      FAT: { quantity: 50 },
      VITA_RAE: { quantity: 0 },
      VITC: { quantity: 0 },
      CA: { quantity: 43 },
      FE: { quantity: 1.9 },
    }
  },
};

function convertToGrams(quantity: number, unit: string, food: string): number {
  const normalizedUnit = unit.toLowerCase();
  const normalizedFood = food.toLowerCase();
  
  if (normalizedUnit === 'g' || normalizedUnit === 'gram') {
    return quantity;
  }
  
  const conversion = unitConversions[normalizedUnit]?.[normalizedFood];
  if (conversion) {
    return quantity * conversion;
  }
  
  // Default conversions if specific food not found
  const defaultConversions: { [key: string]: number } = {
    cup: 240, // ml/g for liquids
    tbsp: 15,
    tsp: 5,
    oz: 28,
    lb: 454,
    pound: 454,
  };
  
  return quantity * (defaultConversions[normalizedUnit] || 100);
}

function scaleNutrients(nutrients: any, grams: number): any {
  // All nutrition data is per 100g, so scale accordingly
  const scaleFactor = grams / 100;
  
  return {
    name: 'Unknown',
    portion: `${grams}g`,
    calories: (nutrients.ENERC_KCAL?.quantity || 0) * scaleFactor,
    protein: (nutrients.PROCNT?.quantity || 0) * scaleFactor,
    carbs: (nutrients.CHOCDF?.quantity || 0) * scaleFactor,
    fats: (nutrients.FAT?.quantity || 0) * scaleFactor,
    vitaminA: (nutrients.VITA_RAE?.quantity || 0) * scaleFactor,
    vitaminC: (nutrients.VITC?.quantity || 0) * scaleFactor,
    calcium: (nutrients.CA?.quantity || 0) * scaleFactor,
    iron: (nutrients.FE?.quantity || 0) * scaleFactor,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.toLowerCase() || '';
  const quantity = parseFloat(searchParams.get('quantity') || '1');
  const unit = searchParams.get('unit')?.toLowerCase() || 'gram';

  try {
    const grams = convertToGrams(quantity, unit, query);
    
    // Check local database first
    if (commonFoods[query]) {
      const scaledData = scaleNutrients(commonFoods[query].nutrients, grams);
      scaledData.name = query;
      scaledData.portion = `${quantity} ${unit}`;
      return NextResponse.json(scaledData);
    }

    // Try Edamam Food Database API
    if (process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY) {
      const response = await axios.get('https://api.edamam.com/api/food-database/v2/parser', {
        params: {
          app_id: process.env.EDAMAM_APP_ID,
          app_key: process.env.EDAMAM_APP_KEY,
          ingr: query,
          'nutrition-type': 'cooking',
        },
      });

      if (response.data.parsed && response.data.parsed.length > 0) {
        const food = response.data.parsed[0].food;
        const scaledData = scaleNutrients(food.nutrients, grams);
        scaledData.name = food.label || query;
        scaledData.portion = `${quantity} ${unit}`;
        return NextResponse.json(scaledData);
      }
    }

    // Fallback to estimated values
    const estimatedNutrients = {
      ENERC_KCAL: { quantity: 50 }, // Generic estimate
      PROCNT: { quantity: 2 },
      CHOCDF: { quantity: 10 },
      FAT: { quantity: 1 },
      VITA_RAE: { quantity: 5 },
      VITC: { quantity: 2 },
      CA: { quantity: 20 },
      FE: { quantity: 0.5 },
    };
    
    const scaledData = scaleNutrients(estimatedNutrients, grams);
    scaledData.name = query + ' (estimated)';
    scaledData.portion = `${quantity} ${unit}`;
    
    return NextResponse.json(scaledData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food data' },
      { status: 500 }
    );
  }
} 