import { supabase } from "./supabase";

// Shape transforms

function normalizeIngredient(i) {
  if (typeof i === "string") return { name: i, qty: null, unit: null };
  return {
    name: i.name ?? i.ingredient_name ?? "",
    qty:  i.qty  ?? i.quantity ?? null,
    unit: i.unit ?? null,
  };
}

export function mapDish(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    category: row.category,
    prepTime: Number(row.prep_time_min) || 0,
    cookTime: Number(row.cook_time_min) || 0,
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
    reqIngredients: (row.req_ingredients ?? []).map(normalizeIngredient),
    optIngredients: (row.opt_ingredients ?? []).map(normalizeIngredient),
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

// Week helpers

// Local-time yyyy-mm-dd (the app's canonical date-string format)
export function fmtDate(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

// weekStart ("yyyy-mm-dd") + N days, as a date string
function weekStartPlus(weekStart, days) {
  const [y, m, d] = weekStart.split("-").map(Number);
  return fmtDate(new Date(y, m - 1, d + days));
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return fmtDate(d);
}

export function getWeekDates(weekStart) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const result = {};
  DAYS.forEach((day, i) => { result[day] = weekStartPlus(weekStart, i); });
  return result;
}

export function todayDateStr() {
  return fmtDate(new Date());
}

// App enums

export async function fetchAppEnums() {
  const { data, error } = await supabase.rpc("get_app_enums");
  if (error) throw error;
  return data;
}

// Dishes

export const UNIVERSAL_USER_ID = "aaaaaaaa-0001-0001-0001-000000000001";

// Light column set for bulk loading: everything except recipe_text, which is
// by far the heaviest column (~1 KB/dish) and only needed on the detail view.
const DISH_LIST_COLUMNS =
  "id,user_id,name,category,prep_time_min,cook_time_min,total_time_min," +
  "servings,tags,img_emoji,youtube_url,cal,protein_g,carbs_g,fat_g,fiber_g," +
  "req_ingredients,opt_ingredients";

export async function fetchDishes(userId) {
  const PAGE = 1000;
  const pageQuery = from => supabase
    .from("v_dish_full")
    .select(DISH_LIST_COLUMNS, from === 0 ? { count: "exact" } : undefined)
    .in("user_id", [UNIVERSAL_USER_ID, userId])
    .order("id")
    .range(from, from + PAGE - 1);

  // First page also returns the total count, so the remaining pages can be
  // fetched in parallel instead of one after another.
  const { data: first, error, count } = await pageQuery(0);
  if (error) throw error;

  let all = first;
  const total = count ?? first.length;
  if (total > PAGE) {
    const rest = [];
    for (let from = PAGE; from < total; from += PAGE) rest.push(pageQuery(from));
    const results = await Promise.all(rest);
    for (const r of results) {
      if (r.error) throw r.error;
      all = all.concat(r.data);
    }
  }
  return all.map(mapDish);
}

// Server-side page for the Dish Database screen: filtering, searching and
// counting happen in Postgres, so only `pageSize` dishes travel to the client.
// `scope` selects which owners to include: "all" (universal + the user's own,
// the default) or "mine" (only dishes the user has added).
export async function fetchDishesPage(userId, {
  page = 1, pageSize = 12, search = "", category = "All", tags = [], scope = "all",
} = {}) {
  let q = supabase
    .from("v_dish_full")
    .select(DISH_LIST_COLUMNS, { count: "exact" });

  q = scope === "mine"
    ? q.eq("user_id", userId)
    : q.in("user_id", [UNIVERSAL_USER_ID, userId]);

  if (search.trim())     q = q.ilike("name", `%${search.trim()}%`);
  if (category !== "All") q = q.eq("category", category);
  if (tags.length > 0)   q = q.contains("tags", tags);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await q.order("id").range(from, from + pageSize - 1);
  if (error) throw error;
  return { dishes: data.map(mapDish), total: count ?? 0 };
}

// Typeahead over the ingredient reference table (pantry "add item" field).
export async function searchIngredientAliases(term, limit = 8) {
  const t = term.trim();
  if (t.length < 2) return [];
  const { data, error } = await supabase
    .from("ingredient_aliases")
    .select("alias,category,is_canonical")
    .ilike("alias", `%${t}%`)
    .order("is_canonical", { ascending: false })
    .order("alias")
    .limit(limit);
  if (error) throw error;
  return data;
}

// Fuzzy-match a (possibly messy) receipt item name against the ingredient
// alias dictionary. Returns up to `limit` candidates scoring >= `threshold`
// (0..1), best first. Powered by the match_ingredient_aliases RPC (pg_trgm).
export async function matchIngredientAliases(name, { threshold = 0.7, limit = 3 } = {}) {
  const t = (name ?? "").trim();
  if (!t) return [];
  const { data, error } = await supabase.rpc("match_ingredient_aliases", {
    query_text:      t,
    match_threshold: threshold,
    max_results:     limit,
  });
  if (error) throw error;
  return data ?? [];
}

// Add a brand-new ingredient to the shared catalog with manually entered
// per-100g macros, returning its ingredient_id. Idempotent server-side: an
// existing name resolves to its current id. Powered by the SECURITY DEFINER
// add_catalog_ingredient RPC.
export async function addCatalogIngredient({ name, cal, protein, carbs, fat, fiber }) {
  const { data, error } = await supabase.rpc("add_catalog_ingredient", {
    p_name:    name,
    p_cal:     cal     ?? null,
    p_protein: protein ?? null,
    p_carbs:   carbs   ?? null,
    p_fat:     fat     ?? null,
    p_fiber:   fiber   ?? null,
  });
  if (error) throw error;
  return data;
}

// Lazy-load the recipe text only when a dish detail is opened.
export async function fetchDishRecipe(dishId) {
  const { data, error } = await supabase
    .from("dishes")
    .select("recipe_text")
    .eq("id", dishId)
    .single();
  if (error) throw error;
  return data?.recipe_text ?? "";
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

  const toIngObj = (ing, i) => ({
    name:       typeof ing === "string" ? ing : ing.name,
    qty:        typeof ing === "object" && ing.qty !== "" ? Number(ing.qty) || null : null,
    unit:       typeof ing === "object" ? (ing.unit || null) : null,
    sort_order: i + 1,
  });

  const typeRows = [];
  if (dish.reqIngredients?.length)
    typeRows.push({ dish_id: dishRow.id, type: "required", ingredients: dish.reqIngredients.map(toIngObj) });
  if (dish.optIngredients?.length)
    typeRows.push({ dish_id: dishRow.id, type: "optional", ingredients: dish.optIngredients.map(toIngObj) });

  if (typeRows.length > 0) {
    const { error: ingErr } = await supabase.from("dish_ingredients").insert(typeRows);
    if (ingErr) throw ingErr;
  }

  return { ...dish, id: dishRow.id };
}

export async function deleteDish(id) {
  const { error } = await supabase.from("dishes").delete().eq("id", id);
  if (error) throw error;
}

// Pantry

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
  // Merge into an existing row with the same name (case-insensitive) AND the
  // same unit by summing quantity; otherwise insert a new row. Rows with a
  // different unit stay separate (e.g. "3 lb potatoes" vs "2 pcs potatoes").
  const { data: candidates, error: findErr } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("user_id", userId)
    .eq("unit", item.unit)
    .ilike("name", item.name);            // coarse, case-insensitive prefilter
  if (findErr) throw findErr;

  const key = String(item.name).trim().toLowerCase();
  const existing = (candidates ?? []).find(r => r.name.trim().toLowerCase() === key);

  if (existing) {
    const { data, error } = await supabase
      .from("pantry_items")
      .update({ quantity: Number(existing.quantity) + Number(item.qty) })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return mapPantryItem(data);
  }

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

// Merge freshly saved pantry rows into an existing list by id: rows that were
// updated (e.g. after a quantity merge) replace their old copy in place, new
// rows are appended. Callers use this instead of blindly appending, since
// insertPantryItem may return an updated existing row rather than a new one.
export function mergePantryRows(list, rows) {
  const byId = new Map(list.map(r => [r.id, r]));
  for (const r of rows) if (r) byId.set(r.id, r);
  return Array.from(byId.values());
}

export async function deletePantryItem(id) {
  const { error } = await supabase.from("pantry_items").delete().eq("id", id);
  if (error) throw error;
}

// Profile

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

// Nutrient targets

export async function fetchNutrientTargets(userId) {
  const { data, error } = await supabase
    .from("nutrient_targets")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

// Replaces the user's nutrient targets with a fresh set (e.g. from the DRI
// calculator). Each target: { nutrient_name, target_value, unit, display_color,
// sort_order }. Done as delete + insert so it doesn't depend on a unique
// constraint on (user_id, nutrient_name).
export async function saveNutrientTargets(userId, targets) {
  const { error: delErr } = await supabase
    .from("nutrient_targets")
    .delete()
    .eq("user_id", userId);
  if (delErr) throw delErr;

  const rows = targets.map(t => ({ user_id: userId, ...t }));
  const { data, error } = await supabase
    .from("nutrient_targets")
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}

// Activity stats

// Per-user counts for the Profile "Activity Stats" tiles. Each value is a real
// count from the user's own data (the universal/shared dishes are excluded).
export async function fetchActivityStats(userId) {
  const [dishes, meals, shopping, pantry] = await Promise.all([
    supabase.from("dishes").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("meal_plans").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("shopping_list_items").select("week_start").eq("user_id", userId),
    supabase.from("pantry_items").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  for (const r of [dishes, meals, shopping, pantry]) {
    if (r.error) throw r.error;
  }

  const shoppingLists = new Set((shopping.data ?? []).map(r => r.week_start)).size;

  return {
    dishesCreated: dishes.count ?? 0,
    mealsPlanned:  meals.count ?? 0,
    shoppingLists,
    pantryItems:   pantry.count ?? 0,
  };
}

// Meal plan

export async function fetchWeeklyPlan(userId, weekStart) {
  const weekEnd = weekStartPlus(weekStart, 6);

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

// Community / Social

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

// Shopping

export async function fetchShoppingNeeded(userId, weekStart) {
  const weekEnd = weekStartPlus(weekStart, 6);

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
