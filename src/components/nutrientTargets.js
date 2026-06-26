import { C } from "../theme";

// The five standard nutrients tracked across the Dashboard, Nutrition page and
// targets store. Display colour + sort order are shared by the DRI calculator
// and the manual "Custom Targets" editor so saved rows look identical wherever
// they were created.
export const STANDARD_TARGETS = [
  { name: "Calories", unit: "kcal", color: C.gold,   sort: 1 },
  { name: "Protein",  unit: "g",    color: C.accent, sort: 2 },
  { name: "Carbs",    unit: "g",    color: C.purple, sort: 3 },
  { name: "Fat",      unit: "g",    color: C.teal,   sort: 4 },
  { name: "Fiber",    unit: "g",    color: C.sage,   sort: 5 },
];

// Keyed lookup of { color, sort } by nutrient name (matches the Nutrition page).
export const TARGET_STYLE = Object.fromEntries(
  STANDARD_TARGETS.map(t => [t.name, { color: t.color, sort: t.sort }]),
);
