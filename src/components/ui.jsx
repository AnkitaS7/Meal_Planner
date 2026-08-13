import { useEffect, useRef } from "react";
import { C, FONTS, RADIUS, SHADOW, alpha } from "../theme";

// Chrome icons — quiet round-cap strokes on currentColor, so they inherit
// each button's hover color. Food art stays in art.jsx; these are the only
// glyphs allowed in UI chrome (never emoji / text symbols).
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
    <path d="M2.5 5 h13 M2.5 9 h13 M2.5 13 h13" {...STROKE} strokeWidth={strokeWidth} />
  </svg>
);

// Tag
export const Tag = ({ children, color = C.sage }) => (
  <span style={{
    background: alpha(color, 13),
    color,
    border: `1px solid ${alpha(color, 27)}`,
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

// Card
export const Card = ({ children, style = {}, onClick, onMouseEnter, onMouseLeave }) => (
  <div
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
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

// Button
const BTN_VARIANTS = {
  primary:   { background: C.accent,      color: "var(--on-accent)", border: "none" },
  secondary: { background: C.border,      color: C.text,   border: "none" },
  ghost:     { background: "transparent", color: C.accent, border: `1.5px solid ${C.accent}` },
  sage:      { background: C.sage,        color: "var(--on-accent)", border: "none" },
  sageSoft:  { background: C.sageLight,   color: C.sage,   border: "none" },
  danger:    { background: C.error,       color: "var(--on-accent)", border: "none" },
  dark:      { background: C.sidebar,     color: "var(--bg)", border: "none" },
};

export const Btn = ({
  children, onClick, variant = "primary",
  style = {}, disabled = false, type = "button",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="sr-press"
    style={{
      ...BTN_VARIANTS[variant],
      borderRadius: RADIUS.md,
      padding: "10px 20px",
      fontWeight: 500,
      fontSize: 14,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      transition: "transform 0.14s ease-out, filter 0.18s ease",
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

// Input
export const Input = ({
  label, value, onChange, placeholder,
  type = "text", style = {}, readOnly = false, onKeyDown, min, step,
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
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      type={type}
      readOnly={readOnly}
      min={min}
      step={step}
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
      onFocus={e => { e.target.style.borderColor = C.accent; }}
      onBlur={e  => { e.target.style.borderColor = C.border; }}
    />
  </div>
);

// CheckRow — accessible, keyboard-operable check item used in lists (shopping,
// etc.). Renders as a real checkbox to assistive tech: focusable, toggles on
// Enter/Space, exposes aria-checked, and shows a focus ring for keyboard users.
//   checked   — current state
//   onToggle  — called on click / Enter / Space
//   label     — accessible name (screen-reader text)
//   children  — the visible row content
//   trailing  — optional element rendered at the end (e.g. a remove button)
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
    onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${C.accent}`; }}
    onBlur={e  => { e.currentTarget.style.boxShadow = "none"; }}
    style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "11px 14px", borderRadius: RADIUS.md,
      background: checked ? C.sageLight : C.bg,
      cursor: "pointer", transition: "background 0.18s", userSelect: "none",
      outline: "none",
    }}
  >
    <span style={{
      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
      border: `2px solid ${checked ? C.sage : C.borderDark}`,
      background: checked ? C.sage : "transparent",
      color: "var(--on-accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.18s",
    }}>
      {checked && <IconCheck />}
    </span>
    <div style={{ flex: 1 }}>{children}</div>
    {trailing}
  </div>
);

// Textarea
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
      onBlur={e  => { e.target.style.borderColor = C.border; }}
    />
  </div>
);

// Select
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

// Avatar
export const Avatar = ({ initials, size = 40, color = C.accent }) => (
  <div style={{
    width: size, height: size,
    borderRadius: "50%",
    background: alpha(color, 13),
    border: `2px solid ${alpha(color, 31)}`,
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

// Toggle
export const Toggle = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onChange}
    style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? C.sage : C.borderDark,
      display: "flex", alignItems: "center",
      padding: "0 3px", border: "none",
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
  </button>
);

// SectionLabel
export const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
    color: C.textMuted, textTransform: "uppercase",
    marginBottom: 10,
  }}>
    {children}
  </div>
);

// Divider
export const Divider = ({ style = {} }) => (
  <div style={{ height: 1, background: C.border, ...style }} />
);

// Empty state
const EmptyDefaultIcon = (
  <svg viewBox="0 0 60 60" width={48} height={48} style={{ color: "var(--faint)" }} aria-hidden="true">
    <use href="#w-lens" />
  </svg>
);

export const Empty = ({ icon = EmptyDefaultIcon, title, subtitle, action }) => (
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

// Modal — a real dialog to assistive tech: focus moves into the panel on
// open (and back where it was on close), Tab is trapped inside, Escape and
// the backdrop both close it.
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
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", padding: "16px",
        justifyContent: "center", zIndex: 200,
        animation: "fadeIn 0.2s ease",
        backdropFilter: "blur(2px)",
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
          background: C.card,
          borderRadius: RADIUS.xl,
          padding: 32,
          margin: "auto",
          width,
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: SHADOW.xl,
          animation: "fadeUp 0.28s cubic-bezier(0.22,1,0.36,1)",
          outline: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Page wrapper
export const Page = ({ children }) => (
  <div style={{ animation: "fadeUp 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>
    {children}
  </div>
);

// Page header. `eyebrow` + `color` give each page its signature hue at the
// top; `motif` is an art symbol id (full-color i-* food art) shown beside the
// title so the page opens on food, not just type.
export const PageHeader = ({ title, subtitle, action, eyebrow, color, motif }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 16,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
      {motif && (
        <svg
          aria-hidden="true" viewBox="0 0 60 60" width={46} height={46}
          style={{ flexShrink: 0 }}
        >
          <use href={`#${motif}`} />
        </svg>
      )}
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <div style={{
            fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase",
            fontWeight: 700, color: color ?? C.accent, marginBottom: 5,
          }}>
            {eyebrow}
          </div>
        )}
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
    </div>
    {action && <div style={{ flexShrink: 0 }}>{action}</div>}
  </div>
);

// Shared loading state — rising steam (currentColor line art from SvgDefs)
// instead of bare "Loading…" text. Compact enough to sit inside a panel.
export const Loading = ({ label = "Warming the stove…", size = 38, style = {} }) => (
  <div role="status" style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 8, padding: "28px 0", color: C.textMuted, fontSize: 13, ...style,
  }}>
    <svg
      aria-hidden="true" viewBox="0 0 60 60" width={size} height={size}
      style={{ animation: "pulse 1.5s ease-in-out infinite" }}
    >
      <use href="#w-steam" />
    </svg>
    <span>{label}</span>
  </div>
);
