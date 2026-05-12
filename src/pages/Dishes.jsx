import { useState } from "react";
import { C, FONTS, RADIUS, SHADOW } from "../theme";
import {
  Card, Btn, Tag, Input, Textarea, Select, Modal,
  Page, PageHeader, Empty, SectionLabel,
} from "../components/ui";

import { insertDish, deleteDish, UNIVERSAL_USER_ID } from "../lib/db";


// Dish detail
function DishDetail({ dish, onBack, onDelete }) {
  return (
    <Page>
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", color: C.accent,
          fontSize: 14, cursor: "pointer", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: FONTS.body,
        }}
      >
        ← Back to Database
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <span style={{ fontSize: 56 }}>{dish.img}</span>
            <h2 style={{
              fontFamily: FONTS.display, fontSize: 28,
              color: C.text, marginTop: 14, marginBottom: 10,
            }}>
              {dish.name}
            </h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              <Tag color={C.accent}>{dish.category}</Tag>
              {dish.prepTime > 0 && <Tag color={C.sage}>🥄 Prep {dish.prepTime} min</Tag>}
              {dish.cookTime > 0 && <Tag color={C.sage}>🍳 Cook {dish.cookTime} min</Tag>}
              {dish.prepTime === 0 && dish.cookTime === 0 && <Tag color={C.sage}>⏱ {dish.time} min</Tag>}
              <Tag color={C.gold}>👥 {dish.servings} servings</Tag>
              {dish.tags.map(t => <Tag key={t} color={C.textMuted}>{t}</Tag>)}
            </div>

            <SectionLabel>Required Ingredients</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {dish.reqIngredients.map(i => (
                <Tag key={i.name} color={C.accent}>
                  {i.qty != null ? `${i.qty}${i.unit ? " " + i.unit : ""} ` : ""}{i.name}
                </Tag>
              ))}
            </div>

            {dish.optIngredients.length > 0 && (
              <>
                <SectionLabel>Optional Ingredients</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {dish.optIngredients.map(i => (
                    <Tag key={i.name} color={C.textMuted}>
                      {i.qty != null ? `${i.qty}${i.unit ? " " + i.unit : ""} ` : ""}{i.name}
                    </Tag>
                  ))}
                </div>
              </>
            )}
          </Card>

            {(dish.user_id !== UNIVERSAL_USER_ID) && <Btn variant="danger" onClick={() => onDelete(dish.id)} style={{ alignSelf: "flex-start" }}>
            🗑 Delete Dish
          </Btn>}
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 16, color: C.text }}>
              Nutrition per serving
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
              {[
                ["Calories", dish.nutrients.calories, "kcal"],
                ["Protein",  dish.nutrients.protein,  "g"],
                ["Carbs",    dish.nutrients.carbs,     "g"],
                ["Fat",      dish.nutrients.fat,       "g"],
                ["Fiber",    dish.nutrients.fiber,     "g"],
              ].map(([label, val, unit]) => (
                <div key={label} style={{
                  textAlign: "center", background: C.bg,
                  borderRadius: 10, padding: 12,
                }}>
                  <div style={{
                    fontSize: 20, fontWeight: 700, color: C.accent,
                    fontFamily: FONTS.display,
                  }}>
                    {val}
                  </div>
                  <div style={{
                    fontSize: 10, color: C.textMuted, textTransform: "uppercase",
                    letterSpacing: 0.5, marginTop: 4, lineHeight: 1.5,
                  }}>
                    {unit}<br />{label}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {dish.recipe && (
            <Card>
              <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 16, color: C.text }}>
                📝 Recipe
              </h3>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {dish.recipe.split(/(?<=[.!?])\s+/).filter(s => s.trim()).map((step, i) => (
                  <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{
                      minWidth: 24, height: 24, borderRadius: "50%",
                      background: C.accent + "18", color: C.accent,
                      fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7 }}>{step.trim()}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {dish.youtubeLink && (
            <Card>
              <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 12, color: C.text }}>
                📺 Video Tutorial
              </h3>
              <a
                href={dish.youtubeLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#FF0000", fontSize: 14,
                  textDecoration: "none", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                ▶ Watch on YouTube
              </a>
            </Card>
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
  const inputStyle = {
    background: C.bg, border: `1.5px solid ${C.border}`,
    borderRadius: RADIUS.md, padding: "8px 10px",
    fontSize: 13, color: C.text, width: "100%", outline: "none",
  };
  const focus = e => { e.target.style.borderColor = C.accent; };
  const blur  = e => { e.target.style.borderColor = C.border; };
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input
        value={ing.name} onChange={e => onChange({ ...ing, name: e.target.value })}
        placeholder="Ingredient name"
        style={{ ...inputStyle, flex: 1 }} onFocus={focus} onBlur={blur}
      />
      <input
        value={ing.qty} onChange={e => onChange({ ...ing, qty: e.target.value })}
        placeholder="Qty" type="number" min="0"
        style={{ ...inputStyle, width: 64 }} onFocus={focus} onBlur={blur}
      />
      <input
        list="ing-units" value={ing.unit} onChange={e => onChange({ ...ing, unit: e.target.value })}
        placeholder="unit"
        style={{ ...inputStyle, width: 72 }} onFocus={focus} onBlur={blur}
      />
      <datalist id="ing-units">
        {ING_UNITS.map(u => <option key={u} value={u} />)}
      </datalist>
      <button
        onClick={onRemove}
        style={{
          background: "none", border: "none", color: C.textMuted,
          cursor: "pointer", fontSize: 15, padding: "4px 6px",
          borderRadius: 6, flexShrink: 0, lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = C.error; e.currentTarget.style.background = C.error + "18"; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = "none"; }}
      >✕</button>
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
        {[["Name", "flex: 1"], ["Qty", "width: 64px"], ["Unit", "width: 72px"]].map(([h, s]) => (
          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: 0.5, [s.split(": ")[0]]: s.split(": ")[1] }}>
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
          marginTop: 8, background: "none", border: `1.5px dashed ${C.border}`,
          borderRadius: RADIUS.md, padding: "7px 14px", fontSize: 12,
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
        title="Add New Dish"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
            <Btn onClick={save} disabled={!f.name}>✓ Save Dish</Btn>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left - Basic info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: C.text }}>
              Basic Info
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <Input
                  label="Emoji"
                  value={f.img}
                  onChange={e => set("img", e.target.value)}
                  style={{ width: 72 }}
                />
                <div style={{ flex: 1 }}>
                  <Input
                    label="Dish Name *"
                    value={f.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="e.g. Mushroom Risotto"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
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
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.textSub, letterSpacing: 0.6, textTransform: "uppercase" }}>
                    Dietary Tags
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {dietaryOptions.map(tag => {
                      const active = tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          style={{
                            padding: "5px 12px", borderRadius: RADIUS.full,
                            border: `1.5px solid ${active ? C.sage : C.border}`,
                            background: active ? C.sage + "22" : "#fff",
                            color: active ? C.sage : C.textSub,
                            fontSize: 12, fontWeight: active ? 600 : 400,
                            cursor: "pointer", fontFamily: FONTS.body,
                            transition: "all 0.18s",
                          }}
                        >
                          {active && "✓ "}{tag}
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
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: C.text }}>
              Ingredients
            </h3>
            <IngSection label="Required" list={reqIngs} setList={setReqIngs} />
            <div style={{ borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />
            <IngSection label="Optional" list={optIngs} setList={setOptIngs} />
          </Card>

          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: C.text }}>
              Nutrition per Serving
            </h3>
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

// Dish card
function DishCard({ dish, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: `1px solid ${C.border}`,
        borderRadius: RADIUS.lg,
        padding: 20,
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform  = "translateY(-3px)";
        e.currentTarget.style.boxShadow  = SHADOW.md;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform  = "";
        e.currentTarget.style.boxShadow  = "";
      }}
    >
      <div style={{ fontSize: 38, marginBottom: 12 }}>{dish.img}</div>
      <h3 style={{ fontWeight: 600, color: C.text, fontSize: 15, marginBottom: 8, lineHeight: 1.3 }}>
        {dish.name}
      </h3>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <Tag color={C.accent}>{dish.category}</Tag>
        {dish.youtubeLink && <Tag color="#CC0000">▶ Video</Tag>}
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        borderTop: `1px solid ${C.border}`, paddingTop: 12,
      }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>⏱ {dish.time} min</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>🔥 {dish.nutrients.calories}</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>👥 {dish.servings}</span>
      </div>
    </div>
  );
}

// Main page
export default function Dishes({ dishes, setDishes, userId, dishCategories, dietaryOptions }) {
  const [view, setView]       = useState("list");  // list | add | detail
  const [selected, setSelected] = useState(null);
  const [search, setSearch]   = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [tagFilters, setTagFilters] = useState(new Set());

  const categories = ["All", ...new Set(dishes.map(d => d.category))];
  const allTags = [...new Set(dishes.flatMap(d => d.tags ?? []))].sort();

  const toggleTag = tag =>
    setTagFilters(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  const filtered = dishes.filter(d => {
    const matchName = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat  = catFilter === "All" || d.category === catFilter;
    const matchTags = tagFilters.size === 0 || (d.tags ?? []).some(t => tagFilters.has(t));
    return matchName && matchCat && matchTags;
  });

  if (view === "detail" && selected) {
    return (
      <DishDetail
        dish={selected}
        onBack={() => { setView("list"); setSelected(null); }}
        onDelete={async id => {
          await deleteDish(id).catch(console.error);
          setDishes(ds => ds.filter(d => d.id !== id));
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
          if (saved) setDishes(ds => [...ds, saved]);
          setView("list");
        }}
        onCancel={() => setView("list")}
        dishCategories={dishCategories}
        dietaryOptions={dietaryOptions}
      />
    );
  }

  return (
    <Page>
      <PageHeader
        title="Dish Database"
        subtitle={`${dishes.length} dishes in your collection`}
        action={<Btn onClick={() => setView("add")}>+ Add New Dish</Btn>}
      />

      {/* Filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search dishes…"
            style={{
              flex: 1, minWidth: 200,
              background: "#fff",
              border: `1.5px solid ${C.border}`,
              borderRadius: RADIUS.md,
              padding: "10px 16px",
              fontSize: 14, color: C.text,
            }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                style={{
                  padding: "8px 16px", borderRadius: RADIUS.sm,
                  border: `1.5px solid ${catFilter === c ? C.accent : C.border}`,
                  background: catFilter === c ? C.accentLight : "#fff",
                  color: catFilter === c ? C.accent : C.textSub,
                  fontSize: 13, fontWeight: catFilter === c ? 600 : 400,
                  cursor: "pointer", fontFamily: FONTS.body,
                  transition: "all 0.18s",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.6, textTransform: "uppercase", marginRight: 4 }}>
              Diet
            </span>
            {allTags.map(tag => {
              const active = tagFilters.has(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: "5px 12px", borderRadius: RADIUS.full,
                    border: `1.5px solid ${active ? C.sage : C.border}`,
                    background: active ? C.sage + "22" : "#fff",
                    color: active ? C.sage : C.textSub,
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    cursor: "pointer", fontFamily: FONTS.body,
                    transition: "all 0.18s",
                  }}
                >
                  {active && "✓ "}{tag}
                </button>
              );
            })}
            {tagFilters.size > 0 && (
              <button
                onClick={() => setTagFilters(new Set())}
                style={{
                  padding: "5px 10px", borderRadius: RADIUS.full,
                  border: `1.5px solid ${C.border}`,
                  background: "none", color: C.textMuted,
                  fontSize: 12, cursor: "pointer", fontFamily: FONTS.body,
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Empty
          icon="🍽"
          title="No dishes found"
          subtitle="Try adjusting your search or add your first dish."
          action={<Btn onClick={() => setView("add")}>+ Add a Dish</Btn>}
        />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: 16,
        }}>
          {filtered.map(d => (
            <DishCard
              key={d.id}
              dish={d}
              onClick={() => { setSelected(d); setView("detail"); }}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
