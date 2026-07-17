import { C, FONTS, alpha } from "../theme";
import { Btn, Tag, Page, PageHeader, Empty } from "../components/ui";
import { DishArt, IngredientArt, Watermark, dishSymbol, DISH_TINT } from "../components/art";

function SuggestionCard({ dish, type, onViewDish }) {
  const missing = dish.reqIngredients.filter(
    i => !dish._pantryHas?.includes(i.name.toLowerCase())
  );
  const tint = DISH_TINT[dishSymbol(dish)] ?? "#D89540";

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${type === "full" ? alpha(C.success, 40) : C.border}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: "var(--shadow)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Cover — the dish leads */}
      <div style={{
        height: 84, display: "grid", placeItems: "center", position: "relative",
        background: `color-mix(in srgb, ${tint} ${type === "full" ? 26 : 16}%, var(--panel))`,
      }}>
        <DishArt dish={dish} size={68} style={{ transform: "translateY(13px)" }} />
        {type === "full" && (
          <span style={{ position: "absolute", top: 10, right: 10 }}>
            <Tag color={C.success}>Ready to cook</Tag>
          </span>
        )}
      </div>

      <div style={{ padding: "22px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ fontFamily: FONTS.serif, fontSize: 19, color: C.head, marginBottom: 8 }}>
          {dish.name}
        </h3>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <Tag color={C.accent}>{dish.category}</Tag>
          <Tag color={C.sage}>{dish.time} min</Tag>
          <Tag color={C.gold}>{(Number(dish.nutrients.calories) || 0).toFixed(1)} kcal</Tag>
        </div>

        {type === "partial" && missing.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 10, color: C.textMuted, fontWeight: 700,
              letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8,
            }}>
              Missing · {missing.length}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {missing.map((m, i) => <Tag key={`${m.name}-${i}`} color={C.error}>{m.name}</Tag>)}
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: "auto", display: "flex", gap: 8 }}>
          <Btn
            variant={type === "full" ? "sage" : "ghost"}
            style={{ flex: 1 }}
            onClick={() => onViewDish(dish)}
          >
            {type === "full" ? "Cook now" : "View recipe"}
          </Btn>
        </div>
      </div>
    </div>
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

  // Ranked by how few ingredients stand between you and the dish
  const partial = annotated
    .filter(d =>
      !canMake.some(c => c.id === d.id)
      && d.reqIngredients.some(i => pantryNames.has(i.name.toLowerCase()))
    )
    .sort((a, b) =>
      (a.reqIngredients.length - a._pantryHas.length) - (b.reqIngredients.length - b._pantryHas.length)
    );

  const SectionHead = ({ dot, title, count }) => (
    <h2 style={{
      fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase",
      color: C.textMuted, fontWeight: 600,
      marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
    }}>
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: dot, display: "inline-block" }} />
      {title} · {count}
    </h2>
  );

  return (
    <Page>
      <PageHeader
        title="From your shelf"
        subtitle={`What your pantry of ${pantry.length} items can already cook`}
      />

      {canMake.length === 0 && partial.length === 0 && (
        <Empty
          icon={<IngredientArt name="chili" size={56} />}
          title="Pantry looks bare"
          subtitle="Add items to your pantry and dishes you can already cook will appear here."
        />
      )}

      <div style={{ position: "relative" }}>
        <Watermark symbol="i-chili" size={220} style={{ right: -10, top: -40, transform: "rotate(-18deg)" }} />

        {canMake.length > 0 && (
          <section style={{ marginBottom: 36, position: "relative" }}>
            <SectionHead dot={C.success} title="Ready to cook" count={canMake.length} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
              {canMake.map(d => <SuggestionCard key={d.id} dish={d} type="full" onViewDish={onViewDish} />)}
            </div>
          </section>
        )}

        {partial.length > 0 && (
          <section style={{ marginBottom: 36, position: "relative" }}>
            <SectionHead dot={C.warning} title="Almost there" count={partial.length} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
              {partial.map(d => <SuggestionCard key={d.id} dish={d} type="partial" onViewDish={onViewDish} />)}
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}