import { useState, useRef } from "react";
import { C, FONTS, RADIUS, alpha } from "../theme";
import { Card, Btn, Page, PageHeader, IconCheck } from "../components/ui";
import { Watermark } from "../components/art";
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
          chosenName: matches[0]?.alias ?? it.name,
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
      const chosenIsNew = !(item.matches ?? []).some(m => m.alias === item.chosenName);
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

  return (
    <Page>
      <PageHeader
        title="Bill Scanner"
        subtitle="Upload a grocery receipt and AI will populate your pantry automatically"
      />

      {/* ── Idle ── */}
      {stage === "idle" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>

          <div>
            <div
              onDragOver={e  => { e.preventDefault(); setDrag(true);  }}
              onDragLeave={  () => setDrag(false)}
              onDrop={e      => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={      () => fileRef.current?.click()}
              style={{
                border: `2.5px dashed ${drag ? C.accent : C.borderDark}`,
                borderRadius: RADIUS.xl,
                padding: "64px 40px",
                textAlign: "center",
                cursor: "pointer",
                background: drag ? C.accentLight : C.card,
                transition: "all 0.22s",
                boxShadow: drag ? `0 0 0 4px ${alpha(C.accent, 13)}` : "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Watermark symbol="w-receipt" size={190} style={{ right: -40, bottom: -50, transform: "rotate(10deg)" }} />
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])}
              />
              <svg viewBox="0 0 60 60" width={56} height={56} style={{ color: C.textMuted, margin: "0 auto 20px", display: "block" }} aria-hidden="true">
                <use href="#w-receipt" />
              </svg>
              <h3 style={{ fontFamily: FONTS.display, fontSize: 24, color: C.text, marginBottom: 10 }}>
                Upload Your Receipt
              </h3>
              <p style={{ color: C.textSub, fontSize: 14, lineHeight: 1.7 }}>
                Drag & drop or click to browse.<br />
                Supports JPG, PNG, and WebP.
              </p>
            </div>
          </div>

          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 20, marginBottom: 20, color: C.text }}>
              How It Works
            </h3>
            {[
              ["Upload",       "Take a photo or scan of your grocery receipt"],
              ["AI reads",     "AI identifies items, quantities, and categories from the image"],
              ["Review & edit","Adjust any quantities, units, or categories before adding"],
              ["Done",         "Selected items are saved directly to your pantry"],
            ].map(([title, desc], i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: C.accentLight, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONTS.serif, fontSize: 15, color: C.accent,
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{title}</div>
                  <div style={{ fontSize: 13, color: C.textSub, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
            <div style={{
              background: C.bg, borderRadius: RADIUS.md,
              padding: 14, marginTop: 6,
              fontSize: 12, color: C.textMuted, lineHeight: 1.6,
            }}>
              Your receipt image is sent directly to the Google Gemini API and is not stored by this app.
            </div>
          </Card>
        </div>
      )}

      {/* ── Scanning ── */}
      {stage === "scanning" && (
        <Card style={{ textAlign: "center", padding: "80px 40px" }}>
          <div aria-hidden="true" style={{
            width: 64, height: 64, borderRadius: "50%",
            margin: "0 auto 24px",
            border: `5px solid ${C.accentLight}`,
            borderTopColor: C.accent,
            animation: "spin 1.1s linear infinite",
          }} />
          <h3 style={{ fontFamily: FONTS.display, fontSize: 26, color: C.text, marginBottom: 10 }}>
            Analyzing your receipt…
          </h3>
          <p style={{ color: C.textSub, fontSize: 14, marginBottom: 32 }}>
            {SCAN_STEPS[scanStep]}
          </p>
          <div style={{ width: 300, height: 5, background: C.border, borderRadius: 3, margin: "0 auto 24px" }}>
            <div style={{
              height: "100%", background: C.accent, borderRadius: 3,
              width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%`,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
            {SCAN_STEPS.map((step, i) => (
              <div key={step} style={{
                fontSize: 12,
                color: i < scanStep ? C.accent : i === scanStep ? C.text : C.textMuted,
                fontWeight: i === scanStep ? 600 : 400,
              }}>
                {i < scanStep ? "✓ " : i === scanStep ? "→ " : ""}{step}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Error ── */}
      {stage === "error" && (
        <Card style={{ textAlign: "center", padding: "60px 40px" }}>
          <div aria-hidden="true" style={{
            width: 56, height: 56, borderRadius: "50%",
            margin: "0 auto 16px",
            background: alpha(C.error, 12), border: `2px solid ${alpha(C.error, 35)}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONTS.serif, fontSize: 28, color: C.error,
          }}>!</div>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.text, marginBottom: 12 }}>
            Scan Failed
          </h3>
          <p style={{
            color: C.textSub, fontSize: 14, lineHeight: 1.7,
            maxWidth: 440, margin: "0 auto 28px",
          }}>
            {errorMsg}
          </p>
          <Btn onClick={reset}>Try Again</Btn>
        </Card>
      )}

      {/* ── Result ── */}
      {stage === "result" && (
        <div>
          <Card style={{ marginBottom: 20 }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 14,
            }}>
              <div>
                <h3 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.text }}>
                  Scan complete
                </h3>
                <p style={{ color: C.textSub, fontSize: 13, marginTop: 4 }}>
                  {items.length} items detected · {selectedCount} selected
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="secondary" onClick={selectAll}>Select All</Btn>
                <Btn variant="secondary" onClick={deselectAll}>Deselect All</Btn>
                <Btn variant="secondary" onClick={reset}>Rescan</Btn>
                <Btn
                  variant="sage"
                  onClick={addToPantry}
                  disabled={selectedCount === 0 || saving}
                >
                  {saving ? "Saving…" : `Add ${selectedCount} to Pantry →`}
                </Btn>
              </div>
            </div>

            {saveError && (
              <div style={{
                marginTop: 14, background: "#FDECEA", border: "1px solid #F5C6CB",
                borderRadius: RADIUS.md, padding: "10px 14px",
                fontSize: 13, color: C.error, lineHeight: 1.6,
              }}>
                {saveError}
              </div>
            )}
          </Card>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}>
            {items.map((item, index) => {
              const isSel  = !!selected[index];
              const color  = CAT_COLORS[item.category] ?? C.textSub;

              // "Add as" choices: matched aliases (deduped) + a keep-original
              // option, unless the original is already one of the matches.
              const opts = [];
              const seen = new Set();
              for (const m of (item.matches ?? [])) {
                if (seen.has(m.alias)) continue;
                seen.add(m.alias);
                opts.push({ value: m.alias, score: m.score });
              }
              if (!seen.has(item.name)) opts.push({ value: item.name, score: null, original: true });

              // The chosen name is "new" (not in the catalog) when it isn't one
              // of the fuzzy matches — only then can it be added to the catalog.
              const chosenIsNew = !(item.matches ?? []).some(m => m.alias === item.chosenName);

              return (
                <div key={index} style={{
                  border: `2px solid ${isSel ? C.sage : C.border}`,
                  borderRadius: RADIUS.md,
                  padding: 14,
                  background: isSel ? C.sageLight : C.card,
                  transition: "border-color 0.18s, background 0.18s",
                }}>

                  {/* Scanned name + checkbox */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1, lineHeight: 1.3 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Scanned</div>
                      <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{item.name}</div>
                    </div>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSel}
                      aria-label={`Include ${item.name}`}
                      onClick={() => toggleItem(index)}
                      style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0, padding: 0,
                        border: `2px solid ${isSel ? C.sage : C.borderDark}`,
                        background: isSel ? C.sage : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.18s", marginLeft: 10, cursor: "pointer",
                      }}
                    >
                      {isSel && <span style={{ color: "var(--on-accent)", display: "flex" }}><IconCheck size={13} /></span>}
                    </button>
                  </div>

                  {/* Add as: matched ingredient options */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>
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
                              padding: "6px 8px", borderRadius: RADIUS.sm, cursor: "pointer",
                              border: `1.5px solid ${active ? C.sage : C.border}`,
                              background: active ? C.card : "transparent",
                              fontFamily: "inherit", textAlign: "left",
                            }}
                          >
                            <span style={{
                              width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                              border: `2px solid ${active ? C.sage : C.borderDark}`,
                              background: active ? C.sage : "transparent",
                            }} />
                            <span style={{ fontSize: 13, color: C.text, flex: 1 }}>
                              {o.original ? `Keep “${o.value}”` : o.value}
                            </span>
                            {o.score != null && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.sage }}>
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
                      marginBottom: 10, padding: "8px 10px",
                      background: C.bg, borderRadius: RADIUS.sm,
                      border: `1px dashed ${C.border}`,
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
                                style={{
                                  width: "100%", padding: "5px 7px",
                                  border: `1.5px solid ${C.border}`, borderRadius: RADIUS.sm,
                                  fontSize: 12, color: C.text, background: C.card, outline: "none",
                                }}
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
                      style={{
                        width: 68, padding: "5px 8px",
                        border: `1.5px solid ${C.border}`, borderRadius: RADIUS.sm,
                        fontSize: 13, color: C.text, background: C.card,
                        outline: "none",
                      }}
                    />
                    <select
                      value={item.unit}
                      onChange={e => updateItem(index, { ...item, unit: e.target.value })}
                      style={{
                        flex: 1, padding: "5px 6px",
                        border: `1.5px solid ${C.border}`, borderRadius: RADIUS.sm,
                        fontSize: 12, color: C.text, background: C.card,
                        outline: "none", cursor: "pointer",
                      }}
                    >
                      {units.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Category */}
                  <select
                    value={item.category}
                    onChange={e => updateItem(index, { ...item, category: e.target.value })}
                    style={{
                      width: "100%", padding: "5px 8px",
                      border: `1.5px solid ${alpha(color, 33)}`,
                      borderRadius: RADIUS.sm,
                      fontSize: 12, fontWeight: 600,
                      color, background: alpha(color, 8),
                      outline: "none", cursor: "pointer",
                    }}
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
