import { C, FONTS } from "../theme";
import {
  Card, Btn, NutrientBar, Tag, Page, PageHeader, StatTile,
} from "../components/ui";
import { NUTRIENTS_DAILY } from "../data/mockData";

export default function Dashboard({ setPage, dishes, pantry }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const stats = [
    { icon: "🍽", value: dishes.length,  label: "Dishes Saved",   color: C.accent, page: "dishes"    },
    { icon: "🏺", value: pantry.length,  label: "Pantry Items",   color: C.sage,   page: "pantry"    },
    { icon: "🔥", value: "1,840",        label: "Calories Today", color: C.gold,   page: "nutrients" },
    { icon: "👥", value: 3,              label: "Following",      color: C.purple, page: "social"    },
  ];

  const todaysMeals = [
    { slot: "🌅 Breakfast", name: "Avocado Toast Deluxe", cal: "340 kcal" },
    { slot: "☀️ Lunch",     name: "Greek Salad Bowl",     cal: "280 kcal" },
    { slot: "🌙 Dinner",    name: "Mushroom Risotto",     cal: "520 kcal" },
  ];

  const missingItems = ["Roma tomatoes", "Mixed mushrooms", "White wine"];

  return (
    <Page>
      <PageHeader
        title={`Good morning, Aria 👋`}
        subtitle={`Here's what's on the menu for today — ${today}`}
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
          {todaysMeals.map(({ slot, name, cal }) => (
            <div key={slot} style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 0",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{slot}</div>
                <div style={{ fontWeight: 500, color: C.text, marginTop: 2 }}>{name}</div>
              </div>
              <Tag color={C.accent}>{cal}</Tag>
            </div>
          ))}
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.textSub }}>
              Total: <strong style={{ color: C.accent }}>1,140 kcal</strong>
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
            {NUTRIENTS_DAILY.slice(0, 4).map(n => (
              <NutrientBar key={n.name} {...n} />
            ))}
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
          {dishes.slice(1, 3).map(d => (
            <div key={d.id} style={{
              display: "flex", gap: 12, padding: "11px 0",
              borderBottom: `1px solid ${C.border}`, alignItems: "center",
            }}>
              <span style={{ fontSize: 26 }}>{d.img}</span>
              <div>
                <div style={{ fontWeight: 500, color: C.text }}>{d.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {d.time} min • {d.nutrients.calories} kcal
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
          <p style={{ fontSize: 13, color: C.textSub, marginBottom: 14 }}>
            {missingItems.length} items missing from this week's plan:
          </p>
          {missingItems.map(item => (
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
          <Btn variant="ghost" onClick={() => setPage("shopping")}
            style={{ marginTop: 14, padding: "6px 14px", fontSize: 13 }}>
            Full List →
          </Btn>
        </Card>
      </div>
    </Page>
  );
}
