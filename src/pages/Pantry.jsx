import { useState, useEffect, useRef } from "react";
import { C, FONTS, RADIUS, SHADOW, alpha } from "../theme";
import { IngredientArt, Watermark } from "../components/art";
import {
  Card, Btn, Input, Select, Page, PageHeader, Empty, SectionLabel, IconX,
} from "../components/ui";

import { insertPantryItem, deletePantryItem, searchIngredientAliases, mergePantryRows } from "../lib/db";

const CAT_COLORS = {
  Grains:   C.gold,
  Dairy:    C.sage,
  Produce:  C.success,
  Pantry:   C.accent,
  Bakery:   "#C9784C",
  Meat:     "#C25B5B",
  Seafood:  C.teal,
  Spices:   C.purple,
  Frozen:   "#6B96C4",
  Groceries: "#8A8FA3",
};

// Items are shelved by whatever their category column holds — categories we
// haven't met before still get a stable color of their own.
const catOf = item => item.category || "Uncategorized";

function catColor(category) {
  category = category || "Uncategorized";
  if (CAT_COLORS[category]) return CAT_COLORS[category];
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)"][h % 4];
}

// Distinct categories present on the rows themselves, in a stable order:
// known enum categories first (enum order), then the rest alphabetically.
function categoriesOf(items, pantryCategories) {
  return [...new Set(items.map(catOf))].sort((a, b) => {
    const ia = pantryCategories.indexOf(a), ib = pantryCategories.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24));
}

// Expiry as a small badge perched on the shelf item (V2 language)
function ExpiryBadge({ dateStr }) {
  const days = daysUntilExpiry(dateStr);
  if (days === null || days > 7) return null;
  const color = days < 3 ? C.error : C.warning;
  const text  = days < 0 ? "expired" : days === 0 ? "today" : `${days} d`;
  return (
    <span style={{
      position: "absolute", top: 0, right: 2,
      background: alpha(color, 12), color,
      border: `1px solid ${alpha(color, 35)}`,
      fontSize: 9, fontWeight: 700, borderRadius: 999,
      padding: "1px 7px", letterSpacing: "0.06em",
    }}>
      {text}
    </span>
  );
}

const BLANK = { name: "", qty: "", unit: "g", category: "Produce", expiry: "" };

// Item-name input with typeahead suggestions from the ingredient reference
// table. Picking a suggestion fills the name AND auto-selects its category;
// free typing (ignoring the suggestions) still works exactly as before.
function ItemNameAutocomplete({ value, onChange, onPick, pantryCategories }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]   = useState(false);
  const [hi, setHi]       = useState(-1);     // highlighted index
  const pickedRef = useRef(false);            // suppress refetch after a pick
  const boxRef    = useRef(null);

  useEffect(() => {
    if (pickedRef.current) { pickedRef.current = false; return; }
    if (value.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    let alive = true;
    const t = setTimeout(() => {
      searchIngredientAliases(value)
        .then(rows => { if (alive) { setSuggestions(rows); setOpen(rows.length > 0); setHi(-1); } })
        .catch(console.error);
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [value]);

  // close when clicking outside
  useEffect(() => {
    const close = e => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = s => {
    pickedRef.current = true;
    onPick(s.pantry_alias || s.alias, pantryCategories.includes(s.category) ? s.category : null);
    setOpen(false);
  };

  const onKeyDown = e => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && hi >= 0) { e.preventDefault(); pick(suggestions[hi]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }} onKeyDown={onKeyDown}>
      <Input
        label="Item Name *"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. Olive oil"
      />
      {open && (
        <div className="sr-menu" style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30,
          marginTop: 4, background: C.card,
          border: `1.5px solid ${C.border}`, borderRadius: RADIUS.md,
          boxShadow: SHADOW.md, overflow: "hidden", maxHeight: 264, overflowY: "auto",
        }}>
          {suggestions.map((s, i) => {
            const color = catColor(s.category);
            const name = s.pantry_alias || s.alias;
            return (
              <div
                key={name}
                onMouseDown={e => { e.preventDefault(); pick(s); }}
                onMouseEnter={() => setHi(i)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  gap: 10, padding: "9px 14px", cursor: "pointer",
                  background: i === hi ? C.accentLight : C.card,
                  borderBottom: i < suggestions.length - 1 ? `1px solid ${alpha(C.border, 33)}` : "none",
                }}
              >
                <span style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color, flexShrink: 0,
                  background: alpha(color, 10), border: `1px solid ${alpha(color, 27)}`,
                  borderRadius: RADIUS.full, padding: "2px 8px",
                  letterSpacing: 0.4, textTransform: "uppercase",
                }}>
                  {s.category}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Pantry({ pantry, setPantry, userId, pantryCategories, pantryUnits }) {
  const [showAdd, setShowAdd]  = useState(false);
  const [form, setForm]        = useState(BLANK);
  const [search, setSearch]    = useState("");
  const [cat, setCat]          = useState("All");
  const [removing, setRemoving] = useState(() => new Set()); // ids mid-exit

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addItem = async () => {
    if (!form.name || !form.qty) return;
    const item = { name: form.name, qty: parseFloat(form.qty), unit: form.unit, category: form.category, expiry: form.expiry };
    const saved = await insertPantryItem(item, userId).catch(console.error);
    if (saved) setPantry(p => mergePantryRows(p, [saved]));
    setForm(BLANK);
    setShowAdd(false);
  };

  const removeItem = (id) => {
    // Play the exit first, then drop the row. The DB delete fires in parallel;
    // the row is already flagged non-interactive by the `removing` class.
    setRemoving(prev => new Set(prev).add(id));
    deletePantryItem(id).catch(console.error);
    setTimeout(() => {
      setPantry(p => p.filter(i => i.id !== id));
      setRemoving(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 180);
  };

  const categories = ["All", ...categoriesOf(pantry, pantryCategories)];

  const filtered = pantry.filter(
    p => (cat === "All" || catOf(p) === cat)
      && p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Summary by category — straight from the items' own category column
  const summary = categoriesOf(pantry, pantryCategories);

  return (
    <Page>
      <PageHeader
        title="Pantry"
        subtitle={`${pantry.length} items tracked`}
        action={
          <Btn onClick={() => setShowAdd(v => !v)}>
            {showAdd ? "Cancel" : "+ Add Item"}
          </Btn>
        }
      />

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {summary.map(c => {
          const count = pantry.filter(p => catOf(p) === c).length;
          const color = catColor(c);
          return (
            <div key={c} style={{
              padding: "5px 14px", borderRadius: RADIUS.full,
              background: alpha(color, 10), color, border: `1px solid ${alpha(color, 27)}`,
              fontSize: 12, fontWeight: 500,
            }}>
              {c} · {count}
            </div>
          );
        })}
      </div>

      {/* Add item form */}
      {showAdd && (
        <div className="sr-pop">
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: C.text }}>
            Add Pantry Item
          </h3>
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end",
          }}>
            <div style={{ flex: 2, minWidth: 180 }}>
              <ItemNameAutocomplete
                value={form.name}
                onChange={v => set("name", v)}
                onPick={(name, category) =>
                  setForm(f => ({ ...f, name, category: category ?? f.category }))}
                pantryCategories={pantryCategories}
              />
            </div>
            <div style={{ width: 90 }}>
              <Input
                label="Quantity *"
                value={form.qty}
                onChange={e => set("qty", e.target.value)}
                type="number"
              />
            </div>
            <div style={{ width: 100 }}>
              <Select
                label="Unit"
                value={form.unit}
                onChange={e => set("unit", e.target.value)}
                options={pantryUnits}
              />
            </div>
            <div style={{ width: 140 }}>
              <Select
                label="Category"
                value={form.category}
                onChange={e => set("category", e.target.value)}
                options={pantryCategories}
              />
            </div>
            <div style={{ width: 150 }}>
              <Input
                label="Expiry Date"
                value={form.expiry}
                onChange={e => set("expiry", e.target.value)}
                type="date"
              />
            </div>
            <Btn onClick={addItem} disabled={!form.name || !form.qty}>
              Save
            </Btn>
          </div>
        </Card>
        </div>
      )}

      {/* Search & category filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search pantry…"
          style={{
            flex: 1, minWidth: 200,
            background: C.card, border: `1.5px solid ${C.border}`,
            borderRadius: RADIUS.md, padding: "10px 16px",
            fontSize: 14, color: C.text,
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categories.map(c => (
            <button
              key={c}
              className="sr-press"
              onClick={() => setCat(c)}
              style={{
                padding: "8px 14px", borderRadius: RADIUS.sm,
                border: `1.5px solid ${cat === c ? C.accent : C.border}`,
                background: cat === c ? C.accentLight : C.card,
                color: cat === c ? C.accent : C.textSub,
                fontSize: 13, cursor: "pointer", fontFamily: FONTS.body,
                fontWeight: cat === c ? 600 : 400,
                transition: "background 0.18s, border-color 0.18s, color 0.18s, transform 0.14s ease-out",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* The shelves — everything you own, standing in rows (V2 language) */}
      {filtered.length === 0 ? (
        <Empty
          icon={<IngredientArt name="jar" size={56} />}
          title="No items found"
          subtitle="Add your first pantry item or try a different search."
          action={<Btn onClick={() => setShowAdd(true)}>+ Add Item</Btn>}
        />
      ) : (
        <div className="sr-panel clip" style={{ paddingBottom: 10 }}>
          <Watermark symbol="i-garlic" size={170} style={{ left: -32, top: -22 }} />
          <Watermark symbol="i-herb" size={190} style={{ right: -28, bottom: -36, transform: "rotate(14deg)" }} />

          {categoriesOf(filtered, pantryCategories)
            .map(category => {
              const color = catColor(category);
              const shelfItems = filtered.filter(p => catOf(p) === category);
              return (
                <div key={category} style={{ marginBottom: 22, position: "relative" }}>
                  <div style={{
                    fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
                    color: C.textMuted, marginBottom: 2, display: "flex", gap: 8, alignItems: "center",
                  }}>
                    <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                    {category} · {shelfItems.length}
                  </div>
                  <div className="sr-shelf">
                    {shelfItems.map(item => (
                      <div key={item.id} className={`sr-pitem${removing.has(item.id) ? " removing" : ""}`} tabIndex={0}>
                        <ExpiryBadge dateStr={item.expiry} />
                        <IngredientArt
                          name={item.name}
                          category={item.category}
                          size={44}
                          jarColor={color}
                        />
                        <div className="truncate" style={{
                          fontSize: 12, color: C.text, marginTop: 5, maxWidth: 110,
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          fontSize: 10, color: C.textMuted, fontVariantNumeric: "tabular-nums",
                        }}>
                          {item.qty} {item.unit}
                          <button
                            className="sr-press"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name} from pantry`}
                            style={{
                              background: "none", border: "none", color: C.textMuted,
                              cursor: "pointer", padding: 0,
                              // 44×44 tap target; negative margins absorb the extra
                              // size so the tight card row keeps its height.
                              minWidth: 44, minHeight: 44,
                              margin: "-11px -4px -11px 0", marginLeft: 4,
                              display: "inline-flex", alignItems: "center",
                              justifyContent: "center", verticalAlign: "middle",
                              transition: "color 0.18s, transform 0.14s ease-out",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = "var(--c2)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "var(--faint)"; }}
                          >
                            <IconX size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </Page>
  );
}
