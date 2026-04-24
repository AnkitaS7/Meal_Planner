import { useState, useEffect } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Card, Btn, Page, PageHeader } from "../components/ui";
import {
  fetchShoppingNeeded, fetchManualShoppingItems,
  addManualShoppingItem, toggleManualShoppingItem, deleteManualShoppingItem,
  getWeekStart,
} from "../lib/db";

export default function Shopping({ userId }) {
  const weekStart = getWeekStart();

  const [needed, setNeeded]     = useState([]); // { name, type, dish_name }
  const [have, setHave]         = useState([]); // ingredient names in pantry
  const [optNeed, setOptNeed]   = useState([]); // optional items not in pantry
  const [manual, setManual]     = useState([]); // shopping_list_items rows
  const [autoChecked, setAutoChecked] = useState({}); // local check state for auto items
  const [extraInput, setExtraInput]   = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetchShoppingNeeded(userId, weekStart),
      fetchManualShoppingItems(userId, weekStart),
    ])
      .then(([shoppingRows, manualRows]) => {
        const seen = new Set();
        const req_needed = [], req_have = [], opt_needed = [];

        shoppingRows.forEach(r => {
          const key = `${r.ingredient_name.toLowerCase()}:${r.type}`;
          if (seen.has(key)) return;
          seen.add(key);

          if (r.type === "required") {
            if (r.in_pantry) req_have.push(r.ingredient_name);
            else req_needed.push({ name: r.ingredient_name, dish: r.dish_name });
          } else {
            if (!r.in_pantry) opt_needed.push({ name: r.ingredient_name, dish: r.dish_name });
          }
        });

        setNeeded(req_needed);
        setHave(req_have);
        setOptNeed(opt_needed);
        setManual(manualRows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, weekStart]);

  const totalItems = needed.length + optNeed.length + manual.length;
  const doneAuto   = Object.values(autoChecked).filter(Boolean).length;
  const doneManual = manual.filter(m => m.is_checked).length;
  const doneItems  = doneAuto + doneManual;

  const toggleAuto = (name) =>
    setAutoChecked(c => ({ ...c, [name]: !c[name] }));

  const toggleManual = async (item) => {
    const newVal = !item.is_checked;
    setManual(m => m.map(x => x.id === item.id ? { ...x, is_checked: newVal } : x));
    await toggleManualShoppingItem(item.id, newVal).catch(console.error);
  };

  const addExtra = async () => {
    const val = extraInput.trim();
    if (!val) return;
    setExtraInput("");
    const saved = await addManualShoppingItem(userId, val, weekStart).catch(console.error);
    if (saved) setManual(m => [...m, saved]);
  };

  const removeExtra = async (id) => {
    setManual(m => m.filter(x => x.id !== id));
    await deleteManualShoppingItem(id).catch(console.error);
  };

  const AutoCheckItem = ({ item }) => {
    const checked = !!autoChecked[item.name];
    return (
      <div
        onClick={() => toggleAuto(item.name)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "11px 14px", borderRadius: RADIUS.md,
          background: checked ? C.sageLight : C.bg,
          cursor: "pointer", transition: "background 0.18s", userSelect: "none",
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
          border: `2px solid ${checked ? C.sage : C.borderDark}`,
          background: checked ? C.sage : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.18s",
        }}>
          {checked && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{
            fontSize: 14, color: checked ? C.textMuted : C.text,
            textDecoration: checked ? "line-through" : "none",
          }}>
            {item.name}
          </span>
          {item.dish && (
            <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>
              ({item.dish})
            </span>
          )}
        </div>
      </div>
    );
  };

  const ManualCheckItem = ({ item }) => (
    <div
      onClick={() => toggleManual(item)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "11px 14px", borderRadius: RADIUS.md,
        background: item.is_checked ? C.sageLight : C.bg,
        cursor: "pointer", transition: "background 0.18s", userSelect: "none",
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${item.is_checked ? C.sage : C.borderDark}`,
        background: item.is_checked ? C.sage : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s",
      }}>
        {item.is_checked && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
      </div>
      <span style={{
        fontSize: 14, flex: 1,
        color: item.is_checked ? C.textMuted : C.text,
        textDecoration: item.is_checked ? "line-through" : "none",
      }}>
        {item.name}
      </span>
      <button
        onClick={e => { e.stopPropagation(); removeExtra(item.id); }}
        style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14 }}
      >
        ✕
      </button>
    </div>
  );

  return (
    <Page>
      <PageHeader
        title="Shopping List"
        subtitle="Based on this week's meal plan · Pantry items excluded"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary">🖨 Print</Btn>
            <Btn variant="sage">📤 Export</Btn>
          </div>
        }
      />

      {/* Progress banner */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: RADIUS.lg, padding: "16px 20px",
        marginBottom: 24,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: C.textSub, marginBottom: 6 }}>
            {doneItems} of {totalItems} items collected
          </div>
          <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${totalItems ? (doneItems / totalItems) * 100 : 0}%`,
              background: doneItems === totalItems && totalItems > 0 ? C.success : C.accent,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.accent, fontFamily: FONTS.display }}>
          {totalItems - doneItems}
          <span style={{ fontSize: 13, color: C.textMuted, fontFamily: FONTS.body, marginLeft: 4 }}>left</span>
        </div>
      </div>

      {loading ? (
        <div style={{ color: C.textMuted, fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Loading shopping list…
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Required items to buy */}
            <Card>
              <h3 style={{ fontFamily: FONTS.display, fontSize: 20, marginBottom: 4, color: C.text }}>
                🛒 Items to Buy
              </h3>
              <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
                {needed.length} required ingredients missing from pantry
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {needed.length === 0 ? (
                  <div style={{ fontSize: 13, color: C.textMuted }}>Everything is stocked!</div>
                ) : (
                  needed.map(item => <AutoCheckItem key={item.name} item={item} />)
                )}
              </div>
            </Card>

            {/* Optional items */}
            {optNeed.length > 0 && (
              <Card>
                <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 4, color: C.text }}>
                  ✨ Optional Ingredients
                </h3>
                <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>
                  Nice to have but not required
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {optNeed.map(item => <AutoCheckItem key={item.name} item={item} />)}
                </div>
              </Card>
            )}

            {/* Custom extras */}
            <Card>
              <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 14, color: C.text }}>
                ➕ Add Custom Items
              </h3>
              {manual.map(item => (
                <div key={item.id} style={{ marginBottom: 6 }}>
                  <ManualCheckItem item={item} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={extraInput}
                  onChange={e => setExtraInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addExtra()}
                  placeholder="Type item and press Enter…"
                  style={{
                    flex: 1, background: C.bg,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: RADIUS.md, padding: "10px 14px",
                    fontSize: 14, color: C.text,
                  }}
                />
                <Btn onClick={addExtra} disabled={!extraInput.trim()}>Add</Btn>
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Already in pantry */}
            <Card>
              <h3 style={{ fontFamily: FONTS.display, fontSize: 20, marginBottom: 4, color: C.text }}>
                ✅ Already in Pantry
              </h3>
              <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
                {have.length} items covered — no need to buy
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {have.map(name => (
                  <div key={name} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "11px 14px", borderRadius: RADIUS.md, background: C.sageLight,
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: C.sage, display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <span style={{ color: "#fff", fontSize: 11 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 14, color: C.sageDark }}>{name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </Page>
  );
}
