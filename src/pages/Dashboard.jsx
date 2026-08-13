import { useState, useEffect } from "react";
import { C, FONTS, alpha } from "../theme";
import { Btn, Loading, Page } from "../components/ui";
import { DishArt, SpiceMound, Watermark, NUTRIENT_SPICE } from "../components/art";
import {
  fetchTodayPlan, fetchNutrientTargets, fetchShoppingNeeded, getWeekStart,
} from "../lib/db";

// Color follows the clock: sunrise, noon, snack gold, evening.
const SLOT_COLOR = {
  Breakfast: "var(--c2)",
  Lunch:     "var(--c4)",
  Snack:     "var(--c3)",
  Dinner:    "var(--c1)",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// The meal the clock points at: the first unfinished slot of the day.
function nextMeal(rows) {
  if (!rows.length) return null;
  const h = new Date().getHours();
  const order = ["Breakfast", "Lunch", "Snack", "Dinner"];
  const cutoff = h < 10 ? 0 : h < 15 ? 1 : h < 18 ? 2 : 3;
  for (let i = cutoff; i < order.length; i++) {
    const row = rows.find(r => r.meal_slot === order[i]);
    if (row) return row;
  }
  return rows[rows.length - 1];
}

export default function Dashboard({ setPage, onOpenSuggestions, dishes, pantry, userId }) {
  const [todayMeals, setTodayMeals]         = useState([]);
  const [nutrientData, setNutrientData]     = useState([]);
  const [shoppingNeeded, setShoppingNeeded] = useState([]);
  const [loading, setLoading]               = useState(true);

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
          color:   NUTRIENT_SPICE[t.nutrient_name] ?? t.display_color,
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
  const upNext = nextMeal(todayMeals);

  const stats = [
    { value: dishes.filter(d => d.user_id === userId).length, label: "Dishes saved",  page: "dishes"    },
    { value: pantry.length,                                   label: "Pantry items",  page: "pantry"    },
    { value: totalCaloriesToday ? totalCaloriesToday.toFixed(1) : "—", label: "Cal planned", page: "nutrients" },
    { value: todayMeals.length,                               label: "Meals today",   page: "planner"   },
  ];

  return (
    <Page>
      <div className="sr-grid">
        {/* ---- HERO: the cover — what the clock points at ---- */}
        <section className="sr-panel sr-tint-1 clip sp-8" style={{ minHeight: 210 }}>
          <Watermark symbol="i-scallion" size={170} style={{ right: -20, top: -34, transform: "rotate(18deg)" }} />
          <Watermark symbol="i-ginger" size={130} style={{ right: 96, bottom: -44, transform: "rotate(-12deg)" }} />
          <p style={{
            fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase",
            color: C.textMuted, marginBottom: 10,
          }}>
            {today}
          </p>
          <h1 style={{
            fontFamily: FONTS.display, fontWeight: 700,
            fontSize: "clamp(22px, 2.6vw, 30px)", lineHeight: 1.12,
            color: C.head, marginBottom: 6, maxWidth: "18ch",
          }}>
            {greeting()} — here's today's kitchen.
          </h1>

          {loading ? (
            <p style={{ fontSize: 13, color: C.textMuted }}>Warming up…</p>
          ) : upNext ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18, flexWrap: "wrap" }}>
              <DishArt dish={{ name: upNext.dish_name }} size={72} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
                  color: SLOT_COLOR[upNext.meal_slot] ?? C.accent, fontWeight: 700,
                }}>
                  Up next · {upNext.meal_slot}
                </div>
                <div style={{
                  fontFamily: FONTS.serif, fontSize: 20, color: C.head,
                  margin: "3px 0 2px", lineHeight: 1.25,
                }}>
                  {upNext.dish_name ?? "—"}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>
                  {(Number(upNext.cal) || 0).toFixed(1)} kcal · {totalCaloriesToday.toFixed(1)} planned today
                </div>
              </div>
              <Btn onClick={() => setPage("planner")} style={{ borderRadius: 999, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Open planner →
              </Btn>
            </div>
          ) : (
            <div style={{ marginTop: 18 }}>
              <p style={{ fontFamily: FONTS.serif, fontSize: 15, color: C.textSub, marginBottom: 12 }}>
                Nothing on the stove yet — today's menu is unwritten.
              </p>
              <Btn onClick={() => setPage("planner")} style={{ borderRadius: 999, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Plan today →
              </Btn>
            </div>
          )}
        </section>

        {/* ---- SHOPPING: on the way home ---- */}
        <section className="sr-panel sr-tint-3 sp-4">
          <h3 className="sr-panel-h">
            <span>On the way home</span>
            <span style={{ letterSpacing: "0.06em" }}>{shoppingNeeded.length || ""}</span>
          </h3>
          {loading ? (
            <Loading size={26} style={{ padding: "10px 0" }} label="On the stove…" />
          ) : shoppingNeeded.length === 0 ? (
            <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", fontSize: 14, color: C.textSub }}>
              Everything for this week is already on your shelves.
            </p>
          ) : (
            shoppingNeeded.map(item => (
              <div key={item} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 0", borderBottom: `1px solid ${alpha(C.gold, 20)}`,
              }}>
                <span aria-hidden="true" style={{
                  width: 12, height: 12, borderRadius: "50%",
                  border: `2px solid ${C.gold}`, flexShrink: 0,
                }} />
                <span style={{ fontSize: 14, color: C.text }}>{item}</span>
              </div>
            ))
          )}
          <button
            onClick={() => setPage("shopping")}
            style={{
              marginTop: 14, background: "none", border: "none", cursor: "pointer",
              color: C.gold, fontSize: 11, letterSpacing: "0.18em",
              textTransform: "uppercase", fontWeight: 700, padding: 0,
              fontFamily: FONTS.body,
            }}
          >
            Full list →
          </button>
        </section>

        {/* ---- SPICE STALL: today's intake as spice mounds ---- */}
        <section className="sr-panel sp-8">
          <h3 className="sr-panel-h">
            <span>The spice stall — today's intake</span>
            <button
              onClick={() => setPage("nutrients")}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
                color: C.accent, fontSize: 11, letterSpacing: "0.14em",
                textTransform: "uppercase", fontWeight: 700, fontFamily: FONTS.body,
              }}
            >
              Full report →
            </button>
          </h3>
          {loading ? (
            <Loading size={26} style={{ padding: "10px 0" }} label="On the stove…" />
          ) : nutrientData.length === 0 ? (
            <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", fontSize: 14, color: C.textSub }}>
              Set nutrition targets in your profile to fill the stall.
            </p>
          ) : (
            <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
              {nutrientData.slice(0, 5).map((n, i) => (
                <SpiceMound key={n.name} {...n} pourDelay={0.15 + i * 0.1} />
              ))}
            </div>
          )}
        </section>

        {/* ---- STATS: the kitchen count ---- */}
        <section className="sr-panel sp-4" style={{ display: "flex", alignItems: "stretch", padding: "12px 6px" }}>
          {stats.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setPage(s.page)}
              style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                borderLeft: i > 0 ? `1px solid ${C.border}` : "none",
                padding: "10px 4px", textAlign: "center", fontFamily: FONTS.body,
              }}
            >
              <div style={{
                fontFamily: FONTS.serif, fontSize: 22, color: C.head,
                fontVariantNumeric: "tabular-nums", lineHeight: 1.2,
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase",
                color: C.textMuted, marginTop: 4,
              }}>
                {s.label}
              </div>
            </button>
          ))}
        </section>

        {/* ---- TODAY'S DECK: each meal as a small cover card ---- */}
        <section className="sr-panel sp-7">
          <h3 className="sr-panel-h"><span>Today's table</span><span>{todayMeals.length} meals</span></h3>
          {loading ? (
            <Loading size={26} style={{ padding: "10px 0" }} label="On the stove…" />
          ) : todayMeals.length === 0 ? (
            <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", fontSize: 14, color: C.textSub }}>
              No meals planned for today — the planner is waiting.
            </p>
          ) : (
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {todayMeals.map(row => (
                <button
                  key={row.meal_slot}
                  className="sr-card"
                  onClick={() => setPage("planner")}
                  style={{ flex: "1 0 130px", maxWidth: 180 }}
                >
                  <div style={{
                    height: 64, display: "grid", placeItems: "center",
                    background: alpha(SLOT_COLOR[row.meal_slot] ?? C.accent, 10),
                  }}>
                    <DishArt dish={{ name: row.dish_name }} size={56} style={{ transform: "translateY(10px)" }} />
                  </div>
                  <div style={{ padding: "16px 12px 10px" }}>
                    <div style={{
                      fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
                      color: SLOT_COLOR[row.meal_slot] ?? C.accent, fontWeight: 700,
                    }}>
                      {row.meal_slot}
                    </div>
                    <div className="truncate" style={{
                      fontFamily: FONTS.serif, fontSize: 14, color: C.head, margin: "3px 0 1px",
                    }}>
                      {row.dish_name ?? "—"}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>
                      {(Number(row.cal) || 0).toFixed(1)} kcal
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ---- SUGGESTIONS: from your shelf ---- */}
        <section className="sr-panel sr-tint-4 sp-5">
          <h3 className="sr-panel-h"><span>From your shelf</span></h3>
          {dishes.slice(0, 2).map(d => (
            <div
              key={d.id}
              style={{
                display: "flex", gap: 12, padding: "9px 0", alignItems: "center",
                borderBottom: `1px solid ${alpha(C.sage, 20)}`,
              }}
            >
              <DishArt dish={d} size={38} />
              <div style={{ minWidth: 0 }}>
                <div className="truncate" style={{ fontFamily: FONTS.serif, fontSize: 14, color: C.head }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {d.time} min · {(Number(d.nutrients.calories) || 0).toFixed(1)} kcal
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={onOpenSuggestions}
            style={{
              marginTop: 12, background: "none", border: "none", cursor: "pointer",
              color: C.sage, fontSize: 11, letterSpacing: "0.18em",
              textTransform: "uppercase", fontWeight: 700, padding: 0,
              fontFamily: FONTS.body,
            }}
          >
            See all →
          </button>
        </section>
      </div>
    </Page>
  );
}