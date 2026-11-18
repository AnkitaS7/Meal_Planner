import { useState, useRef } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Btn, Page, PageHeader, IconCheck, Mark } from "../components/ui";
import { insertPantryItem, matchIngredientAliases, addCatalogIngredient, mergePantryRows } from "../lib/db";
import { supabase } from "../lib/supabase";

const FALLBACK_CATEGORIES = ["Produce","Dairy","Grains","Pantry","Bakery","Meat","Seafood","Spices","Frozen"];
const FALLBACK_UNITS = ["g","kg","ml","L","oz","lb","pcs","loaf","cartons","tbsp","tsp","cups","bunch"];

const CAT_COLORS = {
  Grains:"#D4A843", Dairy:"#7BAE8A", Produce:"#5BA37B",
  Pantry:"#C9784C", Bakery:"#C9784C", Meat:"#C25B5B",
  Seafood:"#4A9BAF", Spices:"#9B7BC2", Frozen:"#6B96C4", Groceries:"#8A8FA3",
};

const SCAN_STEPS = ["Reading image…", "Sending to AI…", "Extracting items…", "Matching to pantry…"];

// Downscale large photos before upload so the request stays under the
// serverless body-size limit (~4.5MB; base64 inflates size ~33%). We render
// onto a canvas capped at MAX_DIMENSION and re-encode as JPEG.
const MAX_DIMENSION = 1500;
const JPEG_QUALITY  = 0.85;

// Empty string → null; otherwise a finite number (for optional macro inputs).
function numOrNull(v) {
  if (v === "" || v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function fileToResizedBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload  = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload  = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width  * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function extractItemsFromReceipt(file, onStep) {
  onStep(0);
  const base64   = await fileToResizedBase64(file);
  const mimeType = "image/jpeg";

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("NOT_LOGGED_IN");

  onStep(1);
  const res = await fetch("/api/scan-receipt", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ imageBase64: base64, mimeType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }

  onStep(2);
  const { items } = await res.json();
  if (!Array.isArray(items) || items.length === 0)
    throw new Error("No grocery items were found on this receipt.");
  return items;
}

export default function Scanner({ setPantry, userId, pantryCategories, pantryUnits }) {
  const categories = (pantryCategories?.length ? pantryCategories : FALLBACK_CATEGORIES);
  // Union server units with the fallback so oz/lb are always selectable even if
  // get_app_enums hasn't been refreshed to include them.
  const units      = Array.from(new Set([...(pantryUnits ?? []), ...FALLBACK_UNITS]));

  const [stage, setStage]       = useState("idle");   // idle | scanning | result | error
  const [drag, setDrag]         = useState(false);
  const [items, setItems]       = useState([]);
  const [selected, setSelected] = useState({});
  const [scanStep, setScanStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)) {
      setErrorMsg("Unsupported format. Please upload a JPG, PNG, or WebP image.");
      setStage("error");
      return;
    }
    setScanStep(0);
    setSaveError("");
    setStage("scanning");
    try {
      const extracted = await extractItemsFromReceipt(file, setScanStep);

      // Fuzzy-match each scanned name against the ingredient dictionary. Attach
      // the top candidates and default the chosen name to the best match (or
      // the original name when nothing clears the threshold).
      setScanStep(3);
      const withMatches = await Promise.all(extracted.map(async (it) => {
        let matches = [];
        try {
          matches = await matchIngredientAliases(it.name);
        } catch (err) {
          console.error("Alias match failed for", it.name, err);
        }
        return {
          ...it,
          matches,
          // pantry_alias is the clean household name; fall back to the raw
          // alias if the match RPC predates the pantry_alias column
          chosenName: matches[0]?.pantry_alias ?? matches[0]?.alias ?? it.name,
          addToCatalog: false,
          nutrients: { cal: "", protein: "", carbs: "", fat: "", fiber: "" },
        };
      }));

      setItems(withMatches);
      setSelected(Object.fromEntries(withMatches.map((_, i) => [i, true])));
      setStage("result");
    } catch (err) {
      setErrorMsg(
        err.message === "NOT_LOGGED_IN"
          ? "Please sign in to scan receipts."
          : err.message
      );
      setStage("error");
    }
  };

  const updateItem = (index, updated) =>
    setItems(prev => prev.map((it, i) => (i === index ? updated : it)));

  const toggleItem = (index) =>
    setSelected(s => ({ ...s, [index]: !s[index] }));

  const selectAll   = () => setSelected(Object.fromEntries(items.map((_, i) => [i, true])));
  const deselectAll = () => setSelected(Object.fromEntries(items.map((_, i) => [i, false])));

  const addToPantry = async () => {
    const indices = items.map((_, i) => i).filter(i => selected[i]);
    if (!indices.length) return;
    setSaving(true);
    setSaveError("");
    const saved  = [];
    const failed = [];
    for (const i of indices) {
      const item = items[i];
      const chosenIsNew = !(item.matches ?? []).some(m => (m.pantry_alias ?? m.alias) === item.chosenName);
      try {
        // Optionally register a not-found item in the shared ingredient catalog
        // first (idempotent server-side), then add it to the pantry.
        if (item.addToCatalog && chosenIsNew) {
          const n = item.nutrients ?? {};
          await addCatalogIngredient({
            name:    item.chosenName,
            cal:     numOrNull(n.cal),
            protein: numOrNull(n.protein),
            carbs:   numOrNull(n.carbs),
            fat:     numOrNull(n.fat),
            fiber:   numOrNull(n.fiber),
          });
        }
        const s = await insertPantryItem({ ...item, name: item.chosenName, expiry: "" }, userId);
        saved.push(s);
      } catch (err) {
        console.error("Failed to save", item.chosenName, err);
        failed.push(item);
      }
    }
    if (saved.length) setPantry(p => mergePantryRows(p, saved));
    setSaving(false);

    if (!failed.length) {
      setStage("idle");
      setItems([]);
    } else {
      // Keep the failures on screen so the user can adjust and retry instead of
      // having them silently disappear.
      setItems(failed);
      setSelected(Object.fromEntries(failed.map((_, i) => [i, true])));
      setSaveError(`${saved.length} added. ${failed.length} couldn't be saved — check their unit/category and try again.`);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const reset = () => { setStage("idle"); setItems([]); setErrorMsg(""); setSaveError(""); };

  const bigTitle = {
    fontFamily: FONTS.display, fontWeight: 400, fontSize: "clamp(28px, 3vw, 40px)", lineHeight: 1.1, letterSpacing: "-0.015em",
  };

  return (
    <Page>
      <PageHeader
        title={["Scan", { em: true, text: "a receipt." }]}
        subtitle="Upload a grocery receipt and AI will populate your pantry automatically."
        eyebrow="Receipt to shelf"
      />

      {/* ── Idle ── */}
      {stage === "idle" && (
        <div className="sr-grid" style={{ alignItems: "start" }}>
          {/* The drop zone is the receipt itself */}
          <div className="sp-5 rise">
            <div
              className="receipt"
              role="button"
              tabIndex={0}
              aria-label="Upload a receipt image"
              onDragOver={e  => { e.preventDefault(); setDrag(true);  }}
              onDragLeave={  () => setDrag(false)}
              onDrop={e      => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={      () => fileRef.current?.click()}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
              style={{
                cursor: "pointer", textAlign: "center",
                padding: "44px 26px 64px",
                transform: drag ? "scale(1.015)" : "none",
                transition: "transform 0.3s var(--ease-out), background 0.2s",
                background: drag ? "var(--c1-soft)" : undefined,
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])}
              />
              <div style={{ fontFamily: FONTS.display, fontStyle: "italic", fontSize: 20 }}>Season</div>
              <hr className="receipt-rule" />
              <svg viewBox="0 0 60 60" width={72} height={72} style={{ margin: "14px auto 18px", display: "block" }} aria-hidden="true">
                <use href="#w-receipt" />
              </svg>
              <h3 style={{ ...bigTitle, fontSize: "clamp(28px, 3vw, 38px)", marginBottom: 14 }}>
                Drop your receipt here
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>
                Drag & drop or click to browse.<br />
                Supports JPG, PNG, and WebP.
              </p>
              <hr className="receipt-rule" />
              <div style={{ fontSize: 14, color: C.textMuted }}>One photo fills the shelf.</div>
            </div>
          </div>

          <section className="sr-panel sp-7 rise" style={{ "--i": 1 }}>
            <h3 className="sr-panel-h"><span>How it works</span><span>four steps</span></h3>
            <div className="row-list">
              {[
                ["Upload",       "Take a photo or scan of your grocery receipt"],
                ["AI reads",     "AI identifies items, quantities, and categories from the image"],
                ["Review & edit","Adjust any quantities, units, or categories before adding"],
                ["Done",         "Selected items are saved directly to your pantry"],
              ].map(([title, desc], i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 14, padding: "16px 0", alignItems: "center" }}>
                  <div className="bignum" style={{ fontSize: 40, color: "var(--c1)" }}>{i + 1}</div>
                  <div>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 400, fontSize: 22, letterSpacing: "-0.015em" }}>{title}</div>
                    <div style={{ fontSize: 15, opacity: 0.75, marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mono" style={{ fontSize: 11.5, opacity: 0.6, lineHeight: 1.6, marginTop: 14 }}>
              Your receipt image is sent directly to the Google Gemini API and is not stored by this app.
            </p>
          </section>
        </div>
      )}

      {/* ── Scanning ── */}
      {stage === "scanning" && (
        <section className="sr-panel rise" style={{ padding: "clamp(28px, 5vw, 64px)" }} role="status">
          <Mark size={48} spin style={{ color: "var(--c1)", marginBottom: 26 }} />
          <h3 style={{ ...bigTitle, marginBottom: 14 }}>
            Analyzing your receipt…
          </h3>
          <p style={{ fontSize: 18, opacity: 0.8, marginBottom: 30 }}>
            {SCAN_STEPS[scanStep]}
          </p>
          <div style={{ maxWidth: 520, height: 14, background: "var(--bg)", borderRadius: 999, marginBottom: 22, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: "var(--c1)", borderRadius: 999,
              width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%`,
              transition: "width 0.5s var(--ease-out)",
            }} />
          </div>
          <div style={{ display: "flex", gap: "8px 22px", flexWrap: "wrap", fontSize: 14 }}>
            {SCAN_STEPS.map((step, i) => (
              <div key={step} style={{ opacity: i <= scanStep ? 1 : 0.45, color: i < scanStep ? "var(--c1)" : "inherit" }}>
                {i < scanStep ? "✓ " : i === scanStep ? "→ " : ""}{step}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Error ── */}
      {stage === "error" && (
        <section className="sr-panel rise" style={{ padding: "clamp(28px, 5vw, 64px)", background: "var(--c2-soft)" }} role="alert">
          <div className="kicker" style={{ marginBottom: 16 }}>Something went wrong</div>
          <h3 style={{ ...bigTitle, marginBottom: 16 }}>
            Scan failed
          </h3>
          <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 520, marginBottom: 28 }}>
            {errorMsg}
          </p>
          <Btn onClick={reset}>Try Again</Btn>
        </section>
      )}

      {/* ── Result ── */}
      {stage === "result" && (
        <div>
          <section className="sr-panel rise" style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-end", flexWrap: "wrap", gap: 18,
            }}>
              <div>
                <div className="kicker" style={{ opacity: 0.7, marginBottom: 10 }}>
                  {items.length} items detected · {selectedCount} selected
                </div>
                <h3 style={bigTitle}>
                  Scan complete
                </h3>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Btn variant="secondary" onClick={selectAll}>Select All</Btn>
                <Btn variant="secondary" onClick={deselectAll}>Deselect All</Btn>
                <Btn variant="secondary" onClick={reset}>Rescan</Btn>
                <Btn
                  variant="pop"
                  onClick={addToPantry}
                  disabled={selectedCount === 0 || saving}
                >
                  {saving ? "Saving…" : `Add ${selectedCount} to Pantry →`}
                </Btn>
              </div>
            </div>

            {saveError && (
              <div role="alert" style={{
                marginTop: 16, background: "var(--c2-soft)", color: "var(--c2)",
                borderRadius: RADIUS.md, padding: "12px 16px",
                fontSize: 14, lineHeight: 1.6,
              }}>
                {saveError}
              </div>
            )}
          </section>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}>
            {items.map((item, index) => {
              const isSel  = !!selected[index];
              const color  = CAT_COLORS[item.category] ?? C.textSub;

              // "Add as" choices: matched pantry names (deduped) + a keep-original
              // option, unless the original is already one of the matches. Dedupe
              // on the pantry name, since distinct catalog ingredients can share
              // one household name.
              const opts = [];
              const seen = new Set();
              for (const m of (item.matches ?? [])) {
                const name = m.pantry_alias ?? m.alias;
                if (seen.has(name)) continue;
                seen.add(name);
                opts.push({ value: name, score: m.score });
              }
              if (!seen.has(item.name)) opts.push({ value: item.name, score: null, original: true });

              // The chosen name is "new" (not in the catalog) when it isn't one
              // of the fuzzy matches — only then can it be added to the catalog.
              const chosenIsNew = !(item.matches ?? []).some(m => (m.pantry_alias ?? m.alias) === item.chosenName);

              return (
                <div key={index} style={{
                  boxShadow: isSel ? `inset 0 0 0 2.5px ${C.text}` : "none",
                  borderRadius: 24,
                  padding: 18,
                  background: C.card, color: C.text,
                  opacity: isSel ? 1 : 0.72,
                  transition: "box-shadow 0.18s, opacity 0.18s",
                }}>

                  {/* Scanned name + checkbox */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1, lineHeight: 1.3 }}>
                      <div className="kicker" style={{ color: C.textMuted, marginBottom: 4 }}>Scanned</div>
                      <div style={{ fontFamily: FONTS.display, fontWeight: 400, color: C.head, fontSize: 19, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{item.name}</div>
                    </div>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSel}
                      aria-label={`Include ${item.name}`}
                      onClick={() => toggleItem(index)}
                      style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0, padding: 0,
                        border: `2px solid ${isSel ? C.text : C.borderDark}`,
                        background: isSel ? C.text : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.18s", marginLeft: 10, cursor: "pointer",
                      }}
                    >
                      {isSel && <span style={{ color: C.panel, display: "flex" }}><IconCheck size={13} /></span>}
                    </button>
                  </div>

                  {/* Add as: matched ingredient options */}
                  <div style={{ marginBottom: 10 }}>
                    <div className="kicker" style={{ color: C.textMuted, marginBottom: 6 }}>
                      Add as{item.matches?.length ? "" : " · no close match"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {opts.map(o => {
                        const active = item.chosenName === o.value;
                        return (
                          <button
                            type="button"
                            key={o.value}
                            aria-pressed={active}
                            onClick={() => updateItem(index, { ...item, chosenName: o.value })}
                            style={{
                              display: "flex", alignItems: "center", gap: 8, width: "100%",
                              padding: "9px 12px", borderRadius: 14, cursor: "pointer",
                              border: 0,
                              background: active ? C.bg : "transparent",
                              fontFamily: "inherit", textAlign: "left",
                            }}
                          >
                            <span style={{
                              width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                              border: `2px solid ${active ? C.text : C.borderDark}`,
                              background: active ? C.text : "transparent",
                            }} />
                            <span style={{ fontSize: 13, color: C.text, flex: 1 }}>
                              {o.original ? `Keep “${o.value}”` : o.value}
                            </span>
                            {o.score != null && (
                              <span className="mono" style={{ fontSize: 11, color: C.textMuted }}>
                                {Math.round(o.score * 100)}%
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add a not-found item to the shared ingredient catalog */}
                  {chosenIsNew && (
                    <div style={{
                      marginBottom: 10, padding: "10px 12px",
                      background: C.bg, borderRadius: 14,
                    }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!!item.addToCatalog}
                          onChange={e => updateItem(index, { ...item, addToCatalog: e.target.checked })}
                        />
                        <span style={{ fontSize: 12, color: C.text }}>
                          Also add to ingredient database
                        </span>
                      </label>

                      {item.addToCatalog && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 5 }}>
                            Nutrition per 100 g (optional)
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                            {[
                              ["cal", "Cal"], ["protein", "Protein g"],
                              ["carbs", "Carbs g"], ["fat", "Fat g"], ["fiber", "Fiber g"],
                            ].map(([key, label]) => (
                              <input
                                key={key}
                                type="number"
                                min="0"
                                placeholder={label}
                                value={item.nutrients?.[key] ?? ""}
                                onChange={e => updateItem(index, {
                                  ...item,
                                  nutrients: { ...item.nutrients, [key]: e.target.value },
                                })}
                                className="sr-field"
                                style={{ padding: "7px 10px", fontSize: 12.5, borderRadius: 10, background: C.card }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Qty + unit row */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <input
                      type="number"
                      value={item.qty}
                      min="0"
                      onChange={e => updateItem(index, { ...item, qty: parseFloat(e.target.value) || 0 })}
                      aria-label="Quantity"
                      className="sr-field"
                      style={{ width: 78, padding: "9px 12px", fontSize: 14, borderRadius: 12 }}
                    />
                    <select
                      value={item.unit}
                      onChange={e => updateItem(index, { ...item, unit: e.target.value })}
                      aria-label="Unit"
                      className="sr-field"
                      style={{ flex: 1, width: "auto", padding: "9px 12px", fontSize: 14, borderRadius: 12 }}
                    >
                      {units.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Category */}
                  <select
                    value={item.category}
                    onChange={e => updateItem(index, { ...item, category: e.target.value })}
                    aria-label="Category"
                    className="sr-field"
                    style={{ padding: "9px 12px", fontSize: 14, fontWeight: 600, borderRadius: 12, color }}
                  >
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Page>
  );
}
