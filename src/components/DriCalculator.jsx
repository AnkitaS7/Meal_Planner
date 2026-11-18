import { useState } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Btn, Input, Select } from "./ui";
import { computeDRI, ACTIVITY_LEVELS, lbToKg, ftInToM, cmToM } from "../lib/dri";
import { saveNutrientTargets } from "../lib/db";
import { TARGET_STYLE } from "./nutrientTargets";

const SEX_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male",   label: "Male" },
];
const STATUS_OPTIONS = [
  { value: "none",      label: "Not pregnant / not lactating" },
  { value: "pregnant",  label: "Pregnant" },
  { value: "lactating", label: "Breastfeeding" },
];

export default function DriCalculator({ userId }) {
  const [units, setUnits]   = useState("metric"); // "metric" | "imperial"
  const [sex, setSex]       = useState("female");
  const [ageValue, setAgeValue] = useState("");
  const [ageUnit, setAgeUnit]   = useState("years"); // "years" | "months"
  const [weight, setWeight] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [activity, setActivity] = useState("Low Active");
  const [status, setStatus]     = useState("none");
  const [pregWeeks, setPregWeeks]       = useState("");
  const [prePregWeight, setPrePregWeight] = useState("");
  const [lactPeriod, setLactPeriod]     = useState("0-6");

  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const imperial = units === "imperial";
  const female   = sex === "female";
  const pregnant  = female && status === "pregnant";
  const lactating = female && status === "lactating";

  const reset = () => { setResult(null); setError(""); setSaveMsg(""); };

  const calculate = () => {
    setSaveMsg("");
    const ageYears = ageUnit === "months" ? Number(ageValue) / 12 : Number(ageValue);
    const weightKg = imperial ? lbToKg(Number(weight)) : Number(weight);
    const heightM  = imperial ? ftInToM(heightFt, heightIn) : cmToM(Number(heightCm));

    // Validation (height/activity only matter for ages 3+).
    if (!ageValue || ageYears <= 0)        return setError("Enter a valid age."), setResult(null);
    if (!weight || weightKg <= 0)          return setError("Enter a valid weight."), setResult(null);
    if (ageYears >= 3 && heightM <= 0)     return setError("Enter a valid height."), setResult(null);
    if (pregnant && (!pregWeeks || Number(pregWeeks) <= 0))
      return setError("Enter the number of weeks pregnant."), setResult(null);

    setError("");
    const { eer, targets } = computeDRI({
      sex, ageYears, weightKg, heightM, activity,
      pregnant,  pregnancyWeeks: Number(pregWeeks),
      prePregnancyWeightKg: prePregWeight
        ? (imperial ? lbToKg(Number(prePregWeight)) : Number(prePregWeight))
        : undefined,
      lactating, lactationPeriod: lactPeriod,
    });
    setResult({ eer, targets, infant: ageYears < 1 });
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    setSaveMsg("");
    const rows = result.targets.map(t => ({
      nutrient_name: t.nutrient_name,
      target_value:  t.target_value,
      unit:          t.unit,
      display_color: TARGET_STYLE[t.nutrient_name].color,
      sort_order:    TARGET_STYLE[t.nutrient_name].sort,
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

  const UnitBtn = ({ value, label }) => (
    <button
      type="button"
      className={`chip${units === value ? " on" : ""}`}
      aria-pressed={units === value}
      onClick={() => { setUnits(value); reset(); }}
    >
      {label}
    </button>
  );

  return (
    <>
      <p style={{ fontSize: 15, color: C.textSub, marginBottom: 18, lineHeight: 1.55, maxWidth: "62ch" }}>
        Estimate your daily calorie & macronutrient targets from the USDA / National
        Academies Dietary Reference Intakes. Inputs are used only for this calculation
        and are not stored.
      </p>

      {/* Units toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <UnitBtn value="metric"   label="Metric (kg / cm)" />
        <UnitBtn value="imperial" label="Imperial (lb / ft·in)" />
      </div>

      {/* Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="Sex" value={sex} onChange={e => { setSex(e.target.value); reset(); }} options={SEX_OPTIONS} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignItems: "end" }}>
          <Input label="Age" type="number" value={ageValue} onChange={e => setAgeValue(e.target.value)} />
          <Select value={ageUnit} onChange={e => setAgeUnit(e.target.value)}
            options={[{ value: "years", label: "years" }, { value: "months", label: "months" }]} />
        </div>

        <Input
          label={imperial ? "Weight (lb)" : "Weight (kg)"}
          type="number" value={weight} onChange={e => setWeight(e.target.value)}
        />

        {imperial ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Input label="Height (ft)" type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} />
            <Input label="(in)"        type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} />
          </div>
        ) : (
          <Input label="Height (cm)" type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
        )}

        <Select label="Activity Level" value={activity} onChange={e => setActivity(e.target.value)}
          options={ACTIVITY_LEVELS} style={{ gridColumn: female ? "auto" : "1 / -1" }} />

        {female && (
          <Select label="Status" value={status} onChange={e => { setStatus(e.target.value); reset(); }} options={STATUS_OPTIONS} />
        )}

        {pregnant && (
          <>
            <Input label="Weeks pregnant" type="number" value={pregWeeks} onChange={e => setPregWeeks(e.target.value)} />
            <Input label={imperial ? "Pre-pregnancy wt (lb)" : "Pre-pregnancy wt (kg)"}
              type="number" value={prePregWeight} onChange={e => setPrePregWeight(e.target.value)} />
          </>
        )}

        {lactating && (
          <Select label="Months postpartum" value={lactPeriod} onChange={e => setLactPeriod(e.target.value)}
            options={[{ value: "0-6", label: "0–6 months" }, { value: "7-12", label: "7–12 months" }]} />
        )}
      </div>

      {error && <div style={{ color: C.error, fontSize: 13, marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 16 }}>
        <Btn onClick={calculate}>Calculate</Btn>
      </div>

      {/* Results */}
      {result && (
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
          <div className="kicker" style={{ color: C.textMuted, marginBottom: 6 }}>
            Recommended Daily Targets
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {result.targets.map(t => (
              <div key={t.nutrient_name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "13px 2px", borderBottom: `1px solid ${C.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 9 }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: TARGET_STYLE[t.nutrient_name].color }} />
                    {t.nutrient_name}
                  </div>
                  {t.basis && (
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{t.basis}</div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="bignum" style={{ fontSize: 32, color: C.head }}>
                    {t.target_value}<span className="mono" style={{ fontSize: 12, fontWeight: 400, letterSpacing: 0, marginLeft: 5, color: C.textMuted }}>{t.unit}</span>
                  </span>
                  {t.range && (
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                      range {t.range[0]}–{t.range[1]} {t.unit}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {result.infant && (
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 12, lineHeight: 1.6 }}>
              For infants under 12 months the DRI does not define carbohydrate, fat, or
              fibre distributions, so only calories and protein are shown.
            </p>
          )}

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <Btn onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save as my targets"}
            </Btn>
            {saveMsg && (
              <span style={{ fontSize: 13, color: saveMsg.startsWith("Could not") ? C.error : C.success }}>
                {saveMsg}
              </span>
            )}
          </div>

          <p style={{ fontSize: 11, color: C.textMuted, marginTop: 16, lineHeight: 1.6 }}>
            Based on the IOM (2005) Estimated Energy Requirement equations. Protein
            uses the RDA (0.8 g/kg for adults; higher for children, pregnancy &
            lactation), as in the USDA report; carbs/fat use AMDR midpoints (50% /
            30% of energy) and fibre the AI of 14 g per 1000 kcal. Estimates only —
            not medical advice.
          </p>
        </div>
      )}
    </>
  );
}
