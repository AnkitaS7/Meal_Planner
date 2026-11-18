import { useEffect, useState } from "react";
import { setThemeMode, isNightMode } from "../theme";
import { NavIcon, IconMenu, IconX } from "./ui";

// Every destination, in order. `c` is the world's colour, used by the menu.
export const NAV_ITEMS = [
  { id: "dashboard", label: "Today",    c: "#F2452B" },
  { id: "planner",   label: "Week",     c: "#C9F25B" },
  { id: "dishes",    label: "Cookbook", c: "#FFB627" },
  { id: "pantry",    label: "Pantry",   c: "#C5D86D" },
  { id: "shopping",  label: "Market",   c: "#8FA2FF" },
  { id: "nutrients", label: "Macros",   c: "#E59BF5" },
  { id: "scanner",   label: "Scan",     c: "#E4DFD2" },
  { id: "social",    label: "Circle",   c: "#FF9CC2" },
  { id: "profile",   label: "You",      c: "#F6F0E3" },
];
const MOBILE_PRIMARY = ["dashboard", "planner", "dishes", "pantry"];

const SunMoon = ({ night }) => (
  <svg viewBox="0 0 20 20" width={17} height={17} aria-hidden="true" style={{ display: "block" }}>
    {night ? (
      <path d="M15.5 12.2A6.5 6.5 0 0 1 7.8 4.5 6.5 6.5 0 1 0 15.5 12.2Z" fill="currentColor" />
    ) : (
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <circle cx="10" cy="10" r="3.4" fill="currentColor" stroke="none" />
        <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
      </g>
    )}
  </svg>
);

export function useNight() {
  const [night, setNight] = useState(isNightMode);
  const toggle = () => { const next = !night; setNight(next); setThemeMode(next); };
  return [night, toggle];
}

const Wordmark = (props) => (
  <span {...props}>Season<span className="sub">home kitchen</span></span>
);

// Floats over each page's photograph. On wide screens every section is a
// link here; narrower screens use the dock and the menu instead.
export function TopBar({ page, setPage, user, night, onToggleNight, onOpenMenu, menuOpen }) {
  return (
    <div className="topbar">
      <button className="wordmark" onClick={() => setPage("dashboard")} aria-label="Season — go to Today">
        <Wordmark />
      </button>
      <nav className="topnav" aria-label="Main">
        {NAV_ITEMS.filter(i => i.id !== "profile").map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} aria-current={page === item.id ? "page" : undefined}>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="topbar-actions">
        <button
          className="bar-btn round" onClick={onToggleNight} aria-pressed={night}
          aria-label={night ? "Switch to day" : "Switch to night"} title={night ? "Switch to day" : "Switch to night"}
        >
          <SunMoon night={night} />
        </button>
        <button className="bar-btn hide-sm" onClick={() => setPage("profile")} aria-label={`Your profile: ${user.name}`}>
          <span className="bar-avatar" aria-hidden="true">{user.avatar}</span>
          <span className="truncate" style={{ maxWidth: 110 }}>{user.name}</span>
        </button>
        <button className="bar-btn" onClick={onOpenMenu} aria-expanded={menuOpen} aria-label="Open menu">
          <IconMenu />
          <span className="hide-sm menu-label">Menu</span>
        </button>
      </div>
    </div>
  );
}

export function Dock({ page, setPage, onOpenMenu }) {
  return (
    <nav className="dock" aria-label="Main">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`dock-item${MOBILE_PRIMARY.includes(item.id) ? "" : " desk"}`}
          onClick={() => setPage(item.id)}
          aria-current={page === item.id ? "page" : undefined}
          aria-label={item.label}
        >
          <NavIcon id={item.id} />
          <span className="lbl" aria-hidden="true">{item.label}</span>
        </button>
      ))}
      <button
        className="dock-item more" onClick={onOpenMenu} aria-label="More"
        aria-current={!MOBILE_PRIMARY.includes(page) ? "page" : undefined}
      >
        <IconMenu size={20} />
        <span className="lbl" aria-hidden="true">More</span>
      </button>
    </nav>
  );
}

// Full-screen menu: every destination as a headline.
export function Menu({ page, setPage, user, night, onToggleNight, onSignOut, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="menu" role="dialog" aria-modal="true" aria-label="Menu">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark className="wordmark" style={{ cursor: "default" }} />
        <button className="bar-btn" onClick={onClose} autoFocus aria-label="Close menu">
          <IconX size={15} /> Close
        </button>
      </div>
      <nav className="menu-links" aria-label="All sections">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.id}
            className="menu-link"
            style={{ "--i": i, "--lc": item.c }}
            onClick={() => { setPage(item.id); onClose(); }}
            aria-current={page === item.id ? "page" : undefined}
          >
            <span className="n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="menu-foot">
        <span style={{ opacity: 0.7 }}>{user.name} · {user.handle}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="bar-btn" onClick={onToggleNight} aria-pressed={night}>
            <SunMoon night={night} /> {night ? "Switch to day" : "Switch to night"}
          </button>
          {onSignOut && <button className="bar-btn" onClick={onSignOut}>Sign out</button>}
        </div>
      </div>
    </div>
  );
}
