// Spice Route art kit — grain-textured dish plates, ingredient icons,
// spice-mound charts and page watermarks. All vector, all theme-aware.
//
// <SvgDefs/> must be mounted once (App does this); every other component
// references its <symbol>/<filter> definitions by id.

// Fixed "content" colors — spices and food read the same in day and night.
export const SPICE = {
  saffron:  "#E8842C",
  paprika:  "#C0492B",
  turmeric: "#E3A320",
  cardamom: "#C9A96E",
  matcha:   "#7A8B4C",
  chili:    "#C2452F",
  broth:    "#D89540",
  fig:      "#8E3B46",
};

// Nutrient name → spice, for the stall
export const NUTRIENT_SPICE = {
  Calories: SPICE.saffron,
  Protein:  SPICE.paprika,
  Carbs:    SPICE.turmeric,
  Fat:      SPICE.cardamom,
  Fiber:    SPICE.matcha,
  Fibre:    SPICE.matcha,
};

const DISH_IDS = [
  "d-noodle", "d-congee", "d-shak", "d-dal", "d-taco",
  "d-saag", "d-pho", "d-cacio", "d-jollof",
];

// Cover-tint color per dish symbol (used behind deck-card plates)
export const DISH_TINT = {
  "d-noodle": "#D89540", "d-congee": "#EFE6CE", "d-shak": "#C24328",
  "d-dal": "#E0A81E", "d-taco": "#E8C87A", "d-saag": "#557A34",
  "d-pho": "#C89050", "d-cacio": "#EAD9A0", "d-jollof": "#D06428",
};

// Deterministic dish → artwork. Category steers the family where it can;
// the name hash keeps assignment stable between renders and sessions.
export function dishSymbol(dish) {
  const name = (dish?.name ?? "").toLowerCase();
  const category = (dish?.category ?? "").toLowerCase();
  if (/noodle|ramen|udon|soba|miso/.test(name)) return "d-noodle";
  if (/congee|porridge|oat|rice pudding/.test(name)) return "d-congee";
  if (/shakshuka|egg|omelet|frittata/.test(name)) return "d-shak";
  if (/dal|daal|lentil|curry/.test(name)) return "d-dal";
  if (/taco|burrito|quesadilla|wrap/.test(name)) return "d-taco";
  if (/saag|palak|spinach|greens/.test(name)) return "d-saag";
  if (/pho|soup|broth|stew/.test(name)) return "d-pho";
  if (/pasta|spaghetti|pepe|noodles al|mac/.test(name)) return "d-cacio";
  if (/jollof|biryani|pilaf|fried rice|paella/.test(name)) return "d-jollof";
  if (category.includes("breakfast")) return "d-congee";
  if (category.includes("soup")) return "d-pho";
  let h = 0;
  const s = name || category || "dish";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return DISH_IDS[h % DISH_IDS.length];
}

// A plated dish. Round, grain-textured, consistent light.
// When real photography lands, this component swaps to an <img> for dishes
// that have a photo URL and keeps the illustration as the fallback.
export function DishArt({ dish, size = 40, style }) {
  const id = dishSymbol(dish);
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        overflow: "hidden", display: "inline-block", background: "#F4EFE2",
        boxShadow: "0 4px 10px -4px rgba(10,10,10,0.35), inset 0 0 0 2px rgba(255,255,255,0.5)",
        ...style,
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }}>
        <use href={`#${id}`} />
      </svg>
    </span>
  );
}

const ING_RULES = [
  [/scallion|spring onion|green onion|leek|chive/, "i-scallion"],
  [/chili|chilli|pepper(?!corn)|jalape/, "i-chili"],
  [/lemon|lime|orange|citrus|yuzu/, "i-lemon"],
  [/ginger|turmeric root|galangal/, "i-ginger"],
  [/garlic|onion|shallot/, "i-garlic"],
  [/spinach|herb|basil|mint|coriander|cilantro|parsley|kale|lettuce|greens|rosemary|thyme/, "i-herb"],
  [/egg/, "i-egg"],
  [/milk|cream|yog|kefir|buttermilk|oil|vinegar|sauce|juice/, "i-bottle"],
  [/rice|flour|farro|quinoa|oat|grain|sugar|lentil|bean|pasta|noodle|bread/, "i-sack"],
];

// Ingredient/pantry-item icon. Spices render as a filled jar in the
// item's category color; unknown items fall back to the jar too.
export function IngredientArt({ name = "", category = "", size = 44, jarColor }) {
  const n = name.toLowerCase();
  let id = null;
  for (const [re, sym] of ING_RULES) {
    if (re.test(n)) { id = sym; break; }
  }
  const cat = category.toLowerCase();
  if (!id) {
    if (cat.includes("produce")) id = "i-herb";
    else if (cat.includes("dairy")) id = "i-bottle";
    else if (cat.includes("grain") || cat.includes("bakery")) id = "i-sack";
    else id = "i-jar";
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 60" width={size} height={size}
      style={{
        display: "block", margin: "0 auto",
        filter: "drop-shadow(0 3px 4px rgba(10,10,10,0.18))",
        ...(id === "i-jar" ? { "--jc": jarColor ?? SPICE.turmeric } : {}),
      }}
    >
      <use href={`#${id}`} />
    </svg>
  );
}

// One nutrient as a grainy spice pile that fills toward its target.
// `sub` swaps the unit in the caption for a spice name ("Protein · paprika")
// and moves the unit up into the value line instead.
export function SpiceMound({ name, current, target, unit, color, pourDelay = 0.2, sub, style }) {
  const spice = color ?? NUTRIENT_SPICE[name] ?? SPICE.saffron;
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const y = 64 - 54 * pct;
  const fmt = v => (Number.isInteger(v) ? v.toLocaleString() : Number(v).toFixed(1));
  return (
    <div style={{ flex: "1 1 96px", minWidth: 90, maxWidth: 180, textAlign: "center", ...style }}>
      <svg
        viewBox="0 0 120 70" width="100%" style={{ display: "block" }}
        role="img"
        aria-label={`${name}: ${fmt(current)} of ${fmt(target)} ${unit ?? ""}`}
      >
        <use href="#moundShape" fill="var(--mound)" />
        <g clipPath="url(#mclip)">
          <g className="sr-pour" style={{ "--pour-delay": `${pourDelay}s` }}>
            <rect x="0" y={y} width="120" height={70 - y} fill={spice} />
            <rect x="0" y={y} width="120" height={70 - y} fill="#3A2208" filter="url(#grain)" opacity="0.45" />
          </g>
        </g>
      </svg>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
        <b>{fmt(current)}</b> / {fmt(target)}{sub && unit ? ` ${unit}` : ""}
      </div>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--faint)", marginTop: 2 }}>
        {name}{sub ? ` · ${sub}` : unit ? ` · ${unit}` : ""}
      </div>
    </div>
  );
}

// Oversized faint page motif. Parent must be position:relative + overflow:hidden.
export function Watermark({ symbol, size = 180, style }) {
  return (
    <svg
      className="sr-wm" aria-hidden="true"
      viewBox="0 0 60 60" width={size} height={size} style={style}
    >
      <use href={`#${symbol}`} />
    </svg>
  );
}

// Mounted once in App. Holds every shared filter/clip/symbol.
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
        <path id="moundShape" d="M6 64 C 30 60 42 28 60 10 C 78 28 90 60 114 64 Z" />
        <clipPath id="mclip"><use href="#moundShape" /></clipPath>
        <clipPath id="cp36"><circle cx="50" cy="50" r="36" /></clipPath>

        {/* dishes */}
        <symbol id="d-noodle" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#2E6E68" /><circle cx="50" cy="50" r="40" fill="#3D7D75" /><circle cx="50" cy="50" r="36" fill="#D89540" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#8A5010" filter="url(#grain)" opacity=".35" />
            <path d="M22 46 C 38 38 62 38 78 48 M24 56 C 40 49 60 49 76 57 M28 64 C 42 59 58 59 72 65" stroke="#F2DCA8" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="35" cy="41" rx="11" ry="9" fill="#FBF3E0" /><circle cx="35" cy="41" r="4.5" fill="#E8A23C" />
            <circle cx="63" cy="38" r="3.5" fill="none" stroke="#6E8B3D" strokeWidth="2.2" />
            <path d="M52 30 c 5 -2 9 1 7 5 c -3 4 -9 1 -7 -5 Z" fill="#5E7A34" />
            <path d="M44 68 l 7 3" stroke="#C24E32" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-congee" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E8E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" /><circle cx="50" cy="50" r="36" fill="#EFE6CE" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#B09860" filter="url(#grain)" opacity=".22" />
            <path d="M30 50 C 38 42 62 42 70 52 C 60 60 40 60 30 50 Z" fill="#F7F0DE" opacity=".8" />
            <path d="M38 40 l 9 -4 M52 38 l 9 3" stroke="#C98F3C" strokeWidth="2" strokeLinecap="round" />
            <circle cx="42" cy="57" r="1.5" fill="#3A2E1E" /><circle cx="56" cy="58" r="1.5" fill="#3A2E1E" />
            <circle cx="62" cy="63" r="3" fill="none" stroke="#6E8B3D" strokeWidth="2" />
          </g>
        </symbol>
        <symbol id="d-shak" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#3A3A3E" /><circle cx="50" cy="50" r="41" fill="#2E2E32" /><circle cx="50" cy="50" r="36" fill="#C24328" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#701E0E" filter="url(#grain)" opacity=".4" />
            <circle cx="38" cy="42" r="9" fill="#F7F1E2" /><circle cx="38" cy="42" r="4" fill="#E8A23C" />
            <circle cx="62" cy="40" r="8.5" fill="#F7F1E2" /><circle cx="62" cy="40" r="3.8" fill="#E8A23C" />
            <circle cx="50" cy="62" r="9" fill="#F7F1E2" /><circle cx="50" cy="62" r="4" fill="#E8A23C" />
            <path d="M30 58 l 5 2 M68 56 l 5 -2" stroke="#5E7A34" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-dal" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#8A5A2E" /><circle cx="50" cy="50" r="40" fill="#9C6A38" /><circle cx="50" cy="50" r="36" fill="#E0A81E" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#8A6208" filter="url(#grain)" opacity=".35" />
            <path d="M32 46 C 44 40 58 42 70 50" stroke="#F2DCA8" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
            <path d="M40 60 c 6 -3 12 -3 18 0" stroke="#C24E32" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M35 34 c 4 -4 8 -2 7 2 c -2 4 -8 2 -7 -2 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-taco" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="42" fill="#F2EBDA" />
          <path d="M20 62 A 18 18 0 0 1 56 62 Z" fill="#E8C87A" transform="rotate(-9 38 58)" />
          <path d="M24 58 h 28" stroke="#B4502E" strokeWidth="4" transform="rotate(-9 38 58)" />
          <path d="M26 54 h 24" stroke="#6E8B3D" strokeWidth="2.6" transform="rotate(-9 38 58)" />
          <path d="M44 66 A 18 18 0 0 1 80 66 Z" fill="#EED292" transform="rotate(7 62 62)" />
          <path d="M48 62 h 28" stroke="#B4502E" strokeWidth="4" transform="rotate(7 62 62)" />
          <path d="M50 58 h 24" stroke="#6E8B3D" strokeWidth="2.6" transform="rotate(7 62 62)" />
        </symbol>
        <symbol id="d-saag" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#7A4A30" /><circle cx="50" cy="50" r="40" fill="#8A5638" /><circle cx="50" cy="50" r="36" fill="#557A34" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#2C4416" filter="url(#grain)" opacity=".4" />
            <rect x="34" y="36" width="12" height="12" rx="3" fill="#F7F1E2" /><rect x="54" y="42" width="11" height="11" rx="3" fill="#F2ECD9" /><rect x="42" y="56" width="11" height="11" rx="3" fill="#F7F1E2" />
            <path d="M62 60 l 6 3" stroke="#C24E32" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-pho" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E2D2" /><circle cx="50" cy="50" r="40" fill="#F4EFE2" /><circle cx="50" cy="50" r="36" fill="#C89050" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#7E5620" filter="url(#grain)" opacity=".3" />
            <path d="M24 52 C 40 44 60 44 76 54 M28 60 C 42 54 58 54 72 61" stroke="#F2E4C0" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="40" cy="40" rx="9" ry="5.5" fill="#B87868" /><ellipse cx="58" cy="37" rx="8.5" ry="5" fill="#C4877A" />
            <path d="M68 46 c 4 -4 9 -2 8 2 c -2 5 -9 3 -8 -2 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-cacio" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="42" fill="#F2EBDA" />
          <path d="M30 52 C 36 40 64 40 70 52 C 64 64 36 64 30 52 Z" fill="#EAD9A0" />
          <path d="M32 50 C 40 42 60 42 68 51 M34 56 C 42 49 58 49 66 56" stroke="#DFC888" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="42" cy="48" r="1.4" fill="#2E2A22" /><circle cx="55" cy="45" r="1.4" fill="#2E2A22" /><circle cx="61" cy="54" r="1.4" fill="#2E2A22" />
        </symbol>
        <symbol id="d-jollof" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#6E2E22" /><circle cx="50" cy="50" r="40" fill="#7E3628" /><circle cx="50" cy="50" r="36" fill="#D06428" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#7E3208" filter="url(#grain)" opacity=".5" />
            <path d="M38 56 l 8 -2 M54 58 l 8 -3" stroke="#B02E20" strokeWidth="3" strokeLinecap="round" />
            <path d="M46 34 c 4 -3 8 0 6 4 c -3 3 -8 0 -6 -4 Z" fill="#5E7A34" />
          </g>
        </symbol>

        {/* ingredients */}
        <symbol id="i-scallion" viewBox="0 0 60 60">
          <path d="M22 48 C 24 30 24 18 20 6" stroke="#5E8F2C" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M30 48 C 32 32 36 16 42 8" stroke="#6FA03A" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="26" cy="50" rx="9" ry="6" fill="#F4EFE0" />
        </symbol>
        <symbol id="i-chili" viewBox="0 0 60 60">
          <path d="M12 44 C 20 50 38 44 46 26 C 48 20 42 16 38 22 C 32 36 20 42 12 40 Z" fill="#C2452F" />
          <path d="M44 22 c 2 -6 8 -6 10 -2" stroke="#4A6B28" strokeWidth="3" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-lemon" viewBox="0 0 60 60">
          <circle cx="30" cy="32" r="17" fill="#C9A21B" /><circle cx="30" cy="32" r="14.5" fill="#F2DE7A" />
          <g stroke="#E9C63C" strokeWidth="2">
            <path d="M30 32 v-13 M30 32 l 11 -6 M30 32 l 11 7 M30 32 v 13 M30 32 l -11 7 M30 32 l -11 -6" />
          </g>
          <circle cx="30" cy="32" r="2.5" fill="#E9C63C" />
        </symbol>
        <symbol id="i-ginger" viewBox="0 0 60 60">
          <path d="M14 38 C 10 28 20 24 26 28 C 28 20 40 18 42 26 C 52 24 54 34 46 38 C 48 46 36 50 32 44 C 26 50 16 46 14 38 Z" fill="#C89A5E" />
          <path d="M22 34 c 4 2 8 2 12 0 M30 40 c 4 1 8 0 10 -2" stroke="#A87838" strokeWidth="1.5" fill="none" />
        </symbol>
        <symbol id="i-garlic" viewBox="0 0 60 60">
          <path d="M30 14 C 26 22 16 26 16 38 C 16 48 24 52 30 52 C 36 52 44 48 44 38 C 44 26 34 22 30 14 Z" fill="#F2ECDC" />
          <path d="M30 20 v 30 M24 26 c -2 8 -2 16 0 24 M36 26 c 2 8 2 16 0 24" stroke="#D8CCB4" strokeWidth="1.5" fill="none" />
          <path d="M30 14 c 0 -4 2 -6 4 -8" stroke="#8FA05A" strokeWidth="2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-herb" viewBox="0 0 60 60">
          <path d="M30 54 C 30 40 30 24 30 10" stroke="#4A7A34" strokeWidth="2.5" fill="none" />
          <path d="M30 22 c -9 -2 -13 -8 -13 -15 c 9 0 13 7 13 15 Z" fill="#5E8F3C" />
          <path d="M30 22 c 9 -2 13 -8 13 -15 c -9 0 -13 7 -13 15 Z" fill="#6FA048" />
          <path d="M30 38 c -7 -1 -10 -6 -10 -12 c 7 0 10 5 10 12 Z" fill="#5E8F3C" />
          <path d="M30 38 c 7 -1 10 -6 10 -12 c -7 0 -10 5 -10 12 Z" fill="#6FA048" />
        </symbol>
        <symbol id="i-egg" viewBox="0 0 60 60">
          <path d="M16 30 C 12 18 28 10 38 15 C 50 19 48 34 42 42 C 34 50 18 46 16 30 Z" fill="#F7F1E2" />
          <circle cx="30" cy="29" r="8" fill="#E8A23C" /><circle cx="27" cy="26" r="2.5" fill="#F2C878" />
        </symbol>
        <symbol id="i-bottle" viewBox="0 0 60 60">
          <path d="M25 8 h 10 v 8 c 6 4 8 10 8 18 v 16 c 0 4 -3 6 -6 6 h -14 c -3 0 -6 -2 -6 -6 v -16 c 0 -8 2 -14 8 -18 Z" fill="#F2ECDC" />
          <rect x="24" y="6" width="12" height="5" rx="2" fill="#C9C2B0" />
          <rect x="19" y="32" width="22" height="12" rx="2" fill="#FFFFFF" opacity=".7" />
        </symbol>
        <symbol id="i-jar" viewBox="0 0 60 60">
          <rect x="16" y="14" width="28" height="8" rx="3" fill="#A89878" />
          <path d="M18 22 h 24 v 26 c 0 4 -3 6 -6 6 h -12 c -3 0 -6 -2 -6 -6 Z" fill="#EDE6D6" />
          <path d="M18 32 h 24 v 16 c 0 4 -3 6 -6 6 h -12 c -3 0 -6 -2 -6 -6 Z" fill="var(--jc, #E0A81E)" />
        </symbol>
        <symbol id="i-sack" viewBox="0 0 60 60">
          <path d="M18 20 C 14 34 14 44 20 50 C 28 54 34 54 40 50 C 46 44 46 34 42 20 Z" fill="#E4D6B4" />
          <path d="M16 18 h 28 v 5 h -28 Z" fill="#D0BE94" />
          <path d="M24 34 h 12 M24 40 h 12" stroke="#B8A276" strokeWidth="1.6" />
        </symbol>

        {/* watermark-only motifs */}
        <symbol id="w-steam" viewBox="0 0 60 60">
          <g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
            <path d="M16 56 C 10 44 20 40 14 28 C 10 20 16 14 14 4" />
            <path d="M32 56 C 26 44 36 40 30 28 C 26 20 32 14 30 4" />
            <path d="M48 56 C 42 44 52 40 46 28 C 42 20 48 14 46 4" />
          </g>
        </symbol>
        <symbol id="w-rings" viewBox="0 0 60 60">
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="30" cy="30" r="27" /><circle cx="30" cy="30" r="20" /><circle cx="30" cy="30" r="7" />
          </g>
        </symbol>
        <symbol id="w-receipt" viewBox="0 0 60 60">
          <g fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 4 h32 v46 l-4 -4 -4 4 -4 -4 -4 4 -4 -4 -4 4 -4 -4 -4 4 Z" />
            <path d="M21 15 h18 M21 23 h18 M21 31 h12" strokeWidth="2" />
          </g>
        </symbol>
        <symbol id="w-plates" viewBox="0 0 60 60">
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="21" cy="30" r="17" /><circle cx="21" cy="30" r="6" />
            <circle cx="39" cy="30" r="17" /><circle cx="39" cy="30" r="6" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}