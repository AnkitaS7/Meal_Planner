import { useState, useEffect } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Btn, Loading, Page, PageHeader, CheckRow, IconX, IconCheck } from "../components/ui";
import { IngredientArt } from "../components/art";
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

  // Rows are plain render functions (not nested components), so React keeps
  // their DOM between renders — toggling one no longer drops keyboard focus.
  const renderAutoItem = (item) => {
    const checked = !!autoChecked[item.name];
    const qtyLabel = item.qty != null ? `${item.qty}${item.unit ? " " + item.unit : ""}` : "";
    return (
      <CheckRow
        key={item.name}
        checked={checked}
        onToggle={() => toggleAuto(item.name)}
        label={`${item.name}${qtyLabel ? `, ${qtyLabel}` : ""}${item.dish ? `, for ${item.dish}` : ""}`}
      >
        <span style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{
            fontSize: 25, fontWeight: 600, lineHeight: 1.1, color: C.text, flex: 1, minWidth: 0,
            textDecoration: checked ? "line-through" : "none",
          }}>
            {item.name}
            {item.dish && (
              <span style={{ display: "block", fontSize: 17, fontWeight: 500, color: C.textMuted, marginTop: 1 }}>
                for {item.dish}
              </span>
            )}
          </span>
          {item.qty != null && (
            <span style={{ fontSize: 21, color: C.textSub, whiteSpace: "nowrap" }}>
              {item.qty}{item.unit ? " " + item.unit : ""}
            </span>
          )}
        </span>
      </CheckRow>
    );
  };

  const renderManualItem = (item) => (
    <CheckRow
      checked={item.is_checked}
      onToggle={() => toggleManual(item)}
      label={item.name}
      trailing={
        <button
          onClick={e => { e.stopPropagation(); removeExtra(item.id); }}
          aria-label={`Remove ${item.name}`}
          style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 8 }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--c2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--faint)"; }}
        >
          <IconX />
        </button>
      }
    >
      <span style={{
        fontSize: 17, fontWeight: 500, color: C.text,
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

  const left = totalItems - doneItems;

  return (
    <Page>
      <PageHeader
        title={["The", { em: true, text: "market list." }]}
        subtitle="Built from this week's plan — what's already on your shelves stays home."
        eyebrow="Shopping list"
        stats={[
          { v: left, l: "left to get" },
          { v: `${doneItems}/${totalItems}`, l: "collected" },
        ]}
        action={
          <div style={{ position: "relative" }}>
            <Btn onClick={() => setShowExport(v => !v)} aria-expanded={showExport}>Share ↗</Btn>
            {showExport && (
              <>
                <div
                  onClick={() => setShowExport(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 99 }}
                />
                <div className="sr-menu" style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: C.card, color: C.text, borderRadius: 20, padding: 6,
                  boxShadow: "var(--shadow-lift)", zIndex: 100, minWidth: 220,
                }}>
                  {[
                    { label: "Save as PDF",       action: exportPDF     },
                    { label: "Send via email",    action: shareEmail    },
                    { label: "Share on WhatsApp", action: shareWhatsApp },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      style={{
                        display: "block", width: "100%", padding: "12px 16px",
                        background: "none", cursor: "pointer", border: "none", borderRadius: 14,
                        fontSize: 14, fontWeight: 500, color: C.text,
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
        <Loading label="Writing the ticket…" style={{ color: "var(--ink)", padding: "80px 0" }} size={56} />
      ) : (
        <div className="sr-grid" style={{ alignItems: "start" }}>
          {/* ---- THE LIST: chalked up on the kitchen board ---- */}
          <section className="sp-7 rise">
            <div className="receipt" style={{ padding: "clamp(22px, 3vw, 40px) clamp(18px, 3vw, 40px) 46px" }}>
              <div style={{ textAlign: "center" }}>
                <div className="hand" style={{ fontSize: 40, lineHeight: 1 }}>
                  To buy
                </div>
                <div style={{ fontSize: 14, marginTop: 6, color: C.textMuted }}>
                  {needed.length} required · {optNeed.length} optional
                </div>
              </div>
              <hr className="receipt-rule" />
              <div className="row-list">
                {needed.length === 0 ? (
                  <p style={{ fontSize: 15, color: C.textSub, margin: 0, padding: "10px 0", border: 0 }}>
                    Everything this week's plan needs is already on your shelves.
                  </p>
                ) : (
                  needed.map(renderAutoItem)
                )}
              </div>

              {optNeed.length > 0 && (
                <>
                  <hr className="receipt-rule" />
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.textMuted }}>
                    Optional · nice to have
                  </div>
                  <div className="row-list">
                    {optNeed.map(renderAutoItem)}
                  </div>
                </>
              )}
              <hr className="receipt-rule" />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: C.textSub }}>
                <span>Collected</span><span>{doneItems} / {totalItems}</span>
              </div>
            </div>
          </section>

          <div className="sp-5" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* ---- THE BASKET: ticked items land here ---- */}
            <section className="sr-panel pop rise" style={{ "--i": 1 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div className="bignum" style={{ fontSize: 64 }}>{left}</div>
                  <div className="kicker" style={{ marginTop: 10 }}>left to get</div>
                </div>
                {checkedAutoCount > 0 && (
                  <Btn disabled={addingToPantry} onClick={addCheckedToPantry}>
                    {addingToPantry ? "Adding…" : `Add ${checkedAutoCount} to pantry`}
                  </Btn>
                )}
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={totalItems}
                aria-valuenow={doneItems}
                aria-label="Items collected"
                style={{ height: 14, background: "var(--bg)", borderRadius: 999, marginTop: 18, overflow: "hidden" }}
              >
                <div style={{
                  height: "100%", borderRadius: 999,
                  width: `${totalItems ? (doneItems / totalItems) * 100 : 0}%`,
                  background: "var(--c1)",
                  transition: "width 0.5s var(--ease-out)",
                }} />
              </div>

              <div className="kicker" style={{ margin: "22px 0 10px" }}>In the basket · {basket.length}</div>
              {basket.length === 0 ? (
                <p style={{ fontSize: 15, margin: 0 }}>
                  Tick items as you shop — they land here.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {basket.map(item => (
                    <div key={item._k} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 14px 6px 8px",
                      background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 999, animation: "pop-in 0.4s var(--ease-out) both",
                    }}>
                      <IngredientArt name={item.name} size={30} />
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{item.name}</span>
                      {item.qty != null && (
                        <span className="mono" style={{ fontSize: 11, opacity: 0.7 }}>
                          {item.qty}{item.unit ? ` ${item.unit}` : ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ---- YOUR ADDITIONS ---- */}
            <section className="sr-panel rise" style={{ "--i": 2 }}>
              <h3 className="sr-panel-h"><span>Your own additions</span></h3>
              <div className="row-list">
                {manual.map(item => (
                  <div key={item.id}>
                    {renderManualItem(item)}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                  value={extraInput}
                  onChange={e => setExtraInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addExtra()}
                  placeholder="Type an item and press Enter…"
                  aria-label="Add your own item"
                  className="sr-field"
                  style={{ flex: 1, borderRadius: 999, paddingLeft: 20 }}
                />
                <Btn onClick={addExtra} disabled={!extraInput.trim()}>Add</Btn>
              </div>
            </section>

            {/* ---- ALREADY STOCKED ---- */}
            <section className="sr-panel rise" style={{ "--i": 3 }}>
              <h3 className="sr-panel-h">
                <span>Already on your shelves</span>
                <span>{have.length}</span>
              </h3>
              {have.length === 0 ? (
                <p style={{ fontSize: 16, color: C.textSub, margin: 0 }}>
                  Nothing from this week's plan is in your pantry yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {have.map(name => (
                    <span key={name} style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "7px 14px", borderRadius: RADIUS.full,
                      background: "var(--c4-soft)", color: "var(--c4)", fontSize: 14, fontWeight: 500,
                    }}>
                      <span style={{ display: "flex" }} aria-hidden="true"><IconCheck size={11} /></span>
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
