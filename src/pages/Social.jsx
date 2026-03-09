import { useState } from "react";
import { C, FONTS, RADIUS } from "../theme";
import {
  Card, Btn, Avatar, Tag, Page, PageHeader, Empty,
} from "../components/ui";
import { MOCK_SOCIAL } from "../data/mockData";

function UserCard({ user, onToggle }) {
  return (
    <Card>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 16,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar initials={user.avatar} size={46} color={C.accent} />
          <div>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{user.handle}</div>
          </div>
        </div>
        <Btn
          variant={user.following ? "secondary" : "primary"}
          onClick={() => onToggle(user.id)}
          style={{ padding: "7px 16px", fontSize: 13 }}
        >
          {user.following ? "Following ✓" : "+ Follow"}
        </Btn>
      </div>

      {/* Stats */}
      <div style={{
        display: "flex", gap: 0,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: "12px 0", marginBottom: 14,
      }}>
        {[["Followers", user.followers.toLocaleString()], ["Dishes", user.dishes]].map(([label, val]) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, color: C.text }}>
              {val}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent meal */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 26 }}>{user.img}</span>
        <div>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5 }}>
            LATEST MEAL
          </div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginTop: 2 }}>
            {user.recentMeal}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
        <Btn variant="secondary" style={{ flex: 1, fontSize: 12, padding: "8px 12px" }}>
          🍽 View Dishes
        </Btn>
        <Btn variant="secondary" style={{ flex: 1, fontSize: 12, padding: "8px 12px" }}>
          📅 View Menu
        </Btn>
      </div>
    </Card>
  );
}

export default function Social() {
  const [users, setUsers]  = useState(MOCK_SOCIAL);
  const [search, setSearch] = useState("");
  const [tab, setTab]       = useState("following"); // following | discover

  const toggle = (id) =>
    setUsers(u => u.map(x => x.id === id ? { ...x, following: !x.following } : x));

  const displayed = users.filter(u =>
    (tab === "following" ? u.following : !u.following)
    && u.name.toLowerCase().includes(search.toLowerCase())
  );

  const followingCount = users.filter(u => u.following).length;
  const discoverCount  = users.filter(u => !u.following).length;

  return (
    <Page>
      <PageHeader
        title="Community"
        subtitle="Follow cooks and explore their menus, dishes, and recipes"
      />

      {/* Tab + search bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{
          display: "flex", background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.md, overflow: "hidden", flexShrink: 0,
        }}>
          {[
            { id: "following", label: `Following (${followingCount})` },
            { id: "discover",  label: `Discover (${discoverCount})`  },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 20px", border: "none",
                background: tab === t.id ? C.accent : "transparent",
                color: tab === t.id ? "#fff" : C.textSub,
                fontWeight: tab === t.id ? 600 : 400,
                fontSize: 14, cursor: "pointer",
                fontFamily: FONTS.body,
                transition: "all 0.18s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search people…"
          style={{
            flex: 1, minWidth: 200,
            background: "#fff", border: `1.5px solid ${C.border}`,
            borderRadius: RADIUS.md, padding: "10px 16px",
            fontSize: 14, color: C.text,
          }}
        />
      </div>

      {/* Cards */}
      {displayed.length === 0 ? (
        <Empty
          icon="👥"
          title={tab === "following" ? "Not following anyone yet" : "No new people found"}
          subtitle={
            tab === "following"
              ? "Switch to Discover to find cooks to follow."
              : "Try adjusting your search."
          }
        />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 18,
        }}>
          {displayed.map(u => (
            <UserCard key={u.id} user={u} onToggle={toggle} />
          ))}
        </div>
      )}
    </Page>
  );
}
