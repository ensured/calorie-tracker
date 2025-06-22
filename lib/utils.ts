import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse input like "half cup of blueberries" or "1 1/2 cup flour"
export function parseInput(text: string) {
  const patterns = [
    // Match mixed numbers (e.g., 1 1/2 cup), fractions, decimals, and words
    /(\d+\s+\d+\/\d+|\d*\.?\d+|\d+\/\d+|\w+)\s*(slice|slices|piece|pieces|pc|clove|cloves|pinch|dashes|dash|milliliter|millilitre|milliliters|ml|cc|liter|litre|liters|l|fluid\sounce|fl\soz|pint|pints|pt|quart|quarts|qt|gallon|gallons|gal|milligram|mg|cup|cups|c|tbsp|tbsps|tablespoon|tablespoons|tb|tsp|tsps|teaspoon|teaspoons|t|ounce|ounces|oz|gram|grams|g|kilogram|kilograms|kg|kgs|pound|pounds|lb|lbs)\s*(?:of\s+)?([\w\s]*)/i,
    /(\w+)\s*(slice|slices|piece|pieces|pc|clove|cloves|pinch|dashes|dash|milliliter|millilitre|milliliters|ml|cc|liter|litre|liters|l|fluid\sounce|fl\soz|pint|pints|pt|quart|quarts|qt|gallon|gallons|gal|milligram|mg|cup|cups|c|tbsp|tbsps|tablespoon|tablespoons|tb|tsp|tsps|teaspoon|teaspoons|t|ounce|ounces|oz|gram|grams|g|kilogram|kilograms|kg|kgs|pound|pounds|lb|lbs)\s*(?:of\s+)?([\w\s]*)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let quantityStr = match[1];
      const unit = match[2];
      const food = match[3] || '';
      let quantity: number;
      const wordToNumber: { [key: string]: number } = {
        'half': 0.5, 'halves': 0.5,
        'third': 1/3, 'thirds': 1/3,
        'fourth': 0.25, 'fourths': 0.25,
        'quarter': 0.25, 'quarters': 0.25,
        'fifth': 0.2, 'fifths': 0.2,
        'sixth': 1/6, 'sixths': 1/6,
        'seventh': 1/7, 'sevenths': 1/7,
        'eighth': 0.125, 'eighths': 0.125,
        'ninth': 1/9, 'ninths': 1/9,
        'tenth': 0.1, 'tenths': 0.1,
        'eleventh': 1/11, 'elevenths': 1/11,
        'twelfth': 1/12, 'twelfths': 1/12,
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'a': 1, 'an': 1,
        'three-quarters': 0.75, 'three-fourths': 0.75, 'two-thirds': 2/3, 'three-fifths': 0.6, 'three-eighths': 0.375, 'two-fifths': 0.4, 'five-eighths': 0.625, 'seven-eighths': 0.875
      };
      quantityStr = quantityStr.trim();
      if (/^\d+\s+\d+\/\d+$/.test(quantityStr)) {
        // e.g., "1 1/2"
        const [whole, frac] = quantityStr.split(/\s+/);
        const [num, denom] = frac.split('/').map(Number);
        quantity = parseInt(whole) + num / denom;
      } else if (/^\d+\/\d+$/.test(quantityStr)) {
        // e.g., "1/2", "3/4"
        const [num, denom] = quantityStr.split('/').map(Number);
        quantity = num / denom;
      } else if (/^\d*\.?\d+$/.test(quantityStr)) {
        quantity = parseFloat(quantityStr);
      } else {
        quantity = wordToNumber[quantityStr.toLowerCase()] || 1;
      }
      // --- Unit normalization ---
      const unitMap: { [key: string]: string } = {
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
      const normalizedUnit = unitMap[unit.toLowerCase()] || unit.toLowerCase();
      return { quantity, unit: normalizedUnit, food: food.trim().toLowerCase() };
    }
  }
  return null;
}

export function formatPortion(portion: string) {
  const match = portion.match(/^([0-9.]+)/);
  if (match) {
    const num = parseFloat(match[1]);
    // If the number has more than 3 decimals, round to 3. If the third decimal is 0, show 2 decimals, etc.
    let rounded = num.toFixed(3);
    if (rounded.endsWith('00')) {
      rounded = num.toFixed(1);
    } else if (rounded.endsWith('0')) {
      rounded = num.toFixed(2);
    }
    // Remove trailing .0 if present
    if (rounded.endsWith('.0')) {
      rounded = rounded.slice(0, -2);
    }
    return portion.replace(match[1], rounded);
  }
  return portion;
}

export function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}
