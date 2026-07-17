import { useEffect, useState } from "react";
import { C, FONTS, RADIUS } from "../theme";
import {
  Card, Btn, Input, Textarea, Avatar, Toggle, Page, PageHeader, Divider,
} from "../components/ui";
import { Watermark } from "../components/art";

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

  return (
    <Page>
      <PageHeader
        title="Your Profile"
        action={
          editing
            ? (
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="secondary" onClick={cancel}>Cancel</Btn>
                <Btn onClick={save}>Save changes</Btn>
              </div>
            )
            : <Btn variant="ghost" onClick={() => setEditing(true)}>Edit profile</Btn>
        }
      />

      <div className="sr-grid" style={{ gap: 18 }}>
        {/* Left column */}
        <div className="sp-4" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Avatar & identity */}
          <Card style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
            <Watermark symbol="i-egg" size={150} style={{ right: -34, top: -28, transform: "rotate(12deg)" }} />
            <div style={{
              width: 86, height: 86, borderRadius: "50%",
              background: C.accentLight,
              border: `3px solid ${C.accent}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, fontWeight: 700, color: C.accent,
              margin: "0 auto 18px",
              fontFamily: FONTS.body,
              userSelect: "none",
            }}>
              {displayProfile.avatar}
            </div>

            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Input label="Display Name" value={draft.name}   onChange={e => setD("name", e.target.value)} />
                <Input label="Handle"       value={draft.handle} onChange={e => setD("handle", e.target.value)} />
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.text }}>
                  {displayProfile.name}
                </h2>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                  {displayProfile.handle}
                </div>
              </>
            )}

            <Divider style={{ margin: "18px 0" }} />
            <div style={{ display: "flex" }}>
              {[["Followers", displayProfile.followers], ["Following", displayProfile.following], ["Dishes", displayProfile.dishes]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 700, color: C.text }}>
                    {val}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Bio */}
          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 14, color: C.text }}>
              About Me
            </h3>
            {editing ? (
              <Textarea
                value={draft.bio}
                onChange={e => setD("bio", e.target.value)}
                placeholder="Tell the community about yourself…"
                rows={3}
              />
            ) : (
              <p style={{ color: C.textSub, lineHeight: 1.75, fontSize: 14 }}>
                {displayProfile.bio || "No bio yet."}
              </p>
            )}
          </Card>

          {/* Dietary preferences */}
          <Card>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.textSub,
              letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 14,
            }}>
              Dietary Preferences
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {dietaryOptions.map(d => {
                const active = (editing ? draft : displayProfile).dietary.includes(d);
                return (
                  <span
                    key={d}
                    onClick={() => editing && toggleDiet(d)}
                    style={{
                      padding: "5px 12px", borderRadius: RADIUS.full,
                      fontSize: 12, fontWeight: 500,
                      cursor: editing ? "pointer" : "default",
                      border: `1.5px solid ${active ? C.sage : C.border}`,
                      background: active ? C.sageLight : C.card,
                      color: active ? C.sageDark : C.textMuted,
                      transition: "all 0.18s",
                      userSelect: "none",
                    }}
                  >
                    {d}
                  </span>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="sp-8" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Activity stats */}
          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 18, color: C.text }}>
              Activity Stats
            </h3>
            <div style={{ display: "flex" }}>
              {activityStats.map(([label, val, color], i) => (
                <div key={label} style={{
                  flex: 1, textAlign: "center", padding: "6px 4px",
                  borderLeft: i > 0 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{ fontSize: 24, color, fontFamily: FONTS.serif, fontVariantNumeric: "tabular-nums" }}>
                    {val ?? "—"}
                  </div>
                  <div style={{
                    fontSize: 10, color: C.textSub, marginTop: 4, lineHeight: 1.4,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                  }}>{label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Nutrition targets (DRI calculator + custom) */}
          <NutritionTargets userId={userId} />

          {/* Settings */}
          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 18, color: C.text }}>
              Account Settings
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                ["notifications", "notif_email",     "Email notifications",  "Weekly meal reminders & recipe suggestions"],
                ["publicProfile", "public_profile",  "Public profile",       "Anyone can view your dishes and menus"],
                ["nutritionTrack","nutrition_track",  "Nutrition tracking",   "Enabled - daily summaries active"],
                ["weeklyDigest",  "weekly_digest",    "Weekly digest",        "Receive a summary of trending recipes"],
              ].map(([key, dbKey, label, sub]) => (
                <div key={key} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "14px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{label}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{sub}</div>
                  </div>
                  <Toggle
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
      </div>
    </Page>
  );
}
