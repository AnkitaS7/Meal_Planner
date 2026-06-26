import { useState } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Card } from "./ui";
import DriCalculator from "./DriCalculator";
import CustomTargets from "./CustomTargets";

const TABS = [
  { value: "calculator", label: "🧮 DRI Calculator" },
  { value: "custom",     label: "✏️ Custom Nutritional Targets" },
];

// Tabbed card on the Profile page: compute targets from the DRI calculator, or
// set them by hand. Both tabs write to the same nutrient_targets store.
export default function NutritionTargets({ userId }) {
  const [tab, setTab] = useState("calculator");

  return (
    <Card>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {TABS.map(t => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              style={{
                flex: 1, padding: "9px 12px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: FONTS.body,
                border: `1.5px solid ${active ? C.accent : C.border}`,
                background: active ? C.accentLight : "#fff",
                color: active ? C.accentDark : C.textMuted,
                borderRadius: RADIUS.md,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "calculator"
        ? <DriCalculator userId={userId} />
        : <CustomTargets userId={userId} />}
    </Card>
  );
}
