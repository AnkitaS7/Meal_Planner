import {useEffect, useMemo, useState} from "react";
import {C, FONTS} from "../theme";
import {DishArt} from "../components/art";
import {Btn, IconX, Loading, Modal, Page, PageHeader} from "../components/ui";
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
      <Btn onClick={() => setShowExport(v => !v)} aria-expanded={showExport}>Share ↗</Btn>
      {showExport && (
        <>
          <div onClick={() => setShowExport(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div className="sr-menu" style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: C.card, color: C.text, borderRadius: 20, padding: 6,
            boxShadow: "var(--shadow-lift)", zIndex: 100, minWidth: 220,
          }}>
            {[
              { label: "Save as PDF",        action: exportPDF      },
              { label: "Send via email",     action: shareEmail     },
              { label: "Share on WhatsApp",  action: shareWhatsApp  },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  display: "block", width: "100%", padding: "12px 16px",
                  background: "none", cursor: "pointer", border: "none", borderRadius: 14,
                  fontSize: 14, fontWeight: 500, color: C.text,
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
      <div className="slot-filled">
        <DishArt dish={dish} size={180} round={false} style={{ width: "100%", height: 66, borderRadius: 3 }} />
        <div className="nm">{dish.name}</div>
        <div className="kc">{(Number(dish.nutrients.calories) || 0).toFixed(1)} kcal</div>
        <button
          className="slot-x"
          onClick={() => remove(day, meal)}
          aria-label={`Remove ${dish.name} from ${day} ${meal}`}
        ><IconX size={12} /></button>
      </div>
    ) : (
      <button
        type="button"
        className="slot-empty"
        onClick={() => setModal({ day, meal })}
        aria-label={`Add a dish for ${day} ${meal}`}
      >
        +
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
      <div className="kicker" style={{ color: C.textMuted, marginBottom: 8 }}>{modal.day} · pick a dish</div>
      <h3 style={{
        fontFamily: FONTS.display, fontWeight: 400, fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.head, marginBottom: 18,
      }}>
        Add {modal.meal}
      </h3>
      <input
        autoFocus
        value={modalSearch}
        onChange={e => setModalSearch(e.target.value)}
        placeholder="Search dishes…"
        className="sr-field"
        style={{ marginBottom: 10 }}
      />
      <div className="row-list">
        {pickerMatches.map(d => (
            <button
              type="button"
              key={d.id}
              onClick={() => assign(d)}
              style={{
                display: "flex", gap: 14, padding: "12px 8px", width: "100%", alignItems: "center",
                background: "none", cursor: "pointer", border: 0,
                borderBottom: `1px solid ${C.border}`, borderRadius: 0,
                textAlign: "left", fontFamily: "inherit", color: C.text,
                transition: "background 0.18s, padding 0.3s var(--ease-out)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.paddingLeft = "16px"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.paddingLeft = "8px"; }}
            >
              <DishArt dish={d} size={56} round={false} style={{ borderRadius: 4 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 400, fontSize: 20, letterSpacing: "-0.02em" }}>{d.name}</div>
                <div className="mono" style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>
                  {d.time} min · {d.category} · {(Number(d.nutrients.calories) || 0).toFixed(1)} kcal
                </div>
              </div>
            </button>
        ))}
        {pickerMatches.length >= PICKER_LIMIT && (
          <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", margin: "10px 0 0", border: 0 }}>
            Showing the first {PICKER_LIMIT} — keep typing to narrow the list.
          </p>
        )}
      </div>
    </>
  );

  const plannedCount = DAYS.reduce((n, d) => n + MEALS.filter(m => plan[d]?.[m]).length, 0);
  const weekKcal = DAYS.reduce((n, d) => n + dayTotal(d), 0);
  const dayNum = d => Number(weekDates[d].split("-")[2]);
  const pickerModal = (
    <Modal
      open={!!modal}
      onClose={() => setModal(null)}
      width={520}
      label={modal ? `Add a dish for ${modal.day} ${modal.meal}` : "Add a dish"}
    >
      {modalContent}
    </Modal>
  );
  const header = (
    <PageHeader
      eyebrow={weekLabel}
      title={["The", { em: true, text: "week." }]}
      subtitle="Seven days, four places a day. Tap an open place to fill it."
      stats={[
        { v: `${plannedCount}/28`, l: "meals planned" },
        { v: Math.round(weekKcal).toLocaleString(), l: "kcal this week" },
      ]}
      action={
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <Btn variant="secondary" onClick={() => shiftWeek(-1)} aria-label="Previous week">←<span className="hide-sm"> Previous</span></Btn>
          <Btn variant="secondary" onClick={goToToday}>Today</Btn>
          <Btn variant="secondary" onClick={() => shiftWeek(1)} aria-label="Next week"><span className="hide-sm">Next </span>→</Btn>
          {shareDropdown}
        </div>
      }
    />
  );

  // Mobile layout — one day at a time
  if (isMobile) {
    return (
      <Page>
        {header}
        <div className="on-world chip-row" style={{ flexWrap: "nowrap", overflowX: "auto", scrollbarWidth: "none", margin: "0 calc(var(--pad) * -1) 14px", padding: "0 var(--pad)" }}>
          {DAYS.map(day => {
            const kcal = dayTotal(day);
            return (
              <button
                key={day}
                className={`chip${day === selectedDay ? " on" : ""}`}
                onClick={() => setSelectedDay(day)}
                aria-pressed={day === selectedDay}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "8px 14px", borderRadius: 18, flexShrink: 0 }}
              >
                <span>{day}{weekDates[day] === todayDate ? " •" : ""}</span>
                <span className="mono" style={{ fontSize: 10, opacity: 0.75 }}>{kcal > 0 ? kcal.toFixed(0) : "—"}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <Loading label="Reading the week's menu…" style={{ color: "var(--ink)", padding: "60px 0" }} />
        ) : (
          <div className={`day-col${weekDates[selectedDay] === todayDate ? " today" : ""}`}>
            <div className="day-head">
              <div className="day-name">
                <span>{selectedDay}</span>
                <button onClick={() => clearDay(selectedDay)} className="kicker" style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", textDecoration: "underline" }}>
                  Clear {selectedDay}
                </button>
              </div>
              <div className="day-num">{dayNum(selectedDay)}</div>
            </div>
            {MEALS.map(meal => (
              <div key={meal} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="slot-label">{meal}</div>
                {renderDishCell(selectedDay, meal)}
              </div>
            ))}
          </div>
        )}
        {pickerModal}
      </Page>
    );
  }

  // Desktop layout — the whole week as a board of seven columns
  return (
    <Page>
      {header}
      {loading ? (
        <Loading label="Reading the week's menu…" style={{ color: "var(--ink)", padding: "80px 0" }} size={56} />
      ) : (
        <div className="board">
          {DAYS.map((d, i) => {
            const isToday = weekDates[d] === todayDate;
            const total = dayTotal(d);
            return (
              <section key={d} className={`day-col rise${isToday ? " today" : ""}`} style={{ "--i": i }} aria-label={d}>
                <div className="day-head">
                  <div className="day-name">
                    <span>{d}{isToday ? " · today" : ""}</span>
                    <button
                      onClick={() => clearDay(d)}
                      style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", font: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}
                    >
                      clear
                    </button>
                  </div>
                  <div className="day-num">{dayNum(d)}</div>
                  <div className="day-kcal">{total > 0 ? `${total.toFixed(1)} kcal` : "nothing yet"}</div>
                </div>
                {MEALS.map(meal => (
                  <div key={meal} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="slot-label">{meal}</div>
                    {renderDishCell(d, meal)}
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}
      {pickerModal}
    </Page>
  );
}
