import { useMemo, useState } from "react";
import { C, FONTS } from "../theme";
import { Btn, Empty } from "./ui";
import { DishArt, IngredientArt } from "./art";

// Cap both grids: with a big catalog almost every dish shares one common
// ingredient (and dishes without listed ingredients count as cookable), so
// rendering every match at once can mean thousands of cards.
const FULL_LIMIT    = 48;
const PARTIAL_LIMIT = 24;

function SuggestionCard({ dish, missing, onViewDish }) {
  const full = missing.length === 0;
  return (
    <button className="sr-card" onClick={() => onViewDish(dish)} aria-label={`${dish.name} — ${full ? "ready to cook" : `missing ${missing.length}`}`}>
      <div className="tile-cover">
        <span className="tile-cat">{dish.category}</span>
        {full && (
          <span className="tile-cat" style={{ left: "auto", right: 14, color: "var(--c4)" }}>Ready to cook</span>
        )}
        <DishArt dish={dish} size={240} round={false} />
      </div>
      <div className="tile-body">
        <div className="tile-name">{dish.name}</div>
        {missing.length > 0 && (
          <div>
            <div className="kicker" style={{ color: C.error, marginBottom: 6 }}>Missing · {missing.length}</div>
            <div style={{ fontSize: 13.5, color: C.textSub, lineHeight: 1.4 }}>
              {missing.map(m => m.name).join(", ")}
            </div>
          </div>
        )}
        <div className="tile-meta">
          <span>{dish.time} min</span>
          <span>{(Number(dish.nutrients.calories) || 0).toFixed(1)} kcal</span>
          <span style={{ marginLeft: "auto", color: C.text }}>{full ? "Cook now →" : "View recipe →"}</span>
        </div>
      </div>
    </button>
  );
}

// Pantry-based suggestions, rendered as the "Suggested Dishes" tab of the
// Dish Database page. Category / diet filters mirror the ones on the
// Explore and Your Dishes tabs, applied client-side here.
export default function DishSuggestions({ dishes, pantry, onViewDish, dishCategories, dietaryOptions }) {
  const [catFilter, setCatFilter]   = useState("All");
  const [tagFilters, setTagFilters] = useState(new Set());

  const categories = ["All", ...(dishCategories?.length
    ? dishCategories
    : [...new Set(dishes.map(d => d.category))])];
  const allTags = (dietaryOptions?.length
    ? [...dietaryOptions]
    : [...new Set(dishes.flatMap(d => d.tags ?? []))]).sort();

  const toggleTag = tag =>
    setTagFilters(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  const tagKey = [...tagFilters].sort().join("|");
  // "Bare" is about the pantry itself, not the active filters — so a stocked
  // pantry that's simply been over-filtered gets the filter empty state, while
  // an empty pantry always gets the "add items" prompt.
  const pantryBare = pantry.length === 0;

  // One pass over the catalog: skip dishes the filters exclude, then split
  // each dish's required ingredients into have/missing against the pantry
  // and classify. Memoized — this only reruns when the dish list, pantry,
  // or filters actually change.
  const { canMake, canMakeTotal, partial, partialTotal } = useMemo(() => {
    const pantryNames = new Set(pantry.map(p => p.name.toLowerCase()));
    const wantedTags = [...tagFilters];
    const allFull = [], allPartial = [];
    for (const dish of dishes) {
      if (catFilter !== "All" && dish.category !== catFilter) continue;
      if (wantedTags.length > 0 && !wantedTags.every(t => dish.tags?.includes(t))) continue;
      const missing = [];
      let have = 0;
      for (const ing of dish.reqIngredients) {
        if (pantryNames.has(ing.name.toLowerCase())) have++;
        else missing.push(ing);
      }
      if (missing.length === 0) allFull.push({ dish, missing });
      else if ((have/dish.reqIngredients.length) > 0.70) allPartial.push({ dish, missing });
    }
    // Ranked by how few ingredients stand between you and the dish
    allPartial.sort((a, b) => a.missing.length - b.missing.length);
    return {
      canMake:      allFull.slice(0, FULL_LIMIT),
      canMakeTotal: allFull.length,
      partial:      allPartial.slice(0, PARTIAL_LIMIT),
      partialTotal: allPartial.length,
    };
  }, [dishes, pantry, catFilter, tagKey]);

  const SectionHead = ({ title, count }) => (
    <h2 style={{
      fontFamily: FONTS.display, fontWeight: 400, fontSize: 28, letterSpacing: "-0.015em", lineHeight: 1.1,
      color: "var(--ink)", marginBottom: 16,
      display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap",
    }}>
      {title}
      <span style={{ fontFamily: FONTS.body, fontSize: 14, color: C.textMuted, letterSpacing: 0 }}>{count}</span>
    </h2>
  );

  const filtersActive = catFilter !== "All" || tagFilters.size > 0;
  const noResults = canMakeTotal === 0 && partialTotal === 0;

  return (
    <>
      {/* Filters — same category / diet chips as the Explore and Yours tabs */}
      <div className="on-world chip-row" style={{ marginBottom: 26 }}>
        {categories.map(c => (
          <button key={c} className={`chip${catFilter === c ? " on" : ""}`} aria-pressed={catFilter === c} onClick={() => setCatFilter(c)}>
            {c}
          </button>
        ))}
        {allTags.length > 0 && <span aria-hidden="true" style={{ width: 1, height: 22, background: "var(--line-strong)", opacity: 0.3, margin: "0 6px" }} />}
        {allTags.map(tag => {
          const active = tagFilters.has(tag);
          return (
            <button key={tag} className={`chip${active ? " on" : ""}`} aria-pressed={active} onClick={() => toggleTag(tag)}>
              {tag}
            </button>
          );
        })}
        {tagFilters.size > 0 && (
          <button className="go" style={{ color: "var(--ink)", marginLeft: 6 }} onClick={() => setTagFilters(new Set())}>Clear</button>
        )}
      </div>

      {noResults && ((!pantryBare && filtersActive) ? (
        <Empty
          icon={<IngredientArt name="chili" size={72} />}
          title="No suggestions match these filters"
          subtitle="Try a different category or fewer diet tags."
          action={<Btn variant="secondary" onClick={() => { setCatFilter("All"); setTagFilters(new Set()); }}>Clear filters</Btn>}
        />
      ) : (
        <Empty
          icon={<IngredientArt name="chili" size={72} />}
          title="Pantry looks bare"
          subtitle="Add items to your pantry and dishes you can already cook will appear here."
        />
      ))}

    <div>

      {canMakeTotal > 0 && (
        <section style={{ marginBottom: 36, position: "relative" }}>
          <SectionHead
            title="Ready to cook"
            count={canMakeTotal > canMake.length ? `first ${canMake.length} of ${canMakeTotal}` : canMakeTotal}
          />
          <div className="tile-grid">
            {canMake.map(({ dish, missing }) => (
              <SuggestionCard key={dish.id} dish={dish} missing={missing} onViewDish={onViewDish} />
            ))}
          </div>
        </section>
      )}

      {partialTotal > 0 && (
        <section style={{ marginBottom: 36, position: "relative" }}>
          <SectionHead
            title="Almost there"
            count={partialTotal > partial.length ? `closest ${partial.length} of ${partialTotal}` : partialTotal}
          />
          <div className="tile-grid">
            {partial.map(({ dish, missing }) => (
              <SuggestionCard key={dish.id} dish={dish} missing={missing} onViewDish={onViewDish} />
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  );
}
