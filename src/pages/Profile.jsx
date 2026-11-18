import { useEffect, useState } from "react";
import { C, FONTS } from "../theme";
import {
  Card, Btn, Input, Textarea, Toggle, Page, PageHeader,
} from "../components/ui";

import { fetchActivityStats, updateProfile } from "../lib/db";
import NutritionTargets from "../components/NutritionTargets";

export default function Profile({ profile, setProfile, userId, dishCount, dietaryOptions }) {
  const toAppProfile = (p) => ({
    name:           p.name,
    handle:         p.handle,
    avatar:         p.avatar_initials,
    bio:            p.bio ?? "",
    dietary:        p.dietary_prefs ?? [],
    followers:      p.follower_count ?? 0,
    following:      p.following_count ?? 0,
    dishes:         dishCount,
    notif_email:    p.notif_email,
    public_profile: p.public_profile,
    nutrition_track:p.nutrition_track,
    weekly_digest:  p.weekly_digest,
  });

  const [editing, setEditing] = useState(false);
  const [displayProfile, setDisplayProfile] = useState(() => toAppProfile(profile));
  const [draft, setDraft]     = useState(() => toAppProfile(profile));

  const setD = (k, v) => setDraft(p => ({ ...p, [k]: v }));

  const toggleDiet = (d) =>
    setDraft(p => ({
      ...p,
      dietary: p.dietary.includes(d)
        ? p.dietary.filter(x => x !== d)
        : [...p.dietary, d],
    }));

  const save = async () => {
    const updates = {
      name:           draft.name,
      handle:         draft.handle,
      bio:            draft.bio,
      dietary_prefs:  draft.dietary,
    };
    const updated = await updateProfile(userId, updates).catch(console.error);
    if (updated) {
      setProfile(updated);
      setDisplayProfile(toAppProfile(updated));
    }
    setEditing(false);
  };

  const cancel = () => { setDraft(displayProfile); setEditing(false); };

  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    fetchActivityStats(userId)
      .then(s => { if (active) setStats(s); })
      .catch(console.error);
    return () => { active = false; };
  }, [userId]);

  const activityStats = [
    ["Dishes created", stats?.dishesCreated ?? dishCount,  C.accent ],
    ["Meals planned",  stats?.mealsPlanned,                 C.sage   ],
    ["Shopping lists", stats?.shoppingLists,                C.gold   ],
    ["Pantry items",   stats?.pantryItems,                  C.success],
  ];

  const nameParts = (displayProfile.name || "You").trim().split(/\s+/);
  const titleLines = nameParts.length > 1
    ? [nameParts.slice(0, -1).join(" "), { em: true, text: nameParts[nameParts.length - 1] + "." }]
    : [{ em: true, text: nameParts[0] + "." }];

  return (
    <Page>
      <PageHeader
        title={titleLines}
        eyebrow={displayProfile.handle}
        subtitle={!editing ? (displayProfile.bio || "No bio yet.") : "Editing your profile."}
        stats={[
          { v: displayProfile.followers, l: "followers" },
          { v: displayProfile.following, l: "following" },
          { v: displayProfile.dishes, l: "dishes" },
        ]}
        action={
          editing
            ? (
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="secondary" onClick={cancel}>Cancel</Btn>
                <Btn onClick={save}>Save changes</Btn>
              </div>
            )
            : <Btn variant="ghost" onClick={() => setEditing(true)}>Edit profile</Btn>
        }
      />

      <div className="sr-grid">
        {/* Activity — four loud numbers */}
        <section className="sp-12 rise" aria-label="Activity stats">
          <div className="count-strip">
            {activityStats.map(([label, val]) => (
              <div key={label} className="count-cell static">
                <div className="v">{val ?? "—"}</div>
                <div className="kicker" style={{ marginTop: 12, opacity: 0.75 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Left column */}
        <div className="sp-5" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Identity */}
          {editing && (
            <Card className="sr-pop">
              <h3 className="sr-panel-h"><span>Who you are</span></h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Input label="Display Name" value={draft.name}   onChange={e => setD("name", e.target.value)} />
                <Input label="Handle"       value={draft.handle} onChange={e => setD("handle", e.target.value)} />
                <Textarea
                  label="About me"
                  value={draft.bio}
                  onChange={e => setD("bio", e.target.value)}
                  placeholder="Tell the community about yourself…"
                  rows={3}
                />
              </div>
            </Card>
          )}

          {/* Bio */}
          {!editing && (
            <section className="sr-panel pop rise" style={{ "--i": 1, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="kicker">About me</span>
                <div aria-hidden="true" style={{
                  width: 64, height: 64, borderRadius: "50%", background: "var(--panel)", color: "var(--c1)", border: "1px solid var(--line)",
                  display: "grid", placeItems: "center",
                  fontFamily: FONTS.display, fontWeight: 400, fontSize: 26,
                }}>
                  {displayProfile.avatar}
                </div>
              </div>
              <p style={{ fontFamily: FONTS.display, fontWeight: 400, fontSize: "clamp(22px, 2vw, 28px)", lineHeight: 1.05, letterSpacing: "-0.015em" }}>
                {displayProfile.bio || "No bio yet."}
              </p>
            </section>
          )}

          {/* Dietary preferences */}
          <Card className="rise" style={{ "--i": 2 }}>
            <h3 className="sr-panel-h"><span>Dietary preferences</span>{editing && <span>tap to toggle</span>}</h3>
            <div className="chip-row">
              {dietaryOptions.map(d => {
                const active = (editing ? draft : displayProfile).dietary.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    disabled={!editing}
                    aria-pressed={active}
                    className={`chip${active ? " on" : ""}`}
                    onClick={() => editing && toggleDiet(d)}
                    style={{ cursor: editing ? "pointer" : "default" }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Settings */}
          <Card className="rise" style={{ "--i": 3 }}>
            <h3 className="sr-panel-h"><span>Account settings</span></h3>
            <div className="row-list">
              {[
                ["notifications", "notif_email",     "Email notifications",  "Weekly meal reminders & recipe suggestions"],
                ["publicProfile", "public_profile",  "Public profile",       "Anyone can view your dishes and menus"],
                ["nutritionTrack","nutrition_track",  "Nutrition tracking",   "Enabled - daily summaries active"],
                ["weeklyDigest",  "weekly_digest",    "Weekly digest",        "Receive a summary of trending recipes"],
              ].map(([key, dbKey, label, sub]) => (
                <div key={key} style={{
                  display: "flex", justifyContent: "space-between", gap: 16,
                  alignItems: "center", padding: "15px 0",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, color: C.text }}>{label}</div>
                    <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{sub}</div>
                  </div>
                  <Toggle
                    label={label}
                    on={displayProfile[dbKey]}
                    onChange={async () => {
                      const newVal = !displayProfile[dbKey];
                      setDisplayProfile(p => ({ ...p, [dbKey]: newVal }));
                      await updateProfile(userId, { [dbKey]: newVal }).catch(console.error);
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column — nutrition targets (DRI calculator + custom) */}
        <div className="sp-7 rise" style={{ "--i": 2, display: "flex", flexDirection: "column", gap: 14 }}>
          <NutritionTargets userId={userId} />
        </div>
      </div>
    </Page>
  );
}
