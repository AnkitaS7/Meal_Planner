import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { C, FONTS, alpha } from "../theme";
import { Loading, Page, PageHeader, IconX } from "../components/ui";
import { DishArt, SPICE, NUTRIENT_SPICE } from "../components/art";
import { DAYS } from "../data/mockData";
import { fetchNutrientTargets, fetchWeeklyPlan, getWeekStart } from "../lib/db";

// Which spice each nutrient is sold as at the stall.
const SPICE_NAME = {
  Calories: "saffron", Protein: "paprika", Carbs: "turmeric",
  Fat: "cardamom", Fiber: "matcha", Fibre: "matcha",
};
const WEEK_KEY = {
  Calories: "calories", Protein: "protein", Carbs: "carbs",
  Fat: "fat", Fiber: "fiber", Fibre: "fiber",
};
const DAY_FULL = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

// Seven tiny bars under a mound — the week's history, today emphasized.
function WeekSpark({ values, todayIdx, color }) {
  const max = Math.max(...values, 1);
  return (
    <div
      aria-hidden="true"
      style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 54, marginTop: 16 }}
    >
      {values.map((v, i) => (
        <span
          key={i}
          style={{
            flex: 1, borderRadius: 6,
            height: Math.max(5, Math.round((v / max) * 54)),
            background: i === todayIdx ? color : alpha(color, 26),
            transformOrigin: "bottom",
            animation: `pour 0.8s var(--ease-out) ${0.2 + i * 0.05}s both`,
          }}
        />
      ))}
    </div>
  );
}

export default function Nutrients({ dishes, userId }) {
  const [nutrientData, setNutrientData] = useState([]);
  const [weekData, setWeekData]         = useState([]);
  const [loading, setLoading]           = useState(true);

  const [compDishes, setCompDishes]     = useState([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [compSearch, setCompSearch]     = useState("");

  const addDish = dish => {
    if (compDishes.length >= 3) return;
    setCompDishes(prev => [...prev, dish]);
    setIsSearching(false);
    setCompSearch("");
  };
  const removeDish = id => setCompDishes(prev => prev.filter(d => d.id !== id));

  // Stop scanning the catalog as soon as 8 matches are found (and skip the
  // whole walk when the search card isn't open).
  const searchResults = [];
  if (isSearching) {
    const q = compSearch.toLowerCase();
    for (const d of dishes) {
      if (searchResults.length >= 8) break;
      if (!compDishes.some(s => s.id === d.id) && d.name.toLowerCase().includes(q)) {
        searchResults.push(d);
      }
    }
  }

  const maxVals = compDishes.length > 0 ? {
    calories: Math.max(...compDishes.map(d => d.nutrients.calories), 1),
    protein:  Math.max(...compDishes.map(d => d.nutrients.protein),  1),
    carbs:    Math.max(...compDishes.map(d => d.nutrients.carbs),    1),
    fat:      Math.max(...compDishes.map(d => d.nutrients.fat),      1),
    fiber:    Math.max(...compDishes.map(d => d.nutrients.fiber),    1),
  } : { calories: 1, protein: 1, carbs: 1, fat: 1, fiber: 1 };

  useEffect(() => {
    const weekStart = getWeekStart();
    Promise.all([
      fetchNutrientTargets(userId),
      fetchWeeklyPlan(userId, weekStart),
    ])
      .then(([targets, planRows]) => {
        // Aggregate per day
        const byDay = {};
        DAYS.forEach(d => {
          byDay[d] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        });
        planRows.forEach(row => {
          const d = byDay[row.day_label];
          if (!d) return;
          d.calories += Number(row.cal)       || 0;
          d.protein  += Number(row.protein_g) || 0;
          d.carbs    += Number(row.carbs_g)   || 0;
          d.fat      += Number(row.fat_g)     || 0;
          d.fiber    += Number(row.fiber_g)   || 0;
        });
        setWeekData(DAYS.map(day => ({
          day,
          calories: Math.round(byDay[day].calories * 10) / 10,
          protein:  Math.round(byDay[day].protein),
          carbs:    Math.round(byDay[day].carbs),
          fat:      Math.round(byDay[day].fat),
          fiber:    Math.round(byDay[day].fiber),
        })));

        // Today's totals
        const todayLabel = new Date().toLocaleString("en-US", { weekday: "short" }).slice(0, 3);
        const todayTotals = byDay[todayLabel] ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

        const nutrientKey = { Calories: "calories", Protein: "protein", Carbs: "carbs", Fat: "fat", Fiber: "fiber" };
        setNutrientData(targets.map(t => ({
          name:    t.nutrient_name,
          current: t.nutrient_name === "Calories"
            ? Math.round((todayTotals[nutrientKey[t.nutrient_name]] ?? 0) * 10) / 10
            : Math.round(todayTotals[nutrientKey[t.nutrient_name]] ?? 0),
          target:  Number(t.target_value),
          unit:    t.unit,
          color:   NUTRIENT_SPICE[t.nutrient_name] ?? t.display_color,
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const macroData = nutrientData
    .filter(n => ["Carbs", "Protein", "Fat"].includes(n.name))
    .map(n => ({ name: n.name, value: n.current, color: n.color }));

  const chartTooltipStyle = {
    contentStyle: {
      borderRadius: 10,
      border: `1px solid ${C.border}`,
      background: C.card,
      fontFamily: FONTS.body,
      fontSize: 13,
    },
  };

  // ---- The read of the day (written from real numbers, not a stat wall) ----
  const todayIdx = DAYS.indexOf(new Date().toLocaleString("en-US", { weekday: "short" }).slice(0, 3));
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const calRow = nutrientData.find(n => n.name === "Calories");
  const calPct = calRow && calRow.target > 0 ? Math.round((calRow.current / calRow.target) * 100) : null;
  const weekPlanned = weekData.some(d => d.calories > 0);
  const bestProtein = weekPlanned
    ? weekData.reduce((a, b) => (b.protein > a.protein ? b : a))
    : null;
  const behind = nutrientData
    .filter(n => n.target > 0)
    .map(n => ({ ...n, pct: Math.round((n.current / n.target) * 100) }))
    .sort((a, b) => a.pct - b.pct)[0];

  const cal = nutrientData.find(n => n.name === "Calories");
  const sentence = { fontFamily: FONTS.display, fontWeight: 400, fontSize: "clamp(21px, 2vw, 27px)", lineHeight: 1.25, letterSpacing: "-0.015em", margin: 0 };

  return (
    <Page>
      <PageHeader
        title={["Your", { em: true, text: "macros." }]}
        subtitle={`${dateStr}${calPct != null ? ` · ${calPct}% of today's calories` : ""}`}
        eyebrow="Nutrition tracking"
        stats={cal ? [
          { v: Math.round(cal.current).toLocaleString(), l: "kcal today" },
          { v: calPct != null ? `${calPct}%` : "—", l: "of your target" },
        ] : undefined}
      />

      <div className="sr-grid">
        {/* ---- TODAY: one tile per nutrient, the week underneath ---- */}
        {loading ? (
          <div className="sp-12"><Loading label="Adding it up…" size={56} style={{ padding: "70px 0", color: "var(--ink)" }} /></div>
        ) : nutrientData.length === 0 ? (
          <section className="sr-panel sp-12">
            <p style={{ ...sentence, maxWidth: "26ch" }}>
              Set nutrition targets in your profile to start tracking.
            </p>
          </section>
        ) : (
          <div className="sp-12" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {nutrientData.map((n, i) => {
              const pct = n.target > 0 ? Math.round((n.current / n.target) * 100) : 0;
              return (
                <section key={n.name} className="sr-panel rise" style={{ "--i": i }} aria-label={`${n.name}: ${n.current} of ${n.target} ${n.unit}`}>
                  <div className="kicker" style={{ display: "flex", justifyContent: "space-between", color: C.textMuted }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: n.color }} />
                      {n.name}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="bignum" style={{ fontSize: 42, color: C.head, marginTop: 18 }}>
                    {Number.isInteger(n.current) ? n.current.toLocaleString() : Number(n.current).toFixed(1)}
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>
                    of {Number(n.target).toLocaleString()} {n.unit}
                  </div>
                  <div className="meter-track" style={{ marginTop: 14 }}>
                    <div className="meter-fill" style={{ width: `${Math.max(Math.min(pct, 100), 1.5)}%`, "--mc": n.color, "--d": `${0.3 + i * 0.1}s` }} />
                  </div>
                  <WeekSpark
                    values={weekData.map(d => d[WEEK_KEY[n.name]] ?? 0)}
                    todayIdx={todayIdx}
                    color={n.color}
                  />
                  <div className="kicker" style={{ color: C.textMuted, marginTop: 8, fontSize: 9.5, display: "flex", justifyContent: "space-between" }}>
                    <span>Mon</span><span>this week</span><span>Sun</span>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ---- The read of the day ---- */}
        {!loading && nutrientData.length > 0 && (
          <section className="sr-panel pop sp-5 rise" style={{ "--i": 2, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
            <div className="kicker">Read of the day</div>
            <p style={sentence}>
              {!weekPlanned ? (
                <>Nothing planned this week yet — fill the planner and the numbers rise with it.</>
              ) : (
                <>
                  {bestProtein && bestProtein.protein > 0 && (
                    <>
                      Protein peaks at{" "}
                      <span className="accent">
                        {bestProtein.protein} g on {DAY_FULL[bestProtein.day] ?? bestProtein.day}
                      </span>
                      {" "}— the week's strongest plate.{" "}
                    </>
                  )}
                  {behind && (behind.pct < 100 ? (
                    <>{behind.name} sits furthest from today's target, at {behind.pct}%.</>
                  ) : (
                    <>Every target is met today.</>
                  ))}
                </>
              )}
            </p>
          </section>
        )}

        {/* ---- Weekly calories ---- */}
        <section className={`sr-panel rise ${!loading && nutrientData.length > 0 ? "sp-7" : "sp-12"}`} style={{ "--i": 3 }}>
          <h3 className="sr-panel-h"><span>The week in calories</span><span>kcal per day</span></h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={weekData} barCategoryGap="18%">
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--faint)", fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--faint)", fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip {...chartTooltipStyle} cursor={{ fill: "var(--bg)" }} />
              <Bar dataKey="calories" fill="var(--c1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ---- Macro split ---- */}
        <section className="sr-panel sp-12 rise" style={{ "--i": 4, display: "flex", gap: "clamp(20px, 4vw, 60px)", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <h3 className="sr-panel-h" style={{ marginBottom: 8 }}><span>Macro split</span></h3>
            <p style={{ color: C.textSub, fontSize: 16, maxWidth: "32ch" }}>How today's protein, carbs and fat divide the plate.</p>
          </div>
          {macroData.every(m => !m.value) ? (
            <p style={{ ...sentence, flex: "2 1 300px" }}>No macros on the plate yet today.</p>
          ) : (
            <>
              <PieChart width={210} height={210}>
                <Pie
                  data={macroData}
                  cx={105} cy={105}
                  innerRadius={58} outerRadius={100}
                  dataKey="value"
                  paddingAngle={3}
                  stroke="none"
                >
                  {macroData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
              <div style={{ display: "flex", gap: "clamp(18px, 3vw, 44px)", flexWrap: "wrap", flex: "1 1 300px" }}>
                {macroData.map(m => (
                  <div key={m.name}>
                    <div className="bignum" style={{ fontSize: 38, color: C.head }}>
                      {m.value}<span className="mono" style={{ fontSize: 14, fontWeight: 400, letterSpacing: 0, marginLeft: 4, color: C.textMuted }}>g</span>
                    </div>
                    <div className="kicker" style={{ color: C.textMuted, marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: m.color }} />
                      {m.name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ---- Per-dish comparison ---- */}
        <section className="sp-12 rise" style={{ "--i": 5, marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginBottom: 18, color: "var(--ink)" }}>
            <h3 style={{
              fontFamily: FONTS.display, fontWeight: 400, fontSize: "clamp(26px, 2.6vw, 34px)", letterSpacing: "-0.015em", lineHeight: 1.1,
            }}>
              Compare <span className="accent">dishes</span>
            </h3>
            <span className="kicker">{compDishes.length}/3</span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            alignItems: "start",
          }}>
            {/* Filled dish cards */}
            {compDishes.map(d => {
              const NUTRIENTS = [
                { key: "protein", label: "Protein", unit: "g", color: SPICE.paprika  },
                { key: "carbs",   label: "Carbs",   unit: "g", color: SPICE.turmeric },
                { key: "fat",     label: "Fat",     unit: "g", color: SPICE.cardamom },
                { key: "fiber",   label: "Fiber",   unit: "g", color: SPICE.matcha   },
              ];
              return (
                <div key={d.id} className="sr-panel" style={{
                  display: "flex", flexDirection: "column", gap: 14,
                  animation: "pop-in 0.5s var(--ease-spring) both",
                }}>
                  <button
                    onClick={() => removeDish(d.id)}
                    aria-label={`Remove ${d.name} from comparison`}
                    className="slot-x"
                    style={{ top: 12, right: 12 }}
                  ><IconX /></button>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, paddingRight: 30 }}>
                    <DishArt dish={d} size={64} />
                    <div style={{ minWidth: 0 }}>
                      <div className="kicker" style={{ color: C.textMuted }}>{d.category}</div>
                      <div style={{
                        fontFamily: FONTS.display, fontWeight: 400, fontSize: 20, color: C.head,
                        lineHeight: 1.05, letterSpacing: "-0.015em",
                      }}>{d.name}</div>
                    </div>
                  </div>

                  <div>
                    <div className="bignum" style={{ fontSize: 40, color: C.head }}>
                      {d.nutrients.calories}
                    </div>
                    <div className="kicker" style={{ color: C.textMuted, marginTop: 6 }}>kcal</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {NUTRIENTS.map(({ key, label, unit, color }) => {
                      const val = d.nutrients[key];
                      const pct = Math.round((val / maxVals[key]) * 100);
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span className="kicker" style={{ color: C.textMuted }}>{label}</span>
                            <span className="mono" style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{val}{unit}</span>
                          </div>
                          <div style={{ height: 10, background: "var(--bg)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", width: `${pct}%`,
                              background: color, borderRadius: 4,
                              transition: "width 0.4s ease",
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Add / search card */}
            {compDishes.length < 3 && (
              <div>
                {isSearching ? (
                  <div className="sr-panel" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
                      <input
                        autoFocus
                        value={compSearch}
                        onChange={e => setCompSearch(e.target.value)}
                        placeholder="Search dishes…"
                        style={{
                          width: "100%", border: "none", outline: "none",
                          fontSize: 16, color: C.text, background: "transparent",
                          fontFamily: FONTS.body,
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                      {searchResults.length === 0 ? (
                        <div style={{ padding: "14px", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
                          No matches
                        </div>
                      ) : searchResults.map(d => (
                        <button
                          key={d.id}
                          onClick={() => addDish(d)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", border: "none", background: "none",
                            cursor: "pointer", textAlign: "left", fontFamily: FONTS.body,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                        >
                          <DishArt dish={d} size={28} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{d.name}</div>
                            <div style={{ fontSize: 11, color: C.textMuted }}>{d.nutrients.calories} kcal</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => { setIsSearching(false); setCompSearch(""); }}
                      style={{
                        width: "100%", padding: "10px", border: "none",
                        background: C.bg, color: C.textMuted, fontSize: 12,
                        cursor: "pointer", fontFamily: FONTS.body,
                      }}
                    >Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSearching(true)}
                    className="on-world"
                    style={{
                      width: "100%", minHeight: 220,
                      border: "1px dashed var(--line-strong)", borderRadius: 20,
                      background: "none", cursor: "pointer",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 10,
                      color: "var(--ink)", fontFamily: FONTS.body,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--panel)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                  >
                    <span style={{ fontSize: 34, lineHeight: 1, fontWeight: 300 }}>+</span>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>
                      {compDishes.length === 0 ? "Add a dish" : "Compare another"}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </Page>
  );
}