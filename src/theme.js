// Design tokens — Season (Spice Route system)
//
// Every value here resolves to a CSS custom property defined in index.css,
// so the whole app re-themes (including day/night) without touching call
// sites. The custom properties flip when `.night` is set on <html>.

export const C = {
  // Backgrounds
  bg:          "var(--bg)",
  cream:       "var(--panel)",
  card:        "var(--panel)",

  // Rail (legacy names kept for the rare "dark" button variant)
  sidebar:     "var(--head)",
  sidebarHover:"var(--line)",

  // Primary — c1, brand/evening indigo
  accent:      "var(--c1)",
  accentLight: "var(--c1-soft)",
  accentDark:  "var(--c1)",

  // Secondary — c4, mint
  sage:        "var(--c4)",
  sageDark:    "var(--c4)",
  sageLight:   "var(--c4-soft)",

  // Tertiary — c3, saffron gold
  gold:        "var(--c3)",
  goldLight:   "var(--c3-soft)",

  // Neutrals
  text:        "var(--ink)",
  textSub:     "var(--soft)",
  textMuted:   "var(--faint)",
  border:      "var(--line)",
  borderDark:  "var(--line-strong)",

  // Semantic
  success:     "var(--c4)",
  warning:     "var(--c3)",
  error:       "var(--c2)",

  // Accents (legacy names — mapped into the four-color system)
  purple:      "var(--c2)",
  teal:        "var(--c4)",

  // Four working colors, addressable directly by new code
  c1: "var(--c1)", c2: "var(--c2)", c3: "var(--c3)", c4: "var(--c4)",
  c1Soft: "var(--c1-soft)", c2Soft: "var(--c2-soft)",
  c3Soft: "var(--c3-soft)", c4Soft: "var(--c4-soft)",
  head: "var(--head)",
  panel: "var(--panel)",
};

// Translucent tint of a theme color. Replaces the old hex-concatenation
// trick ("#AABBCC" + "22"), which cannot work with var() tokens.
export const alpha = (color, pct) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// Solid tint mixed toward the panel surface (for chips/soft fills that
// must stay opaque over other content).
export const tint = (color, pct) =>
  `color-mix(in srgb, ${color} ${pct}%, var(--panel))`;

export const FONTS = {
  display: "var(--font-display)",
  serif:   "var(--font-serif)",
  body:    "var(--font-body)",
};

export const RADIUS = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 9999,
};

export const SHADOW = {
  sm: "var(--shadow)",
  md: "var(--shadow)",
  lg: "var(--shadow-lift)",
  xl: "var(--shadow-lift)",
};

// ---- Day / night mode -------------------------------------------------
const MODE_KEY = "season-theme-mode";

export function initThemeMode() {
  let night;
  try {
    const saved = localStorage.getItem(MODE_KEY);
    night = saved != null
      ? saved === "night"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    night = false;
  }
  document.documentElement.classList.toggle("night", night);
  return night;
}

export function setThemeMode(night) {
  document.documentElement.classList.toggle("night", night);
  try { localStorage.setItem(MODE_KEY, night ? "night" : "day"); } catch { /* private mode */ }
}

export function isNightMode() {
  return document.documentElement.classList.contains("night");
}