import { C, FONTS, RADIUS, SHADOW } from "../theme";
import { SvgDefs, Watermark } from "./art";

// Shared chrome for the signed-out screens (sign in / sign up / password reset)
// so they stay visually identical without each page re-declaring the card.

export const authInputStyle = {
  width: "100%",
  border: `1.5px solid ${C.border}`,
  borderRadius: RADIUS.md,
  padding: "11px 14px",
  fontSize: 14,
  color: C.text,
  fontFamily: FONTS.body,
  outline: "none",
  boxSizing: "border-box",
};

export const authLabelStyle = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: C.textSub, marginBottom: 6, letterSpacing: 0.4,
  textTransform: "uppercase",
};

export const AuthShell = ({ children }) => (
  <div style={{
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}>
    <SvgDefs />
    <div style={{
      background: C.card,
      borderRadius: RADIUS.xl,
      boxShadow: SHADOW.lg,
      padding: "48px 40px",
      width: "100%",
      maxWidth: 400,
      position: "relative",
      overflow: "hidden",
    }}>
      <Watermark symbol="w-steam" size={170} style={{ right: -34, top: -30 }} />
      {/* Brand */}
      <div style={{ textAlign: "center", marginBottom: 32, position: "relative" }}>
        <div style={{
          fontFamily: FONTS.display, fontSize: 26, fontWeight: 800,
          color: C.accent, letterSpacing: "0.3em", textTransform: "uppercase",
        }}>
          Season
        </div>
        <div style={{
          fontSize: 13, color: C.textMuted, marginTop: 4,
          letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          Meal Planner
        </div>
      </div>
      {children}
    </div>
  </div>
);

export const AuthNotice = ({ tone = "error", children }) => (
  <div style={{
    background: `color-mix(in srgb, var(${tone === "error" ? "--c2" : "--c4"}) 10%, var(--panel))`,
    border: `1px solid color-mix(in srgb, var(${tone === "error" ? "--c2" : "--c4"}) 35%, transparent)`,
    borderRadius: RADIUS.md, padding: "10px 14px",
    fontSize: 13, color: tone === "error" ? C.error : C.success,
  }}>
    {children}
  </div>
);

export const AuthButton = ({ loading, children, ...rest }) => (
  <button
    {...rest}
    disabled={loading}
    style={{
      background: loading ? C.border : C.accent,
      color: "var(--on-accent)", border: "none",
      borderRadius: RADIUS.md, padding: "13px 0",
      fontSize: 15, fontWeight: 600,
      fontFamily: FONTS.body,
      cursor: loading ? "not-allowed" : "pointer",
      marginTop: 4, transition: "background 0.18s",
    }}
  >
    {children}
  </button>
);

export const AuthLink = ({ children, style = {}, ...rest }) => (
  <button
    type="button"
    {...rest}
    style={{
      background: "none", border: "none", padding: 0,
      color: C.accent, fontSize: 13, fontWeight: 600,
      fontFamily: FONTS.body, cursor: "pointer",
      ...style,
    }}
  >
    {children}
  </button>
);
