import { useState } from "react";
import { C, FONTS, setThemeMode, isNightMode } from "../theme";
import { Avatar } from "./ui";

const NAV_ITEMS = [
  { id: "dashboard",   label: "Dashboard"     },
  { id: "planner",     label: "Meal Planner"  },
  { id: "dishes",      label: "Dish Database" },
  { id: "pantry",      label: "Pantry"        },
  { id: "shopping",    label: "Shopping"      },
  { id: "nutrients",   label: "Nutrients"     },
  { id: "scanner",     label: "Bill Scanner"  },
  { id: "social",      label: "Community"     },
  { id: "profile",     label: "Profile"       },
];

export default function Sidebar({ page, setPage, user, onSignOut }) {
  const [night, setNight] = useState(isNightMode);

  const toggleNight = () => {
    const next = !night;
    setNight(next);
    setThemeMode(next);
  };

  return (
    <aside style={{
      width: 220,
      background: C.panel,
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      padding: "28px 0 20px",
      minHeight: "100vh",
      position: "sticky",
      top: 0,
      flexShrink: 0,
      transition: "background 0.35s ease, border-color 0.35s ease",
    }}>
      {/* Brand */}
      <div style={{ padding: "0 24px 22px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{
          fontFamily: FONTS.display,
          color: C.accent,
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}>
          Season
        </div>
        <div style={{
          color: C.textMuted,
          fontSize: 9,
          marginTop: 4,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}>
          Meal Planner
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "14px 10px", flex: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              aria-current={active ? "page" : undefined}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "10px 14px",
                borderRadius: 9,
                border: "none",
                background: active ? C.accentLight : "transparent",
                color: active ? C.accent : C.textSub,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.18s",
                textAlign: "left",
                marginBottom: 2,
                fontFamily: FONTS.body,
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.color = "var(--ink)";
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.color = "var(--soft)";
              }}
            >
              <span aria-hidden="true" style={{
                width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                background: active ? C.accent : "transparent",
                transition: "background 0.18s",
              }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Day / night */}
      <div style={{ padding: "0 20px 14px" }}>
        <button
          onClick={toggleNight}
          aria-pressed={night}
          style={{
            width: "100%",
            padding: "9px 0",
            borderRadius: 9,
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.textSub,
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: FONTS.body,
            transition: "all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c1)"; e.currentTarget.style.color = "var(--c1)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--soft)"; }}
        >
          {night ? "Switch to day" : "Switch to night"}
        </button>
      </div>

      {/* User footer */}
      <div style={{ padding: "16px 20px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar initials={user.avatar} size={34} color={C.gold} />
          <div style={{ overflow: "hidden" }}>
            <div style={{
              color: C.text, fontSize: 13, fontWeight: 600,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {user.name}
            </div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>
              {user.handle}
            </div>
          </div>
        </div>
        {onSignOut && (
          <button
            onClick={onSignOut}
            style={{
              width: "100%",
              padding: "7px 0",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: C.textMuted,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: FONTS.body,
              transition: "color 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--c2)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--faint)"; }}
          >
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}