import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { C, FONTS, RADIUS } from "../theme";
import { Card, Tag, Page, PageHeader } from "../components/ui";
import { DAYS } from "../data/mockData";
import { fetchNutrientTargets, fetchWeeklyPlan, getWeekStart } from "../lib/db";

const MACRO_COLORS = [C.gold, C.sage, C.accent, C.purple, C.teal];

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

  const searchResults = dishes
    .filter(d => !compDishes.some(s => s.id === d.id))
    .filter(d => d.name.toLowerCase().includes(compSearch.toLowerCase()))
    .slice(0, 8);

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
          color:   t.display_color,
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const macroData = nutrientData
    .filter(n => ["Carbs", "Protein", "Fat"].includes(n.name))
    .map((n, i) => ({ name: n.name, value: n.current, color: MACRO_COLORS[i] }));

  const chartTooltipStyle = {
    contentStyle: {
      borderRadius: 10,
      border: `1px solid ${C.border}`,
      background: "#fff",
      fontFamily: FONTS.body,
      fontSize: 13,
    },
  };

  return (
    <Page>
      <PageHeader
        title="Nutrition Dashboard"
        subtitle="Your daily and weekly nutritional tracking"
      />

      {/* Daily target rings */}
      <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 16, color: C.text, textAlign: "center" }}>
        Today's Progress
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 14,
        marginBottom: 28,
      }}>
        {loading ? (
          <div style={{ gridColumn: "1/-1", color: C.textMuted, fontSize: 13 }}>Loading targets…</div>
        ) : nutrientData.map(n => {
          const pct = n.target > 0 ? Math.min(100, Math.round((n.current / n.target) * 100)) : 0;
          const circumference = 2 * Math.PI * 26;
          const dashOffset = circumference * (1 - pct / 100);
          return (
            <Card key={n.name} style={{ textAlign: "center", padding: 20 }}>
              <div style={{ position: "relative", width: 68, height: 68, margin: "0 auto 12px" }}>
                <svg width={68} height={68} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={34} cy={34} r={26} fill="none" stroke={C.border} strokeWidth={6} />
                  <circle cx={34} cy={34} r={26}
                    fill="none" stroke={n.color} strokeWidth={6}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: n.color,
                }}>
                  {pct}%
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: FONTS.display }}>
                {n.name === "Calories" ? n.current.toFixed(1) : n.current}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 1.5 }}>
                {n.unit} {n.name}<br />
                <span style={{ color: C.border }}>of {n.target}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Weekly calories bar */}
        <Card>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 20, color: C.text }}>
            Weekly Calorie Intake
          </h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={weekData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: C.textMuted, fontFamily: FONTS.body }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted, fontFamily: FONTS.body }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="calories" fill={C.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Macro pie */}
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 8, alignSelf: "flex-start", color: C.text }}>
            Macro Split
          </h3>
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
        </Card>
      </div>

      {/* Per-dish comparison */}
      <Card>
        <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 6, color: C.text }}>
          Per-Dish Breakdown
        </h3>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
          Search and compare up to 3 dishes side by side.
        </p>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Filled dish cards */}
          {compDishes.map(d => {
            const NUTRIENTS = [
              { key: "protein", label: "Protein", unit: "g", color: C.sage   },
              { key: "carbs",   label: "Carbs",   unit: "g", color: C.gold   },
              { key: "fat",     label: "Fat",     unit: "g", color: C.accent  },
              { key: "fiber",   label: "Fiber",   unit: "g", color: C.purple  },
            ];
            return (
              <div key={d.id} style={{
                width: 200, flexShrink: 0,
                border: `1.5px solid ${C.border}`, borderRadius: 14,
                padding: 20, background: "#fff",
                display: "flex", flexDirection: "column", gap: 12,
                position: "relative",
              }}>
                <button
                  onClick={() => removeDish(d.id)}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    background: "none", border: "none",
                    color: C.textMuted, fontSize: 14, cursor: "pointer",
                    lineHeight: 1, padding: 2,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.error; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; }}
                >✕</button>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 44, marginBottom: 8 }}>{d.img}</div>
                  <div style={{
                    fontWeight: 700, fontSize: 14, color: C.text,
                    lineHeight: 1.3, marginBottom: 4,
                  }}>{d.name}</div>
                  <Tag color={C.accent}>{d.category}</Tag>
                </div>

                <div style={{
                  textAlign: "center", padding: "12px 0",
                  borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: C.accent, fontFamily: FONTS.display }}>
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
                        <div style={{ height: 6, background: C.border, borderRadius: 4, overflow: "hidden" }}>
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
            <div style={{ width: 200, flexShrink: 0 }}>
              {isSearching ? (
                <div style={{
                  border: `1.5px solid ${C.accent}`, borderRadius: 14,
                  background: "#fff", overflow: "hidden",
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
                        <span style={{ fontSize: 20 }}>{d.img}</span>
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
      </Card>
    </Page>
  );
}
