import { supabase } from "./supabase";

// ── Shape transforms ──────────────────────────────────────────

export function mapDish(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    category: row.category,
    time: Number(row.total_time_min) || (Number(row.prep_time_min || 0) + Number(row.cook_time_min || 0)),
    servings: row.servings,
    tags: row.tags ?? [],
    img: row.img_emoji ?? "🍽",
    recipe: row.recipe_text ?? "",
    youtubeLink: row.youtube_url ?? "",
    nutrients: {
      calories: Number(row.cal) || 0,
      protein:  Number(row.protein_g) || 0,
      carbs:    Number(row.carbs_g) || 0,
      fat:      Number(row.fat_g) || 0,
      fiber:    Number(row.fiber_g) || 0,
    },
    reqIngredients: row.req_ingredients ?? [],
    optIngredients: row.opt_ingredients ?? [],
  };
}

export function mapPantryItem(row) {
  return {
    id: row.id,
    name: row.name,
    qty: Number(row.quantity),
    unit: row.unit,
    category: row.category,
    expiry: row.expiry_date ?? "",
  };
}

// ── Week helpers ──────────────────────────────────────────────

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekDates(weekStart) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [y, m, d] = weekStart.split("-").map(Number);
  const result = {};
  DAYS.forEach((day, i) => {
    const dt = new Date(y, m - 1, d + i);
    const yyyy = dt.getFullYear();
    const mm   = String(dt.getMonth() + 1).padStart(2, "0");
    const dd   = String(dt.getDate()).padStart(2, "0");
    result[day] = `${yyyy}-${mm}-${dd}`;
  });
  return result;
}

export function todayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ── Dishes ────────────────────────────────────────────────────

export const UNIVERSAL_USER_ID = "aaaaaaaa-0001-0001-0001-000000000001";

export async function fetchDishes(userId) {
  const { data, error } = await supabase
    .from("v_dish_full")
    .select("*")
    .in("user_id", [UNIVERSAL_USER_ID, userId])
    .order("id");
  if (error) throw error;
  return data.map(mapDish);
}

export async function insertDish(dish, userId) {
  const { data: dishRow, error: dishErr } = await supabase
    .from("dishes")
    .insert({
      user_id:      userId,
      name:         dish.name,
      category:     dish.category,
      prep_time_min: dish.prepTime ?? 0,
      cook_time_min: dish.cookTime ?? dish.time ?? 0,
      servings:     dish.servings,
      tags:         dish.tags ?? [],
      img_emoji:    dish.img,
      recipe_text:  dish.recipe,
      youtube_url:  dish.youtubeLink || null,
      cal:          dish.nutrients.calories,
      protein_g:    dish.nutrients.protein,
      carbs_g:      dish.nutrients.carbs,
      fat_g:        dish.nutrients.fat,
      fiber_g:      dish.nutrients.fiber,
    })
    .select()
    .single();
  if (dishErr) throw dishErr;

  const ingredients = [
    ...(dish.reqIngredients ?? []).map((name, i) => ({
      dish_id: dishRow.id, ingredient_name: name, type: "required", sort_order: i + 1,
    })),
    ...(dish.optIngredients ?? []).map((name, i) => ({
      dish_id: dishRow.id, ingredient_name: name, type: "optional", sort_order: i + 1,
    })),
  ];

  if (ingredients.length > 0) {
    const { error: ingErr } = await supabase.from("dish_ingredients").insert(ingredients);
    if (ingErr) throw ingErr;
  }

  return { ...dish, id: dishRow.id };
}

export async function deleteDish(id) {
  const { error } = await supabase.from("dishes").delete().eq("id", id);
  if (error) throw error;
}

// ── Pantry ────────────────────────────────────────────────────

export async function fetchPantry(userId) {
  const { data, error } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data.map(mapPantryItem);
}

export async function insertPantryItem(item, userId) {
  const { data, error } = await supabase
    .from("pantry_items")
    .insert({
      user_id:     userId,
      name:        item.name,
      quantity:    item.qty,
      unit:        item.unit,
      category:    item.category,
      expiry_date: item.expiry || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapPantryItem(data);
}

export async function deletePantryItem(id) {
  const { error } = await supabase.from("pantry_items").delete().eq("id", id);
  if (error) throw error;
}

// ── Profile ───────────────────────────────────────────────────

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Nutrient targets ──────────────────────────────────────────

export async function fetchNutrientTargets(userId) {
  const { data, error } = await supabase
    .from("nutrient_targets")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

// ── Meal plan ─────────────────────────────────────────────────

export async function fetchWeeklyPlan(userId, weekStart) {
  const [y, m, d] = weekStart.split("-").map(Number);
  const end = new Date(y, m - 1, d + 6);
  const weekEnd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("v_weekly_plan")
    .select("*")
    .eq("user_id", userId)
    .gte("plan_date", weekStart)
    .lte("plan_date", weekEnd);
  if (error) throw error;
  return data;
}

export async function fetchTodayPlan(userId) {
  const today = todayDateStr();
  const { data, error } = await supabase
    .from("v_weekly_plan")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_date", today);
  if (error) throw error;
  return data ?? [];
}

// Converts v_weekly_plan rows into { Mon: { Breakfast: dishId | null, ... }, ... }
export function buildPlanObject(rows, DAYS, MEALS) {
  const plan = {};
  DAYS.forEach(d => {
    plan[d] = {};
    MEALS.forEach(m => { plan[d][m] = null; });
  });
  rows.forEach(row => {
    const day  = row.day_label;
    const meal = row.meal_slot;
    if (plan[day] !== undefined) {
      plan[day][meal] = row.dish_id ?? null;
    }
  });
  return plan;
}

export async function upsertMealPlan(userId, planDate, mealSlot, dishId) {
  const { error } = await supabase
    .from("meal_plans")
    .upsert(
      { user_id: userId, plan_date: planDate, meal_slot: mealSlot, dish_id: dishId },
      { onConflict: "user_id,plan_date,meal_slot" }
    );
  if (error) throw error;
}

export async function removeMealPlan(userId, planDate, mealSlot) {
  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("user_id", userId)
    .eq("plan_date", planDate)
    .eq("meal_slot", mealSlot);
  if (error) throw error;
}

export async function clearDayMealPlan(userId, planDate) {
  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("user_id", userId)
    .eq("plan_date", planDate);
  if (error) throw error;
}

// ── Community / Social ────────────────────────────────────────

export async function fetchCommunityUsers(userId) {
  const [{ data: profiles, error: pErr }, { data: follows, error: fErr }] = await Promise.all([
    supabase.from("profiles").select("*").eq("public_profile", true).neq("id", userId),
    supabase.from("user_follows").select("following_id").eq("follower_id", userId),
  ]);
  if (pErr) throw pErr;
  if (fErr) throw fErr;

  const followingSet = new Set((follows ?? []).map(f => f.following_id));
  return (profiles ?? []).map(p => ({
    id:         p.id,
    name:       p.name,
    handle:     p.handle,
    avatar:     p.avatar_initials,
    following:  followingSet.has(p.id),
    followers:  p.follower_count,
    dishes:     0,
    recentMeal: "",
    img:        "🍽",
  }));
}

export async function followUser(followerId, followingId) {
  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId, followingId) {
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

// ── Shopping ──────────────────────────────────────────────────

export async function fetchShoppingNeeded(userId, weekStart) {
  const [y, m, d] = weekStart.split("-").map(Number);
  const end = new Date(y, m - 1, d + 6);
  const weekEnd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("v_shopping_needed")
    .select("*")
    .eq("user_id", userId)
    .gte("plan_date", weekStart)
    .lte("plan_date", weekEnd);
  if (error) throw error;
  return data ?? [];
}

export async function fetchManualShoppingItems(userId, weekStart) {
  const { data, error } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function addManualShoppingItem(userId, name, weekStart) {
  const { data, error } = await supabase
    .from("shopping_list_items")
    .insert({ user_id: userId, name, week_start: weekStart, is_checked: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleManualShoppingItem(id, is_checked) {
  const { error } = await supabase
    .from("shopping_list_items")
    .update({ is_checked })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteManualShoppingItem(id) {
  const { error } = await supabase.from("shopping_list_items").delete().eq("id", id);
  if (error) throw error;
}
