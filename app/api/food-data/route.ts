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
      K: { quantity: 107 },
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
      K: { quantity: 358 },
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
      K: { quantity: 77 },
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
      K: { quantity: 256 },
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
      K: { quantity: 558 },
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
    potassium: (nutrients.K?.quantity || 0) * scaleFactor,
  };
}

// Helper function to detect if input is natural language
function isNaturalLanguage(query: string, quantity: number, unit: string): boolean {
  const naturalWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'a', 'an', 'some', 'slice', 'piece', 'serving'];
  const fullQuery = `${quantity === 1 && unit === 'gram' ? '' : `${quantity} ${unit}`} ${query}`.toLowerCase();
  
  // Check if it contains natural language words or if quantity is 1 and unit is default (likely natural language)
  return naturalWords.some(word => fullQuery.includes(word)) || 
         (quantity === 1 && unit === 'gram' && !query.includes('gram'));
}

// Helper function to format input for better API parsing
function formatForAPI(query: string, quantity: number, unit: string): string {
  const cleanQuery = query.toLowerCase().trim();
  
  // Handle word numbers
  const wordToNumber: { [key: string]: string } = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'half': '0.5', 'quarter': '0.25', 'third': '0.33'
  };
  
  // Convert word numbers to digits
  let formattedQuery = cleanQuery;
  Object.entries(wordToNumber).forEach(([word, number]) => {
    formattedQuery = formattedQuery.replace(new RegExp(`\\b${word}\\b`, 'g'), number);
  });
  
  // If the query already looks natural (contains quantity words), use as-is
  if (formattedQuery.match(/\b\d*\.?\d+\s+(cup|tbsp|tsp|oz|slice|piece|medium|large|small)\b/) || 
      cleanQuery.includes('cup') || cleanQuery.includes('tbsp') || cleanQuery.includes('slice')) {
    return formattedQuery;
  }
  
  // Otherwise, format it properly
  if (quantity === 1 && unit === 'gram') {
    // Likely natural language like "apple" -> "1 medium apple"
    if (cleanQuery === 'apple') return '1 medium apple';
    if (cleanQuery === 'banana') return '1 medium banana';
    if (cleanQuery === 'orange') return '1 medium orange';
    if (cleanQuery.includes('pizza')) return '1 slice pizza';
    return `1 ${cleanQuery}`;
  }
  
  // Format structured input properly
  const unitMap: { [key: string]: string } = {
    'gram': 'g',
    'grams': 'g',
    'cup': 'cup',
    'cups': 'cup',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'ounce': 'oz',
    'ounces': 'oz',
    'pound': 'lb',
    'pounds': 'lb'
  };
  
  const normalizedUnit = unitMap[unit] || unit;
  
  // Use fractions for common amounts
  if (quantity === 0.5) return `half ${normalizedUnit} ${cleanQuery}`;
  if (quantity === 0.25) return `quarter ${normalizedUnit} ${cleanQuery}`;
  if (quantity === 0.33) return `third ${normalizedUnit} ${cleanQuery}`;
  
  return `${quantity} ${normalizedUnit} ${cleanQuery}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const originalQuery = searchParams.get('query') || '';
  const quantity = parseFloat(searchParams.get('quantity') || '1');
  const unit = searchParams.get('unit')?.toLowerCase() || 'gram';

  console.log(`🔍 Original input: "${originalQuery}", quantity: ${quantity}, unit: ${unit}`);

  try {
    if (process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY) {
      console.log('🌐 Using Edamam Food Database API...');
      
      // Format the query for better API compatibility
      const formattedQuery = formatForAPI(originalQuery, quantity, unit);
      console.log(`📝 Formatted query: "${formattedQuery}"`);

      // Try multiple query formats if the first one fails
      const queryVariants = [
        formattedQuery,
        `${quantity} ${unit} of ${originalQuery}`,
        `${quantity} ${unit} ${originalQuery}`,
        originalQuery
      ].filter((q, index, arr) => arr.indexOf(q) === index); // Remove duplicates

      for (const searchQuery of queryVariants) {
        console.log(`🎯 Trying query variant: "${searchQuery}"`);
        
        try {
          // Step 1: Search for the food using parser endpoint
          const searchResponse = await axios.get('https://api.edamam.com/api/food-database/v2/parser', {
            params: {
              app_id: process.env.EDAMAM_APP_ID,
              app_key: process.env.EDAMAM_APP_KEY,
              ingr: searchQuery,
              'nutrition-type': 'logging',
            },
          });

          console.log(`📊 Search response for "${searchQuery}":`, JSON.stringify(searchResponse.data, null, 2));

          // Try parsed results first (most accurate)
          if (searchResponse.data.parsed && searchResponse.data.parsed.length > 0) {
            const parsed = searchResponse.data.parsed[0];
            const food = parsed.food;
            const measure = parsed.measure;
            const parsedQuantity = parsed.quantity || quantity;
            
            console.log('✅ Found parsed result:', food.label);
            console.log('📏 Parsed quantity:', parsedQuantity, 'measure:', measure?.label);

            // Step 2: Get detailed nutrition using nutrients endpoint
            const nutrientsResponse = await axios.post('https://api.edamam.com/api/food-database/v2/nutrients', {
              ingredients: [{
                quantity: parsedQuantity,
                measureURI: measure?.uri || "http://www.edamam.com/ontologies/edamam.owl#Measure_gram",
                foodId: food.foodId
              }]
            }, {
              params: {
                app_id: process.env.EDAMAM_APP_ID,
                app_key: process.env.EDAMAM_APP_KEY,
              },
              headers: {
                'Content-Type': 'application/json',
              }
            });

            console.log('🥗 Nutrients response:', JSON.stringify(nutrientsResponse.data, null, 2));

            if (nutrientsResponse.data && nutrientsResponse.data.totalNutrients) {
              const nutrients = nutrientsResponse.data.totalNutrients;
              const scaledData = {
                name: food.label || originalQuery,
                portion: measure?.label ? `${parsedQuantity} ${measure.label}` : searchQuery,
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
            console.log('🔄 Trying hints fallback...');
            const food = searchResponse.data.hints[0].food;
            
            // Smart measure selection
            let estimatedQuantity = quantity;
            let measureURI = "http://www.edamam.com/ontologies/edamam.owl#Measure_gram";
            
            if (food.measures && food.measures.length > 0) {
              // Look for specific measures based on the query
              let selectedMeasure = null;
              
              if (searchQuery.includes('medium') || originalQuery.includes('apple')) {
                selectedMeasure = food.measures.find((m: any) => m.label.toLowerCase().includes('medium'));
              } else if (searchQuery.includes('slice')) {
                selectedMeasure = food.measures.find((m: any) => m.label.toLowerCase().includes('slice'));
              } else if (searchQuery.includes('cup')) {
                selectedMeasure = food.measures.find((m: any) => m.label.toLowerCase().includes('cup'));
              } else if (searchQuery.includes('tbsp')) {
                selectedMeasure = food.measures.find((m: any) => m.label.toLowerCase().includes('tablespoon'));
              } else if (searchQuery.includes('tsp')) {
                selectedMeasure = food.measures.find((m: any) => m.label.toLowerCase().includes('teaspoon'));
              }
              
              if (selectedMeasure) {
                estimatedQuantity = quantity;
                measureURI = selectedMeasure.uri;
                console.log('📏 Using selected measure:', selectedMeasure.label);
              } else {
                // Use first available measure
                const firstMeasure = food.measures[0];
                measureURI = firstMeasure?.uri || measureURI;
                console.log('📏 Using first available measure:', firstMeasure?.label);
              }
            } else {
              // Convert to grams
              let grams = quantity;
              if (unit !== 'gram' && unit !== 'g') {
                const conversions: { [key: string]: number } = {
                  'cup': 240, 'tbsp': 15, 'tsp': 5, 'oz': 28, 'lb': 454, 'pound': 454,
                };
                
                if (originalQuery.includes('oat')) conversions['cup'] = 81;
                grams = quantity * (conversions[unit] || 100);
              }
              estimatedQuantity = grams;
              console.log(`📐 Converted to ${grams}g`);
            }

            // Get detailed nutrition
            const nutrientsResponse = await axios.post('https://api.edamam.com/api/food-database/v2/nutrients', {
              ingredients: [{
                quantity: estimatedQuantity,
                measureURI: measureURI,
                foodId: food.foodId
              }]
            }, {
              params: {
                app_id: process.env.EDAMAM_APP_ID,
                app_key: process.env.EDAMAM_APP_KEY,
              },
              headers: {
                'Content-Type': 'application/json',
              }
            });

            if (nutrientsResponse.data && nutrientsResponse.data.totalNutrients) {
              const nutrients = nutrientsResponse.data.totalNutrients;
              const scaledData = {
                name: food.label || originalQuery,
                portion: searchQuery,
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
        } catch (variantError: any) {
          console.log(`❌ Query variant "${searchQuery}" failed:`, variantError.response?.data || variantError.message);
          continue; // Try next variant
        }
      }
    }

    console.log('⚠️ All API attempts failed, using estimates...');
    
    // Format query for fallback
    const fallbackQuery = formatForAPI(originalQuery, quantity, unit);
    
    // Improved estimates
    const estimates: { [key: string]: any } = {
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
    if (unit !== 'gram') {
      if (unit === 'cup' && originalQuery.includes('oat')) multiplier = quantity * 0.81;
      else if (unit === 'cup') multiplier = quantity;
      else if (unit === 'tbsp') multiplier = quantity;
      else multiplier = quantity;
    } else {
      multiplier = quantity / 100; // Assume per 100g
    }
    
    const estimatedData = {
      name: `${originalQuery} (estimated)`,
      portion: fallbackQuery,
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
    
    console.log('🔢 Estimated result:', estimatedData);
    return NextResponse.json(estimatedData);

  } catch (error: any) {
    console.error('💥 API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API credentials. Please check your EDAMAM_APP_ID and EDAMAM_APP_KEY.' },
        { status: 401 }
      );
    }
    
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

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