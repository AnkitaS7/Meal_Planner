import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { C, FONTS, alpha } from "../theme";
import { Tag, Page, PageHeader, IconX } from "../components/ui";
import { DishArt, SpiceMound, SPICE, NUTRIENT_SPICE } from "../components/art";
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
      style={{
        display: "flex", gap: 3, alignItems: "flex-end",
        justifyContent: "center", height: 22, marginTop: 8,
      }}
    >
      {values.map((v, i) => (
        <span
          key={i}
          style={{
            width: 6, borderRadius: 2,
            height: Math.max(3, Math.round((v / max) * 20)),
            background: i === todayIdx ? color : alpha(color, 25),
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

  return (
    <Page>
      <PageHeader
        title="The spice stall"
        subtitle={`${dateStr}${calPct != null ? ` · ${calPct}% of today's calories` : ""}`}
      />

      <div className="sr-grid">
        {/* ---- HERO: the stall — five mounds, a week under each ---- */}
        <section className="sr-panel clip sp-12">
          <svg
            className="sr-wm" viewBox="0 0 120 70" width={360} height={210}
            style={{ left: -64, bottom: -52 }} aria-hidden="true"
          >
            <use href="#moundShape" fill="currentColor" />
          </svg>

          <h3 className="sr-panel-h">
            <span>Today's intake</span>
            <span>a week under each mound</span>
          </h3>

          {loading ? (
            <div style={{ color: C.textMuted, fontSize: 13 }}>Loading targets…</div>
          ) : nutrientData.length === 0 ? (
            <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", fontSize: 14, color: C.textSub }}>
              Set nutrition targets in your profile to raise the stall.
            </p>
          ) : (
            <div style={{
              display: "flex", gap: 18, alignItems: "flex-end",
              flexWrap: "wrap", position: "relative",
            }}>
              {nutrientData.map((n, i) => (
                <div key={n.name} style={{ flex: "1 1 128px", minWidth: 108, maxWidth: 210 }}>
                  <SpiceMound
                    name={n.name} current={n.current} target={n.target}
                    unit={n.unit} color={n.color} sub={SPICE_NAME[n.name]}
                    pourDelay={0.15 + i * 0.12}
                    style={{ flex: "none", width: "100%", minWidth: 0, maxWidth: "none" }}
                  />
                  <WeekSpark
                    values={weekData.map(d => d[WEEK_KEY[n.name]] ?? 0)}
                    todayIdx={todayIdx}
                    color={n.color}
                  />
                </div>
              ))}
            </div>
          )}

          {/* The read of the day */}
          {!loading && nutrientData.length > 0 && (
            <div style={{
              borderTop: `1px solid ${C.border}`, marginTop: 18, paddingTop: 14,
              position: "relative",
            }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
                color: C.textMuted, fontWeight: 600, marginBottom: 6,
              }}>
                Read of the day
              </div>
              <p style={{
                margin: 0, fontFamily: FONTS.serif, fontStyle: "italic",
                fontSize: 15, lineHeight: 1.55, color: C.textSub, maxWidth: "64ch",
              }}>
                {!weekPlanned ? (
                  <>Nothing planned this week yet — fill the planner and the mounds rise with it.</>
                ) : (
                  <>
                    {bestProtein && bestProtein.protein > 0 && (
                      <>
                        Protein peaks at{" "}
                        <b style={{ color: C.success, fontStyle: "normal" }}>
                          {bestProtein.protein} g on {DAY_FULL[bestProtein.day] ?? bestProtein.day}
                        </b>
                        {" "}— the week's strongest plate.{" "}
                      </>
                    )}
                    {behind && (behind.pct < 100 ? (
                      <>{behind.name} sits furthest from today's target, at {behind.pct}%.</>
                    ) : (
                      <>Every mound is full today.</>
                    ))}
                  </>
                )}
              </p>
            </div>
          )}
        </section>

        {/* ---- Weekly calories ---- */}
        <section className="sr-panel sp-7">
          <h3 className="sr-panel-h"><span>The week in calories</span></h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={weekData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: C.textMuted, fontFamily: FONTS.body }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted, fontFamily: FONTS.body }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="calories" fill={C.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ---- Macro split ---- */}
        <section className="sr-panel sp-5" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 className="sr-panel-h" style={{ alignSelf: "stretch" }}>
            <span>Macro split · today</span>
          </h3>
          {macroData.every(m => !m.value) ? (
            <p style={{
              fontFamily: FONTS.serif, fontStyle: "italic", fontSize: 14,
              color: C.textSub, margin: "auto 0", textAlign: "center",
            }}>
              No macros on the plate yet today.
            </p>
          ) : (
            <>
              <PieChart width={180} height={180}>
                <Pie
                  data={macroData}
                  cx={90} cy={90}
                  innerRadius={52} outerRadius={82}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {macroData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                {macroData.map(m => (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: m.color }} />
                    <span style={{ fontSize: 12, color: C.textSub }}>{m.name} · {m.value}g</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ---- Per-dish comparison ---- */}
        <section className="sr-panel sp-12">
          <h3 className="sr-panel-h">
            <span>Compare dishes</span>
            <span>{compDishes.length}/3</span>
          </h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
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
                <div key={d.id} style={{
                  border: `1.5px solid ${C.border}`, borderRadius: 14,
                  padding: 20, background: C.card,
                  display: "flex", flexDirection: "column", gap: 12,
                  position: "relative",
                }}>
                  <button
                    onClick={() => removeDish(d.id)}
                    aria-label={`Remove ${d.name} from comparison`}
                    style={{
                      position: "absolute", top: 8, right: 8,
                      background: "none", border: "none",
                      color: C.textMuted, cursor: "pointer",
                      lineHeight: 1, padding: 8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.error; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; }}
                  ><IconX /></button>

                  <div style={{ textAlign: "center" }}>
                    <DishArt dish={d} size={56} style={{ margin: "0 auto 8px", display: "block" }} />
                    <div style={{
                      fontFamily: FONTS.serif, fontSize: 15, color: C.head,
                      lineHeight: 1.3, marginBottom: 4,
                    }}>{d.name}</div>
                    <Tag color={C.accent}>{d.category}</Tag>
                  </div>

                  <div style={{
                    textAlign: "center", padding: "12px 0",
                    borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
                  }}>
                    <div style={{
                      fontSize: 28, fontWeight: 700, color: SPICE.saffron,
                      fontFamily: FONTS.display, fontVariantNumeric: "tabular-nums",
                    }}>
                      {d.nutrients.calories}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>kcal</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {NUTRIENTS.map(({ key, label, unit, color }) => {
                      const val = d.nutrients[key];
                      const pct = Math.round((val / maxVals[key]) * 100);
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: C.textSub, fontWeight: 600 }}>{label}</span>
                            <span style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>{val}{unit}</span>
                          </div>
                          <div style={{ height: 6, background: "var(--mound)", borderRadius: 4, overflow: "hidden" }}>
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
                  <div style={{
                    border: `1.5px solid ${C.accent}`, borderRadius: 14,
                    background: C.card, overflow: "hidden",
                  }}>
                    <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
                      <input
                        autoFocus
                        value={compSearch}
                        onChange={e => setCompSearch(e.target.value)}
                        placeholder="Search dishes…"
                        style={{
                          width: "100%", border: "none", outline: "none",
                          fontSize: 13, color: C.text, background: "transparent",
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
                    style={{
                      width: "100%", minHeight: 200,
                      border: `2px dashed ${C.border}`, borderRadius: 14,
                      background: "none", cursor: "pointer",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 8,
                      color: C.textMuted, fontFamily: FONTS.body,
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border;  e.currentTarget.style.color = C.textMuted; }}
                  >
                    <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
                    <span style={{ fontSize: 13 }}>
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