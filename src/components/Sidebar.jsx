import { C, FONTS } from "../theme";
import { Avatar } from "./ui";

const NAV_ITEMS = [
  { id: "dashboard",   icon: "⊞",  label: "Dashboard"     },
  { id: "planner",     icon: "📅", label: "Meal Planner"  },
  { id: "dishes",      icon: "🍽", label: "Dish Database" },
  { id: "pantry",      icon: "🏺", label: "Pantry"        },
  { id: "shopping",    icon: "🛒", label: "Shopping Cart" },
  { id: "suggestions", icon: "✨", label: "Suggestions"   },
  { id: "nutrients",   icon: "📊", label: "Nutrients"     },
  { id: "scanner",     icon: "📷", label: "Bill Scanner"  },
  { id: "social",      icon: "👥", label: "Community"     },
  { id: "profile",     icon: "👤", label: "Profile"       },
];

export default function Sidebar({ page, setPage, user }) {
  return (
    <aside style={{
      width: 220,
      background: C.sidebar,
      display: "flex",
      flexDirection: "column",
      padding: "28px 0",
      minHeight: "100vh",
      position: "sticky",
      top: 0,
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{
        padding: "0 24px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{
          fontFamily: FONTS.display,
          color: "#fff",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: -0.3,
        }}>
          Mise en Place
        </div>
        <div style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 10,
          marginTop: 3,
          letterSpacing: 1.5,
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
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: active ? C.accent : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.18s",
                textAlign: "left",
                marginBottom: 2,
                fontFamily: FONTS.body,
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <Avatar initials={user.avatar} size={34} color="#fff" />
        <div style={{ overflow: "hidden" }}>
          <div style={{
            color: "#fff", fontSize: 13, fontWeight: 600,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {user.name}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
            {user.handle}
          </div>
        </div>
      </div>
    </aside>
  );
}
