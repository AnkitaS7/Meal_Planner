import {useEffect, useMemo, useState} from "react";
import {C, FONTS} from "../theme";
import {DishArt, Watermark} from "../components/art";
import {Btn, IconX, Loading, Modal, Page, PageHeader, Tag} from "../components/ui";
import {DAYS, MEALS} from "../data/mockData";
import {
    buildPlanObject,
    clearDayMealPlan,
    fetchWeeklyPlan,
    getWeekDates,
    getWeekStart,
    removeMealPlan,
    todayDateStr,
    upsertMealPlan,
} from "../lib/db";

// Cap the dish-picker list: the catalog holds thousands of dishes and the
// modal only needs enough rows to pick from — typing narrows the rest.
const PICKER_LIMIT = 40;

export default function Planner({ dishes, userId }) {
  const [weekStart, setWeekStart] = useState(getWeekStart);
  const weekDates = getWeekDates(weekStart);

  const [plan, setPlan] = useState(() => {
    const p = {};
    DAYS.forEach(d => { p[d] = {}; MEALS.forEach(m => { p[d][m] = null; }); });
    return p;
  });
  const [modal, setModal] = useState(null);
  const [modalSearch, setModalSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);


  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 700);
  const todayLabel = new Date().toLocaleString("en-US", { weekday: "short" }).slice(0, 3);
  const todayDate = todayDateStr();
  const [selectedDay, setSelectedDay] = useState(() => DAYS.includes(todayLabel) ? todayLabel : DAYS[0]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => { if (!modal) setModalSearch(""); }, [modal]);

  useEffect(() => {
    setLoading(true);
    fetchWeeklyPlan(userId, weekStart)
      .then(rows => setPlan(buildPlanObject(rows, DAYS, MEALS)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, weekStart]);

  // The catalog holds thousands of dishes and the grid looks one up per cell,
  // so index by id once instead of scanning the array every time.
  const dishMap = useMemo(() => new Map(dishes.map(d => [d.id, d])), [dishes]);
  const dishById = id => dishMap.get(id) ?? null;

  const assign = async (dish) => {
    if (!modal) return;
    const { day, meal } = modal;
    const date = weekDates[day];
    setPlan(p => ({ ...p, [day]: { ...p[day], [meal]: dish.id } }));
    setModal(null);
    await upsertMealPlan(userId, date, meal, dish.id).catch(console.error);
  };

  const remove = async (day, meal) => {
    const date = weekDates[day];
    setPlan(p => ({ ...p, [day]: { ...p[day], [meal]: null } }));
    await removeMealPlan(userId, date, meal).catch(console.error);
  };

  const clearDay = async (day) => {
    const date = weekDates[day];
    setPlan(p => {
      const updated = { ...p, [day]: {} };
      MEALS.forEach(m => { updated[day][m] = null; });
      return updated;
    });
    await clearDayMealPlan(userId, date).catch(console.error);
  };

  const goToToday = () => setWeekStart(getWeekStart());

  const shiftWeek = (delta) => {
    const [y, m, d] = weekStart.split("-").map(Number);
    const next = new Date(y, m - 1, d + delta * 7);
    const yyyy = next.getFullYear();
    const mm   = String(next.getMonth() + 1).padStart(2, "0");
    const dd   = String(next.getDate()).padStart(2, "0");
    setWeekStart(`${yyyy}-${mm}-${dd}`);
  };

  const dayTotal = (day) => parseFloat(MEALS.reduce((sum, meal) => {
        const dish = dishById(plan[day]?.[meal]);
        return sum + (dish?.nutrients.calories ?? 0);
    }, 0).toFixed(1));

  const weekLabel = (() => {
    const dates = Object.values(weekDates);
    const fmt = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(dates[0])} - ${fmt(dates[6])}`;
  })();

  const buildPlanText = () => {
    const lines = [`Weekly Meal Plan - ${weekLabel}`, ""];
    DAYS.forEach(day => {
      lines.push(day);
      MEALS.forEach(meal => {
        const dish = dishById(plan[day]?.[meal]);
        lines.push(`  ${meal}: ${dish ? dish.name : "-"}`);
      });
      lines.push("");
    });
    return lines.join("\n");
  };

  const exportPDF = () => {
    setShowExport(false);
    const win = window.open("", "_blank");
    const bodyRows = MEALS.map(meal =>
      `<tr>
        <td style="font-weight:700;font-size:11px;color:#888;text-transform:uppercase;padding:10px 14px;border:1px solid #e8e0d8;white-space:nowrap">${meal}</td>
        ${DAYS.map(day => {
          const dish = dishById(plan[day]?.[meal]);
          return `<td style="padding:10px 14px;border:1px solid #e8e0d8;font-size:13px">${dish ? `<strong>${dish.name}</strong>` : '<span style="color:#ccc">-</span>'}</td>`;
        }).join("")}
      </tr>`
    ).join("");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Meal Plan - ${weekLabel}</title>
      <style>
        body{font-family:Georgia,serif;padding:40px;color:#1a1a1a;max-width:1100px;margin:0 auto}
        h1{font-size:24px;margin:0 0 4px}
        .sub{color:#888;font-size:13px;margin-bottom:28px}
        table{width:100%;border-collapse:collapse}
        th{background:#f9f5f1;padding:10px 14px;border:1px solid #e8e0d8;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.5px}
        @media print{@page{margin:20mm}body{padding:0}}
      </style></head><body>
      <h1>Weekly Meal Plan</h1>
      <div class="sub">${weekLabel}</div>
      <table>
        <thead><tr><th>Meal</th>${DAYS.map(d => `<th>${d}</th>`).join("")}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <script>window.onload=()=>{window.print();}<\/script>
      </body></html>`);
    win.document.close();
  };

  const shareEmail = () => {
    setShowExport(false);
    const subject = `Meal Plan - ${weekLabel}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildPlanText())}`;
  };

  const shareWhatsApp = () => {
    setShowExport(false);
    window.open(`https://wa.me/?text=${encodeURIComponent(buildPlanText())}`, "_blank");
  };

  // Share dropdown — plain JSX (not a nested component) so React reconciles
  // it in place instead of remounting it on every parent render.
  const shareDropdown = (
    <div style={{ position: "relative" }}>
      <Btn onClick={() => setShowExport(v => !v)}>Share ↗</Btn>
      {showExport && (
        <>
          <div onClick={() => setShowExport(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, boxShadow: "var(--shadow-lift)",
            zIndex: 100, minWidth: 200, overflow: "hidden",
          }}>
            {[
              { label: "Save as PDF",        action: exportPDF      },
              { label: "Send via email",     action: shareEmail     },
              { label: "Share on WhatsApp",  action: shareWhatsApp  },
            ].map(({ label, action }, i, arr) => (
              <button
                key={label}
                onClick={action}
                style={{
                  display: "block", width: "100%", padding: "12px 16px",
                  background: "none", cursor: "pointer", border: "none",
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                  fontSize: 14, color: C.text,
                  fontFamily: FONTS.body, textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Dish cell, shared between mobile and desktop layouts (called as a plain
  // function so the cells keep their DOM between renders)
  const renderDishCell = (day, meal) => {
    const dish = dishById(plan[day]?.[meal]);
    return dish ? (
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 10, position: "relative",
        boxShadow: "var(--shadow)",
      }}>
        <DishArt dish={dish} size={30} />
        <div className="truncate" style={{
          fontSize: 12, fontFamily: FONTS.serif, color: C.text, lineHeight: 1.3, marginTop: 6,
        }}>
          {dish.name}
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
          {(Number(dish.nutrients.calories) || 0).toFixed(1)} kcal
        </div>
        <button
          onClick={() => remove(day, meal)}
          aria-label={`Remove ${dish.name} from ${day} ${meal}`}
          style={{
            position: "absolute", top: 4, right: 4,
            background: "none", border: "none",
            color: C.textMuted, cursor: "pointer",
            lineHeight: 1, padding: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--c2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--faint)"; }}
        ><IconX size={13} /></button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setModal({ day, meal })}
        aria-label={`Add a dish for ${day} ${meal}`}
        style={{
          width: "100%", background: "transparent",
          border: `2px dashed ${C.borderDark}`,
          borderRadius: 12, padding: "14px 6px",
          textAlign: "center", cursor: "pointer",
          color: C.textMuted, fontSize: 12, fontFamily: "inherit",
          transition: "border-color 0.18s, background 0.18s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentLight; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDark; e.currentTarget.style.background = "transparent"; }}
      >
        + Add
      </button>
    );
  };

  // Dish picker modal. The list stops at PICKER_LIMIT rows — searching
  // narrows it — so opening the picker never renders the whole catalog.
  const pickerMatches = [];
  if (modal) {
    const q = modalSearch.trim().toLowerCase();
    for (const d of dishes) {
      if (pickerMatches.length >= PICKER_LIMIT) break;
      if (!q || d.name.toLowerCase().includes(q)) pickerMatches.push(d);
    }
  }

  const modalContent = modal && (
    <>
      <h3 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.text, marginBottom: 4 }}>
        Add {modal.meal}
      </h3>
      <p style={{ color: C.textSub, fontSize: 13, marginBottom: 16 }}>
        {modal.day} · Select a dish from your database
      </p>
      <input
        autoFocus
        value={modalSearch}
        onChange={e => setModalSearch(e.target.value)}
        placeholder="Search dishes…"
        style={{
          width: "100%", marginBottom: 14,
          background: C.bg, border: `1.5px solid ${C.border}`,
          borderRadius: 10, padding: "10px 14px",
          fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box",
        }}
        onFocus={e => { e.target.style.borderColor = C.accent; }}
        onBlur={e  => { e.target.style.borderColor = C.border; }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pickerMatches.map(d => (
            <button
              type="button"
              key={d.id}
              onClick={() => assign(d)}
              style={{
                display: "flex", gap: 14, padding: 14, width: "100%",
                background: C.bg, borderRadius: 12, cursor: "pointer",
                border: "1.5px solid transparent", textAlign: "left",
                fontFamily: "inherit",
                transition: "border-color 0.18s, background 0.18s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentLight; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = C.bg; }}
            >
              <DishArt dish={d} size={38} />
              <div>
                <div style={{ fontFamily: FONTS.serif, fontWeight: 600, color: C.text }}>{d.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  {d.time} min · {d.category} · {(Number(d.nutrients.calories) || 0).toFixed(1)} kcal
                </div>
              </div>
            </button>
        ))}
        {pickerMatches.length >= PICKER_LIMIT && (
          <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", margin: "6px 0 0" }}>
            Showing the first {PICKER_LIMIT} — keep typing to narrow the list.
          </p>
        )}
      </div>
    </>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <Page>
        {/* Compact mobile header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 10,
          }}>
            <h1 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.text }}>
              Weekly Planner
            </h1>
            {shareDropdown}
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "8px 12px",
          }}>
            <button
              onClick={() => shiftWeek(-1)}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.accent, padding: "0 4px" }}
            >‹</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: C.textSub, fontWeight: 500 }}>{weekLabel}</span>
              <button
                onClick={goToToday}
                style={{
                  background: C.accentLight, border: `1px solid ${C.accent}`,
                  borderRadius: 6, padding: "2px 8px",
                  fontSize: 11, fontWeight: 600, color: C.accent,
                  cursor: "pointer", fontFamily: FONTS.body,
                }}
              >Today</button>
            </div>
            <button
              onClick={() => shiftWeek(1)}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.accent, padding: "0 4px" }}
            >›</button>
          </div>
        </div>

        {/* Day tab strip */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto",
          paddingBottom: 4, marginBottom: 16,
          scrollbarWidth: "none",
        }}>
          {DAYS.map(day => {
            const isSelected = day === selectedDay;
            const isToday    = day === todayLabel;
            const kcal       = dayTotal(day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  flexShrink: 0,
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 2, padding: "8px 12px",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  background: isSelected ? C.accent : isToday ? C.accentLight : C.card,
                  color: isSelected ? "var(--on-accent)" : isToday ? C.accent : C.textSub,
                  fontFamily: FONTS.body,
                  boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.18s",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600 }}>{day}</span>
                {kcal > 0 && (
                  <span style={{
                    fontSize: 10,
                    color: isSelected ? "var(--on-accent)" : C.accent,
                    fontWeight: 500,
                  }}>
                    {kcal.toFixed(1)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day meal cards */}
        {loading ? (
          <div style={{ color: C.textMuted, fontSize: 14, textAlign: "center", padding: "40px 0" }}>
            Loading plan…
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => clearDay(selectedDay)}
                style={{
                  background: "none", border: "none", fontSize: 12,
                  color: C.textMuted, cursor: "pointer", fontFamily: FONTS.body,
                }}
              >
                Clear {selectedDay}
              </button>
            </div>
            {MEALS.map(meal => (
              <div key={meal} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  width: 72, flexShrink: 0,
                  fontSize: 10, fontWeight: 700, color: C.textSub,
                  letterSpacing: 0.5, paddingTop: 14,
                }}>
                  {meal.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  {renderDishCell(selectedDay, meal)}
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          open={!!modal}
          onClose={() => setModal(null)}
          width={500}
          label={modal ? `Add a dish for ${modal.day} ${modal.meal}` : "Add a dish"}
        >
          {modalContent}
        </Modal>
      </Page>
    );
  }

  // Desktop layout
  return (
    <Page>
      <PageHeader
        title="Weekly Planner"
        subtitle={weekLabel}
        eyebrow="The week ahead"
        color={C.c1}
        motif="i-tomato"
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn variant="secondary" onClick={() => shiftWeek(-1)}>← Previous</Btn>
            <Btn variant="secondary" onClick={goToToday}>Today</Btn>
            <Btn variant="secondary" onClick={() => shiftWeek(1)}>Next →</Btn>
            {shareDropdown}
          </div>
        }
      />

      {loading ? (
        <Loading label="Reading the week's menu…" />
      ) : (
        <div className="sr-panel sr-tint-1 clip" style={{ marginBottom: 8, padding: "14px 16px" }}>
          <Watermark symbol="w-steam" size={200} style={{ right: -26, top: -34 }} />
          <div style={{ overflowX: "auto", position: "relative" }}>
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
                {DAYS.map(d => {
                  const isToday = weekDates[d] === todayDate;
                  return (
                    <th key={d} style={{
                      minWidth: 138, padding: "6px 4px",
                      background: isToday ? C.accentLight : "transparent",
                      borderRadius: 10,
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: isToday ? C.accent : C.text,
                        }}>{d}</span>
                        {dayTotal(d) > 0 && <Tag color={C.accent}>{dayTotal(d).toFixed(1)} kcal</Tag>}
                        <button onClick={() => clearDay(d)}
                          style={{
                            fontSize: 10, color: C.textMuted, background: "none",
                            border: "none", cursor: "pointer", fontFamily: FONTS.body,
                          }}>
                          clear
                        </button>
                      </div>
                    </th>
                  );
                })}
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
                    const isToday = weekDates[day] === todayDate;
                    return (
                      <td key={day} style={{
                        verticalAlign: "top", padding: "4px",
                        background: isToday ? C.accentLight : "transparent",
                        borderRadius: 10,
                      }}>
                        {renderDishCell(day, meal)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        width={500}
        label={modal ? `Add a dish for ${modal.day} ${modal.meal}` : "Add a dish"}
      >
        {modalContent}
      </Modal>
    </Page>
  );
}
