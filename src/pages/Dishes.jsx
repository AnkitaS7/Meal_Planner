import { useState, useEffect } from "react";
import { C, FONTS, RADIUS, alpha } from "../theme";
import { DishArt, dishPhoto } from "../components/art";
import DishSuggestions from "../components/DishSuggestions";
import {
  Card, Btn, Input, Textarea, Select, IconX,
  Page, PageHeader, HeroTitle, Empty, SectionLabel,
} from "../components/ui";

import { insertDish, deleteDish, fetchDishesPage, fetchDishRecipe, UNIVERSAL_USER_ID } from "../lib/db";

const PAGE_SIZE = 12;

// Dish detail
function DishDetail({ dish: dishProp, onBack, onDelete }) {
  // recipe_text is excluded from list payloads; fetch it on demand
  const [dish, setDish] = useState(dishProp);
  const [servings, setServings] = useState(dishProp.servings || 1);
  const [unitSystem, setUnitSystem] = useState("metric");

  useEffect(() => {
    let alive = true;
    if (!dishProp.recipe) {
      fetchDishRecipe(dishProp.id)
        .then(text => { if (alive && text) setDish(d => ({ ...d, recipe: text })); })
        .catch(console.error);
    }
    return () => { alive = false; };
  }, [dishProp.id]);

  const baseServings = dish.servings || 1;
  const scale = servings / baseServings;

  // Quantities are stored numerically; PostgREST may hand them back as a
  // number (JSONB) or a numeric string, so coerce either to a number.
  const parseQty = qty => {
    if (qty == null || qty === "") return null;
    const n = Number(qty);
    return isNaN(n) ? null : n;
  };

  const toFraction = num => {
    const whole = Math.floor(num);
    const dec = num - whole;
    if (dec < 0.01) return whole === 0 ? "0" : String(whole);
    const denoms = [2, 3, 4, 6, 8, 12, 16];
    let bestN = 1, bestD = 1, bestDiff = Infinity;
    for (const d of denoms) {
      const n = Math.round(dec * d);
      const diff = Math.abs(dec - n / d);
      if (diff < bestDiff) { bestDiff = diff; bestN = n; bestD = d; }
    }
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const g = gcd(bestN, bestD);
    const n = bestN / g, d = bestD / g;
    if (n >= d) return String(whole + 1);
    return whole > 0 ? `${whole} ${n}/${d}` : `${n}/${d}`;
  };

  const METRIC_TO_IMP = {
    g:  { factor: 0.035274, unit: "oz"    },
    kg: { factor: 2.20462,  unit: "lb"    },
    ml: { factor: 0.033814, unit: "fl oz" },
    L:  { factor: 4.22675,  unit: "cups"  },
  };
  const IMP_TO_METRIC = {
    oz:      { factor: 28.3495,  unit: "g"  },
    lb:      { factor: 453.592,  unit: "g"  },
    "fl oz": { factor: 29.5735,  unit: "ml" },
  };

  const formatIngredient = (qty, unit) => {
    const n = parseQty(qty);
    if (n == null || isNaN(n)) return { qty, unit };
    let num = n * scale;
    let u = unit;
    const map = unitSystem === "imperial" ? METRIC_TO_IMP : IMP_TO_METRIC;
    const conv = u ? map[u] : null;
    if (conv) { num = num * conv.factor; u = conv.unit; }
    const display = Number.isInteger(num) ? String(num) : toFraction(num);
    return { qty: display, unit: u };
  };

  const renderIngList = (ingredients, muted) => (
    <ul className="row-list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {ingredients.map(i => {
        const { qty: dQty, unit: dUnit } = formatIngredient(i.qty, i.unit);
        return (
          <li key={i.name} style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14,
            padding: "11px 2px", opacity: muted ? 0.7 : 1,
          }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: C.text }}>{i.name}</span>
            <span className="mono" style={{ fontSize: 13, color: C.textMuted, whiteSpace: "nowrap" }}>
              {i.qty != null ? `${dQty}${dUnit ? " " + dUnit : ""}` : "—"}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const sheetTitle = { fontFamily: FONTS.display };

  return (
    <Page>
      <PageHeader
        photo={dishPhoto(dish, 2000)}
        onBack={onBack}
        backLabel="Back to cookbook"
        eyebrow={dish.tags.length ? `${dish.category.toLowerCase()} · ${dish.tags.slice(0, 2).join(", ").toLowerCase()}` : dish.category.toLowerCase()}
        title={[dish.name]}
        stats={[
          ...(dish.prepTime > 0 ? [{ v: dish.prepTime, l: "min prep" }] : []),
          ...(dish.cookTime > 0 ? [{ v: dish.cookTime, l: "min cooking" }] : []),
          ...(dish.prepTime === 0 && dish.cookTime === 0 ? [{ v: dish.time, l: "minutes" }] : []),
          { v: baseServings, l: baseServings === 1 ? "serving" : "servings" },
        ]}
        action={(dish.user_id !== UNIVERSAL_USER_ID)
          ? <Btn variant="secondary" onClick={() => onDelete(dish.id)}>Delete dish</Btn>
          : null}
      />

      <div className="sr-grid">
        {/* Nutrition — one loud strip */}
        <section className="sr-panel pop sp-12 rise" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 18, alignItems: "end" }}>
          {[
            ["Calories", (Number(dish.nutrients.calories) || 0).toFixed(1), "kcal"],
            ["Protein",  dish.nutrients.protein,  "g"],
            ["Carbs",    dish.nutrients.carbs,     "g"],
            ["Fat",      dish.nutrients.fat,       "g"],
            ["Fiber",    dish.nutrients.fiber,     "g"],
          ].map(([label, val, unit], i) => (
            <div key={label}>
              <div className="bignum" style={{ fontSize: i === 0 ? 44 : 34, color: i === 0 ? "var(--c1)" : "inherit" }}>
                {val}
              </div>
              <div className="kicker" style={{ opacity: 0.7, marginTop: 8 }}>{label} · {unit}</div>
            </div>
          ))}
          <div className="kicker" style={{ opacity: 0.5, alignSelf: "start", justifySelf: "end" }}>per serving</div>
        </section>

        {/* Ingredients */}
        <section className="sr-panel sp-5 rise" style={{ "--i": 1, alignSelf: "start" }}>
          <h3 className="sr-panel-h"><span style={sheetTitle}>Ingredients</span><span>serves {servings}</span></h3>

          {/* Serving size + unit system controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: C.bg, borderRadius: 999, padding: 4 }}>
              <button className="sr-step sr-press" aria-label="Fewer servings" onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
              <span className="mono" style={{ minWidth: 34, textAlign: "center", fontSize: 15, fontWeight: 600, color: C.text }}>
                {servings}
              </span>
              <button className="sr-step sr-press" aria-label="More servings" onClick={() => setServings(s => s + 1)}>+</button>
            </div>
            {servings !== baseServings && (
              <button className="chip" onClick={() => setServings(baseServings)}>Reset</button>
            )}
            <div className="chip-row" style={{ marginLeft: "auto" }}>
              {["metric", "imperial"].map(sys => (
                <button
                  key={sys}
                  className={`chip${unitSystem === sys ? " on" : ""}`}
                  aria-pressed={unitSystem === sys}
                  onClick={() => setUnitSystem(sys)}
                >
                  {sys === "metric" ? "Metric" : "Imperial"}
                </button>
              ))}
            </div>
          </div>

          <SectionLabel>Required Ingredients</SectionLabel>
          <div style={{ marginBottom: 22 }}>
            {renderIngList(dish.reqIngredients, false)}
          </div>

          {dish.optIngredients.length > 0 && (
            <>
              <SectionLabel>Optional Ingredients</SectionLabel>
              {renderIngList(dish.optIngredients, true)}
            </>
          )}
        </section>

        {/* Method */}
        <div className="sp-7" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {dish.recipe && (
            <section className="sr-panel rise" style={{ "--i": 2 }}>
              <h3 className="sr-panel-h"><span style={sheetTitle}>Recipe</span></h3>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 20 }}>
                {dish.recipe.split(/(?<=[.!?])\s+/).filter(s => s.trim()).map((step, i) => (
                  <li key={i} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "start" }}>
                    <span className="bignum" style={{ fontSize: 28, color: C.accent }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 17, color: C.text, lineHeight: 1.55, paddingTop: 4 }}>{step.trim()}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {dish.youtubeLink && (
            <section className="sr-panel pop rise" style={{ "--i": 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: FONTS.display, fontWeight: 400, fontSize: 23 }}>
                Video tutorial
              </h3>
              <a
                href={dish.youtubeLink}
                target="_blank"
                rel="noreferrer"
                className="sr-btn sr-btn-primary"
                style={{ textDecoration: "none" }}
              >
                ▶ Watch on YouTube
              </a>
            </section>
          )}
        </div>
      </div>
    </Page>
  );
}

// Ingredient row
const BLANK_ING = () => ({ name: "", qty: "", unit: "" });

const ING_UNITS = ["g", "kg", "ml", "L", "cups", "tbsp", "tsp", "pcs", "cloves", "slices", "sprigs", "leaves", "bunch"];

function IngredientRow({ ing, onChange, onRemove }) {
  const inputStyle = { padding: "10px 12px", fontSize: 14 };
  const focus = undefined, blur = undefined;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input
        value={ing.name} onChange={e => onChange({ ...ing, name: e.target.value })}
        placeholder="Ingredient name"
        className="sr-field" style={{ ...inputStyle, flex: 1 }} onFocus={focus} onBlur={blur}
      />
      <input
        value={ing.qty} onChange={e => onChange({ ...ing, qty: e.target.value })}
        placeholder="Qty" type="number" min="0"
        className="sr-field" style={{ ...inputStyle, width: 72 }} onFocus={focus} onBlur={blur}
      />
      <input
        list="ing-units" value={ing.unit} onChange={e => onChange({ ...ing, unit: e.target.value })}
        placeholder="unit"
        className="sr-field" style={{ ...inputStyle, width: 82 }} onFocus={focus} onBlur={blur}
      />
      <datalist id="ing-units">
        {ING_UNITS.map(u => <option key={u} value={u} />)}
      </datalist>
      <button
        onClick={onRemove}
        aria-label="Remove ingredient"
        style={{
          background: "none", border: "none", color: C.textMuted,
          cursor: "pointer", padding: 8,
          borderRadius: 6, flexShrink: 0, lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = C.error; e.currentTarget.style.background = alpha(C.error, 10); }}
        onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = "none"; }}
      ><IconX /></button>
    </div>
  );
}

// Add dish form helpers — defined at module level so IngSection has a stable reference
const BLANK = {
  name: "", category: "Main", prepTime: "", cookTime: "", servings: "2",
  recipe: "", youtubeLink: "", img: "🍽",
  calories: "", protein: "", carbs: "", fat: "", fiber: "",
};

const updateIng = (list, setList, idx, val) => setList(list.map((x, i) => i === idx ? val : x));
const addIng    = setList => setList(l => [...l, BLANK_ING()]);
const removeIng = (list, setList, idx) => setList(list.filter((_, i) => i !== idx));

function IngSection({ label, list, setList }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6, paddingRight: 34 }}>
        {[["Name", "flex: 1"], ["Qty", "width: 72px"], ["Unit", "width: 82px"]].map(([h, s]) => (
          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textSub, letterSpacing: 0.5, [s.split(": ")[0]]: s.split(": ")[1] }}>
            {h}
          </span>
        ))}
      </div>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
        {list.map((ing, i) => (
          <IngredientRow
            key={i}
            ing={ing}
            onChange={val => updateIng(list, setList, i, val)}
            onRemove={() => list.length > 1 ? removeIng(list, setList, i) : updateIng(list, setList, i, BLANK_ING())}
          />
        ))}
      </div>
      <button
        onClick={() => addIng(setList)}
        style={{
          marginTop: 8, background: "none", border: `1.5px dashed ${C.borderDark}`,
          borderRadius: RADIUS.md, padding: "10px 14px", fontSize: 13, fontWeight: 600,
          color: C.textMuted, cursor: "pointer", width: "100%",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border;  e.currentTarget.style.color = C.textMuted; }}
      >
        + Add ingredient
      </button>
    </div>
  );
}

function AddDishForm({ onSave, onCancel, dishCategories, dietaryOptions }) {
  const [f, setF]           = useState(BLANK);
  const [reqIngs, setReqIngs] = useState([BLANK_ING()]);
  const [optIngs, setOptIngs] = useState([BLANK_ING()]);
  const [tags, setTags]     = useState([]);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const toggleTag = tag =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const save = () => {
    onSave({
      id: Date.now(),
      name:     f.name,
      category: f.category,
      prepTime: parseInt(f.prepTime) || 0,
      cookTime: parseInt(f.cookTime) || 0,
      time:     (parseInt(f.prepTime) || 0) + (parseInt(f.cookTime) || 0),
      servings: parseInt(f.servings) || 2,
      tags,
      youtubeLink: f.youtubeLink,
      recipe:      f.recipe,
      img:         f.img || "🍽",
      nutrients: {
        calories: parseInt(f.calories) || 0,
        protein:  parseInt(f.protein)  || 0,
        carbs:    parseInt(f.carbs)    || 0,
        fat:      parseInt(f.fat)      || 0,
        fiber:    parseInt(f.fiber)    || 0,
      },
      reqIngredients: reqIngs.filter(i => i.name.trim()),
      optIngredients: optIngs.filter(i => i.name.trim()),
    });
  };

  return (
    <Page>
      <PageHeader
        title={["New", { em: true, text: "dish." }]}
        onBack={onCancel}
        backLabel="Back to cookbook"
        subtitle="Name it, list what goes in, and say how it's made."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
            <Btn onClick={save} disabled={!f.name}>Save dish</Btn>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        {/* Left - Basic info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <h3 className="sr-panel-h"><span>Basic Info</span></h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input
                label="Dish Name *"
                value={f.name}
                onChange={e => set("name", e.target.value)}
                placeholder="e.g. Mushroom Risotto"
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 160px" }}>
                  <Select
                    label="Category"
                    value={f.category}
                    onChange={e => set("category", e.target.value)}
                    options={dishCategories}
                  />
                </div>
                <Input label="Prep (min)" value={f.prepTime} type="number"
                  onChange={e => set("prepTime", e.target.value)} style={{ width: 82 }} />
                <Input label="Cook (min)" value={f.cookTime} type="number"
                  onChange={e => set("cookTime", e.target.value)} style={{ width: 82 }} />
                <Input label="Servings" value={f.servings} type="number"
                  onChange={e => set("servings", e.target.value)} style={{ width: 80 }} />
              </div>

              <Textarea
                label="Recipe / Instructions"
                value={f.recipe}
                onChange={e => set("recipe", e.target.value)}
                placeholder="Describe the cooking steps..."
                rows={5}
              />

              <Input
                label="YouTube Video Link (optional)"
                value={f.youtubeLink}
                onChange={e => set("youtubeLink", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />

              {dietaryOptions?.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label className="field-label">Dietary Tags</label>
                  <div className="chip-row">
                    {dietaryOptions.map(tag => {
                      const active = tags.includes(tag);
                      return (
                        <button
                          key={tag} type="button"
                          className={`chip${active ? " on" : ""}`}
                          aria-pressed={active}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right - Ingredients + Nutrition */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <h3 className="sr-panel-h"><span>Ingredients</span></h3>
            <IngSection label="Required" list={reqIngs} setList={setReqIngs} />
            <div style={{ borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />
            <IngSection label="Optional" list={optIngs} setList={setOptIngs} />
          </Card>

          <Card>
            <h3 className="sr-panel-h"><span>Nutrition per Serving</span></h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Calories (kcal)", "calories"],
                ["Protein (g)",     "protein"],
                ["Carbs (g)",       "carbs"],
                ["Fat (g)",         "fat"],
                ["Fiber (g)",       "fiber"],
              ].map(([label, key]) => (
                <Input
                  key={key}
                  label={label}
                  value={f[key]}
                  type="number"
                  onChange={e => set(key, e.target.value)}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

// Dish card — a polaroid: the dish photo, its name and the numbers.
function DishCard({ dish, onClick }) {
  return (
    <button onClick={onClick} className="sr-card">
      <div className="tile-cover">
        <span className="tile-cat">{dish.category}</span>
        {dish.youtubeLink && (
          <span className="tile-cat" style={{ left: "auto", right: 14, }}>Video</span>
        )}
        <DishArt dish={dish} size={240} round={false} />
      </div>
      <div className="tile-body">
        <div className="tile-name">{dish.name}</div>
        <div className="tile-meta">
          <span>{dish.time} min</span>
          <span>{(Number(dish.nutrients.calories) || 0).toFixed(1)} kcal</span>
          <span>serves {dish.servings}</span>
        </div>
      </div>
    </button>
  );
}

// Tabs for the Dish Database screen.
//   explore   — every dish available to the user (universal + their own)
//   yours     — only dishes the user has added
//   suggested — pantry-based suggestions (what you can cook right now)
const TABS = [
  { id: "explore",   label: "Explore"   },
  { id: "yours",     label: "Yours"      },
  { id: "suggested", label: "Ready to cook" },
];

function TabBar({ active, onChange }) {
  return (
    <div className="tabs" role="tablist" style={{ marginBottom: 22 }}>
      {TABS.map(t => (
        <button
          key={t.id} role="tab" className="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Pagination footer
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const nums = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="chip-row on-world" style={{ justifyContent: "center", marginTop: 28 }}>
      <button className="chip" disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1 }} onClick={() => onChange(page - 1)}>← Prev</button>
      {nums.map((p, i) =>
        p === "…"
          ? <span key={`e${i}`} style={{ color: "var(--ink)", padding: "0 2px" }}>…</span>
          : <button key={p} className={`chip mono${p === page ? " on" : ""}`} aria-current={p === page ? "page" : undefined} onClick={() => onChange(p)}>{p}</button>
      )}
      <button className="chip" disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.4 : 1 }} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

// Main page
export default function Dishes({ dishes, setDishes, pantry, userId, dishCategories, dietaryOptions, pendingTab, onClearPendingTab }) {
  const [view, setView]       = useState("list");  // list | add | detail
  const [tab, setTab]         = useState("explore"); // explore | yours | suggested
  const [selected, setSelected] = useState(null);

  // Another page (e.g. the Dashboard "From your shelf" card) can land here
  // with a specific tab pre-selected.
  useEffect(() => {
    if (pendingTab) {
      setTab(pendingTab);
      setView("list");
      setSelected(null);
      onClearPendingTab?.();
    }
  }, [pendingTab]);
  const [search, setSearch]   = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [tagFilters, setTagFilters] = useState(new Set());

  // server-side paging state
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // debounce the search box so we query while the user types, not per keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const tagKey = [...tagFilters].sort().join("|");

  // any filter change (or tab switch) returns to page 1
  useEffect(() => { setPage(1); }, [debouncedSearch, catFilter, tagKey, tab]);

  // fetch the current page from the server (only PAGE_SIZE dishes travel).
  // The "suggested" tab has no backend yet, so it skips fetching entirely.
  useEffect(() => {
    if (tab === "suggested") { setItems([]); setTotal(0); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    fetchDishesPage(userId, {
      page, pageSize: PAGE_SIZE,
      search: debouncedSearch, category: catFilter, tags: [...tagFilters],
      scope: tab === "yours" ? "mine" : "all",
    })
      .then(({ dishes: d, total: t }) => { if (alive) { setItems(d); setTotal(t); } })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId, page, debouncedSearch, catFilter, tagKey, refreshKey, tab]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categories = ["All", ...(dishCategories?.length
    ? dishCategories
    : [...new Set(items.map(d => d.category))])];
  const allTags = (dietaryOptions?.length
    ? [...dietaryOptions]
    : [...new Set(items.flatMap(d => d.tags ?? []))]).sort();

  const toggleTag = tag =>
    setTagFilters(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  if (view === "detail" && selected) {
    return (
      <DishDetail
        dish={selected}
        onBack={() => { setView("list"); setSelected(null); }}
        onDelete={async id => {
          await deleteDish(id).catch(console.error);
          setDishes(ds => ds.filter(d => d.id !== id));
          setRefreshKey(k => k + 1);
          setView("list"); setSelected(null);
        }}
      />
    );
  }

  if (view === "add") {
    return (
      <AddDishForm
        onSave={async dish => {
          const saved = await insertDish(dish, userId).catch(console.error);
          if (saved) { setDishes(ds => [...ds, saved]); setRefreshKey(k => k + 1); }
          setView("list");
        }}
        onCancel={() => setView("list")}
        dishCategories={dishCategories}
        dietaryOptions={dietaryOptions}
      />
    );
  }

  const subtitle = tab === "suggested"
    ? `What your pantry of ${pantry.length} item${pantry.length === 1 ? "" : "s"} can already cook`
    : loading && total === 0
      ? "Loading dishes…"
      : tab === "yours"
        ? `${total} dish${total === 1 ? "" : "es"} you've added`
        : `${total} dish${total === 1 ? "" : "es"} available to you`;

  return (
    <Page>
      <PageHeader
        title={["The", { em: true, text: "cookbook." }]}
        subtitle={subtitle}
        eyebrow="Dish database"
        action={<Btn onClick={() => setView("add")}>+ Add New Dish</Btn>}
      />

      <TabBar active={tab} onChange={setTab} />

      {tab === "suggested" ? (
        <DishSuggestions
          dishes={dishes}
          pantry={pantry}
          dishCategories={dishCategories}
          dietaryOptions={dietaryOptions}
          onViewDish={dish => { setSelected(dish); setView("detail"); }}
        />
      ) : (
      <>
      {/* Filters — straight on the colour */}
      <div className="on-world" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search dishes…"
          aria-label="Search dishes"
          className="world-search"
        />
        <div className="chip-row">
          {categories.map(c => (
            <button
              key={c}
              className={`chip${catFilter === c ? " on" : ""}`}
              aria-pressed={catFilter === c}
              onClick={() => setCatFilter(c)}
            >
              {c}
            </button>
          ))}
          {allTags.length > 0 && <span aria-hidden="true" style={{ width: 1, height: 22, background: "var(--line-strong)", margin: "0 6px" }} />}
          {allTags.map(tag => {
            const active = tagFilters.has(tag);
            return (
              <button
                key={tag}
                className={`chip${active ? " on" : ""}`}
                aria-pressed={active}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            );
          })}
          {tagFilters.size > 0 && (
            <button className="go" style={{ color: "var(--ink)", marginLeft: 6 }} onClick={() => setTagFilters(new Set())}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {!loading && items.length === 0 ? (
        <Empty
          icon={<DishArt dish={{ name: "pasta" }} size={72} />}
          title={tab === "yours" ? "You haven't added any dishes yet" : "No dishes found"}
          subtitle={tab === "yours"
            ? "Dishes you create will show up here."
            : "Try adjusting your search or add your first dish."}
          action={<Btn onClick={() => setView("add")}>+ Add a Dish</Btn>}
        />
      ) : (
        <>
          <div className="tile-grid" style={{ opacity: loading ? 0.55 : 1, transition: "opacity 0.15s" }}>
            {items.map(d => (
              <DishCard
                key={d.id}
                dish={d}
                onClick={() => { setSelected(d); setView("detail"); }}
              />
            ))}
          </div>

          <div className="kicker" style={{ textAlign: "center", marginTop: 24, color: "var(--ink)", opacity: 0.8 }}>
            {total > 0 && `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={p => setPage(p)} />
        </>
      )}
      </>
      )}
    </Page>
  );
}
