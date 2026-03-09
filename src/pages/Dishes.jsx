import { useState } from "react";
import { C, FONTS, RADIUS, SHADOW } from "../theme";
import {
  Card, Btn, Tag, Input, Textarea, Select, Modal,
  Page, PageHeader, Empty, SectionLabel,
} from "../components/ui";
import { DISH_CATEGORIES } from "../data/mockData";

/* ─── Dish Detail view ─── */
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
              <Tag color={C.sage}>⏱ {dish.time} min</Tag>
              <Tag color={C.gold}>👥 {dish.servings} servings</Tag>
              {dish.tags.map(t => <Tag key={t} color={C.textMuted}>{t}</Tag>)}
            </div>

            <SectionLabel>Required Ingredients</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {dish.reqIngredients.map(i => <Tag key={i} color={C.accent}>{i}</Tag>)}
            </div>

            {dish.optIngredients.length > 0 && (
              <>
                <SectionLabel>Optional Ingredients</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {dish.optIngredients.map(i => <Tag key={i} color={C.textMuted}>{i}</Tag>)}
                </div>
              </>
            )}
          </Card>

          <Btn variant="danger" onClick={() => onDelete(dish.id)} style={{ alignSelf: "flex-start" }}>
            🗑 Delete Dish
          </Btn>
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
              <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 12, color: C.text }}>
                📝 Recipe
              </h3>
              <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.75 }}>{dish.recipe}</p>
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

/* ─── Add Dish form ─── */
const BLANK = {
  name: "", category: "Main", time: "", servings: "2",
  recipe: "", youtubeLink: "", reqIngredients: "", optIngredients: "",
  img: "🍽", calories: "", protein: "", carbs: "", fat: "", fiber: "",
};

function AddDishForm({ onSave, onCancel }) {
  const [f, setF] = useState(BLANK);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const save = () => {
    const dish = {
      id: Date.now(),
      name: f.name,
      category: f.category,
      time: parseInt(f.time) || 30,
      servings: parseInt(f.servings) || 2,
      tags: [],
      youtubeLink: f.youtubeLink,
      recipe: f.recipe,
      img: f.img || "🍽",
      nutrients: {
        calories: parseInt(f.calories) || 0,
        protein:  parseInt(f.protein)  || 0,
        carbs:    parseInt(f.carbs)    || 0,
        fat:      parseInt(f.fat)      || 0,
        fiber:    parseInt(f.fiber)    || 0,
      },
      reqIngredients: f.reqIngredients.split(",").map(s => s.trim()).filter(Boolean),
      optIngredients: f.optIngredients.split(",").map(s => s.trim()).filter(Boolean),
    };
    onSave(dish);
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
        {/* Left — Basic info */}
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
                    options={DISH_CATEGORIES}
                  />
                </div>
                <Input label="Time (min)" value={f.time} type="number"
                  onChange={e => set("time", e.target.value)} style={{ width: 90 }} />
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
            </div>
          </Card>
        </div>

        {/* Right — Ingredients + Nutrition */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: C.text }}>
              Ingredients
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Textarea
                label="Required Ingredients (comma-separated)"
                value={f.reqIngredients}
                onChange={e => set("reqIngredients", e.target.value)}
                placeholder="Arborio rice, Mushrooms, Parmesan..."
                rows={3}
              />
              <Textarea
                label="Optional Ingredients (comma-separated)"
                value={f.optIngredients}
                onChange={e => set("optIngredients", e.target.value)}
                placeholder="Truffle oil, Fresh thyme..."
                rows={2}
              />
            </div>
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

/* ─── Dish card ─── */
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

/* ─── Main page ─── */
export default function Dishes({ dishes, setDishes }) {
  const [view, setView]       = useState("list");  // list | add | detail
  const [selected, setSelected] = useState(null);
  const [search, setSearch]   = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const categories = ["All", ...new Set(dishes.map(d => d.category))];

  const filtered = dishes.filter(d => {
    const matchName = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat  = catFilter === "All" || d.category === catFilter;
    return matchName && matchCat;
  });

  if (view === "detail" && selected) {
    return (
      <DishDetail
        dish={selected}
        onBack={() => { setView("list"); setSelected(null); }}
        onDelete={id => {
          setDishes(ds => ds.filter(d => d.id !== id));
          setView("list"); setSelected(null);
        }}
      />
    );
  }

  if (view === "add") {
    return (
      <AddDishForm
        onSave={dish => { setDishes(ds => [...ds, dish]); setView("list"); }}
        onCancel={() => setView("list")}
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
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
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
