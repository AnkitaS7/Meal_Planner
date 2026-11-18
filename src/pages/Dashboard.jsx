import { useState, useEffect, useMemo } from "react";
import { Btn, Loading, Page, PageHeader, SectionHead } from "../components/ui";
import { DishArt, dishPhoto } from "../components/art";
import {
  fetchTodayPlan, fetchWeeklyPlan, fetchNutrientTargets, fetchShoppingNeeded,
  getWeekStart, getWeekDates, todayDateStr,
} from "../lib/db";

const MEAL_ORDER = ["Breakfast", "Lunch", "Snack", "Dinner"];
const MEAL_NOTE  = { Breakfast: "breakfast", Lunch: "lunch", Snack: "tea time", Dinner: "dinner" };

function partOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// The meal the clock points at: the first unfinished slot of the day.
function nextMeal(rows) {
  if (!rows.length) return null;
  const h = new Date().getHours();
  const cutoff = h < 10 ? 0 : h < 15 ? 1 : h < 18 ? 2 : 3;
  for (let i = cutoff; i < MEAL_ORDER.length; i++) {
    const row = rows.find(r => r.meal_slot === MEAL_ORDER[i]);
    if (row) return row;
  }
  return rows[rows.length - 1];
}

const kcal = v => Math.round(Number(v) || 0).toLocaleString();

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d) - t) / 86400000);
}

export default function Dashboard({ setPage, onOpenSuggestions, dishes, pantry, userId, profileName }) {
  const [todayMeals, setTodayMeals]     = useState([]);
  const [weekRows, setWeekRows]         = useState([]);
  const [targets, setTargets]           = useState([]);
  const [shopping, setShopping]         = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const weekStart = getWeekStart();
    // Each section is fetched independently so one failing query can't
    // blank out the rest of the page.
    Promise.allSettled([
      fetchTodayPlan(userId),
      fetchNutrientTargets(userId),
      fetchShoppingNeeded(userId, weekStart),
      fetchWeeklyPlan(userId, weekStart),
    ])
      .then(([planRes, targetsRes, shoppingRes, weekRes]) => {
        [planRes, targetsRes, shoppingRes, weekRes].forEach(r => r.status === "rejected" && console.error(r.reason));
        setTodayMeals(planRes.status === "fulfilled" ? planRes.value : []);
        setTargets(targetsRes.status === "fulfilled" ? targetsRes.value : []);
        setWeekRows(weekRes.status === "fulfilled" ? weekRes.value ?? [] : []);
        if (shoppingRes.status === "fulfilled") {
          // Unique missing required ingredients for this week
          const seen = new Map();
          for (const r of shoppingRes.value) {
            if (r.in_pantry || r.type !== "required" || seen.has(r.ingredient_name)) continue;
            seen.set(r.ingredient_name, { name: r.ingredient_name, qty: r.quantity, unit: r.unit, dish: r.dish_name });
          }
          setShopping([...seen.values()]);
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const upNext   = nextMeal(todayMeals);
  const nextDish = upNext ? dishes.find(d => d.id === upNext.dish_id) : null;
  const pantryNames = useMemo(() => new Set(pantry.map(p => p.name.toLowerCase())), [pantry]);

  // Today's intake against targets
  const totals = { Calories: 0, Protein: 0, Carbs: 0, Fat: 0, Fiber: 0 };
  todayMeals.forEach(r => {
    totals.Calories += Number(r.cal) || 0;
    totals.Protein  += Number(r.protein_g) || 0;
    totals.Carbs    += Number(r.carbs_g) || 0;
    totals.Fat      += Number(r.fat_g) || 0;
    totals.Fiber    += Number(r.fiber_g) || 0;
  });
  const intake = targets.map(t => ({
    name: t.nutrient_name, unit: t.unit,
    current: Math.round(totals[t.nutrient_name] ?? 0),
    target: Number(t.target_value),
  }));
  const calories = intake.find(n => n.name === "Calories");
  const macros   = intake.filter(n => n.name !== "Calories").slice(0, 4);

  // The week, one line per day
  const weekDates = getWeekDates(getWeekStart());
  const todayStr  = todayDateStr();
  const week = Object.entries(weekDates).map(([day, date]) => {
    const rows = weekRows.filter(r => r.plan_date === date)
      .sort((a, b) => MEAL_ORDER.indexOf(b.meal_slot) - MEAL_ORDER.indexOf(a.meal_slot)); // dinner first
    return { day, date, rows, cal: rows.reduce((s, r) => s + (Number(r.cal) || 0), 0) };
  });
  const plannedCount = weekRows.length;

  // Ingredients on hand for the next dish
  const req  = nextDish?.reqIngredients ?? [];
  const have = req.filter(i => pantryNames.has(i.name.toLowerCase())).length;
  const missingNext = req.filter(i => !pantryNames.has(i.name.toLowerCase())).map(i => i.name);

  // Shelves: soonest to spoil first
  const shelf = useMemo(() => [...pantry]
    .map(p => ({ ...p, days: daysUntil(p.expiry) }))
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
    .slice(0, 6), [pantry]);

  // From the cookbook: what the shelves can make (or nearly make)
  const ready = useMemo(() => {
    if (!pantry.length) return dishes.slice(0, 4).map(dish => ({ dish, missing: null }));
    const full = [], near = [];
    for (const dish of dishes) {
      const r = dish.reqIngredients;
      if (!r.length) continue;
      const missing = r.filter(i => !pantryNames.has(i.name.toLowerCase()));
      if (missing.length === 0) full.push({ dish, missing });
      else if (missing.length <= 2 && (r.length - missing.length) / r.length >= 0.6) near.push({ dish, missing });
      if (full.length >= 4) break;
    }
    near.sort((a, b) => a.missing.length - b.missing.length);
    return [...full, ...near].slice(0, 4);
  }, [dishes, pantry, pantryNames]);

  const firstName = (profileName ?? "").trim().split(/\s+/)[0];
  const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const heroPhoto = upNext ? dishPhoto({ name: upNext.dish_name, category: nextDish?.category }, 2000) : undefined;

  const eyebrow = `${weekday} ${partOfDay()}${firstName ? `, ${firstName}` : ""}. ${
    loading ? "Laying the table…" : upNext ? `${upNext.meal_slot === "Snack" ? "Tea time" : upNext.meal_slot} is…` : "Nothing's planned yet."
  }`;

  return (
    <Page>
      <PageHeader
        size="big"
        photo={heroPhoto}
        eyebrow={eyebrow}
        title={upNext ? [upNext.dish_name ?? "Something good"] : ["The table is", { em: true, text: "open." }]}
        subtitle={
          upNext
            ? (nextDish ? `${nextDish.category}${nextDish.tags?.length ? ` · ${nextDish.tags.slice(0, 2).join(" · ")}` : ""}` : null)
            : "Pick a few dishes for the week and Season will write the market list for you."
        }
        action={
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: "min(420px, 100%)" }}>
            {upNext && (
              <div className="facts">
                <div><b>{nextDish?.time || "—"}</b>minutes</div>
                <div><b>{kcal(upNext.cal)}</b>kcal</div>
                <div><b>{Math.round(Number(upNext.protein_g) || 0)}g</b>protein</div>
                <div><b>{nextDish?.servings ?? "—"}</b>servings</div>
              </div>
            )}
            {upNext && req.length > 0 && (
              <p className="have">
                <em>{have} of {req.length} ingredients on your shelves.</em>{" "}
                {missingNext.length ? `${missingNext.slice(0, 2).join(" and ")}${missingNext.length > 2 ? " and more" : ""} still to buy.` : "Everything's here."}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn onClick={() => setPage("planner")}>{upNext ? "Open the week" : "Plan the week"}</Btn>
              <Btn variant="ghost" onClick={() => setPage("shopping")}>Market list</Btn>
            </div>
          </div>
        }
      />

      {loading ? <Loading size={44} label="Laying the table…" /> : (
        <div style={{ display: "grid", gap: 40, paddingTop: 10 }}>

          {/* Row 1 — today's four meals beside the market list */}
          <div className="sr-grid">
            <section className="col sp-8">
              <SectionHead
                title="On the table today"
                note={`${todayMeals.length} of 4 meals · ${kcal(totals.Calories)} kcal`}
                action={<button className="go" onClick={() => setPage("planner")}>Plan the week</button>}
              />
              <div className="polas fill">
                {MEAL_ORDER.map((slot, i) => {
                  const row = todayMeals.find(r => r.meal_slot === slot);
                  const dish = row && dishes.find(d => d.id === row.dish_id);
                  return (
                    <button
                      key={slot} className="pola" style={{ "--i": i }} onClick={() => setPage("planner")}
                      aria-label={row ? `${slot}: ${row.dish_name}. Open the week` : `${slot}: nothing planned. Open the week`}
                    >
                      {row
                        ? <div className="ph"><DishArt dish={{ name: row.dish_name, category: dish?.category }} size={240} round={false} /></div>
                        : <div className="ph empty" aria-hidden="true">+</div>}
                      <div className="meal">{MEAL_NOTE[slot]}</div>
                      <div className="nm" style={{ opacity: row ? 1 : 0.55 }}>{row ? row.dish_name : "An open place"}</div>
                      <div className="kc">{row ? `${dish?.time ? `${dish.time} min · ` : ""}${kcal(row.cal)} kcal` : "tap to plan"}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="col sp-4">
              <SectionHead
                title="Market list"
                note={shopping.length ? `${shopping.length} to buy` : ""}
                action={<button className="go" onClick={() => setPage("shopping")}>Open</button>}
              />
              <div className="receipt fill">
                {shopping.length === 0 ? (
                  <p className="chalk-line" style={{ opacity: 0.85 }}>Nothing to buy. Everything for this week is on your shelves.</p>
                ) : (
                  shopping.slice(0, 6).map(item => (
                    <div key={item.name} className="chalk-line" style={{ display: "flex", justifyContent: "space-between", gap: 10, borderBottom: "1px dashed rgba(236,234,224,0.12)" }}>
                      <span className="truncate">{item.name.toLowerCase()}</span>
                      <span style={{ opacity: 0.65, fontSize: 19, whiteSpace: "nowrap" }}>{item.qty ? `${item.qty}${item.unit ? ` ${item.unit}` : ""}` : ""}</span>
                    </div>
                  ))
                )}
                {shopping.length > 6 && (
                  <div className="chalk-line" style={{ fontSize: 18, opacity: 0.7, marginTop: 6 }}>…and {shopping.length - 6} more</div>
                )}
              </div>
            </section>
          </div>

          {/* Row 2 — the week, today's intake, the shelves */}
          <div className="sr-grid">
            <section className="col sp-6">
              <SectionHead
                title="The week's menu"
                note={`${plannedCount} of 28 planned`}
                action={<button className="go" onClick={() => setPage("planner")}>Open the week</button>}
              />
              <ul className="week-list">
                {week.map(w => (
                  <li key={w.day} className={`${w.date === todayStr ? "today" : ""} ${w.rows.length ? "" : "open"}`}>
                    <span className="d">{w.day.toUpperCase()}{w.date === todayStr ? " ●" : ""}</span>
                    <span className="n">{w.rows.length ? w.rows.slice(0, 2).map(r => r.dish_name).join(", ") : "Nothing planned yet"}</span>
                    <span className="k">{w.rows.length ? `${kcal(w.cal)} kcal` : "—"}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="col sp-3">
              <SectionHead title="Intake" action={<button className="go" onClick={() => setPage("nutrients")}>Macros</button>} />
              {intake.length === 0 ? (
                <div className="nlabel fill">
                  <h4>Today so far</h4>
                  <p style={{ fontSize: 14, color: "var(--soft)", paddingTop: 6 }}>Set your daily targets on your profile to see how today measures up.</p>
                  <button className="go" style={{ marginTop: 10 }} onClick={() => setPage("profile")}>Set targets</button>
                </div>
              ) : (
                <div className="nlabel fill" role="img" aria-label={intake.map(n => `${n.name} ${n.current} of ${n.target} ${n.unit}`).join(", ")}>
                  <h4>Today so far</h4>
                  {calories && <div className="r big"><span>Calories</span><span>{kcal(calories.current)} / {kcal(calories.target)}</span></div>}
                  {macros.map(n => (
                    <div key={n.name}>
                      <div className="r"><span><b>{n.name === "Fiber" ? "Fibre" : n.name}</b> {n.current}{n.unit}</span><span>of {n.target}{n.unit}</span></div>
                      <div className="bar"><i style={{ width: `${Math.min(100, n.target ? (n.current / n.target) * 100 : 0)}%` }} /></div>
                    </div>
                  ))}
                  <small>Counted from today's planned meals.</small>
                </div>
              )}
            </section>

            <section className="col sp-3">
              <SectionHead title="On your shelves" action={<button className="go" onClick={() => setPage("pantry")}>Pantry</button>} />
              {shelf.length === 0 ? (
                <div className="sr-panel fill" style={{ fontSize: 14, color: "var(--soft)" }}>
                  Your pantry is empty. <button className="go" onClick={() => setPage("scanner")}>Scan a receipt</button>
                </div>
              ) : (
                <div className="tags">
                  {shelf.map(p => (
                    <button key={p.id} className={`tag${p.days != null && p.days <= 3 ? " warn" : ""}`} onClick={() => setPage("pantry")} title={p.name}>
                      <b>{p.name}</b>
                      <span>
                        {p.days != null && p.days <= 3
                          ? (p.days < 0 ? "past its date" : p.days === 0 ? "use today" : `${p.days} day${p.days === 1 ? "" : "s"} left`)
                          : `${p.qty} ${p.unit}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Row 3 — from the cookbook, ready with what's on the shelves */}
          <section>
            <SectionHead
              title="From the cookbook"
              note={pantry.length ? "ready with what's on your shelves" : "a few to start with"}
              action={<button className="go" onClick={onOpenSuggestions}>See all</button>}
            />
            {ready.length === 0 ? (
              <p style={{ color: "var(--soft)" }}>Add a few things to your pantry and Season will suggest what to cook.</p>
            ) : (
              <div className="books">
                {ready.map(({ dish, missing }) => (
                  <button key={dish.id} className="book" onClick={onOpenSuggestions}>
                    <div className="ph">
                      <DishArt dish={dish} size={420} round={false} />
                      {missing && (
                        <span className={`ready${missing.length ? " miss" : ""}`}>
                          {missing.length
                            ? `missing ${missing.length} · ${missing[0].name.toLowerCase()}`
                            : `all ${dish.reqIngredients.length} in pantry`}
                        </span>
                      )}
                    </div>
                    <div className="meta">{dish.category} · {dish.time} min · {kcal(dish.nutrients.calories)} kcal</div>
                    <div className="nm">{dish.name}</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Page>
  );
}
