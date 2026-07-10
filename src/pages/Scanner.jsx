import { useState, useRef } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Card, Btn, Page, PageHeader } from "../components/ui";
import { insertPantryItem } from "../lib/db";
import { supabase } from "../lib/supabase";

const FALLBACK_CATEGORIES = ["Produce","Dairy","Grains","Meat","Seafood","Bakery","Spices","Frozen","Pantry","Groceries"];
const FALLBACK_UNITS = ["g","kg","ml","L","pcs","bunch","pack","can","box","bag","bottle","jar"];

const CAT_COLORS = {
  Grains:"#D4A843", Dairy:"#7BAE8A", Produce:"#5BA37B",
  Pantry:"#C9784C", Bakery:"#C9784C", Meat:"#C25B5B",
  Seafood:"#4A9BAF", Spices:"#9B7BC2", Frozen:"#6B96C4", Groceries:"#8A8FA3",
};

const SCAN_STEPS = ["Reading image…", "Sending to AI…", "Extracting items…"];

// Downscale large photos before upload so the request stays under the
// serverless body-size limit (~4.5MB; base64 inflates size ~33%). We render
// onto a canvas capped at MAX_DIMENSION and re-encode as JPEG.
const MAX_DIMENSION = 1500;
const JPEG_QUALITY  = 0.85;

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
  const units      = (pantryUnits?.length      ? pantryUnits      : FALLBACK_UNITS);

  const [stage, setStage]       = useState("idle");   // idle | scanning | result | error
  const [drag, setDrag]         = useState(false);
  const [items, setItems]       = useState([]);
  const [selected, setSelected] = useState({});
  const [scanStep, setScanStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving]     = useState(false);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)) {
      setErrorMsg("Unsupported format. Please upload a JPG, PNG, or WebP image.");
      setStage("error");
      return;
    }
    setScanStep(0);
    setStage("scanning");
    try {
      const extracted = await extractItemsFromReceipt(file, setScanStep);
      setItems(extracted);
      setSelected(Object.fromEntries(extracted.map(i => [i.name, true])));
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

  const toggleItem = (name) =>
    setSelected(s => ({ ...s, [name]: !s[name] }));

  const selectAll   = () => setSelected(Object.fromEntries(items.map(i => [i.name, true])));
  const deselectAll = () => setSelected(Object.fromEntries(items.map(i => [i.name, false])));

  const addToPantry = async () => {
    const toAdd = items.filter(i => selected[i.name]);
    if (!toAdd.length) return;
    setSaving(true);
    const saved = [];
    for (const item of toAdd) {
      try {
        const s = await insertPantryItem({ ...item, expiry: "" }, userId);
        saved.push(s);
      } catch (err) {
        console.error("Failed to save", item.name, err);
      }
    }
    setPantry(p => [...p, ...saved]);
    setSaving(false);
    setStage("idle");
    setItems([]);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const reset = () => { setStage("idle"); setItems([]); setErrorMsg(""); };

  return (
    <Page>
      <PageHeader
        title="Bill Scanner"
        subtitle="Upload a grocery receipt and AI will populate your pantry automatically"
      />

      {/* ── Idle ── */}
      {stage === "idle" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

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
                background: drag ? C.accentLight : "#fff",
                transition: "all 0.22s",
                boxShadow: drag ? `0 0 0 4px ${C.accent}22` : "none",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])}
              />
              <div style={{ fontSize: 56, marginBottom: 20 }}>📸</div>
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
              ["📸", "Upload",       "Take a photo or scan of your grocery receipt"],
              ["🤖", "AI Reads",     "AI identifies items, quantities, and categories from the image"],
              ["✏️", "Review & Edit","Adjust any quantities, units, or categories before adding"],
              ["🏺", "Done!",        "Selected items are saved directly to your pantry"],
            ].map(([icon, title, desc], i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: C.accentLight, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>{icon}</div>
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
              🔒 Your receipt image is sent directly to the Google Gemini API and is not stored by this app.
            </div>
          </Card>
        </div>
      )}

      {/* ── Scanning ── */}
      {stage === "scanning" && (
        <Card style={{ textAlign: "center", padding: "80px 40px" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: C.accentLight, margin: "0 auto 24px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, animation: "spin 2s linear infinite",
          }}>⚙️</div>
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
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
                  ✅ Scan Complete
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
          </Card>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}>
            {items.map((item, index) => {
              const isSel  = !!selected[item.name];
              const color  = CAT_COLORS[item.category] ?? C.textSub;
              return (
                <div key={index} style={{
                  border: `2px solid ${isSel ? C.sage : C.border}`,
                  borderRadius: RADIUS.md,
                  padding: 14,
                  background: isSel ? C.sageLight : "#fff",
                  transition: "border-color 0.18s, background 0.18s",
                }}>

                  {/* Name + checkbox */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, color: C.text, fontSize: 14, flex: 1, lineHeight: 1.3 }}>
                      {item.name}
                    </div>
                    <div
                      onClick={() => toggleItem(item.name)}
                      style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        border: `2px solid ${isSel ? C.sage : C.borderDark}`,
                        background: isSel ? C.sage : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.18s", marginLeft: 10, cursor: "pointer",
                      }}
                    >
                      {isSel && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>

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
                        fontSize: 13, color: C.text, background: "#fff",
                        outline: "none",
                      }}
                    />
                    <select
                      value={item.unit}
                      onChange={e => updateItem(index, { ...item, unit: e.target.value })}
                      style={{
                        flex: 1, padding: "5px 6px",
                        border: `1.5px solid ${C.border}`, borderRadius: RADIUS.sm,
                        fontSize: 12, color: C.text, background: "#fff",
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
                      border: `1.5px solid ${color}55`,
                      borderRadius: RADIUS.sm,
                      fontSize: 12, fontWeight: 600,
                      color, background: color + "14",
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
