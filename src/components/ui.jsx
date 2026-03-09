import { C, FONTS, RADIUS, SHADOW } from "../theme";

/* ─── Tag ──────────────────────────────── */
export const Tag = ({ children, color = C.sage }) => (
  <span style={{
    background: color + "22",
    color,
    border: `1px solid ${color}44`,
    borderRadius: RADIUS.full,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: 0.3,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  }}>
    {children}
  </span>
);

/* ─── Card ──────────────────────────────── */
export const Card = ({ children, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: C.card,
      borderRadius: RADIUS.lg,
      border: `1px solid ${C.border}`,
      padding: 24,
      boxShadow: SHADOW.sm,
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
  >
    {children}
  </div>
);

/* ─── Button ────────────────────────────── */
const BTN_VARIANTS = {
  primary:   { background: C.accent,   color: "#fff",     border: "none" },
  secondary: { background: C.border,   color: C.text,     border: "none" },
  ghost:     { background: "transparent", color: C.accent, border: `1.5px solid ${C.accent}` },
  sage:      { background: C.sage,     color: "#fff",     border: "none" },
  danger:    { background: C.error,    color: "#fff",     border: "none" },
  dark:      { background: C.sidebar,  color: "#fff",     border: "none" },
};

export const Btn = ({
  children, onClick, variant = "primary",
  style = {}, disabled = false, type = "button",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      ...BTN_VARIANTS[variant],
      borderRadius: RADIUS.md,
      padding: "10px 20px",
      fontWeight: 500,
      fontSize: 14,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      transition: "all 0.18s",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      whiteSpace: "nowrap",
      ...style,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.08)"; }}
    onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
  >
    {children}
  </button>
);

/* ─── Input ─────────────────────────────── */
export const Input = ({
  label, value, onChange, placeholder,
  type = "text", style = {}, readOnly = false,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && (
      <label style={{
        fontSize: 11, fontWeight: 700, color: C.textSub,
        letterSpacing: 0.6, textTransform: "uppercase",
      }}>
        {label}
      </label>
    )}
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      readOnly={readOnly}
      style={{
        background: C.bg,
        border: `1.5px solid ${C.border}`,
        borderRadius: RADIUS.md,
        padding: "10px 14px",
        fontSize: 14,
        color: C.text,
        transition: "border-color 0.18s",
        width: "100%",
        ...style,
      }}
      onFocus={e  => { e.target.style.borderColor = C.accent; }}
      onBlur={e   => { e.target.style.borderColor = C.border;  }}
    />
  </div>
);

/* ─── Textarea ───────────────────────────── */
export const Textarea = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && (
      <label style={{
        fontSize: 11, fontWeight: 700, color: C.textSub,
        letterSpacing: 0.6, textTransform: "uppercase",
      }}>
        {label}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        background: C.bg,
        border: `1.5px solid ${C.border}`,
        borderRadius: RADIUS.md,
        padding: "10px 14px",
        fontSize: 14,
        color: C.text,
        resize: "vertical",
        fontFamily: FONTS.body,
        width: "100%",
        transition: "border-color 0.18s",
      }}
      onFocus={e => { e.target.style.borderColor = C.accent; }}
      onBlur={e  => { e.target.style.borderColor = C.border;  }}
    />
  </div>
);

/* ─── Select ─────────────────────────────── */
export const Select = ({ label, value, onChange, options, style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && (
      <label style={{
        fontSize: 11, fontWeight: 700, color: C.textSub,
        letterSpacing: 0.6, textTransform: "uppercase",
      }}>
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      style={{
        background: C.bg,
        border: `1.5px solid ${C.border}`,
        borderRadius: RADIUS.md,
        padding: "10px 14px",
        fontSize: 14,
        color: C.text,
        cursor: "pointer",
        width: "100%",
        ...style,
      }}
    >
      {options.map(o =>
        typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  </div>
);

/* ─── Avatar ─────────────────────────────── */
export const Avatar = ({ initials, size = 40, color = C.accent }) => (
  <div style={{
    width: size, height: size,
    borderRadius: "50%",
    background: color + "20",
    border: `2px solid ${color}50`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.36,
    fontWeight: 700,
    color,
    flexShrink: 0,
    fontFamily: FONTS.body,
    userSelect: "none",
  }}>
    {initials}
  </div>
);

/* ─── NutrientBar ────────────────────────── */
export const NutrientBar = ({ name, current, target, unit, color }) => {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{name}</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          {current} / {target} {unit}
        </span>
      </div>
      <div style={{ height: 7, background: C.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 4,
          transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
        }} />
      </div>
    </div>
  );
};

/* ─── Toggle ─────────────────────────────── */
export const Toggle = ({ on, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? C.sage : C.borderDark,
      display: "flex", alignItems: "center",
      padding: "0 3px",
      justifyContent: on ? "flex-end" : "flex-start",
      cursor: "pointer",
      transition: "all 0.22s",
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: "50%",
      background: "#fff",
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      transition: "all 0.22s",
    }} />
  </div>
);

/* ─── Section heading ────────────────────── */
export const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
    color: C.textMuted, textTransform: "uppercase",
    marginBottom: 10,
  }}>
    {children}
  </div>
);

/* ─── Divider ────────────────────────────── */
export const Divider = ({ style = {} }) => (
  <div style={{ height: 1, background: C.border, ...style }} />
);

/* ─── Empty State ────────────────────────── */
export const Empty = ({ icon = "🔍", title, subtitle, action }) => (
  <div style={{
    textAlign: "center", padding: "64px 24px",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 12,
  }}>
    <span style={{ fontSize: 48 }}>{icon}</span>
    <h3 style={{ fontFamily: FONTS.display, fontSize: 20, color: C.text }}>{title}</h3>
    {subtitle && <p style={{ fontSize: 14, color: C.textSub, maxWidth: 320 }}>{subtitle}</p>}
    {action}
  </div>
);

/* ─── Modal ──────────────────────────────── */
export const Modal = ({ open, onClose, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 200,
        animation: "fadeIn 0.2s ease",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card,
          borderRadius: RADIUS.xl,
          padding: 32,
          width,
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: SHADOW.xl,
          animation: "fadeUp 0.28s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ─── Page wrapper ───────────────────────── */
export const Page = ({ children }) => (
  <div style={{ animation: "fadeUp 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>
    {children}
  </div>
);

/* ─── Page header ────────────────────────── */
export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 16,
  }}>
    <div>
      <h1 style={{
        fontFamily: FONTS.display,
        fontSize: 32, fontWeight: 700,
        color: C.text, lineHeight: 1.1,
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: C.textSub, marginTop: 6, fontSize: 14 }}>{subtitle}</p>
      )}
    </div>
    {action && <div style={{ flexShrink: 0 }}>{action}</div>}
  </div>
);

/* ─── Stat tile ──────────────────────────── */
export const StatTile = ({ icon, value, label, color, onClick }) => (
  <Card
    onClick={onClick}
    style={{
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={onClick ? e => {
      e.currentTarget.style.transform   = "translateY(-2px)";
      e.currentTarget.style.boxShadow   = "0 8px 24px rgba(0,0,0,0.10)";
    } : undefined}
    onMouseLeave={onClick ? e => {
      e.currentTarget.style.transform   = "";
      e.currentTarget.style.boxShadow   = "";
    } : undefined}
  >
    <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
    <div style={{
      fontSize: 28, fontWeight: 700, color,
      fontFamily: FONTS.display,
    }}>
      {value}
    </div>
    <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>{label}</div>
  </Card>
);
