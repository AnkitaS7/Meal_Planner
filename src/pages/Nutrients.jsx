import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { C, FONTS, RADIUS } from "../theme";
import { Card, NutrientBar, Tag, Page, PageHeader } from "../components/ui";
import { NUTRIENTS_DAILY, DAYS } from "../data/mockData";

const MACRO_COLORS = [C.gold, C.sage, C.accent, C.purple, C.teal];

export default function Nutrients({ dishes }) {
  // Fabricate a week of data for the chart
  const weekData = DAYS.map(day => ({
    day,
    calories: Math.round(1550 + Math.random() * 700),
    protein:  Math.round(55   + Math.random() * 40),
    carbs:    Math.round(170  + Math.random() * 100),
    fat:      Math.round(50   + Math.random() * 30),
  }));

  const macroData = [
    { name: "Carbs",   value: 210, color: C.gold   },
    { name: "Protein", value: 72,  color: C.sage   },
    { name: "Fat",     value: 64,  color: C.accent },
  ];

  // Per-dish radar (just first 5)
  const radarData = ["calories", "protein", "carbs", "fat", "fiber"].map(k => ({
    nutrient: k.charAt(0).toUpperCase() + k.slice(1),
    ...Object.fromEntries(dishes.slice(0, 3).map(d => [d.name.split(" ")[0], d.nutrients[k]])),
  }));

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
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 14,
        marginBottom: 28,
      }}>
        {NUTRIENTS_DAILY.map(n => {
          const pct = Math.round((n.current / n.target) * 100);
          const circumference = 2 * Math.PI * 26;
          const dashOffset = circumference * (1 - pct / 100);
          return (
            <Card key={n.name} style={{ textAlign: "center", padding: 20 }}>
              <div style={{ position: "relative", width: 68, height: 68, margin: "0 auto 12px" }}>
                <svg width={68} height={68} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={34} cy={34} r={26}
                    fill="none" stroke={C.border} strokeWidth={6} />
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
              <div style={{
                fontSize: 22, fontWeight: 700, color: C.text,
                fontFamily: FONTS.display,
              }}>
                {n.current}
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
                <span style={{ fontSize: 12, color: C.textSub }}>
                  {m.name} · {m.value}g
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Daily target bars */}
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 20, color: C.text }}>
          Today's Targets
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {NUTRIENTS_DAILY.map(n => <NutrientBar key={n.name} {...n} />)}
        </div>
      </Card>

      {/* Per-dish table */}
      <Card>
        <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 20, color: C.text }}>
          Per-Dish Breakdown
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Dish", "Category", "Calories", "Protein", "Carbs", "Fat", "Fiber"].map(h => (
                  <th key={h} style={{
                    padding: "10px 14px",
                    textAlign: h === "Dish" || h === "Category" ? "left" : "center",
                    fontSize: 11, fontWeight: 700, color: C.textSub,
                    letterSpacing: 0.5, textTransform: "uppercase",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dishes.map((d, idx) => (
                <tr
                  key={d.id}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: idx % 2 === 0 ? "#fff" : C.bg,
                  }}
                >
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 20 }}>{d.img}</span>
                      <span style={{ fontWeight: 500, color: C.text, fontSize: 14 }}>{d.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <Tag color={C.accent}>{d.category}</Tag>
                  </td>
                  {["calories", "protein", "carbs", "fat", "fiber"].map(k => (
                    <td key={k} style={{
                      padding: "13px 14px", textAlign: "center",
                      fontSize: 14,
                      color: k === "calories" ? C.accent : C.text,
                      fontWeight: k === "calories" ? 700 : 400,
                    }}>
                      {d.nutrients[k]}
                      <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 2 }}>
                        {k === "calories" ? "kcal" : "g"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}
