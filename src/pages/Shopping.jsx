import { useState, useEffect } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Btn, Page, PageHeader, CheckRow } from "../components/ui";
import { IngredientArt, Watermark } from "../components/art";
import { todayDateStr } from "../lib/db";
import {
  fetchShoppingNeeded, fetchManualShoppingItems,
  addManualShoppingItem, toggleManualShoppingItem, deleteManualShoppingItem,
  insertPantryItem, getWeekStart, mergePantryRows,
} from "../lib/db";

export default function Shopping({ userId, setPantry }) {
  const weekStart = getWeekStart();

  const [needed, setNeeded]     = useState([]); // { name, type, dish_name }
  const [have, setHave]         = useState([]); // ingredient names in pantry
  const [optNeed, setOptNeed]   = useState([]); // optional items not in pantry
  const [manual, setManual]     = useState([]); // shopping_list_items rows
  const [autoChecked, setAutoChecked] = useState({}); // local check state for auto items
  const [extraInput, setExtraInput]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [addingToPantry, setAddingToPantry] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchShoppingNeeded(userId, weekStart),
      fetchManualShoppingItems(userId, weekStart),
    ])
      .then(([shoppingRows, manualRows]) => {
        const req_needed = [], req_have = [], opt_needed = [];

        shoppingRows.forEach(r => {
          if (r.type === "required") {
            if (r.in_pantry) {
              if (!req_have.includes(r.ingredient_name)) req_have.push(r.ingredient_name);
            } else {
              const existing = req_needed.find(n => n.name === r.ingredient_name);
              if (existing) {
                if (existing.qty != null && r.quantity != null)
                  existing.qty = Math.round((existing.qty + Number(r.quantity)) * 100) / 100;
              } else {
                req_needed.push({ name: r.ingredient_name, dish: r.dish_name, qty: r.quantity != null ? Number(r.quantity) : null, unit: r.unit ?? null });
              }
            }
          } else if (!r.in_pantry) {
            if (!opt_needed.find(n => n.name === r.ingredient_name))
              opt_needed.push({ name: r.ingredient_name, dish: r.dish_name, qty: r.quantity != null ? Number(r.quantity) : null, unit: r.unit ?? null });
          }
        });

        // An ingredient can be required by one dish and optional in another. If
        // it's required anywhere, treat it as required only — otherwise it shows
        // in both lists, sharing one check key (double-toggle / double-insert).
        const requiredNames = new Set(req_needed.map(i => i.name));
        const opt_filtered  = opt_needed.filter(i => !requiredNames.has(i.name));

        setNeeded(req_needed);
        setHave(req_have);
        setOptNeed(opt_filtered);
        setManual(manualRows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, weekStart]);

  const checkedAutoCount = Object.values(autoChecked).filter(Boolean).length;

  const addCheckedToPantry = async () => {
    const allChecked = [
      ...needed.filter(i => autoChecked[i.name]),
      ...optNeed.filter(i => autoChecked[i.name]),
    ];
    if (!allChecked.length) return;

    // Update UI immediately so the user sees the change on click
    const addedNames = new Set(allChecked.map(i => i.name));
    setNeeded(n => n.filter(i => !addedNames.has(i.name)));
    setOptNeed(n => n.filter(i => !addedNames.has(i.name)));
    setHave(h => [...h, ...allChecked.map(i => i.name).filter(n => !h.includes(n))]);
    setAutoChecked(c => {
      const next = { ...c };
      addedNames.forEach(name => delete next[name]);
      return next;
    });

    setAddingToPantry(true);
    const results = await Promise.all(
      allChecked.map(item =>
        insertPantryItem({ name: item.name, qty: item.qty ?? 1, unit: item.unit || "pcs", category: "Pantry", expiry: "" }, userId)
          .catch(console.error)
      )
    ).finally(() => setAddingToPantry(false));
    const inserted = results.filter(Boolean);
    if (inserted.length) setPantry(p => mergePantryRows(p, inserted));
  };

  // Progress tracks required + custom items only — optional extras shouldn't
  // inflate the "left to collect" count.
  const totalItems = needed.length + manual.length;
  const doneAuto   = needed.filter(i => autoChecked[i.name]).length;
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

  const buildListText = () => {
    const lines = [`🛒 Shopping List - ${todayDateStr()}`, ""];
    const fmtItem = i => {
      const qty = i.qty != null ? `${i.qty}${i.unit ? " " + i.unit : ""} ` : "";
      return `  • ${qty}${i.name}${i.dish ? ` (${i.dish})` : ""}`;
    };
    if (needed.length) {
      lines.push("TO BUY (Required)");
      needed.forEach(i => lines.push(fmtItem(i)));
      lines.push("");
    }
    if (optNeed.length) {
      lines.push("OPTIONAL");
      optNeed.forEach(i => lines.push(fmtItem(i)));
      lines.push("");
    }
    if (manual.length) {
      lines.push("CUSTOM ITEMS");
      manual.forEach(i => lines.push(`  ${i.is_checked ? "✓" : "•"} ${i.name}`));
      lines.push("");
    }
    if (have.length) {
      lines.push("ALREADY IN PANTRY");
      have.forEach(n => lines.push(`  ✓ ${n}`));
    }
    return lines.join("\n");
  };

  const exportPDF = () => {
    setShowExport(false);
    const win = window.open("", "_blank");
    const section = (title, items) => items.length === 0 ? "" : `
      <h2 style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin:24px 0 10px">${title}</h2>
      <ul style="list-style:none;padding:0;margin:0">
        ${items.map(i => `<li style="padding:8px 0;border-bottom:1px solid #f0ebe4;font-size:14px">${i}</li>`).join("")}
      </ul>`;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Season · Shopping list</title>
      <style>
        body{font-family:Georgia,serif;padding:40px;color:#1a1a1a;max-width:700px;margin:0 auto}
        h1{font-size:26px;margin:0 0 4px}
        .sub{color:#888;font-size:13px;margin-bottom:28px}
        @media print{@page{margin:20mm}body{padding:0}}
      </style></head><body>
      <h1>Shopping list</h1>
      <div class="sub">${todayDateStr()}</div>
      ${section("To Buy (Required)", needed.map(i => { const qty = i.qty != null ? `<strong>${i.qty}${i.unit ? " " + i.unit : ""}</strong> ` : ""; return `${qty}${i.name}${i.dish ? ` <span style="color:#aaa;font-size:12px">(${i.dish})</span>` : ""}`; }))}
      ${section("Optional", optNeed.map(i => { const qty = i.qty != null ? `<strong>${i.qty}${i.unit ? " " + i.unit : ""}</strong> ` : ""; return `${qty}${i.name}${i.dish ? ` <span style="color:#aaa;font-size:12px">(${i.dish})</span>` : ""}`; }))}
      ${section("Custom Items", manual.map(i => `${i.is_checked ? "✓ " : ""}${i.name}`))}
      ${section("Already in Pantry ✓", have)}
      <script>window.onload=()=>{window.print();}<\/script>
      </body></html>`);
    win.document.close();
  };

  const shareEmail = () => {
    setShowExport(false);
    window.location.href = `mailto:?subject=${encodeURIComponent("Shopping List")}&body=${encodeURIComponent(buildListText())}`;
  };

  const shareWhatsApp = () => {
    setShowExport(false);
    window.open(`https://wa.me/?text=${encodeURIComponent(buildListText())}`, "_blank");
  };

  const AutoCheckItem = ({ item }) => {
    const checked = !!autoChecked[item.name];
    const qtyLabel = item.qty != null ? `${item.qty}${item.unit ? " " + item.unit : ""}` : "";
    return (
      <CheckRow
        checked={checked}
        onToggle={() => toggleAuto(item.name)}
        label={`${item.name}${qtyLabel ? `, ${qtyLabel}` : ""}${item.dish ? `, for ${item.dish}` : ""}`}
      >
        {item.qty != null && (
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: checked ? C.textMuted : C.accent,
            textDecoration: checked ? "line-through" : "none",
            marginRight: 4,
          }}>
            {item.qty}{item.unit ? " " + item.unit : ""}
          </span>
        )}
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
      </CheckRow>
    );
  };

  const ManualCheckItem = ({ item }) => (
    <CheckRow
      checked={item.is_checked}
      onToggle={() => toggleManual(item)}
      label={item.name}
      trailing={
        <button
          onClick={e => { e.stopPropagation(); removeExtra(item.id); }}
          aria-label={`Remove ${item.name}`}
          style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14 }}
        >
          ✕
        </button>
      }
    >
      <span style={{
        fontSize: 14,
        color: item.is_checked ? C.textMuted : C.text,
        textDecoration: item.is_checked ? "line-through" : "none",
      }}>
        {item.name}
      </span>
    </CheckRow>
  );

  // Everything ticked so far — required, optional, and your own additions —
  // stands together on the basket counter.
  const basket = [
    ...needed.filter(i => autoChecked[i.name]).map(i => ({ ...i, _k: `r-${i.name}` })),
    ...optNeed.filter(i => autoChecked[i.name]).map(i => ({ ...i, _k: `o-${i.name}` })),
    ...manual.filter(m => m.is_checked).map(m => ({ name: m.name, qty: null, unit: null, _k: `m-${m.id}` })),
  ];

  return (
    <Page>
      <PageHeader
        title="The market ticket"
        subtitle="Built from this week's plan — what's already on your shelves stays home"
        action={
          <div style={{ position: "relative" }}>
            <Btn onClick={() => setShowExport(v => !v)}>Share ↗</Btn>
            {showExport && (
              <>
                <div
                  onClick={() => setShowExport(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 99 }}
                />
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, boxShadow: "var(--shadow-lift)",
                  zIndex: 100, minWidth: 200, overflow: "hidden",
                }}>
                  {[
                    { label: "Save as PDF",       action: exportPDF     },
                    { label: "Send via email",    action: shareEmail    },
                    { label: "Share on WhatsApp", action: shareWhatsApp },
                  ].map(({ label, action }, i, arr) => (
                    <button
                      key={label}
                      onClick={action}
                      style={{
                        display: "block", width: "100%", padding: "12px 16px",
                        background: "none", cursor: "pointer", border: "none",
                        borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                        fontSize: 14, color: C.text,
                        fontFamily: FONTS.body, textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />

      {loading ? (
        <div style={{ color: C.textMuted, fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Loading shopping list…
        </div>
      ) : (
        <div className="sr-grid">
          {/* ---- THE TICKET & BASKET COUNTER: ticked items land here ---- */}
          <section className="sr-panel clip sp-12">
            <Watermark symbol="i-lemon" size={210} style={{ right: -44, top: -48, transform: "rotate(-14deg)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 13, color: C.textSub, marginBottom: 6 }}>
                  {doneItems} of {totalItems} items collected
                </div>
                <div style={{ height: 6, background: "var(--mound)", borderRadius: 3 }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: `${totalItems ? (doneItems / totalItems) * 100 : 0}%`,
                    background: doneItems === totalItems && totalItems > 0 ? C.success : C.accent,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
              <div style={{
                fontFamily: FONTS.serif, fontSize: 28, color: C.head,
                fontVariantNumeric: "tabular-nums", lineHeight: 1,
              }}>
                {totalItems - doneItems}
                <span style={{ fontSize: 12, color: C.textMuted, fontFamily: FONTS.body, marginLeft: 5 }}>left</span>
              </div>
              {checkedAutoCount > 0 && (
                <Btn
                  variant="sage"
                  disabled={addingToPantry}
                  onClick={addCheckedToPantry}
                  style={{ borderRadius: 999, fontSize: 12 }}
                >
                  {addingToPantry ? "Adding…" : `Add ${checkedAutoCount} to pantry`}
                </Btn>
              )}
            </div>

            {/* The basket counter */}
            <div style={{ marginTop: 16, position: "relative" }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
                color: C.textMuted, marginBottom: 2, fontWeight: 600,
              }}>
                In the basket · {basket.length}
              </div>
              {basket.length === 0 ? (
                <p style={{
                  fontFamily: FONTS.serif, fontStyle: "italic", fontSize: 14,
                  color: C.textSub, margin: "10px 0 4px",
                  borderBottom: "3px solid color-mix(in srgb, var(--faint) 45%, var(--line))",
                  paddingBottom: 14,
                }}>
                  Tick items as you shop — they land on this counter.
                </p>
              ) : (
                <div className="sr-shelf">
                  {basket.map(item => (
                    <div key={item._k} className="sr-pitem" style={{ minWidth: 74, padding: "4px 8px 8px" }}>
                      <IngredientArt name={item.name} size={38} />
                      <div className="truncate" style={{ fontSize: 11, color: C.text, marginTop: 4, maxWidth: 96 }}>
                        {item.name}
                      </div>
                      {item.qty != null && (
                        <div style={{ fontSize: 10, color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>
                          {item.qty}{item.unit ? ` ${item.unit}` : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ---- TO BUY ---- */}
          <section className="sr-panel sp-7">
            <h3 className="sr-panel-h">
              <span>To buy</span>
              <span>{needed.length} required</span>
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {needed.length === 0 ? (
                <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", fontSize: 14, color: C.textSub, margin: 0 }}>
                  Everything this week's plan needs is already on your shelves.
                </p>
              ) : (
                needed.map(item => <AutoCheckItem key={item.name} item={item} />)
              )}
            </div>

            {optNeed.length > 0 && (
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 14 }}>
                <div style={{
                  fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
                  color: C.textMuted, marginBottom: 8, fontWeight: 600,
                }}>
                  Optional · nice to have
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {optNeed.map(item => <AutoCheckItem key={item.name} item={item} />)}
                </div>
              </div>
            )}
          </section>

          {/* ---- YOUR ADDITIONS + ALREADY STOCKED ---- */}
          <div className="sp-5" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <section className="sr-panel">
              <h3 className="sr-panel-h"><span>Your own additions</span></h3>
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
                  placeholder="Type an item and press Enter…"
                  style={{
                    flex: 1, background: C.bg,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: RADIUS.md, padding: "10px 14px",
                    fontSize: 14, color: C.text,
                  }}
                />
                <Btn onClick={addExtra} disabled={!extraInput.trim()}>Add</Btn>
              </div>
            </section>

            <section className="sr-panel sr-tint-4">
              <h3 className="sr-panel-h">
                <span>Already on your shelves</span>
                <span>{have.length}</span>
              </h3>
              {have.length === 0 ? (
                <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", fontSize: 14, color: C.textSub, margin: 0 }}>
                  Nothing from this week's plan is in your pantry yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {have.map(name => (
                    <span key={name} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: RADIUS.full,
                      background: C.sageLight, fontSize: 13, color: C.sageDark,
                    }}>
                      <span style={{ color: C.sage, fontSize: 11 }}>✓</span>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </Page>
  );
}