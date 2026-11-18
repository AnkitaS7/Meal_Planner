import { useState, useEffect } from "react";
import { C, RADIUS } from "../theme";
import { Btn, Input } from "./ui";
import { fetchNutrientTargets, saveNutrientTargets } from "../lib/db";
import { STANDARD_TARGETS } from "./nutrientTargets";

// Manual editor for the five standard daily targets. Pre-fills from whatever is
// already saved (e.g. from the DRI calculator) and writes back through the same
// nutrient_targets store, so the Dashboard and Nutrition page pick it up.
export default function CustomTargets({ userId }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(STANDARD_TARGETS.map(t => [t.name, ""])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetchNutrientTargets(userId)
      .then(rows => {
        setValues(prev => {
          const next = { ...prev };
          rows.forEach(r => {
            if (r.nutrient_name in next) next[r.nutrient_name] = String(r.target_value);
          });
          return next;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const setVal = (name, v) => {
    setValues(p => ({ ...p, [name]: v }));
    setSaveMsg("");
    setError("");
  };

  const save = async () => {
    setError("");
    setSaveMsg("");
    for (const t of STANDARD_TARGETS) {
      const v = Number(values[t.name]);
      if (values[t.name] === "" || Number.isNaN(v) || v <= 0)
        return setError(`${t.name} must be greater than 0.`);
    }
    setSaving(true);
    const rows = STANDARD_TARGETS.map(t => ({
      nutrient_name: t.name,
      target_value:  Number(values[t.name]),
      unit:          t.unit,
      display_color: t.color,
      sort_order:    t.sort,
    }));
    try {
      await saveNutrientTargets(userId, rows);
      setSaveMsg("Saved! Your Dashboard and Nutrition targets are updated.");
    } catch (e) {
      console.error(e);
      setSaveMsg(`Could not save targets: ${e.message ?? "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <p style={{ fontSize: 15, color: C.textSub, marginBottom: 18, lineHeight: 1.55, maxWidth: "62ch" }}>
        Set your own daily targets. These replace any values from the DRI
        calculator and drive the progress bars on your Dashboard and Nutrition
        page.
      </p>

      {loading ? (
        <p style={{ fontSize: 13, color: C.textMuted }}>Loading your targets…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {STANDARD_TARGETS.map(t => (
            <div
              key={t.name}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, padding: "10px 2px", borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 9 }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: t.color }} />
                {t.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Input
                  type="number"
                  value={values[t.name]}
                  onChange={e => setVal(t.name, e.target.value)}
                  style={{ width: 110, textAlign: "right" }}
                />
                <span className="mono" style={{ fontSize: 12, color: C.textMuted, width: 34 }}>{t.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ color: C.error, fontSize: 13, marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Btn onClick={save} disabled={saving || loading}>
          {saving ? "Saving…" : "Save my targets"}
        </Btn>
        {saveMsg && (
          <span style={{ fontSize: 13, color: saveMsg.startsWith("Could not") ? C.error : C.success }}>
            {saveMsg}
          </span>
        )}
      </div>
    </>
  );
}
