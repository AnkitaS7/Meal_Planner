import { useState } from "react";
import { C, FONTS } from "../theme";
import { Card, Btn, Tag, Modal, Page, PageHeader } from "../components/ui";
import { DAYS, MEALS, INITIAL_PLAN } from "../data/mockData";

export default function Planner({ dishes }) {
  // plan stores dish IDs (or null) keyed by day → meal
  const [plan, setPlan] = useState(() => {
    const p = {};
    DAYS.forEach(d => {
      p[d] = {};
      MEALS.forEach(m => { p[d][m] = INITIAL_PLAN[d]?.[m] ?? null; });
    });
    return p;
  });
  const [modal, setModal] = useState(null); // { day, meal }

  const dishById = id => dishes.find(d => d.id === id) ?? null;

  const assign = (dish) => {
    if (!modal) return;
    setPlan(p => ({
      ...p,
      [modal.day]: { ...p[modal.day], [modal.meal]: dish.id },
    }));
    setModal(null);
  };

  const remove = (day, meal) =>
    setPlan(p => ({ ...p, [day]: { ...p[day], [meal]: null } }));

  const clearDay = (day) => {
    setPlan(p => {
      const updated = { ...p, [day]: {} };
      MEALS.forEach(m => { updated[day][m] = null; });
      return updated;
    });
  };

  // Daily calorie totals
  const dayTotal = (day) =>
    MEALS.reduce((sum, meal) => {
      const dish = dishById(plan[day]?.[meal]);
      return sum + (dish?.nutrients.calories ?? 0);
    }, 0);

  return (
    <Page>
      <PageHeader
        title="Weekly Planner"
        subtitle="Dec 9 – Dec 15, 2024"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary">← Previous</Btn>
            <Btn variant="secondary">Next →</Btn>
          </div>
        }
      />

      <div style={{ overflowX: "auto", marginBottom: 8 }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 8 }}>
          <thead>
            <tr>
              <th style={{
                width: 96, padding: "6px 10px",
                textAlign: "left", fontSize: 11,
                color: C.textMuted, fontWeight: 700, letterSpacing: 0.6,
              }}>
                MEAL
              </th>
              {DAYS.map(d => (
                <th key={d} style={{ minWidth: 138, padding: "6px 4px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{d}</span>
                    {dayTotal(d) > 0 && (
                      <Tag color={C.accent}>{dayTotal(d)} kcal</Tag>
                    )}
                    <button onClick={() => clearDay(d)}
                      style={{
                        fontSize: 10, color: C.textMuted, background: "none",
                        border: "none", cursor: "pointer", fontFamily: FONTS.body,
                      }}>
                      clear
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEALS.map(meal => (
              <tr key={meal}>
                <td style={{
                  fontSize: 11, fontWeight: 700, color: C.textSub,
                  padding: "4px 10px", verticalAlign: "top", paddingTop: 16,
                  letterSpacing: 0.5,
                }}>
                  {meal.toUpperCase()}
                </td>
                {DAYS.map(day => {
                  const dish = dishById(plan[day]?.[meal]);
                  return (
                    <td key={day} style={{ verticalAlign: "top", padding: "4px" }}>
                      {dish ? (
                        <div style={{
                          background: "#fff",
                          border: `1px solid ${C.border}`,
                          borderRadius: 12,
                          padding: 10,
                          position: "relative",
                        }}>
                          <span style={{ fontSize: 22 }}>{dish.img}</span>
                          <div style={{
                            fontSize: 12, fontWeight: 600, color: C.text,
                            lineHeight: 1.3, marginTop: 4,
                          }}>
                            {dish.name}
                          </div>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                            {dish.nutrients.calories} kcal
                          </div>
                          <button
                            onClick={() => remove(day, meal)}
                            style={{
                              position: "absolute", top: 6, right: 6,
                              background: "none", border: "none",
                              color: C.textMuted, fontSize: 13, cursor: "pointer",
                              lineHeight: 1, padding: 2,
                            }}
                          >✕</button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setModal({ day, meal })}
                          style={{
                            border: `2px dashed ${C.borderDark}`,
                            borderRadius: 12, padding: "14px 6px",
                            textAlign: "center", cursor: "pointer",
                            color: C.textMuted, fontSize: 12,
                            transition: "border-color 0.18s, background 0.18s",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = C.accent;
                            e.currentTarget.style.background  = C.accentLight;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = C.borderDark;
                            e.currentTarget.style.background  = "transparent";
                          }}
                        >
                          + Add
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dish picker modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} width={500}>
        {modal && (
          <>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.text, marginBottom: 4 }}>
              Add {modal.meal}
            </h3>
            <p style={{ color: C.textSub, fontSize: 13, marginBottom: 20 }}>
              {modal.day} · Select a dish from your database
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dishes.map(d => (
                <div
                  key={d.id}
                  onClick={() => assign(d)}
                  style={{
                    display: "flex", gap: 14, padding: 14,
                    background: C.bg, borderRadius: 12, cursor: "pointer",
                    border: "1.5px solid transparent",
                    transition: "border-color 0.18s, background 0.18s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = C.accent;
                    e.currentTarget.style.background  = C.accentLight;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.background  = C.bg;
                  }}
                >
                  <span style={{ fontSize: 30 }}>{d.img}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: C.text }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                      {d.time} min · {d.category} · {d.nutrients.calories} kcal
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>
    </Page>
  );
}
