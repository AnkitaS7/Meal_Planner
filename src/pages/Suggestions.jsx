import { useMemo } from "react";
import { C, FONTS, alpha } from "../theme";
import { Btn, Tag, Page, PageHeader, Empty } from "../components/ui";
import { DishArt, IngredientArt, Watermark, dishSymbol, DISH_TINT } from "../components/art";

// Cap both grids: with a big catalog almost every dish shares one common
// ingredient (and dishes without listed ingredients count as cookable), so
// rendering every match at once can mean thousands of cards.
const FULL_LIMIT    = 48;
const PARTIAL_LIMIT = 24;

function SuggestionCard({ dish, missing, onViewDish }) {
  const full = missing.length === 0;
  const tint = DISH_TINT[dishSymbol(dish)] ?? "#D89540";

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${full ? alpha(C.success, 40) : C.border}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: "var(--shadow)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Cover — the dish leads */}
      <div style={{
        height: 84, display: "grid", placeItems: "center", position: "relative",
        background: `color-mix(in srgb, ${tint} ${full ? 26 : 16}%, var(--panel))`,
      }}>
        <DishArt dish={dish} size={68} style={{ transform: "translateY(13px)" }} />
        {full && (
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

        {missing.length > 0 && (
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
            variant={full ? "sage" : "ghost"}
            style={{ flex: 1 }}
            onClick={() => onViewDish(dish)}
          >
            {full ? "Cook now" : "View recipe"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export default function Suggestions({ dishes, pantry, onViewDish }) {
  // One pass over the catalog: split each dish's required ingredients into
  // have/missing against the pantry, then classify. Memoized — this only
  // reruns when the dish list or pantry actually changes.
  const { canMake, canMakeTotal, partial, partialTotal } = useMemo(() => {
    const pantryNames = new Set(pantry.map(p => p.name.toLowerCase()));
    const allFull = [], allPartial = [];
    for (const dish of dishes) {
      const missing = [];
      let have = 0;
      for (const ing of dish.reqIngredients) {
        if (pantryNames.has(ing.name.toLowerCase())) have++;
        else missing.push(ing);
      }
      if (missing.length === 0) allFull.push({ dish, missing });
      else if (have > 0) allPartial.push({ dish, missing });
    }
    // Ranked by how few ingredients stand between you and the dish
    allPartial.sort((a, b) => a.missing.length - b.missing.length);
    return {
      canMake:      allFull.slice(0, FULL_LIMIT),
      canMakeTotal: allFull.length,
      partial:      allPartial.slice(0, PARTIAL_LIMIT),
      partialTotal: allPartial.length,
    };
  }, [dishes, pantry]);

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

      {canMakeTotal === 0 && partialTotal === 0 && (
        <Empty
          icon={<IngredientArt name="chili" size={56} />}
          title="Pantry looks bare"
          subtitle="Add items to your pantry and dishes you can already cook will appear here."
        />
      )}

      <div style={{ position: "relative" }}>
        <Watermark symbol="i-chili" size={220} style={{ right: -10, top: -40, transform: "rotate(-18deg)" }} />

        {canMakeTotal > 0 && (
          <section style={{ marginBottom: 36, position: "relative" }}>
            <SectionHead
              dot={C.success}
              title="Ready to cook"
              count={canMakeTotal > canMake.length ? `first ${canMake.length} of ${canMakeTotal}` : canMakeTotal}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
              {canMake.map(({ dish, missing }) => (
                <SuggestionCard key={dish.id} dish={dish} missing={missing} onViewDish={onViewDish} />
              ))}
            </div>
          </section>
        )}

        {partialTotal > 0 && (
          <section style={{ marginBottom: 36, position: "relative" }}>
            <SectionHead
              dot={C.warning}
              title="Almost there"
              count={partialTotal > partial.length ? `closest ${partial.length} of ${partialTotal}` : partialTotal}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
              {partial.map(({ dish, missing }) => (
                <SuggestionCard key={dish.id} dish={dish} missing={missing} onViewDish={onViewDish} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
