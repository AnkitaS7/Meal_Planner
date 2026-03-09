import { useState } from "react";
import { C, FONTS, RADIUS } from "../theme";
import {
  Card, Btn, Input, Select, Page, PageHeader, Empty, SectionLabel,
} from "../components/ui";
import { PANTRY_CATEGORIES, PANTRY_UNITS } from "../data/mockData";

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

export default function Pantry({ pantry, setPantry }) {
  const [showAdd, setShowAdd]  = useState(false);
  const [form, setForm]        = useState(BLANK);
  const [search, setSearch]    = useState("");
  const [cat, setCat]          = useState("All");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addItem = () => {
    if (!form.name || !form.qty) return;
    setPantry(p => [
      ...p,
      { id: Date.now(), name: form.name, qty: parseFloat(form.qty), unit: form.unit, category: form.category, expiry: form.expiry },
    ]);
    setForm(BLANK);
    setShowAdd(false);
  };

  const removeItem = (id) => setPantry(p => p.filter(i => i.id !== id));

  const categories = ["All", ...new Set(pantry.map(p => p.category))];

  const filtered = pantry.filter(
    p => (cat === "All" || p.category === cat)
      && p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Summary by category
  const summary = PANTRY_CATEGORIES.filter(c => pantry.some(p => p.category === c));

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
              <Input
                label="Item Name *"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="e.g. Olive oil"
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
                options={PANTRY_UNITS}
              />
            </div>
            <div style={{ width: 140 }}>
              <Select
                label="Category"
                value={form.category}
                onChange={e => set("category", e.target.value)}
                options={PANTRY_CATEGORIES}
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
