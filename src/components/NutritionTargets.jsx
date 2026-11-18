import { useState } from "react";
import { Card } from "./ui";
import DriCalculator from "./DriCalculator";
import CustomTargets from "./CustomTargets";

const TABS = [
  { value: "calculator", label: "DRI Calculator" },
  { value: "custom",     label: "Custom Targets" },
];

// Tabbed card on the Profile page: compute targets from the DRI calculator, or
// set them by hand. Both tabs write to the same nutrient_targets store.
export default function NutritionTargets({ userId }) {
  const [tab, setTab] = useState("calculator");

  return (
    <Card>
      <h3 className="sr-panel-h"><span>Nutrition targets</span><span>drives your macros</span></h3>
      <div className="chip-row" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.value}
            className={`chip${tab === t.value ? " on" : ""}`}
            onClick={() => setTab(t.value)}
            aria-pressed={tab === t.value}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "calculator"
        ? <DriCalculator userId={userId} />
        : <CustomTargets userId={userId} />}
    </Card>
  );
}
