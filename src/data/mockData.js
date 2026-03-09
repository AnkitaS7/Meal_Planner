/* ─────────────────────────────────────────
   MOCK DATA  —  Mise en Place
───────────────────────────────────────── */

export const MOCK_USER = {
  name:     "Aria Fontaine",
  handle:   "@aria.cooks",
  avatar:   "AF",
  bio:      "Plant-forward cooking enthusiast • Home chef • Nutrition nerd",
  dietary:  ["Vegetarian", "Gluten-conscious"],
  followers: 284,
  following: 91,
  dishes:    47,
};

export const MOCK_DISHES = [
  {
    id: 1, name: "Roasted Tomato Bisque", category: "Soup",
    time: 35, servings: 4, tags: ["vegan", "gluten-free"],
    youtubeLink: "", img: "🍅",
    recipe: "Roast roma tomatoes and garlic at 400 °F for 25 min until caramelised. Transfer to blender with vegetable broth, blend until smooth. Pour into pot, stir in heavy cream and fresh basil. Season generously with salt, pepper and a pinch of sugar.",
    nutrients: { calories: 210, protein: 5, carbs: 28, fat: 9, fiber: 4 },
    reqIngredients: ["Roma tomatoes", "Vegetable broth", "Garlic", "Heavy cream"],
    optIngredients: ["Fresh basil", "Parmesan"],
  },
  {
    id: 2, name: "Mushroom Risotto", category: "Main",
    time: 45, servings: 2, tags: ["vegetarian", "gluten-free"],
    youtubeLink: "https://youtube.com/watch?v=example",
    img: "🍄",
    recipe: "Sauté shallots in butter until translucent. Add arborio rice, toast 2 min. Deglaze with white wine. Add warm vegetable broth one ladle at a time, stirring continuously until absorbed. Fold in sautéed mushrooms and parmesan. Rest 2 min before serving.",
    nutrients: { calories: 520, protein: 14, carbs: 72, fat: 16, fiber: 3 },
    reqIngredients: ["Arborio rice", "Mixed mushrooms", "Parmesan", "White wine", "Shallots", "Vegetable broth"],
    optIngredients: ["Truffle oil", "Fresh thyme"],
  },
  {
    id: 3, name: "Avocado Toast Deluxe", category: "Breakfast",
    time: 10, servings: 1, tags: ["vegan"],
    youtubeLink: "", img: "🥑",
    recipe: "Toast sourdough until golden. Mash ripe avocado with lemon juice, sea salt and black pepper. Spread generously on toast. Finish with chili flakes, microgreens and a drizzle of olive oil.",
    nutrients: { calories: 340, protein: 9, carbs: 31, fat: 22, fiber: 9 },
    reqIngredients: ["Sourdough bread", "Avocado", "Lemon"],
    optIngredients: ["Microgreens", "Chili flakes", "Everything bagel seasoning"],
  },
  {
    id: 4, name: "Greek Salad Bowl", category: "Salad",
    time: 15, servings: 2, tags: ["vegetarian", "gluten-free"],
    youtubeLink: "", img: "🥗",
    recipe: "Chop cucumber, cherry tomatoes, bell pepper and red onion into chunky pieces. Add kalamata olives and generous cubes of feta. Dress with extra-virgin olive oil, red wine vinegar, dried oregano, salt and pepper.",
    nutrients: { calories: 280, protein: 8, carbs: 18, fat: 21, fiber: 4 },
    reqIngredients: ["Cucumber", "Cherry tomatoes", "Feta cheese", "Kalamata olives", "Red onion"],
    optIngredients: ["Bell pepper", "Fresh mint"],
  },
  {
    id: 5, name: "Lemon Herb Quinoa", category: "Side",
    time: 20, servings: 3, tags: ["vegan", "gluten-free"],
    youtubeLink: "", img: "🌾",
    recipe: "Rinse quinoa thoroughly. Cook in vegetable broth (1:2 ratio) for 15 min, covered. Fluff with fork and cool slightly. Toss with lemon zest, lemon juice, olive oil, fresh parsley and mint. Season to taste.",
    nutrients: { calories: 185, protein: 7, carbs: 32, fat: 5, fiber: 4 },
    reqIngredients: ["Quinoa", "Vegetable broth", "Lemon"],
    optIngredients: ["Fresh parsley", "Mint", "Pine nuts"],
  },
  {
    id: 6, name: "Shakshuka", category: "Breakfast",
    time: 25, servings: 2, tags: ["vegetarian", "gluten-free"],
    youtubeLink: "", img: "🍳",
    recipe: "Sauté onion and red pepper in olive oil. Add garlic, cumin, paprika and chilli. Pour in crushed tomatoes, simmer 10 min. Make wells, crack in eggs. Cover and cook until whites are set. Garnish with feta and parsley.",
    nutrients: { calories: 290, protein: 16, carbs: 22, fat: 14, fiber: 5 },
    reqIngredients: ["Eggs", "Crushed tomatoes", "Red pepper", "Onion", "Garlic"],
    optIngredients: ["Feta cheese", "Fresh parsley", "Chilli flakes"],
  },
];

export const MOCK_PANTRY = [
  { id: 1,  name: "Arborio Rice",     qty: 500, unit: "g",      category: "Grains",  expiry: "2025-06-01" },
  { id: 2,  name: "Parmesan",         qty: 150, unit: "g",      category: "Dairy",   expiry: "2024-12-15" },
  { id: 3,  name: "Avocado",          qty: 3,   unit: "pcs",    category: "Produce", expiry: "2024-12-10" },
  { id: 4,  name: "Sourdough bread",  qty: 1,   unit: "loaf",   category: "Bakery",  expiry: "2024-12-09" },
  { id: 5,  name: "Lemon",            qty: 6,   unit: "pcs",    category: "Produce", expiry: "2024-12-20" },
  { id: 6,  name: "Quinoa",           qty: 800, unit: "g",      category: "Grains",  expiry: "2025-04-01" },
  { id: 7,  name: "Vegetable broth",  qty: 2,   unit: "cartons",category: "Pantry",  expiry: "2025-02-01" },
  { id: 8,  name: "Feta cheese",      qty: 200, unit: "g",      category: "Dairy",   expiry: "2024-12-14" },
  { id: 9,  name: "Kalamata olives",  qty: 180, unit: "g",      category: "Pantry",  expiry: "2025-01-01" },
  { id: 10, name: "Olive oil",        qty: 750, unit: "ml",     category: "Pantry",  expiry: "2025-08-01" },
  { id: 11, name: "Eggs",             qty: 12,  unit: "pcs",    category: "Dairy",   expiry: "2024-12-18" },
  { id: 12, name: "Garlic",           qty: 1,   unit: "bulb",   category: "Produce", expiry: "2024-12-30" },
];

export const MOCK_SOCIAL = [
  { id: 1, name: "Marco Delgado",  handle: "@marco.eats",    avatar: "MD", following: true,  followers: 1204, dishes: 89,  recentMeal: "Shakshuka + Pita",      img: "🍳" },
  { id: 2, name: "Priya Sharma",   handle: "@priyacooks",    avatar: "PS", following: true,  followers: 3891, dishes: 214, recentMeal: "Mango Lassi Bowl",      img: "🥭" },
  { id: 3, name: "Lena Fischer",   handle: "@lenaf",         avatar: "LF", following: false, followers: 672,  dishes: 55,  recentMeal: "Black Forest Cake",     img: "🍰" },
  { id: 4, name: "James Okafor",   handle: "@jameskitchen",  avatar: "JO", following: false, followers: 289,  dishes: 33,  recentMeal: "Jollof Rice Platter",   img: "🍚" },
  { id: 5, name: "Sofía Reyes",    handle: "@sofiaeats",     avatar: "SR", following: false, followers: 5021, dishes: 301, recentMeal: "Tacos al Pastor",       img: "🌮" },
  { id: 6, name: "Kira Tanaka",    handle: "@kiracooks",     avatar: "KT", following: true,  followers: 988,  dishes: 77,  recentMeal: "Miso Ramen Bowl",       img: "🍜" },
];

export const NUTRIENTS_DAILY = [
  { name: "Calories", current: 1840, target: 2000, unit: "kcal", color: "#D4724A" },
  { name: "Protein",  current: 72,   target: 80,   unit: "g",    color: "#6B8F71" },
  { name: "Carbs",    current: 210,  target: 250,  unit: "g",    color: "#C9A84C" },
  { name: "Fat",      current: 64,   target: 70,   unit: "g",    color: "#9B7EBD" },
  { name: "Fiber",    current: 28,   target: 35,   unit: "g",    color: "#4AADBC" },
];

export const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];

export const INITIAL_PLAN = {
  Mon: { Breakfast: 3, Lunch: 4, Dinner: 2, Snack: null },
  Tue: { Breakfast: null, Lunch: 5, Dinner: 1, Snack: null },
  Wed: { Breakfast: 3, Lunch: null, Dinner: null, Snack: 4 },
  Thu: { Breakfast: null, Lunch: null, Dinner: null, Snack: null },
  Fri: { Breakfast: null, Lunch: null, Dinner: null, Snack: null },
  Sat: { Breakfast: null, Lunch: null, Dinner: null, Snack: null },
  Sun: { Breakfast: null, Lunch: null, Dinner: null, Snack: null },
};

export const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-free", "Dairy-free",
  "Nut-free", "Keto", "Paleo", "Halal", "Kosher",
];

export const PANTRY_CATEGORIES = [
  "Produce", "Dairy", "Grains", "Pantry", "Bakery",
  "Meat", "Seafood", "Spices", "Frozen",
];

export const PANTRY_UNITS = [
  "g", "kg", "ml", "L", "pcs", "loaf", "cartons",
  "tbsp", "tsp", "cups", "bunch",
];

export const DISH_CATEGORIES = [
  "Breakfast", "Lunch", "Dinner", "Snack",
  "Main", "Soup", "Salad", "Side", "Dessert",
];
