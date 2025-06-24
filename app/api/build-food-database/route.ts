import { NextResponse } from "next/server";
import axios from "axios";
import { FoodData, isNutrientValue } from "@/lib/types";

interface EdamamFood {
  foodId: string;
  label: string;
  category?: string;
  categoryLabel?: string;
  image?: string;
  measures?: Array<{
    uri: string;
    label: string;
  }>;
}

interface EdamamSearchResponse {
  parsed?: Array<{
    food: EdamamFood;
    quantity: number;
    measure: {
      uri: string;
      label: string;
    };
  }>;
  hints?: Array<{
    food: EdamamFood;
  }>;
}

interface EdamamNutrientsResponse {
  totalNutrients?: {
    ENERC_KCAL?: { quantity: number; unit?: string };
    PROCNT?: { quantity: number; unit?: string };
    CHOCDF?: { quantity: number; unit?: string };
    FAT?: { quantity: number; unit?: string };
    FIBTG?: { quantity: number; unit?: string };
    NA?: { quantity: number; unit?: string };
    SUGAR?: { quantity: number; unit?: string };
    VITA_RAE?: { quantity: number; unit?: string };
    VITC?: { quantity: number; unit?: string };
    CA?: { quantity: number; unit?: string };
    FE?: { quantity: number; unit?: string };
    K?: { quantity: number; unit?: string };
  };
}

interface FoodSuggestion {
  name: string;
  query: string;
  category: "quick" | "cooking" | "snack" | "meal";
  estimatedDeficitFill: number;
  multiNutrient?: string[];
  description?: string;
  impact?: string;
}

// Comprehensive food search terms for each nutrient category
const foodSearchTerms = {
  calories: {
    quick: [
      "banana",
      "apple",
      "orange",
      "pear",
      "grapes",
      "strawberries",
      "blueberries",
      "raspberries",
      "blackberries",
      "mango",
      "pineapple",
      "kiwi",
      "peach",
      "plum",
      "apricot",
      "cherries",
      "figs",
      "dates",
      "raisins",
      "greek yogurt",
      "cottage cheese",
      "string cheese",
      "hard boiled eggs",
      "tuna",
      "salmon",
      "turkey",
      "edamame",
      "hummus",
      "avocado",
      "nuts",
      "seeds",
      "dried fruit",
      "granola",
      "protein bar",
      "milk",
      "chocolate milk",
      "smoothie",
      "protein shake",
      "meal replacement shake",
    ],
    cooking: [
      "chicken breast",
      "salmon fillet",
      "lean beef",
      "pork tenderloin",
      "cod fillet",
      "shrimp",
      "tofu",
      "lentils",
      "black beans",
      "chickpeas",
      "quinoa",
      "brown rice",
      "sweet potato",
      "potato",
      "whole wheat pasta",
      "oatmeal",
      "eggs",
      "turkey breast",
      "tempeh",
      "seitan",
      "fish",
      "lean meat",
      "legumes",
      "whole grains",
      "starchy vegetables",
    ],
    snack: [
      "almonds",
      "walnuts",
      "cashews",
      "pistachios",
      "peanuts",
      "sunflower seeds",
      "pumpkin seeds",
      "chia seeds",
      "flax seeds",
      "hemp seeds",
      "peanut butter",
      "almond butter",
      "cashew butter",
      "trail mix",
      "beef jerky",
      "protein chips",
      "popcorn",
      "crackers",
      "rice cakes",
      "dark chocolate",
      "cheese",
      "yogurt",
      "fruit",
      "vegetables",
      "dried fruit",
    ],
  },
  protein: {
    quick: [
      "greek yogurt",
      "cottage cheese",
      "protein shake",
      "protein powder",
      "hard boiled eggs",
      "tuna packet",
      "canned salmon",
      "turkey slices",
      "edamame",
      "tempeh",
      "protein bar",
      "string cheese",
      "milk",
      "soy milk",
      "almond milk",
      "protein drink",
      "meal replacement",
    ],
    cooking: [
      "chicken breast",
      "salmon",
      "lean beef",
      "pork tenderloin",
      "cod",
      "shrimp",
      "tofu",
      "lentils",
      "black beans",
      "chickpeas",
      "quinoa",
      "eggs",
      "turkey breast",
      "seitan",
      "fish",
      "lean meat",
      "legumes",
      "tempeh",
      "protein-rich vegetables",
    ],
    snack: [
      "almonds",
      "peanuts",
      "cashews",
      "pistachios",
      "sunflower seeds",
      "pumpkin seeds",
      "peanut butter",
      "almond butter",
      "protein chips",
      "beef jerky",
      "cheese",
      "yogurt",
      "protein bar",
      "edamame",
      "nuts",
      "seeds",
    ],
  },
  carbs: {
    quick: [
      "banana",
      "apple",
      "orange",
      "pear",
      "grapes",
      "strawberries",
      "blueberries",
      "mango",
      "pineapple",
      "kiwi",
      "peach",
      "dates",
      "raisins",
      "dried apricots",
      "dried cranberries",
      "fruit",
      "juice",
      "smoothie",
      "granola",
      "cereal",
      "bread",
      "tortilla",
    ],
    cooking: [
      "oatmeal",
      "brown rice",
      "quinoa",
      "sweet potato",
      "potato",
      "whole wheat pasta",
      "barley",
      "farro",
      "bulgur",
      "wild rice",
      "corn",
      "peas",
      "butternut squash",
      "acorn squash",
      "whole grains",
      "starchy vegetables",
      "legumes",
    ],
    snack: [
      "popcorn",
      "crackers",
      "rice cakes",
      "bread",
      "tortilla chips",
      "pretzels",
      "granola",
      "dried fruit",
      "fruit",
      "cereal",
      "whole grain snacks",
    ],
  },
  fats: {
    quick: [
      "avocado",
      "olive oil",
      "coconut oil",
      "flax seeds",
      "chia seeds",
      "hemp seeds",
      "pumpkin seeds",
      "sesame seeds",
      "nuts",
      "seeds",
      "coconut milk",
      "tahini",
    ],
    cooking: [
      "salmon",
      "eggs",
      "cooking oils",
      "butter",
      "ghee",
      "fatty fish",
      "meat with fat",
    ],
    snack: [
      "almonds",
      "walnuts",
      "pistachios",
      "cashews",
      "macadamia nuts",
      "pecans",
      "peanut butter",
      "almond butter",
      "cashew butter",
      "sunflower seeds",
      "pumpkin seeds",
      "dark chocolate",
      "cheese",
      "nuts",
      "seeds",
    ],
  },
  vitaminA: {
    quick: [
      "carrots",
      "sweet potato",
      "spinach",
      "kale",
      "butternut squash",
      "cantaloupe",
      "mango",
      "red bell pepper",
      "apricots",
      "pumpkin",
      "collard greens",
      "swiss chard",
      "romaine lettuce",
      "broccoli",
      "peas",
      "orange vegetables",
      "dark leafy greens",
    ],
    cooking: [
      "sweet potato",
      "pumpkin",
      "butternut squash",
      "spinach",
      "kale",
      "collard greens",
      "swiss chard",
      "broccoli",
      "peas",
      "carrots",
      "squash",
      "dark leafy greens",
    ],
    snack: [
      "carrots",
      "sweet potato chips",
      "dried apricots",
      "mango",
      "cantaloupe",
      "red bell pepper",
      "orange vegetables",
      "dark leafy greens",
    ],
  },
  vitaminC: {
    quick: [
      "orange",
      "strawberries",
      "bell pepper",
      "kiwi",
      "grapefruit",
      "pineapple",
      "broccoli",
      "brussels sprouts",
      "cauliflower",
      "tomatoes",
      "lemon",
      "lime",
      "papaya",
      "guava",
      "acerola cherries",
      "kale",
      "mustard greens",
      "citrus fruits",
    ],
    cooking: [
      "broccoli",
      "brussels sprouts",
      "cauliflower",
      "bell peppers",
      "tomatoes",
      "kale",
      "mustard greens",
      "citrus fruits",
      "vegetables",
    ],
    snack: [
      "orange",
      "strawberries",
      "kiwi",
      "grapefruit",
      "pineapple",
      "bell pepper",
      "tomatoes",
      "lemon",
      "lime",
      "papaya",
      "guava",
      "citrus fruits",
    ],
  },
  calcium: {
    quick: [
      "milk",
      "yogurt",
      "cheese",
      "cottage cheese",
      "almonds",
      "spinach",
      "kale",
      "sardines",
      "tofu",
      "fortified orange juice",
      "soy milk",
      "almond milk",
      "chia seeds",
      "sesame seeds",
      "collard greens",
      "bok choy",
      "figs",
    ],
    cooking: [
      "milk",
      "yogurt",
      "cheese",
      "sardines",
      "tofu",
      "spinach",
      "kale",
      "collard greens",
      "bok choy",
      "calcium-rich vegetables",
    ],
    snack: [
      "cheese",
      "yogurt",
      "almonds",
      "chia seeds",
      "sesame seeds",
      "figs",
      "dairy products",
      "nuts",
      "seeds",
    ],
  },
  iron: {
    quick: [
      "spinach",
      "lentils",
      "lean beef",
      "chicken",
      "quinoa",
      "pumpkin seeds",
      "dark chocolate",
      "kidney beans",
      "chickpeas",
      "tofu",
      "oysters",
      "sardines",
      "turkey",
      "cashews",
      "sunflower seeds",
      "blackstrap molasses",
      "dried apricots",
      "raisins",
      "iron-rich foods",
    ],
    cooking: [
      "spinach",
      "lentils",
      "lean beef",
      "chicken",
      "quinoa",
      "kidney beans",
      "chickpeas",
      "tofu",
      "oysters",
      "sardines",
      "turkey",
      "iron-rich foods",
    ],
    snack: [
      "pumpkin seeds",
      "dark chocolate",
      "cashews",
      "sunflower seeds",
      "dried apricots",
      "raisins",
      "nuts",
      "seeds",
      "iron-rich snacks",
    ],
  },
  potassium: {
    quick: [
      "banana",
      "potato",
      "sweet potato",
      "spinach",
      "avocado",
      "coconut water",
      "orange",
      "tomato",
      "yogurt",
      "salmon",
      "white beans",
      "lima beans",
      "acorn squash",
      "beets",
      "cantaloupe",
      "honeydew",
      "prunes",
      "raisins",
      "mushrooms",
      "potassium-rich foods",
    ],
    cooking: [
      "potato",
      "sweet potato",
      "spinach",
      "salmon",
      "white beans",
      "lima beans",
      "acorn squash",
      "beets",
      "mushrooms",
      "potassium-rich foods",
    ],
    snack: [
      "banana",
      "avocado",
      "coconut water",
      "orange",
      "tomato",
      "yogurt",
      "cantaloupe",
      "honeydew",
      "prunes",
      "raisins",
      "potassium-rich snacks",
    ],
  },
};

// Portion sizes for different food types
const portionSizes = {
  fruits: ["1 medium", "1 large", "1 cup", "1/2 cup", "2 medium", "3 pieces"],
  vegetables: ["1 cup", "1/2 cup", "1 medium", "2 cups", "1 large"],
  proteins: ["3 oz", "4 oz", "6 oz", "1 cup", "1/2 cup", "2 pieces"],
  grains: ["1 cup", "1/2 cup", "1 slice", "2 slices", "1 piece"],
  dairy: ["1 cup", "1/2 cup", "1 oz", "2 oz", "1 piece"],
  nuts: ["1/4 cup", "1/2 cup", "2 tbsp", "1 oz", "1 handful"],
  oils: ["1 tbsp", "2 tbsp", "1 tsp", "1/2 tbsp"],
};

function getPortionSize(foodType: string, foodName: string): string {
  if (
    foodName.includes("banana") ||
    foodName.includes("apple") ||
    foodName.includes("orange")
  ) {
    return portionSizes.fruits[
      Math.floor(Math.random() * portionSizes.fruits.length)
    ];
  }
  if (
    foodName.includes("chicken") ||
    foodName.includes("beef") ||
    foodName.includes("fish")
  ) {
    return portionSizes.proteins[
      Math.floor(Math.random() * portionSizes.proteins.length)
    ];
  }
  if (
    foodName.includes("rice") ||
    foodName.includes("pasta") ||
    foodName.includes("bread")
  ) {
    return portionSizes.grains[
      Math.floor(Math.random() * portionSizes.grains.length)
    ];
  }
  if (
    foodName.includes("milk") ||
    foodName.includes("yogurt") ||
    foodName.includes("cheese")
  ) {
    return portionSizes.dairy[
      Math.floor(Math.random() * portionSizes.dairy.length)
    ];
  }
  if (
    foodName.includes("almond") ||
    foodName.includes("walnut") ||
    foodName.includes("seed")
  ) {
    return portionSizes.nuts[
      Math.floor(Math.random() * portionSizes.nuts.length)
    ];
  }
  if (foodName.includes("oil") || foodName.includes("butter")) {
    return portionSizes.oils[
      Math.floor(Math.random() * portionSizes.oils.length)
    ];
  }
  return portionSizes.fruits[
    Math.floor(Math.random() * portionSizes.fruits.length)
  ];
}

async function fetchFoodData(
  foodName: string,
  portion: string
): Promise<FoodData | null> {
  try {
    const query = `${portion} ${foodName}`;

    // Search for the food
    const searchResponse = await axios.get<EdamamSearchResponse>(
      "https://api.edamam.com/api/food-database/v2/parser",
      {
        params: {
          app_id: process.env.EDAMAM_APP_ID,
          app_key: process.env.EDAMAM_APP_KEY,
          ingr: query,
          "nutrition-type": "logging",
        },
      }
    );

    let food: EdamamFood | null = null;
    let measureURI = "http://www.edamam.com/ontologies/edamam.owl#Measure_gram";
    let quantity = 100;

    if (searchResponse.data.parsed && searchResponse.data.parsed.length > 0) {
      const parsed = searchResponse.data.parsed[0];
      food = parsed.food;
      measureURI = parsed.measure.uri;
      quantity = parsed.quantity;
    } else if (
      searchResponse.data.hints &&
      searchResponse.data.hints.length > 0
    ) {
      food = searchResponse.data.hints[0].food;
      if (food.measures && food.measures.length > 0) {
        measureURI = food.measures[0].uri;
      }
    }

    if (!food) {
      return null;
    }

    // Get detailed nutrition
    const nutrientsResponse = await axios.post<EdamamNutrientsResponse>(
      "https://api.edamam.com/api/food-database/v2/nutrients",
      {
        ingredients: [
          {
            quantity: quantity,
            measureURI: measureURI,
            foodId: food.foodId,
          },
        ],
      },
      {
        params: {
          app_id: process.env.EDAMAM_APP_ID,
          app_key: process.env.EDAMAM_APP_KEY,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (nutrientsResponse.data && nutrientsResponse.data.totalNutrients) {
      const nutrients = nutrientsResponse.data.totalNutrients;
      return {
        name: food.label,
        query: query,
        calories: Math.round(nutrients.ENERC_KCAL?.quantity || 0),
        protein: Math.round((nutrients.PROCNT?.quantity || 0) * 10) / 10,
        carbs: Math.round((nutrients.CHOCDF?.quantity || 0) * 10) / 10,
        fats: Math.round((nutrients.FAT?.quantity || 0) * 10) / 10,
        vitaminA: Math.round((nutrients.VITA_RAE?.quantity || 0) * 10) / 10,
        vitaminC: Math.round((nutrients.VITC?.quantity || 0) * 10) / 10,
        calcium: Math.round((nutrients.CA?.quantity || 0) * 10) / 10,
        iron: Math.round((nutrients.FE?.quantity || 0) * 10) / 10,
        potassium: Math.round((nutrients.K?.quantity || 0) * 10) / 10,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching data for ${foodName}:`, error);
    return null;
  }
}

function calculateDeficitFill(
  nutrientValue: number,
  targetValue: number
): number {
  if (targetValue === 0) return 0;
  return Math.round((nutrientValue / targetValue) * 100);
}

function determineMultiNutrients(foodData: FoodData): string[] {
  const multiNutrients: string[] = [];
  const thresholds = {
    calories: 50,
    protein: 5,
    carbs: 10,
    fats: 3,
    vitaminA: 50,
    vitaminC: 10,
    calcium: 50,
    iron: 1,
    potassium: 200,
  };

  Object.entries(thresholds).forEach(([nutrient, threshold]) => {
    const value = foodData[nutrient];
    if (isNutrientValue(value) && value >= threshold) {
      multiNutrients.push(nutrient);
    }
  });

  return multiNutrients;
}

export async function GET() {
  if (!process.env.EDAMAM_APP_ID || !process.env.EDAMAM_APP_KEY) {
    return NextResponse.json(
      { error: "Edamam API credentials not configured" },
      { status: 500 }
    );
  }

  const expandedFoodSuggestions: { [key: string]: FoodSuggestion[] } = {
    calories: [],
    protein: [],
    carbs: [],
    fats: [],
    vitaminA: [],
    vitaminC: [],
    calcium: [],
    iron: [],
    potassium: [],
  };

  console.log("🚀 Starting to build comprehensive food database...");

  // Process each nutrient category
  for (const [nutrient, categories] of Object.entries(foodSearchTerms)) {
    console.log(`📊 Processing ${nutrient}...`);

    for (const [category, foods] of Object.entries(categories)) {
      console.log(`  📝 Processing ${category} foods for ${nutrient}...`);

      const categoryFoods: FoodSuggestion[] = [];

      for (const food of foods) {
        try {
          const portion = getPortionSize(category, food);
          const foodData = await fetchFoodData(food, portion);

          if (foodData) {
            const nutrientValue = foodData[nutrient];
            if (isNutrientValue(nutrientValue) && nutrientValue > 0) {
              const deficitFill = calculateDeficitFill(nutrientValue, 100); // Assuming 100 as target
              const multiNutrients = determineMultiNutrients(foodData);

              const suggestion: FoodSuggestion = {
                name: `${foodData.name} (${portion})`,
                query: foodData.query,
                category: category as "quick" | "cooking" | "snack" | "meal",
                estimatedDeficitFill: deficitFill,
                multiNutrient:
                  multiNutrients.length > 1 ? multiNutrients : undefined,
                description: `${foodData.name} - ${category} option`,
                impact: `Provides ${nutrient} and other nutrients`,
              };

              categoryFoods.push(suggestion);
              console.log(`    ✅ Added: ${suggestion.name}`);
            }

            // Rate limiting - wait 100ms between requests
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`    ❌ Error processing ${food}:`, error);
        }
      }

      // Sort by deficit fill and take top 50
      categoryFoods.sort(
        (a, b) => b.estimatedDeficitFill - a.estimatedDeficitFill
      );
      expandedFoodSuggestions[nutrient].push(...categoryFoods.slice(0, 50));
    }
  }

  console.log("🎉 Food database build complete!");
  console.log("📈 Summary:");
  Object.entries(expandedFoodSuggestions).forEach(([nutrient, foods]) => {
    console.log(`  ${nutrient}: ${foods.length} foods`);
  });

  return NextResponse.json({
    success: true,
    message: "Food database built successfully",
    data: expandedFoodSuggestions,
    summary: Object.fromEntries(
      Object.entries(expandedFoodSuggestions).map(([nutrient, foods]) => [
        nutrient,
        foods.length,
      ])
    ),
  });
}
