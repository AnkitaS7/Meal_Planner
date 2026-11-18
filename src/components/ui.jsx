import { createContext, useContext, useEffect, useRef } from "react";
import { C, FONTS, RADIUS, alpha } from "../theme";
import { SCENES, photoUrl } from "../lib/photos";

// Which section of the app is showing; PageHeader uses it to pick the
// section's photograph when a page doesn't pass its own.
export const WorldContext = createContext("dashboard");

// Chrome icons — round-cap strokes on currentColor. Food art stays in art.jsx.
const STROKE = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" };

export const IconX = ({ size = 14, strokeWidth = 2 }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" style={{ display: "block" }}>
    <path d="M4 4 l8 8 M12 4 l-8 8" {...STROKE} strokeWidth={strokeWidth} />
  </svg>
);

export const IconCheck = ({ size = 12, strokeWidth = 2.6 }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" style={{ display: "block" }}>
    <path d="M3 8.5 L6.5 12 L13 4.5" {...STROKE} strokeWidth={strokeWidth} />
  </svg>
);

export const IconMenu = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg viewBox="0 0 18 18" width={size} height={size} aria-hidden="true" style={{ display: "block" }}>
    <path d="M2.5 6 h13 M2.5 12 h13" {...STROKE} strokeWidth={strokeWidth} />
  </svg>
);

// Navigation glyphs, one per world.
const NAV_PATHS = {
  dashboard: "M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.5 1.5M16.5 16.5 18 18M6 18l1.5-1.5M16.5 7.5 18 6M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z",
  planner:   "M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.500 18V8A1.5 1.5 0 0 1 5 6.5ZM3.500 11h17M8 4v4M16 4v4",
  dishes:    "M12 6.5c-2-1.600-4.800-2-7.500-1.500v13c2.700-.5 5.500-.1 7.500 1.500 2-1.600 4.800-2 7.500-1.500V5c-2.700-.5-5.500-.1-7.500 1.500ZM12 6.500v13",
  pantry:    "M8 3.500h8M8.500 3.500v2.500c-1.600.9-2.500 2.300-2.500 4v8A2.500 2.500 0 0 0 8.500 20.500h7A2.500 2.500 0 0 0 18 18v-8c0-1.700-.9-3.100-2.500-4V3.500M6 12.500h12",
  shopping:  "M4.500 9.500h15l-1.400 9a1.500 1.500 0 0 1-1.500 1.300H7.400a1.500 1.500 0 0 1-1.500-1.300l-1.400-9ZM8.500 9.500 11 4M15.500 9.500 13 4",
  nutrients: "M4 19.500h16M7 19.500v-6M12 19.500V5M17 19.500v-9",
  scanner:   "M7 3.500h10v17l-2.500-1.700L12 20.500l-2.500-1.700L7 20.500v-17ZM10 8h4M10 11.500h4",
  social:    "M9 11.500a3.200 3.200 0 1 0 0-6.400 3.200 3.200 0 0 0 0 6.400ZM3.500 19.500c.4-3 2.600-4.800 5.500-4.800s5.100 1.800 5.500 4.800M16 5.300a3.200 3.200 0 0 1 0 6M17.500 14.900c1.700.6 2.800 2.200 3 4.600",
  profile:   "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.500 20.500c.6-3.600 3.600-5.500 7.500-5.500s6.900 1.900 7.500 5.500",
};
export const NavIcon = ({ id, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
    <path d={NAV_PATHS[id]} {...STROKE} strokeWidth={1.8} />
  </svg>
);

// The brand mark: a citrus wheel — eight segments.
const SEGMENTS = [0, 45, 90, 135, 180, 225, 270, 315];
export const Mark = ({ size = 26, spin = false, style }) => (
  <svg
    viewBox="0 0 64 64" width={size} height={size} aria-hidden="true"
    style={{ display: "block", flexShrink: 0, animation: spin ? "spin 2.4s linear infinite" : undefined, ...style }}
  >
    <circle cx="32" cy="32" r="30.5" fill="none" stroke="currentColor" strokeWidth="3" />
    {SEGMENTS.map(a => (
      <path key={a} d="M32 28 L27.6 9.5 A23 23 0 0 1 36.400 9.500 Z" fill="currentColor" transform={`rotate(${a} 32 32)`} />
    ))}
  </svg>
);

// Tag
export const Tag = ({ children, color = C.sage }) => (
  <span style={{
    background: alpha(color, 11),
    color,
    borderRadius: RADIUS.full,
    padding: "3px 11px",
    fontSize: 13,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  }}>
    {children}
  </span>
);

// Card — a paper sheet
export const Card = ({ children, style = {}, onClick, onMouseEnter, onMouseLeave, className = "" }) => (
  <div
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={`sr-panel ${className}`}
    style={{ cursor: onClick ? "pointer" : "default", ...style }}
  >
    {children}
  </div>
);

// Button — variants live in CSS (.sr-btn-*) so the hero can flip them
export const Btn = ({
  children, onClick, variant = "primary",
  style = {}, disabled = false, type = "button", ...rest
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`sr-press sr-btn sr-btn-${variant}`}
    style={style}
    {...rest}
  >
    {children}
  </button>
);

const Label = ({ children }) => <label className="field-label">{children}</label>;

// Input
export const Input = ({
  label, value, onChange, placeholder,
  type = "text", style = {}, readOnly = false, onKeyDown, min, step,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
    {label && <Label>{label}</Label>}
    <input
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      type={type}
      readOnly={readOnly}
      min={min}
      step={step}
      className="sr-field"
      style={style}
    />
  </div>
);

// CheckRow — accessible, keyboard-operable check item (shopping, etc.).
export const CheckRow = ({ checked, onToggle, label, children, trailing }) => (
  <div
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    tabIndex={0}
    onClick={onToggle}
    onKeyDown={e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); }
    }}
    style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 4px",
      opacity: checked ? 0.55 : 1,
      cursor: "pointer", transition: "opacity 0.2s", userSelect: "none",
    }}
  >
    <span style={{
      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
      border: `1.5px solid ${checked ? C.text : C.borderDark}`,
      background: checked ? C.text : "transparent",
      color: C.panel,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s",
    }}>
      {checked && <IconCheck />}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    {trailing}
  </div>
);

// Textarea
export const Textarea = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
    {label && <Label>{label}</Label>}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="sr-field"
      style={{ resize: "vertical", lineHeight: 1.5 }}
    />
  </div>
);

// Select
export const Select = ({ label, value, onChange, options, style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
    {label && <Label>{label}</Label>}
    <select value={value} onChange={onChange} className="sr-field" style={style}>
      {options.map(o =>
        typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  </div>
);

// Avatar — initials on a soft tint of the section's colour
export const Avatar = ({ initials, size = 40, color }) => (
  <div style={{
    width: size, height: size,
    borderRadius: "50%",
    background: color ? alpha(color, 16) : "linear-gradient(160deg, var(--kraft-a), var(--kraft-b))",
    color: color ?? "#2E2418",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.4,
    flexShrink: 0,
    fontFamily: FONTS.display,
    userSelect: "none",
  }}>
    {initials}
  </div>
);

// Toggle
export const Toggle = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onChange}
    style={{
      width: 52, height: 30, borderRadius: 15,
      background: on ? C.text : C.borderDark,
      display: "flex", alignItems: "center",
      padding: "0 4px", border: "none",
      cursor: "pointer", flexShrink: 0,
      transition: "background 0.25s",
    }}
  >
    <div style={{
      width: 22, height: 22, borderRadius: "50%",
      background: C.panel,
      transform: on ? "translateX(22px)" : "none",
      transition: "transform 0.3s var(--ease-spring)",
    }} />
  </button>
);

// SectionLabel
export const SectionLabel = ({ children }) => (
  <div className="kicker" style={{ color: C.textMuted, marginBottom: 10 }}>{children}</div>
);

// Divider
export const Divider = ({ style = {} }) => (
  <div style={{ height: 1, background: C.border, ...style }} />
);

// Empty state
const EmptyDefaultIcon = <Mark size={44} />;

export const Empty = ({ icon = EmptyDefaultIcon, title, subtitle, action }) => (
  <div className="rise" style={{
    padding: "clamp(40px, 7vw, 80px) 24px", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    border: `1.5px dashed ${C.borderDark}`, borderRadius: 6, background: "color-mix(in srgb, var(--panel) 55%, transparent)",
  }}>
    <span style={{ color: C.accent, marginBottom: 6 }}>{icon}</span>
    <h3 style={{ fontFamily: FONTS.display, fontSize: 30, lineHeight: 1.15, color: C.head, maxWidth: "20ch" }}>{title}</h3>
    {subtitle && <p style={{ fontSize: 16, maxWidth: 400, color: C.textSub }}>{subtitle}</p>}
    {action && <div style={{ marginTop: 8 }}>{action}</div>}
  </div>
);

// Modal — a real dialog: focus moves in on open (and back on close), Tab is
// trapped inside, Escape and the backdrop both close it.
export const Modal = ({ open, onClose, children, width = 520, label = "Dialog" }) => {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement;
    panelRef.current?.focus();
    const onKey = e => { if (e.key === "Escape") closeRef.current?.(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreRef.current?.focus?.();
    };
  }, [open]);

  const trapTab = e => {
    if (e.key !== "Tab") return;
    const nodes = panelRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const list = [...(nodes ?? [])].filter(n => !n.disabled && n.offsetParent != null);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(30,20,10,0.45)",
        display: "flex", alignItems: "center", padding: 14,
        justifyContent: "center", zIndex: 400,
        animation: "fadeIn 0.25s ease",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        onKeyDown={trapTab}
        style={{
          background: C.card, color: C.text,
          borderRadius: 8, border: 0,
          padding: "clamp(20px, 3vw, 32px)",
          margin: "auto",
          width,
          maxWidth: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lift)",
          animation: "rise 0.45s var(--ease-out) both",
          outline: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Page wrapper
export const Page = ({ children }) => <div>{children}</div>;

// Page title. Parts flow on one line; an `{ em, text }` part is set in
// italic in the section's accent.
export const HeroTitle = ({ lines, className = "", style }) => (
  <h1 className={`hero-title ${className}`} style={style}>
    {lines.map((l, i) => (
      <span className="ln" key={i}>
        <span style={{ "--i": i }}>{l.em ? <em>{l.text}</em> : l}</span>{i < lines.length - 1 ? " " : ""}
      </span>
    ))}
  </h1>
);

// Page header: a full-bleed photograph that fades into the page, with the
// title, note and numbers set over the faded part. Props as before (title /
// subtitle / eyebrow / action / stats / onBack) plus `photo` (an Unsplash
// photo id or a full URL) and `size` ("big" | "slim").
export const PageHeader = ({
  title, subtitle, action, eyebrow, stats, onBack, backLabel = "Back", photo, size = "",
}) => {
  const world = useContext(WorldContext);
  const src = photo
    ? (photo.startsWith("http") ? photo : photoUrl(photo, 2000))
    : photoUrl(SCENES[world] ?? SCENES.dashboard, 2000);
  const lines = Array.isArray(title) ? title : [title];
  return (
    <header className={`hero ${size}`}>
      <div className="hero-photo"><img src={src} alt="" key={src} /></div>
      <div className="hero-inner">
        {onBack && <div style={{ marginBottom: 14 }}><button className="hero-back" onClick={onBack}>{backLabel}</button></div>}
        <div className="hero-main">
          <div style={{ minWidth: 0, flex: "1 1 460px" }}>
            {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
            {lines.some(Boolean) && <HeroTitle lines={lines} />}
            {subtitle && <p className="hero-sub">{subtitle}</p>}
          </div>
          {(stats || action) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start", flex: "0 1 auto", maxWidth: "100%" }}>
              {stats && (
                <div className="hero-stats">
                  {stats.map(s => (
                    <div className="hero-stat" key={s.l}>
                      <div className="v">{s.v}</div>
                      <div className="l">{s.l}</div>
                    </div>
                  ))}
                </div>
              )}
              {action && <div style={{ maxWidth: "100%" }}>{action}</div>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// A ruled section head: title, a hand-written note, and an optional link.
export const SectionHead = ({ title, note, action, as: Tag = "h2" }) => (
  <div className="head">
    <Tag>{title}</Tag>
    {note != null && note !== "" && <span className="note">{note}</span>}
    {action && <span style={{ marginLeft: "auto" }}>{action}</span>}
  </div>
);

// Progress toward a target: big number, thick bar.
export const Meter = ({ name, current, target, unit, color, delay = 0.2 }) => {
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const fmt = v => (Number.isInteger(v) ? v.toLocaleString() : Number(v).toFixed(1));
  return (
    <div className="meter" role="img" aria-label={`${name}: ${fmt(current)} of ${fmt(target)} ${unit ?? ""}`}>
      <div className="meter-top">
        <span className="meter-val">{fmt(current)}<small>/ {fmt(target)} {unit}</small></span>
        <span className="meter-name">{name}</span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${Math.max(pct * 100, 1.5)}%`, "--mc": color, "--d": `${delay}s` }} />
      </div>
    </div>
  );
};

// Shared loading state — the citrus wheel turning.
export const Loading = ({ label = "Warming the stove…", size = 38, style = {} }) => (
  <div role="status" style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 12, padding: "28px 0", color: C.textMuted, fontSize: 14, ...style,
  }}>
    <Mark size={Math.min(size, 40)} spin style={{ color: C.accent }} />
    <span>{label}</span>
  </div>
);
