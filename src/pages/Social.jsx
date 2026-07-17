import { useState, useEffect } from "react";
import { C, FONTS, RADIUS } from "../theme";
import { Card, Btn, Avatar, Page, PageHeader, Empty } from "../components/ui";
import { Watermark } from "../components/art";
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
            <div style={{ fontFamily: FONTS.serif, fontWeight: 600, color: C.head, fontSize: 16 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{user.handle}</div>
          </div>
        </div>
        <Btn
          variant={user.following ? "secondary" : "primary"}
          onClick={() => onToggle(user.id)}
          style={{ padding: "7px 16px", fontSize: 13 }}
        >
          {user.following ? "Following" : "Follow"}
        </Btn>
      </div>

      <div style={{
        display: "flex", gap: 0,
        borderTop: `1px solid ${C.border}`,
        padding: "12px 0 0",
      }}>
        {[["Followers", user.followers.toLocaleString()], ["Dishes", user.dishes]].map(([label, val]) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 18, color: C.head, fontVariantNumeric: "tabular-nums" }}>
              {val}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Social({ userId }) {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab]       = useState("discover");
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
          display: "flex", background: C.card,
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
                color: tab === t.id ? "var(--on-accent)" : C.textSub,
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
          placeholder="Search people…"
          style={{
            flex: 1, minWidth: 200,
            background: C.card, border: `1.5px solid ${C.border}`,
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
          icon={
            <svg viewBox="0 0 60 60" width={56} height={56} style={{ color: C.textMuted }} aria-hidden="true">
              <use href="#w-plates" />
            </svg>
          }
          title={tab === "following" ? "Not following anyone yet" : "No new people found"}
          subtitle={
            tab === "following"
              ? "Switch to Discover to find cooks to follow."
              : "Try adjusting your search."
          }
        />
      ) : (
        <div style={{ position: "relative" }}>
          <Watermark symbol="w-plates" size={230} style={{ right: 0, top: -48 }} />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 18,
            position: "relative",
          }}>
            {displayed.map(u => (
              <UserCard key={u.id} user={u} onToggle={toggle} />
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
