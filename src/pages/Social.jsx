import { useState, useEffect } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Card, Btn, Avatar, Page, PageHeader, Empty } from "../components/ui";
import { fetchCommunityUsers, followUser, unfollowUser } from "../lib/db";

function UserCard({ user, onToggle }) {
  return (
    <Card>
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

export default function Social({ userId }) {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab]       = useState("following");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityUsers(userId)
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const toggle = async (targetId) => {
    const target = users.find(u => u.id === targetId);
    if (!target) return;

    // Optimistic update
    setUsers(u => u.map(x => x.id === targetId ? { ...x, following: !x.following } : x));

    if (target.following) {
      await unfollowUser(userId, targetId).catch(() => {
        // Revert on error
        setUsers(u => u.map(x => x.id === targetId ? { ...x, following: true } : x));
      });
    } else {
      await followUser(userId, targetId).catch(() => {
        setUsers(u => u.map(x => x.id === targetId ? { ...x, following: false } : x));
      });
    }
  };

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

      {loading ? (
        <div style={{ color: C.textMuted, fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Loading community…
        </div>
      ) : displayed.length === 0 ? (
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
