import { C, FONTS, RADIUS } from "../theme";
import { Card, Btn, Tag, Page, PageHeader, Empty } from "../components/ui";

function SuggestionCard({ dish, type, onViewDish }) {
  const missing = dish.reqIngredients.filter(
    i => !dish._pantryHas?.includes(i.name.toLowerCase())
  );

  return (
    <Card style={{ position: "relative", overflow: "hidden" }}>
      {type === "full" && (
        <div style={{ position: "absolute", top: 14, right: 14 }}>
          <Tag color={C.success}>✓ Ready to Cook</Tag>
        </div>
      )}

      <div style={{ fontSize: 44, marginBottom: 14 }}>{dish.img}</div>

      <h3 style={{ fontFamily: FONTS.display, fontSize: 20, color: C.text, marginBottom: 8 }}>
        {dish.name}
      </h3>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <Tag color={C.accent}>{dish.category}</Tag>
        <Tag color={C.sage}>⏱ {dish.time} min</Tag>
        <Tag color={C.gold}>🔥 {dish.nutrients.calories} kcal</Tag>
      </div>

      {type === "partial" && missing.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>
            MISSING INGREDIENTS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {missing.map((m, i) => <Tag key={`${m.name}-${i}`} color={C.error}>{m.name}</Tag>)}
          </div>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: "flex", gap: 8 }}>
        <Btn
          variant={type === "full" ? "sage" : "ghost"}
          style={{ flex: 1 }}
          onClick={() => onViewDish(dish)}
        >
          {type === "full" ? "👨‍🍳 Cook Now" : "🛒 Add to Shopping"}
        </Btn>
        <Btn variant="secondary" style={{ padding: "10px 14px" }} onClick={() => onViewDish(dish)}>
          📖
        </Btn>
      </div>
    </Card>
  );
}

export default function Suggestions({ dishes, pantry, onViewDish }) {
  const pantryNames = new Set(pantry.map(p => p.name.toLowerCase()));

  // Annotate dishes with pantry membership
  const annotated = dishes.map(d => ({
    ...d,
    _pantryHas: d.reqIngredients.filter(i => pantryNames.has(i.name.toLowerCase())).map(i => i.name.toLowerCase()),
  }));

  const canMake = annotated.filter(d =>
    d.reqIngredients.every(i => pantryNames.has(i.name.toLowerCase()))
  );

  const partial = annotated.filter(d =>
    !canMake.some(c => c.id === d.id)
    && d.reqIngredients.some(i => pantryNames.has(i.name.toLowerCase()))
  );

  const SectionHead = ({ dot, title, count }) => (
    <h2 style={{
      fontFamily: FONTS.display, fontSize: 22, color: C.text,
      marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ width: 11, height: 11, borderRadius: "50%", background: dot, display: "inline-block" }} />
      {title} ({count})
    </h2>
  );

  return (
    <Page>
      <PageHeader
        title="Recipe Suggestions"
        subtitle={`Based on your pantry of ${pantry.length} items`}
      />

      {canMake.length === 0 && partial.length === 0 && (
        <Empty
          icon="🏺"
          title="Pantry looks bare!"
          subtitle="Add items to your pantry to get personalised recipe suggestions."
        />
      )}

      {canMake.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <SectionHead dot={C.success} title="Ready to Cook" count={canMake.length} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
            {canMake.map(d => <SuggestionCard key={d.id} dish={d} type="full" onViewDish={onViewDish} />)}
          </div>
        </section>
      )}

      {partial.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <SectionHead dot={C.warning} title="Almost There" count={partial.length} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
            {partial.map(d => <SuggestionCard key={d.id} dish={d} type="partial" onViewDish={onViewDish} />)}
          </div>
        </section>
      )}

    </Page>
  );
}
