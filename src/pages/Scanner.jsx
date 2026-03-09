import { useState, useRef } from "react";
import { C, FONTS, RADIUS, SHADOW } from "../theme";
import { Card, Btn, Page, PageHeader } from "../components/ui";

const SCANNED_DEMO = [
  { name: "Cherry Tomatoes",  qty: 250, unit: "g",      category: "Produce" },
  { name: "Parmesan Cheese",  qty: 100, unit: "g",      category: "Dairy"   },
  { name: "Garlic Cloves",    qty: 5,   unit: "pcs",    category: "Produce" },
  { name: "Heavy Cream",      qty: 200, unit: "ml",     category: "Dairy"   },
  { name: "Fresh Basil",      qty: 1,   unit: "bunch",  category: "Produce" },
  { name: "Arborio Rice",     qty: 400, unit: "g",      category: "Grains"  },
  { name: "White Wine",       qty: 250, unit: "ml",     category: "Pantry"  },
  { name: "Shallots",         qty: 3,   unit: "pcs",    category: "Produce" },
];

export default function Scanner({ setPantry }) {
  const [stage, setStage]     = useState("idle");  // idle | scanning | result
  const [drag, setDrag]       = useState(false);
  const [items, setItems]     = useState([]);
  const [selected, setSelected] = useState({});
  const fileRef               = useRef();

  const startScan = () => {
    setStage("scanning");
    setTimeout(() => {
      setItems(SCANNED_DEMO);
      setSelected(Object.fromEntries(SCANNED_DEMO.map(i => [i.name, true])));
      setStage("result");
    }, 2400);
  };

  const toggleItem = (name) =>
    setSelected(s => ({ ...s, [name]: !s[name] }));

  const selectAll   = () => setSelected(Object.fromEntries(items.map(i => [i.name, true])));
  const deselectAll = () => setSelected(Object.fromEntries(items.map(i => [i.name, false])));

  const addToPantry = () => {
    const toAdd = items
      .filter(i => selected[i.name])
      .map(i => ({ ...i, id: Date.now() + Math.random(), expiry: "" }));
    setPantry(p => [...p, ...toAdd]);
    setStage("idle");
    setItems([]);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <Page>
      <PageHeader
        title="Bill Scanner"
        subtitle="Scan your grocery receipt to auto-populate your pantry"
      />

      {/* ── IDLE ── */}
      {stage === "idle" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Drop zone */}
          <div
            onDragOver={e  => { e.preventDefault(); setDrag(true);  }}
            onDragLeave={  () => setDrag(false)}
            onDrop={e      => { e.preventDefault(); setDrag(false); startScan(); }}
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
              accept="image/*,.pdf"
              style={{ display: "none" }}
              onChange={startScan}
            />

            <div style={{ fontSize: 56, marginBottom: 20 }}>📸</div>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 24, color: C.text, marginBottom: 10 }}>
              Upload Your Receipt
            </h3>
            <p style={{ color: C.textSub, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Drag & drop or click to browse.<br />
              Supports JPG, PNG, and PDF formats.
            </p>

            <Btn onClick={e => { e.stopPropagation(); startScan(); }}>
              📷 Demo Scan
            </Btn>
          </div>

          {/* How it works */}
          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 20, marginBottom: 20, color: C.text }}>
              How It Works
            </h3>
            {[
              ["📸", "Upload",     "Take a photo or scan of your grocery receipt"],
              ["🤖", "AI Extract", "Our system identifies items, quantities, and categories automatically"],
              ["✅", "Review",     "Select which detected items to add to your pantry"],
              ["🏺", "Done!",      "Items are instantly available across the entire app"],
            ].map(([icon, title, desc], i) => (
              <div key={i} style={{
                display: "flex", gap: 14, marginBottom: 18,
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: C.accentLight, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>
                  {icon}
                </div>
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
              🔒 Your receipt data is processed locally and never stored on our servers.
            </div>
          </Card>
        </div>
      )}

      {/* ── SCANNING ── */}
      {stage === "scanning" && (
        <Card style={{ textAlign: "center", padding: "80px 40px" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: C.accentLight, margin: "0 auto 24px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
            animation: "spin 2s linear infinite",
          }}>
            ⚙️
          </div>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 26, color: C.text, marginBottom: 10 }}>
            Scanning your receipt…
          </h3>
          <p style={{ color: C.textSub, fontSize: 14, marginBottom: 32 }}>
            Identifying items, quantities, and categories
          </p>
          <div style={{ width: 300, height: 5, background: C.border, borderRadius: 3, margin: "0 auto" }}>
            <div style={{
              height: "100%", background: C.accent, borderRadius: 3,
              width: "70%", animation: "pulse 1.4s ease infinite",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 32 }}>
            {["Reading text…", "Matching items…", "Categorising…"].map((step, i) => (
              <div key={step} style={{
                fontSize: 12, color: i === 1 ? C.accent : C.textMuted,
                fontWeight: i === 1 ? 600 : 400,
              }}>
                {i < 1 ? "✓ " : i === 1 ? "→ " : ""}{step}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── RESULT ── */}
      {stage === "result" && (
        <div>
          {/* Header bar */}
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
                <Btn variant="secondary" onClick={() => { setStage("idle"); setItems([]); }}>
                  Rescan
                </Btn>
                <Btn variant="sage" onClick={addToPantry} disabled={selectedCount === 0}>
                  Add {selectedCount} to Pantry →
                </Btn>
              </div>
            </div>
          </Card>

          {/* Item grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: 12,
          }}>
            {items.map(item => (
              <div
                key={item.name}
                onClick={() => toggleItem(item.name)}
                style={{
                  border: `2px solid ${selected[item.name] ? C.sage : C.border}`,
                  borderRadius: RADIUS.md,
                  padding: 16,
                  cursor: "pointer",
                  background: selected[item.name] ? C.sageLight : "#fff",
                  transition: "all 0.18s",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: C.text, fontSize: 14, marginBottom: 4 }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 13, color: C.textSub }}>
                      {item.qty} {item.unit} · {item.category}
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${selected[item.name] ? C.sage : C.borderDark}`,
                    background: selected[item.name] ? C.sage : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.18s", marginLeft: 10,
                  }}>
                    {selected[item.name] && (
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
