// Dietary Reference Intakes (DRI) calculator
// =================================================================
// Energy uses the Estimated Energy Requirement (EER) equations from the
// Institute of Medicine, "Dietary Reference Intakes for Energy, Carbohydrate,
// Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids" (2005) — the
// same basis as the USDA DRI Calculator. In every equation:
//   a = age in years, w = weight in kg, h = height in metres,
//   PA = physical-activity coefficient (see table below).
//
// Protein uses the RDA / AI (g per kg body weight, by life stage), matching the
// USDA DRI report. Carbohydrate and Fat use AMDR midpoints (50% and 30% of
// energy) so they reduce to a single trackable target. Total fibre uses the
// Adequate Intake of 14 g per 1000 kcal.
//
// NOTE on infants (< 12 months): the DRI does NOT define AMDR macro
// distributions or a fibre AI for this age, so for infants only Calories and
// Protein (AI) are produced — carbs/fat/fibre are intentionally omitted rather
// than fabricated.

export const ACTIVITY_LEVELS = ["Inactive", "Low Active", "Active", "Very Active"];

// PA coefficients — IOM 2005, Tables for adults (>=19 y) and children (3-18 y).
const PA = {
  adult: {
    male:   { "Inactive": 1.00, "Low Active": 1.11, "Active": 1.25, "Very Active": 1.48 },
    female: { "Inactive": 1.00, "Low Active": 1.12, "Active": 1.27, "Very Active": 1.45 },
  },
  child: {
    male:   { "Inactive": 1.00, "Low Active": 1.13, "Active": 1.26, "Very Active": 1.42 },
    female: { "Inactive": 1.00, "Low Active": 1.16, "Active": 1.31, "Very Active": 1.56 },
  },
};

const round1 = n => Math.round(n * 10) / 10;

// Protein RDA / AI in grams per kg body weight, by life stage — IOM 2005.
function proteinPerKg({ ageYears, pregnant, lactating }) {
  if (pregnant)  return 1.1;   // RDA, pregnancy
  if (lactating) return 1.3;   // RDA, lactation
  if (ageYears < 0.5) return 1.52; // 0-6 mo (AI)
  if (ageYears < 1)   return 1.20; // 7-12 mo
  if (ageYears < 4)   return 1.05; // 1-3 y
  if (ageYears < 14)  return 0.95; // 4-13 y
  if (ageYears < 19)  return 0.85; // 14-18 y
  return 0.80;                     // >=19 y
}

// Base (non-pregnant, non-lactating) EER in kcal/day.
function baseEER({ sex, ageYears, weightKg: w, heightM: h, activity }) {
  // Infants & toddlers 0-35 months: no activity term, includes energy deposition.
  if (ageYears < 3) {
    const deposition =
      ageYears < 0.25 ? 175 : // 0-3 mo
      ageYears < 0.5  ? 56  : // 4-6 mo
      ageYears < 1    ? 22  : // 7-12 mo
                        20;   // 13-35 mo
    return (89 * w - 100) + deposition;
  }
  // Children & adolescents 3-18 y (+20 kcal/day energy deposition for growth).
  if (ageYears < 19) {
    const pa = PA.child[sex][activity];
    return sex === "male"
      ? 88.5  - 61.9 * ageYears + pa * (26.7 * w + 903 * h) + 20
      : 135.3 - 30.8 * ageYears + pa * (10.0 * w + 934 * h) + 20;
  }
  // Adults >=19 y.
  const pa = PA.adult[sex][activity];
  return sex === "male"
    ? 662 - 9.53 * ageYears + pa * (15.91 * w + 539.6 * h)
    : 354 - 6.91 * ageYears + pa * (9.36  * w + 726   * h);
}

// Additional daily energy for pregnancy (by trimester) and lactation (by period).
// IOM 2005: pregnancy +0 / +340 / +452 kcal for trimesters 1/2/3; lactation
// +330 kcal (500 milk - 170 mobilisation) for 0-6 mo, +400 kcal for 7-12 mo.
function reproductiveExtra({ pregnant, pregnancyWeeks, lactating, lactationPeriod }) {
  if (pregnant) {
    if (pregnancyWeeks <= 13) return 0;
    if (pregnancyWeeks <= 27) return 340;
    return 452;
  }
  if (lactating) return lactationPeriod === "0-6" ? 330 : 400;
  return 0;
}

// Compute DRI targets from a normalised (metric) input object:
//   { sex: "male"|"female", ageYears, weightKg, heightM, activity,
//     pregnant?, pregnancyWeeks?, prePregnancyWeightKg?,
//     lactating?, lactationPeriod?: "0-6"|"7-12" }
// Returns { eer, targets: [{ nutrient_name, target_value, unit }] }.
export function computeDRI(input) {
  // Energy uses pre-pregnancy weight when pregnant (per the DRI method).
  const energyWeight = input.pregnant && input.prePregnancyWeightKg
    ? input.prePregnancyWeightKg
    : input.weightKg;

  const eer = Math.round(
    baseEER({ ...input, weightKg: energyWeight }) + reproductiveExtra(input)
  );

  // Each target also carries a `basis` label and, for AMDR macros, the full
  // recommended `range` — for display only (not persisted).
  const targets = [{ nutrient_name: "Calories", target_value: eer, unit: "kcal", basis: "EER" }];

  // Protein = RDA / AI (g per kg body weight), matching the USDA DRI report.
  const proteinRDA = proteinPerKg(input) * input.weightKg;
  targets.push({
    nutrient_name: "Protein", target_value: round1(proteinRDA), unit: "g",
    basis: input.ageYears < 1 ? "AI" : "RDA",
  });

  // Carbs / Fat (AMDR midpoints) and fibre AI are not DRI-defined for infants
  // under 12 months, so they're omitted for that age.
  if (input.ageYears >= 1) {
    targets.push({
      nutrient_name: "Carbs", target_value: round1((0.50 * eer) / 4), unit: "g",
      basis: "AMDR 45–65%", range: [round1((0.45 * eer) / 4), round1((0.65 * eer) / 4)],
    });
    targets.push({
      nutrient_name: "Fat", target_value: round1((0.30 * eer) / 9), unit: "g",
      basis: "AMDR 20–35%", range: [round1((0.20 * eer) / 9), round1((0.35 * eer) / 9)],
    });
    targets.push({
      nutrient_name: "Fiber", target_value: round1((14 * eer) / 1000), unit: "g", basis: "AI",
    });
  }

  return { eer, targets };
}

// Unit helpers for the form (imperial -> metric).
export const lbToKg   = lb => lb * 0.45359237;
export const ftInToM  = (ft, inch) => ((Number(ft) || 0) * 12 + (Number(inch) || 0)) * 0.0254;
export const cmToM    = cm => cm / 100;
