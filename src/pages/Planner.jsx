import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { C, FONTS } from "../theme";
import { Card, Btn, Tag, Modal, Page, PageHeader } from "../components/ui";
import { DAYS, MEALS } from "../data/mockData";
import {
  fetchWeeklyPlan, buildPlanObject,
  upsertMealPlan, removeMealPlan, clearDayMealPlan,
  getWeekStart, getWeekDates,
} from "../lib/db";

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
  const tableRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 700);
  const todayLabel = new Date().toLocaleString("en-US", { weekday: "short" }).slice(0, 3);
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

  const dishById = id => dishes.find(d => d.id === id) ?? null;

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

  const shiftWeek = (delta) => {
    const [y, m, d] = weekStart.split("-").map(Number);
    const next = new Date(y, m - 1, d + delta * 7);
    const yyyy = next.getFullYear();
    const mm   = String(next.getMonth() + 1).padStart(2, "0");
    const dd   = String(next.getDate()).padStart(2, "0");
    setWeekStart(`${yyyy}-${mm}-${dd}`);
  };

  const dayTotal = (day) =>
    MEALS.reduce((sum, meal) => {
      const dish = dishById(plan[day]?.[meal]);
      return sum + (dish?.nutrients.calories ?? 0);
    }, 0);

  const weekLabel = (() => {
    const dates = Object.values(weekDates);
    const fmt = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(dates[0])} – ${fmt(dates[6])}`;
  })();

  const buildPlanText = () => {
    const lines = [`Weekly Meal Plan — ${weekLabel}`, ""];
    DAYS.forEach(day => {
      lines.push(day);
      MEALS.forEach(meal => {
        const dish = dishById(plan[day]?.[meal]);
        lines.push(`  ${meal}: ${dish ? dish.name : "—"}`);
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
          return `<td style="padding:10px 14px;border:1px solid #e8e0d8;font-size:13px">${dish ? `<strong>${dish.name}</strong>` : '<span style="color:#ccc">—</span>'}</td>`;
        }).join("")}
      </tr>`
    ).join("");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Meal Plan — ${weekLabel}</title>
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
    const subject = `Meal Plan — ${weekLabel}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildPlanText())}`;
  };

  const shareWhatsApp = async () => {
    setShowExport(false);
    if (!tableRef.current) return;
    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], `meal-plan-${weekStart}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        // Mobile: native share sheet lets user pick WhatsApp directly
        await navigator.share({ files: [file], title: `Meal Plan — ${weekLabel}` });
      } else {
        // Desktop: download the image then open WhatsApp Web with plan text
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meal-plan-${weekStart}.png`;
        a.click();
        URL.revokeObjectURL(url);
        // Open WhatsApp Web with plan text; user can attach the downloaded image
        window.open(
          `https://wa.me/?text=${encodeURIComponent(buildPlanText())}`,
          "_blank"
        );
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("WhatsApp share failed:", err);
    }
  };

  /* ── Shared share dropdown ── */
  const ShareDropdown = () => (
    <div style={{ position: "relative" }}>
      <Btn onClick={() => setShowExport(v => !v)}>Share ↗</Btn>
      {showExport && (
        <>
          <div onClick={() => setShowExport(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "#fff", border: `1px solid ${C.border}`,
            borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            zIndex: 100, minWidth: 200, overflow: "hidden",
          }}>
            {[
              { icon: "📄", label: "Save as PDF",        action: exportPDF      },
              { icon: "✉️", label: "Send via Email",     action: shareEmail     },
              { icon: "💬", label: "Share on WhatsApp",  action: shareWhatsApp  },
            ].map(({ icon, label, action }, i, arr) => (
              <button
                key={label}
                onClick={action}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "12px 16px",
                  background: "none", cursor: "pointer", border: "none",
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                  fontSize: 14, color: C.text,
                  fontFamily: FONTS.body, textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  /* ── Dish cell (reused in both layouts) ── */
  const DishCell = ({ day, meal }) => {
    const dish = dishById(plan[day]?.[meal]);
    return dish ? (
      <div style={{
        background: "#fff", border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 10, position: "relative",
      }}>
        <span style={{ fontSize: 22 }}>{dish.img}</span>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.3, marginTop: 4 }}>
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
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentLight; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDark; e.currentTarget.style.background = "transparent"; }}
      >
        + Add
      </div>
    );
  };

  /* ── Dish picker modal content ── */
  const ModalContent = () => (
    <>
      <h3 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.text, marginBottom: 4 }}>
        Add {modal?.meal}
      </h3>
      <p style={{ color: C.textSub, fontSize: 13, marginBottom: 16 }}>
        {modal?.day} · Select a dish from your database
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
        {dishes
          .filter(d => d.name.toLowerCase().includes(modalSearch.toLowerCase()))
          .map(d => (
            <div
              key={d.id}
              onClick={() => assign(d)}
              style={{
                display: "flex", gap: 14, padding: 14,
                background: C.bg, borderRadius: 12, cursor: "pointer",
                border: "1.5px solid transparent",
                transition: "border-color 0.18s, background 0.18s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentLight; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = C.bg; }}
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
  );

  /* ── Mobile layout ── */
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
            <ShareDropdown />
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#fff", border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "8px 12px",
          }}>
            <button
              onClick={() => shiftWeek(-1)}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.accent, padding: "0 4px" }}
            >‹</button>
            <span style={{ fontSize: 13, color: C.textSub, fontWeight: 500 }}>{weekLabel}</span>
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
                  background: isSelected ? C.accent : isToday ? C.accentLight : "#fff",
                  color: isSelected ? "#fff" : isToday ? C.accent : C.textSub,
                  fontFamily: FONTS.body,
                  boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.18s",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600 }}>{day}</span>
                {kcal > 0 && (
                  <span style={{
                    fontSize: 10,
                    color: isSelected ? "rgba(255,255,255,0.8)" : C.accent,
                    fontWeight: 500,
                  }}>
                    {kcal}
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
                  <DishCell day={selectedDay} meal={meal} />
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal open={!!modal} onClose={() => setModal(null)} width={500}>
          {modal && <ModalContent />}
        </Modal>
      </Page>
    );
  }

  /* ── Desktop layout ── */
  return (
    <Page>
      <PageHeader
        title="Weekly Planner"
        subtitle={weekLabel}
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn variant="secondary" onClick={() => shiftWeek(-1)}>← Previous</Btn>
            <Btn variant="secondary" onClick={() => shiftWeek(1)}>Next →</Btn>
            <ShareDropdown />
          </div>
        }
      />

      {loading ? (
        <div style={{ color: C.textMuted, fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Loading plan…
        </div>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: 8 }}>
          <table ref={tableRef} style={{ width: "100%", borderCollapse: "separate", borderSpacing: 8 }}>
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
                      {dayTotal(d) > 0 && <Tag color={C.accent}>{dayTotal(d)} kcal</Tag>}
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
                  {DAYS.map(day => (
                    <td key={day} style={{ verticalAlign: "top", padding: "4px" }}>
                      <DishCell day={day} meal={meal} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} width={500}>
        {modal && <ModalContent />}
      </Modal>
    </Page>
  );
}
