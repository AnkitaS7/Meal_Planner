import { useState, useEffect } from "react";
import { C, FONTS } from "../theme";
import {
  Card, Btn, NutrientBar, Tag, Page, PageHeader, StatTile,
} from "../components/ui";
import {
  fetchTodayPlan, fetchNutrientTargets, fetchShoppingNeeded, getWeekStart, todayDateStr,
} from "../lib/db";

const MEAL_ICONS = { Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙", Snack: "🍎" };

export default function Dashboard({ setPage, dishes, pantry, userId }) {
  const [todayMeals, setTodayMeals]     = useState([]);
  const [nutrientData, setNutrientData] = useState([]);
  const [shoppingNeeded, setShoppingNeeded] = useState([]);
  const [loading, setLoading]           = useState(true);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    const weekStart = getWeekStart();
    // Each section is fetched independently so one failing query (e.g. the
    // shopping view) can't blank out the rest of the dashboard.
    Promise.allSettled([
      fetchTodayPlan(userId),
      fetchNutrientTargets(userId),
      fetchShoppingNeeded(userId, weekStart),
    ])
      .then(([planRes, targetsRes, shoppingRes]) => {
        const planRows = planRes.status === "fulfilled" ? planRes.value : [];
        const targets  = targetsRes.status === "fulfilled" ? targetsRes.value : [];

        if (planRes.status === "rejected")     console.error(planRes.reason);
        if (targetsRes.status === "rejected")  console.error(targetsRes.reason);
        if (shoppingRes.status === "rejected") console.error(shoppingRes.reason);

        setTodayMeals(planRows);

        // Compute today's intake from plan rows
        const totals = { Calories: 0, Protein: 0, Carbs: 0, Fat: 0, Fiber: 0 };
        planRows.forEach(row => {
          totals.Calories += Number(row.cal)       || 0;
          totals.Protein  += Number(row.protein_g) || 0;
          totals.Carbs    += Number(row.carbs_g)   || 0;
          totals.Fat      += Number(row.fat_g)     || 0;
          totals.Fiber    += Number(row.fiber_g)   || 0;
        });

        setNutrientData(targets.map(t => ({
          name:    t.nutrient_name,
          current: Math.round(totals[t.nutrient_name] ?? 0),
          target:  Number(t.target_value),
          unit:    t.unit,
          color:   t.display_color,
        })));

        // Unique missing ingredients for the current week
        if (shoppingRes.status === "fulfilled") {
          const missing = [...new Set(
            shoppingRes.value
              .filter(r => !r.in_pantry && r.type === "required")
              .map(r => r.ingredient_name)
          )];
          setShoppingNeeded(missing.slice(0, 5));
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const totalCaloriesToday = todayMeals.reduce((s, r) => s + (Number(r.cal) || 0), 0);

  const stats = [
    { icon: "🍽", value: dishes.filter(d => d.user_id === userId).length, label: "Dishes Saved", color: C.accent, page: "dishes" },
    { icon: "🏺", value: pantry.length,  label: "Pantry Items",   color: C.sage,   page: "pantry"    },
    { icon: "🔥", value: totalCaloriesToday ? totalCaloriesToday.toFixed(1) : "-", label: "Calories Today", color: C.gold, page: "nutrients" },
    { icon: "📅", value: todayMeals.length, label: "Meals Today",  color: C.purple, page: "planner"   },
  ];

  return (
    <Page>
      <PageHeader
        title={`Good morning, welcome back 👋`}
        subtitle={`Here's what's on the menu for today - ${today}`}
      />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <StatTile key={s.label} {...s} onClick={() => setPage(s.page)} />
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Today's meals */}
        <Card>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 16, color: C.text }}>
            Today's Meals
          </h3>
          {loading ? (
            <div style={{ color: C.textMuted, fontSize: 13 }}>Loading…</div>
          ) : todayMeals.length === 0 ? (
            <div style={{ color: C.textMuted, fontSize: 13 }}>No meals planned for today.</div>
          ) : (
            todayMeals.map(row => (
              <div key={row.meal_slot} style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 0",
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>
                    {MEAL_ICONS[row.meal_slot] ?? "🍽"} {row.meal_slot.toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 500, color: C.text, marginTop: 2 }}>
                    {row.dish_name ?? "-"}
                  </div>
                </div>
                <Tag color={C.accent}>{(Number(row.cal) || 0).toFixed(1)} kcal</Tag>
              </div>
            ))
          )}
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.textSub }}>
              Total: <strong style={{ color: C.accent }}>{totalCaloriesToday.toFixed(1)} kcal</strong>
            </span>
            <Btn variant="ghost" onClick={() => setPage("planner")}
              style={{ padding: "6px 14px", fontSize: 13 }}>
              View Planner →
            </Btn>
          </div>
        </Card>

        {/* Nutrient summary */}
        <Card>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 16, color: C.text }}>
            Nutrient Summary
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {loading ? (
              <div style={{ color: C.textMuted, fontSize: 13 }}>Loading…</div>
            ) : (
              nutrientData.slice(0, 4).map(n => <NutrientBar key={n.name} {...n} />)
            )}
          </div>
          <Btn variant="ghost" onClick={() => setPage("nutrients")}
            style={{ marginTop: 16, padding: "6px 14px", fontSize: 13 }}>
            Full Report →
          </Btn>
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Suggestions */}
        <Card>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 12, color: C.text }}>
            ✨ Suggested Recipes
          </h3>
          <p style={{ fontSize: 13, color: C.textSub, marginBottom: 14 }}>
            Based on your pantry items you can make:
          </p>
          {dishes.slice(0, 2).map(d => (
            <div key={d.id} style={{
              display: "flex", gap: 12, padding: "11px 0",
              borderBottom: `1px solid ${C.border}`, alignItems: "center",
            }}>
              <span style={{ fontSize: 26 }}>{d.img}</span>
              <div>
                <div style={{ fontWeight: 500, color: C.text }}>{d.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {d.time} min • {(Number(d.nutrients.calories) || 0).toFixed(1)} kcal
                </div>
              </div>
            </div>
          ))}
          <Btn variant="ghost" onClick={() => setPage("suggestions")}
            style={{ marginTop: 14, padding: "6px 14px", fontSize: 13 }}>
            See All →
          </Btn>
        </Card>

        {/* Shopping */}
        <Card>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 12, color: C.text }}>
            🛒 Shopping Needed
          </h3>
          {loading ? (
            <div style={{ color: C.textMuted, fontSize: 13 }}>Loading…</div>
          ) : shoppingNeeded.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textSub }}>All ingredients are in your pantry.</p>
          ) : (
            <>
              <p style={{ fontSize: 13, color: C.textSub, marginBottom: 14 }}>
                {shoppingNeeded.length} items missing from this week's plan:
              </p>
              {shoppingNeeded.map(item => (
                <div key={item} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 0", borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: C.accent, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 14, color: C.text }}>{item}</span>
                </div>
              ))}
            </>
          )}
          <Btn variant="ghost" onClick={() => setPage("shopping")}
            style={{ marginTop: 14, padding: "6px 14px", fontSize: 13 }}>
            Full List →
          </Btn>
        </Card>
      </div>
    </Page>
  );
}
