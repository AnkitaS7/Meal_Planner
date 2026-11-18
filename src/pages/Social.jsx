import { useState, useEffect } from "react";
import { C, FONTS } from "../theme";
import { Btn, Loading, Page, PageHeader, Empty } from "../components/ui";
import { fetchCommunityUsers, followUser, unfollowUser } from "../lib/db";

// Each cook gets a coin in one of the house colours, picked from their name.
const COINS = [
  ["#F3DDCF", "#A64B2A"], ["#DCE6F2", "#37577F"], ["#DDE9DC", "#3C6A4C"],
  ["#F4E8C6", "#8A6412"], ["#EBDCE7", "#77456B"], ["#F6DDE2", "#9C4560"],
];
const coinFor = name => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COINS[h % COINS.length];
};

function UserCard({ user, onToggle, i }) {
  const [bg, fg] = coinFor(user.name ?? "");
  return (
    <article className="sr-panel clip rise" style={{ "--i": i, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div aria-hidden="true" style={{
          width: 72, height: 72, borderRadius: "50%", background: bg, color: fg, flexShrink: 0,
          display: "grid", placeItems: "center",
          fontFamily: FONTS.display, fontWeight: 400, fontSize: 28,
        }}>
          {user.avatar}
        </div>
        <Btn
          variant={user.following ? "secondary" : "primary"}
          onClick={() => onToggle(user.id)}
          aria-pressed={user.following}
        >
          {user.following ? "Following" : "Follow"}
        </Btn>
      </div>

      <div>
        <div className="mono" style={{ fontSize: 12, color: C.textMuted }}>{user.handle}</div>
        <div style={{
          fontFamily: FONTS.display, fontWeight: 400, fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.head, marginTop: 4,
        }}>
          {user.name}
        </div>
      </div>

      <div style={{ display: "flex", gap: 26, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        {[["Followers", user.followers.toLocaleString()], ["Dishes", user.dishes]].map(([label, val]) => (
          <div key={label}>
            <div className="bignum" style={{ fontSize: 30, color: C.head }}>{val}</div>
            <div className="kicker" style={{ color: C.textMuted, marginTop: 5 }}>{label}</div>
          </div>
        ))}
      </div>
    </article>
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
        title={["Your", { em: true, text: "circle." }]}
        subtitle="Follow cooks and explore their menus, dishes, and recipes."
        eyebrow="Community"
        stats={[
          { v: followingCount, l: "following" },
          { v: discoverCount, l: "to discover" },
        ]}
      />

      <div className="on-world" style={{ display: "flex", gap: "14px 30px", marginBottom: 22, flexWrap: "wrap", alignItems: "center" }}>
        <div className="tabs" role="tablist" style={{ borderBottom: 0 }}>
          {[
            { id: "following", label: `Following (${followingCount})` },
            { id: "discover",  label: `Discover (${discoverCount})`  },
          ].map(t => (
            <button key={t.id} role="tab" className="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search people…"
          aria-label="Search people"
          className="world-search"
          style={{ flex: 1, minWidth: 200, width: "auto" }}
        />
      </div>

      {loading ? (
        <Loading label="Gathering the table…" size={56} style={{ color: "var(--ink)", padding: "80px 0" }} />
      ) : displayed.length === 0 ? (
        <Empty
          icon={
            <svg viewBox="0 0 60 60" width={80} height={80} aria-hidden="true">
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {displayed.map((u, i) => (
            <UserCard key={u.id} user={u} onToggle={toggle} i={i} />
          ))}
        </div>
      )}
    </Page>
  );
}
