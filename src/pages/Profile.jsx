import { useState } from "react";
import { C, FONTS, RADIUS } from "../theme";
import {
  Card, Btn, Input, Textarea, Avatar, Toggle, Page, PageHeader, Divider,
} from "../components/ui";
import { MOCK_USER, DIETARY_OPTIONS } from "../data/mockData";

export default function Profile() {
  const [editing, setEditing]   = useState(false);
  const [profile, setProfile]   = useState(MOCK_USER);
  const [draft, setDraft]       = useState(MOCK_USER);
  const [settings, setSettings] = useState({
    notifications: true,
    publicProfile:  true,
    nutritionTrack: true,
    weeklyDigest:   false,
  });

  const setD = (k, v) => setDraft(p => ({ ...p, [k]: v }));

  const toggleDiet = (d) =>
    setDraft(p => ({
      ...p,
      dietary: p.dietary.includes(d)
        ? p.dietary.filter(x => x !== d)
        : [...p.dietary, d],
    }));

  const save = () => { setProfile(draft); setEditing(false); };
  const cancel = () => { setDraft(profile); setEditing(false); };

  const toggleSetting = (k) => setSettings(s => ({ ...s, [k]: !s[k] }));

  const activityStats = [
    ["🍽", "Dishes Created",          profile.dishes,  C.accent ],
    ["📅", "Meals Planned",           128,             C.sage   ],
    ["🛒", "Shopping Lists",           23,             C.gold   ],
    ["✨", "Recipes Shared",            19,             C.purple ],
    ["👥", "Friends' Plans Viewed",     84,             C.teal   ],
    ["🏺", "Pantry Items",              12,             C.success],
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
                <Btn onClick={save}>✓ Save Changes</Btn>
              </div>
            )
            : <Btn variant="ghost" onClick={() => setEditing(true)}>✏️ Edit Profile</Btn>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Avatar & identity */}
          <Card style={{ textAlign: "center" }}>
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
              {profile.avatar}
            </div>

            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Input
                  label="Display Name"
                  value={draft.name}
                  onChange={e => setD("name", e.target.value)}
                />
                <Input
                  label="Handle"
                  value={draft.handle}
                  onChange={e => setD("handle", e.target.value)}
                />
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.text }}>
                  {profile.name}
                </h2>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                  {profile.handle}
                </div>
              </>
            )}

            {/* Follower stats */}
            <Divider style={{ margin: "18px 0" }} />
            <div style={{ display: "flex" }}>
              {[["Followers", profile.followers], ["Following", profile.following], ["Dishes", profile.dishes]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{
                    fontFamily: FONTS.display,
                    fontSize: 20, fontWeight: 700, color: C.text,
                  }}>
                    {val}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{label}</div>
                </div>
              ))}
            </div>
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
              {(editing ? DIETARY_OPTIONS : DIETARY_OPTIONS).map(d => {
                const active = (editing ? draft : profile).dietary.includes(d);
                return (
                  <span
                    key={d}
                    onClick={() => editing && toggleDiet(d)}
                    style={{
                      padding: "5px 12px", borderRadius: RADIUS.full,
                      fontSize: 12, fontWeight: 500,
                      cursor: editing ? "pointer" : "default",
                      border: `1.5px solid ${active ? C.sage : C.border}`,
                      background: active ? C.sageLight : "#fff",
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

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
                {profile.bio}
              </p>
            )}
          </Card>

          {/* Activity stats */}
          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 18, color: C.text }}>
              Activity Stats
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {activityStats.map(([icon, label, val, color]) => (
                <div key={label} style={{
                  background: C.bg, borderRadius: RADIUS.md,
                  padding: "16px 14px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{
                    fontSize: 22, fontWeight: 700, color,
                    fontFamily: FONTS.display,
                  }}>
                    {val}
                  </div>
                  <div style={{
                    fontSize: 11, color: C.textSub,
                    marginTop: 4, lineHeight: 1.4,
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Settings */}
          <Card>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 18, marginBottom: 18, color: C.text }}>
              Account Settings
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                ["notifications", "🔔 Email Notifications",   "Weekly meal reminders & recipe suggestions"],
                ["publicProfile", "🔒 Public Profile",        "Anyone can view your dishes and menus"],
                ["nutritionTrack","📊 Nutrition Tracking",    "Enabled — daily summaries active"],
                ["weeklyDigest",  "📰 Weekly Digest",         "Receive a summary of trending recipes"],
              ].map(([key, label, sub]) => (
                <div key={key} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "14px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{label}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{sub}</div>
                  </div>
                  <Toggle on={settings[key]} onChange={() => toggleSetting(key)} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <Btn variant="danger" style={{ fontSize: 13 }}>
                🗑 Delete Account
              </Btn>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
