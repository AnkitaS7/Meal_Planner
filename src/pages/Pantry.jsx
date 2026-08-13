import { useState, useEffect, useRef } from "react";
import { C, FONTS, RADIUS, SHADOW, alpha } from "../theme";
import { IngredientArt, Watermark } from "../components/art";
import {
  Card, Btn, Input, Select, Page, PageHeader, Empty, IconX,
} from "../components/ui";

import {
  insertPantryItem, deletePantryItem, updatePantryQty,
  searchIngredientAliases, mergePantryRows,
} from "../lib/db";

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

// Freshness is the axis the pantry is really organised around: what needs
// using before it turns. Everything downstream (the "Use soon" strip, the
// per-item dot, the Fresh view) reads from this single classifier.
function freshness(expiry) {
  const d = daysUntilExpiry(expiry);
  if (d === null) return { level: "none",    color: C.textMuted, days: null };
  if (d < 0)      return { level: "expired", color: C.error,     days: d };
  if (d <= 3)     return { level: "urgent",  color: C.error,     days: d };
  if (d <= 7)     return { level: "soon",    color: C.warning,   days: d };
  return               { level: "fresh",   color: C.success,   days: d };
}

function freshnessLabel(days) {
  if (days === null) return "";
  if (days < 0)  return "expired";
  if (days === 0) return "today";
  return `${days} d`;
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

// A single pantry item. The −/＋ stepper is the primary gesture: you decrement
// as you cook, and hitting zero removes the row. Delete is the small corner
// escape hatch. A freshness cue sits opposite it.
function PantryCard({ item, accent, onDec, onInc, onRemove, flashing, removing }) {
  const f = freshness(item.expiry);
  const soon = f.days !== null && f.days <= 7;

  return (
    <div
      className={`sr-pitem${removing ? " removing" : ""}${flashing ? " sr-flash" : ""}`}
      tabIndex={0}
      style={{ minWidth: 128 }}
    >
      {/* Delete — demoted to a subtle corner escape hatch */}
      <button
        className="sr-press"
        onClick={onRemove}
        aria-label={`Remove ${item.name} from pantry`}
        style={{
          position: "absolute", top: 3, left: 3, zIndex: 2,
          width: 26, height: 26, borderRadius: "50%",
          border: "none", background: "none", color: C.textMuted,
          cursor: "pointer", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          transition: "background 0.18s, color 0.18s, transform 0.14s ease-out",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "var(--c2)"; e.currentTarget.style.background = alpha(C.error, 10); }}
        onMouseLeave={e => { e.currentTarget.style.color = "var(--faint)"; e.currentTarget.style.background = "none"; }}
      >
        <IconX size={10} />
      </button>

      {/* Freshness cue, opposite the delete affordance */}
      {f.level !== "none" && (
        soon ? (
          <span style={{
            position: "absolute", top: 2, right: 2, zIndex: 2,
            background: alpha(f.color, 12), color: f.color,
            border: `1px solid ${alpha(f.color, 35)}`,
            fontSize: 9, fontWeight: 700, borderRadius: 999,
            padding: "1px 7px", letterSpacing: "0.06em",
          }}>
            {freshnessLabel(f.days)}
          </span>
        ) : (
          <span aria-label="fresh" title="Fresh" style={{
            position: "absolute", top: 8, right: 8, zIndex: 2,
            width: 8, height: 8, borderRadius: "50%", background: f.color,
          }} />
        )
      )}

      <IngredientArt name={item.name} category={item.category} size={44} jarColor={accent} />

      <div className="truncate" style={{ fontSize: 12, color: C.text, marginTop: 5, maxWidth: 116 }}>
        {item.name}
      </div>

      {/* Quantity stepper */}
      <div className="sr-stepper">
        <button
          className="sr-press sr-step"
          onClick={onDec}
          aria-label={item.qty <= 1 ? `Remove ${item.name}` : `Use one ${item.unit} of ${item.name}`}
        >
          <span aria-hidden="true">−</span>
        </button>
        <span style={{ fontSize: 11, color: C.textMuted, fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "center" }}>
          {item.qty} {item.unit}
        </span>
        <button
          className="sr-press sr-step"
          onClick={onInc}
          aria-label={`Add one ${item.unit} of ${item.name}`}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}

// Matches App's breakpoint. Below it the Add control becomes a thumb-reachable
// FAB + bottom sheet; at desktop widths it lives inline in the toolbar.
function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const handler = e => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

export default function Pantry({ pantry, setPantry, userId, pantryCategories, pantryUnits, onScan }) {
  const isMobile = useIsMobile();
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState(BLANK);
  const [search, setSearch]       = useState("");
  const [view, setView]           = useState("shelf"); // shelf | fresh | az
  const [removing, setRemoving]   = useState(() => new Set()); // ids mid-exit
  const [flashId, setFlashId]     = useState(null);            // just added / changed

  // Bottom-sheet mount + slide state for the mobile add flow (animates both in
  // and out; the panel stays mounted through its slide-down before unmounting).
  const [sheetMounted, setSheetMounted] = useState(false);
  const [sheetShown, setSheetShown]     = useState(false);
  useEffect(() => {
    if (showAdd && isMobile) {
      setSheetMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setSheetShown(true)));
      return () => cancelAnimationFrame(r);
    }
    setSheetShown(false);
    const t = setTimeout(() => setSheetMounted(false), 280);
    return () => clearTimeout(t);
  }, [showAdd, isMobile]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const flash = (id) => {
    setFlashId(id);
    setTimeout(() => setFlashId(cur => (cur === id ? null : cur)), 1100);
  };

  const addItem = async () => {
    const qty = parseFloat(form.qty);
    if (!form.name || !(qty > 0)) return;   // name required, quantity must be positive
    const item = { name: form.name, qty, unit: form.unit, category: form.category, expiry: form.expiry };
    const saved = await insertPantryItem(item, userId).catch(console.error);
    if (saved) { setPantry(p => mergePantryRows(p, [saved])); flash(saved.id); }
    // Keep the panel open and ready for the next item — the common case is
    // stocking several things at once. Clear only name/qty/expiry.
    setForm(f => ({ ...f, name: "", qty: "", expiry: "" }));
  };

  const removeItem = (id) => {
    setRemoving(prev => new Set(prev).add(id));
    deletePantryItem(id).catch(console.error);
    setTimeout(() => {
      setPantry(p => p.filter(i => i.id !== id));
      setRemoving(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 180);
  };

  // Optimistic quantity change: reflect it instantly, persist in the
  // background, and roll back on failure. Decrementing past 1 removes the row.
  const changeQty = (item, delta) => {
    const next = item.qty + delta;
    if (next < 1) { removeItem(item.id); return; }
    setPantry(p => p.map(i => i.id === item.id ? { ...i, qty: next } : i));
    flash(item.id);
    updatePantryQty(item.id, next).catch(err => {
      console.error(err);
      setPantry(p => p.map(i => i.id === item.id ? { ...i, qty: item.qty } : i));
    });
  };

  const filtered = pantry.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // Anything within a week (expired included), soonest first. Drawn from the
  // whole pantry, not the filtered view — it's a standing alert.
  const useSoon = pantry
    .filter(p => { const d = daysUntilExpiry(p.expiry); return d !== null && d <= 7; })
    .sort((a, b) => daysUntilExpiry(a.expiry) - daysUntilExpiry(b.expiry));

  const groups = groupItems(filtered, view, pantryCategories);

  const countLine = `${pantry.length} item${pantry.length === 1 ? "" : "s"} tracked`
    + (useSoon.length ? ` · ${useSoon.length} to use soon` : "");

  // The add-form body — shared verbatim by the desktop inline panel and the
  // mobile bottom sheet, so both stay in lockstep. All fields are shown at once.
  const addFields = (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
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
          onKeyDown={e => { if (e.key === "Enter") addItem(); }}
          type="number"
          min="0"
          step="any"
        />
      </div>
      <div style={{ width: 100 }}>
        <Select label="Unit" value={form.unit} onChange={e => set("unit", e.target.value)} options={pantryUnits} />
      </div>
      <div style={{ width: 140 }}>
        <Select label="Category" value={form.category} onChange={e => set("category", e.target.value)} options={pantryCategories} />
      </div>
      <div style={{ width: 150 }}>
        <Input label="Expiry Date" value={form.expiry} onChange={e => set("expiry", e.target.value)} type="date" />
      </div>
      <Btn onClick={addItem} disabled={!form.name || !(parseFloat(form.qty) > 0)}>Add</Btn>
    </div>
  );

  return (
    <Page>
      <PageHeader
        title="Pantry"
        subtitle={countLine}
        eyebrow="Your shelf"
        color={C.c4}
        motif="i-jar"
      />

      {/* Use-soon triage — the one band that drives action */}
      {useSoon.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
            color: C.textMuted, marginBottom: 8, display: "flex", gap: 8, alignItems: "center",
          }}>
            <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: C.warning }} />
            Use soon · {useSoon.length}
          </div>
          <div className="sr-usesoon">
            {useSoon.map(item => {
              const f = freshness(item.expiry);
              return (
                <button
                  key={item.id}
                  className="sr-press"
                  onClick={() => setSearch(item.name)}
                  title={`Find ${item.name}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                    padding: "7px 12px 7px 8px", borderRadius: RADIUS.full,
                    border: `1.5px solid ${alpha(f.color, 40)}`,
                    background: alpha(f.color, 8), cursor: "pointer",
                    fontFamily: FONTS.body, transition: "transform 0.14s ease-out",
                  }}
                >
                  <IngredientArt name={item.name} category={item.category} size={26} jarColor={catColor(item.category)} />
                  <span style={{ fontSize: 12, color: C.text, whiteSpace: "nowrap" }}>{item.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: f.color, whiteSpace: "nowrap" }}>
                    {freshnessLabel(f.days)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick-add UI lives below the toolbar (desktop) or in a bottom sheet
          (mobile) — see below. */}

      {/* Toolbar: add (desktop) + search + view switch */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {!isMobile && (
          <Btn onClick={() => setShowAdd(v => !v)}>{showAdd ? "Close" : "+ Add"}</Btn>
        )}
        {onScan && (
          <Btn variant="sage" onClick={onScan}>Scan</Btn>
        )}
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
        <div style={{ display: "flex", gap: 4, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: RADIUS.full, padding: 3 }}>
          {[["shelf", "Shelf"], ["fresh", "Freshness"], ["az", "A–Z"]].map(([id, label]) => (
            <button
              key={id}
              className="sr-press"
              onClick={() => setView(id)}
              aria-pressed={view === id}
              style={{
                padding: "6px 14px", borderRadius: RADIUS.full, border: "none",
                background: view === id ? C.accentLight : "transparent",
                color: view === id ? C.accent : C.textSub,
                fontSize: 12, fontWeight: view === id ? 700 : 500,
                cursor: "pointer", fontFamily: FONTS.body,
                transition: "background 0.18s, color 0.18s, transform 0.14s ease-out",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: quick-add panel opens inline, right under the toolbar button */}
      {!isMobile && showAdd && (
        <div className="sr-pop">
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: C.text }}>
              Add Pantry Item
            </h3>
            {addFields}
          </Card>
        </div>
      )}

      {/* Body */}
      {pantry.length === 0 ? (
        <Empty
          icon={<IngredientArt name="jar" size={56} />}
          title="Your pantry is empty"
          subtitle="Scan a grocery receipt to fill it fast, or add your first item by hand."
          action={
            <div style={{ display: "flex", gap: 8 }}>
              {onScan && <Btn variant="sage" onClick={onScan}>Scan a receipt</Btn>}
              <Btn onClick={() => setShowAdd(true)}>+ Add Item</Btn>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <Empty
          icon={<IngredientArt name="chili" size={56} />}
          title="No items match your search"
          subtitle="Try a different term."
          action={<Btn variant="secondary" onClick={() => setSearch("")}>Clear search</Btn>}
        />
      ) : (
        <div className="sr-panel sr-tint-4 clip" style={{ paddingBottom: 10 }}>
          <Watermark symbol="i-garlic" size={170} style={{ left: -32, top: -22 }} />
          <Watermark symbol="i-herb" size={190} style={{ right: -28, bottom: -36, transform: "rotate(14deg)" }} />

          {groups.map(group => (
            <div key={group.label ?? "all"} style={{ marginBottom: 22, position: "relative" }}>
              {group.label && (
                <div style={{
                  fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
                  color: C.textMuted, marginBottom: 2, display: "flex", gap: 8, alignItems: "center",
                }}>
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: group.color }} />
                  {group.label} · {group.items.length}
                </div>
              )}
              <div className="sr-shelf">
                {group.items.map(item => (
                  <PantryCard
                    key={item.id}
                    item={item}
                    accent={catColor(item.category)}
                    onDec={() => changeQty(item, -1)}
                    onInc={() => changeQty(item, +1)}
                    onRemove={() => removeItem(item.id)}
                    flashing={flashId === item.id}
                    removing={removing.has(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile: a thumb-reachable FAB that opens the add form as a bottom sheet */}
      {isMobile && (
        <button
          className="sr-fab sr-press"
          onClick={() => setShowAdd(v => !v)}
          aria-label={showAdd ? "Close add item" : "Add pantry item"}
          aria-expanded={showAdd}
        >
          <span aria-hidden="true">+</span>
        </button>
      )}
      {isMobile && sheetMounted && (
        <>
          <div
            className={`sr-sheet-backdrop${sheetShown ? " open" : ""}`}
            onClick={() => setShowAdd(false)}
          />
          <div className={`sr-sheet${sheetShown ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="Add pantry item">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Add Pantry Item</h3>
              <button
                className="sr-press"
                onClick={() => setShowAdd(false)}
                aria-label="Close"
                style={{
                  width: 36, height: 36, borderRadius: "50%", border: "none",
                  background: C.bg, color: C.textSub, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.14s ease-out",
                }}
              >
                <IconX size={14} />
              </button>
            </div>
            {addFields}
          </div>
        </>
      )}
    </Page>
  );
}

// Group the (already search-filtered) items for the active view. Each group is
// { label, color, items }; a null label renders as a single headerless grid.
function groupItems(items, view, pantryCategories) {
  if (view === "az") {
    return [{ label: null, color: null, items: [...items].sort((a, b) => a.name.localeCompare(b.name)) }];
  }
  if (view === "fresh") {
    const buckets = [
      { label: "Expired",        color: C.error,     test: d => d !== null && d < 0 },
      { label: "Use within 3 days", color: C.error,  test: d => d !== null && d >= 0 && d <= 3 },
      { label: "Use this week",  color: C.warning,   test: d => d !== null && d > 3 && d <= 7 },
      { label: "Fresh",          color: C.success,   test: d => d !== null && d > 7 },
      { label: "No expiry date", color: C.textMuted, test: d => d === null },
    ];
    return buckets
      .map(b => ({
        label: b.label, color: b.color,
        items: items
          .filter(i => b.test(daysUntilExpiry(i.expiry)))
          .sort((a, b) => (daysUntilExpiry(a.expiry) ?? 1e9) - (daysUntilExpiry(b.expiry) ?? 1e9)),
      }))
      .filter(g => g.items.length);
  }
  // shelf (category)
  return categoriesOf(items, pantryCategories).map(category => ({
    label: category, color: catColor(category),
    items: items.filter(i => catOf(i) === category),
  }));
}
