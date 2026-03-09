import { useState } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Card, Btn, Tag, Page, PageHeader } from "../components/ui";

export default function Shopping({ dishes, pantry }) {
  // Derive needed & have from meal-plan dishes (first 3 for demo)
  const mealDishes  = dishes.slice(0, 3);
  const allReq      = mealDishes.flatMap(d => d.reqIngredients);
  const allOpt      = mealDishes.flatMap(d => d.optIngredients);
  const pantrySet   = new Set(pantry.map(p => p.name.toLowerCase()));

  const needed  = [...new Set(allReq)].filter(i => !pantrySet.has(i.toLowerCase()));
  const have    = [...new Set(allReq)].filter(i => pantrySet.has(i.toLowerCase()));
  const optNeed = [...new Set(allOpt)].filter(i => !pantrySet.has(i.toLowerCase()));

  const [checked, setChecked]    = useState({});
  const [extras, setExtras]      = useState([]);
  const [extraInput, setExtraInput] = useState("");

  const toggle = (item) => setChecked(c => ({ ...c, [item]: !c[item] }));

  const addExtra = () => {
    const val = extraInput.trim();
    if (val && !extras.includes(val)) {
      setExtras(e => [...e, val]);
    }
    setExtraInput("");
  };

  const removeExtra = (item) => setExtras(e => e.filter(x => x !== item));

  const totalItems  = needed.length + extras.length;
  const doneItems   = Object.values(checked).filter(Boolean).length;

  const CheckItem = ({ item, onRemove }) => (
    <div
      onClick={() => toggle(item)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "11px 14px", borderRadius: RADIUS.md,
        background: checked[item] ? C.sageLight : C.bg,
        cursor: "pointer", transition: "background 0.18s",
        userSelect: "none",
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${checked[item] ? C.sage : C.borderDark}`,
        background: checked[item] ? C.sage : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s",
      }}>
        {checked[item] && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
      </div>

      <span style={{
        fontSize: 14, flex: 1,
        color: checked[item] ? C.textMuted : C.text,
        textDecoration: checked[item] ? "line-through" : "none",
      }}>
        {item}
      </span>

      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(item); }}
          style={{
            background: "none", border: "none",
            color: C.textMuted, cursor: "pointer", fontSize: 14,
          }}
        >
          ✕
        </button>
      )}
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
              background: doneItems === totalItems ? C.success : C.accent,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
        <div style={{
          fontSize: 24, fontWeight: 700, color: C.accent,
          fontFamily: FONTS.display,
        }}>
          {totalItems - doneItems}
          <span style={{ fontSize: 13, color: C.textMuted, fontFamily: FONTS.body, marginLeft: 4 }}>
            left
          </span>
        </div>
      </div>

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
              {needed.map(item => <CheckItem key={item} item={item} />)}
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
                {optNeed.map(item => <CheckItem key={item} item={item} />)}
              </div>
            </Card>
          )}

          {/* Custom extras */}
          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 14, color: C.text }}>
              ➕ Add Custom Items
            </h3>
            {extras.map(item => (
              <div key={item} style={{ marginBottom: 6 }}>
                <CheckItem item={item} onRemove={removeExtra} />
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
              {have.map(item => (
                <div key={item} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "11px 14px", borderRadius: RADIUS.md,
                  background: C.sageLight,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    background: C.sage, display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ color: "#fff", fontSize: 11 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: C.sageDark }}>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Which dishes */}
          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 16, color: C.text }}>
              Based on These Dishes
            </h3>
            {mealDishes.map(d => (
              <div key={d.id} style={{
                display: "flex", gap: 12, padding: "11px 0",
                borderBottom: `1px solid ${C.border}`, alignItems: "center",
              }}>
                <span style={{ fontSize: 24 }}>{d.img}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    {d.reqIngredients.length} required · {d.optIngredients.length} optional
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Page>
  );
}
