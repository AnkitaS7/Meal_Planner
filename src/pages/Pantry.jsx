import { useState, useEffect, useRef } from "react";
import { C, FONTS, RADIUS, SHADOW } from "../theme";
import {
  Card, Btn, Input, Select, Page, PageHeader, Empty, SectionLabel,
} from "../components/ui";

import { insertPantryItem, deletePantryItem, searchIngredientAliases } from "../lib/db";

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

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24));
}

function ExpiryLabel({ dateStr }) {
  const days = daysUntilExpiry(dateStr);
  if (days === null) return null;
  const color = days < 0 ? C.error : days < 3 ? C.error : days < 7 ? C.warning : C.textMuted;
  const text  = days < 0 ? "⚠ Expired" : days === 0 ? "⚠ Expires today" : `Expires in ${days}d`;
  return (
    <div style={{
      fontSize: 11, fontWeight: days < 7 ? 700 : 400,
      color, marginTop: 10,
    }}>
      {text}
    </div>
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
    onPick(s.alias, pantryCategories.includes(s.category) ? s.category : null);
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
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30,
          marginTop: 4, background: "#fff",
          border: `1.5px solid ${C.border}`, borderRadius: RADIUS.md,
          boxShadow: SHADOW.md, overflow: "hidden", maxHeight: 264, overflowY: "auto",
        }}>
          {suggestions.map((s, i) => {
            const color = CAT_COLORS[s.category] ?? C.textSub;
            return (
              <div
                key={s.alias}
                onMouseDown={e => { e.preventDefault(); pick(s); }}
                onMouseEnter={() => setHi(i)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  gap: 10, padding: "9px 14px", cursor: "pointer",
                  background: i === hi ? C.accentLight : "#fff",
                  borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}55` : "none",
                }}
              >
                <span style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.alias}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color, flexShrink: 0,
                  background: color + "18", border: `1px solid ${color}44`,
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

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addItem = async () => {
    if (!form.name || !form.qty) return;
    const item = { name: form.name, qty: parseFloat(form.qty), unit: form.unit, category: form.category, expiry: form.expiry };
    const saved = await insertPantryItem(item, userId).catch(console.error);
    if (saved) setPantry(p => [...p, saved]);
    setForm(BLANK);
    setShowAdd(false);
  };

  const removeItem = async (id) => {
    await deletePantryItem(id).catch(console.error);
    setPantry(p => p.filter(i => i.id !== id));
  };

  const categories = ["All", ...new Set(pantry.map(p => p.category))];

  const filtered = pantry.filter(
    p => (cat === "All" || p.category === cat)
      && p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Summary by category
  const summary = pantryCategories.filter(c => pantry.some(p => p.category === c));

  return (
    <Page>
      <PageHeader
        title="Pantry"
        subtitle={`${pantry.length} items tracked`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" onClick={() => {}}>📷 Scan Bill</Btn>
            <Btn onClick={() => setShowAdd(v => !v)}>
              {showAdd ? "✕ Cancel" : "+ Add Item"}
            </Btn>
          </div>
        }
      />

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {summary.map(c => {
          const count = pantry.filter(p => p.category === c).length;
          const color = CAT_COLORS[c] ?? C.textSub;
          return (
            <div key={c} style={{
              padding: "5px 14px", borderRadius: RADIUS.full,
              background: color + "18", color, border: `1px solid ${color}44`,
              fontSize: 12, fontWeight: 500,
            }}>
              {c} · {count}
            </div>
          );
        })}
      </div>

      {/* Add item form */}
      {showAdd && (
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
      )}

      {/* Search & category filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search pantry…"
          style={{
            flex: 1, minWidth: 200,
            background: "#fff", border: `1.5px solid ${C.border}`,
            borderRadius: RADIUS.md, padding: "10px 16px",
            fontSize: 14, color: C.text,
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: "8px 14px", borderRadius: RADIUS.sm,
                border: `1.5px solid ${cat === c ? C.accent : C.border}`,
                background: cat === c ? C.accentLight : "#fff",
                color: cat === c ? C.accent : C.textSub,
                fontSize: 13, cursor: "pointer", fontFamily: FONTS.body,
                fontWeight: cat === c ? 600 : 400, transition: "all 0.18s",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      {filtered.length === 0 ? (
        <Empty
          icon="🏺"
          title="No items found"
          subtitle="Add your first pantry item or try a different search."
          action={<Btn onClick={() => setShowAdd(true)}>+ Add Item</Btn>}
        />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: 14,
        }}>
          {filtered.map(item => {
            const color = CAT_COLORS[item.category] ?? C.textMuted;
            return (
              <div key={item.id} style={{
                background: "#fff", border: `1px solid ${C.border}`,
                borderRadius: RADIUS.lg, padding: 18, position: "relative",
              }}>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    position: "absolute", top: 12, right: 12,
                    background: "none", border: "none",
                    color: C.textMuted, cursor: "pointer", fontSize: 14,
                  }}
                >
                  ✕
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
                  <span style={{
                    fontSize: 10, fontWeight: 700, color,
                    letterSpacing: 0.5, textTransform: "uppercase",
                  }}>
                    {item.category}
                  </span>
                </div>

                <div style={{ fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 8 }}>
                  {item.name}
                </div>

                <div style={{
                  fontSize: 22, fontWeight: 700, color,
                  fontFamily: FONTS.display,
                }}>
                  {item.qty}{" "}
                  <span style={{ fontSize: 13, color: C.textMuted, fontFamily: FONTS.body }}>
                    {item.unit}
                  </span>
                </div>

                <ExpiryLabel dateStr={item.expiry} />
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
