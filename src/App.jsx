import { useState, useEffect, lazy, Suspense } from "react";
import { C, initThemeMode } from "./theme";
import { SvgDefs } from "./components/art";
import { supabase } from "./lib/supabase";

initThemeMode();
import { fetchDishes, fetchPantry, fetchProfile, fetchAppEnums } from "./lib/db";
import Sidebar     from "./components/Sidebar";
import { IconMenu } from "./components/ui";
import Login       from "./pages/Login";
import Dashboard   from "./pages/Dashboard";

// Every page beyond the two first-paint ones loads on demand. This keeps
// heavyweight page-only dependencies (recharts lives solely in Nutrients)
// out of the initial bundle.
const Planner     = lazy(() => import("./pages/Planner"));
const Dishes      = lazy(() => import("./pages/Dishes"));
const Pantry      = lazy(() => import("./pages/Pantry"));
const Shopping    = lazy(() => import("./pages/Shopping"));
const Suggestions = lazy(() => import("./pages/Suggestions"));
const Nutrients   = lazy(() => import("./pages/Nutrients"));
const Scanner     = lazy(() => import("./pages/Scanner"));
const Social      = lazy(() => import("./pages/Social"));
const Profile     = lazy(() => import("./pages/Profile"));

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 15,
      color: C.textMuted,
    }}>
      Loading…
    </div>
  );
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [user, setUser]     = useState(null);
  const [profile, setProfile] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [enums, setEnums]   = useState({ dishCategories: [], pantryCategories: [], pantryUnits: [], dietaryOptions: [] });
  const [page, setPage]     = useState("dashboard");
  const [pendingDish, setPendingDish] = useState(null);
  const [isMobile, setIsMobile]     = useState(() => window.innerWidth < 700);
  const [showSidebar, setShowSidebar] = useState(false);

  // Track auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const handler = e => { setIsMobile(e.matches); if (!e.matches) setShowSidebar(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Escape dismisses the mobile drawer, mirroring the backdrop tap
  useEffect(() => {
    if (!showSidebar) return;
    const onKey = e => { if (e.key === "Escape") setShowSidebar(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSidebar]);

  // Load data when user authenticates
  useEffect(() => {
    if (!user) {
      setDishes([]);
      setPantry([]);
      setProfile(null);
      return;
    }

    // Block first paint only on the small, fast queries…
    setDataLoading(true);
    Promise.all([
      fetchPantry(user.id),
      fetchProfile(user.id),
      fetchAppEnums(),
    ])
      .then(([p, prof, e]) => {
        setPantry(p);
        setProfile(prof);
        setEnums(e);
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));

    // …and stream the full dish list in the background. The Dish Database
    // page does its own server-side paging, so nothing waits on this; it
    // feeds the planner/suggestions/nutrients pages as soon as it lands.
    fetchDishes(user.id)
      .then(setDishes)
      .catch(console.error);
  }, [user?.id]);

  if (authLoading || dataLoading) return <LoadingScreen />;
  if (!user) return <Login />;

  const sidebarUser = {
    name:   profile?.name   ?? user.email?.split("@")[0] ?? "User",
    handle: profile?.handle ?? "@user",
    avatar: profile?.avatar_initials ?? "?",
  };

  const sharedProps = { dishes, setDishes, pantry, setPantry, userId: user.id };

  const PAGES = {
    dashboard:   <Dashboard   {...sharedProps} setPage={setPage} />,
    planner:     <Planner     dishes={dishes} userId={user.id} />,
    dishes:      <Dishes      dishes={dishes} setDishes={setDishes} userId={user.id} dishCategories={enums.dishCategories} dietaryOptions={enums.dietaryOptions} pendingDish={pendingDish} onClearPending={() => setPendingDish(null)} />,
    pantry:      <Pantry      pantry={pantry} setPantry={setPantry} userId={user.id} pantryCategories={enums.pantryCategories} pantryUnits={enums.pantryUnits} />,
    shopping:    <Shopping    dishes={dishes} pantry={pantry} setPantry={setPantry} userId={user.id} />,
    suggestions: <Suggestions dishes={dishes} pantry={pantry} onViewDish={dish => { setPendingDish(dish); setPage("dishes"); }} />,
    nutrients:   <Nutrients   dishes={dishes} userId={user.id} />,
    scanner:     <Scanner     setPantry={setPantry} userId={user.id} pantryCategories={enums.pantryCategories} pantryUnits={enums.pantryUnits} />,
    social:      <Social      userId={user.id} />,
    profile:     profile ? <Profile profile={profile} setProfile={setProfile} userId={user.id} dishCount={dishes.length} dietaryOptions={enums.dietaryOptions} /> : <LoadingScreen />,
  };

  const handleNav = (p) => { setPage(p); setShowSidebar(false); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <SvgDefs />
      {/* Mobile overlay */}
      {isMobile && showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 149 }}
        />
      )}

      {/* Sidebar - hidden off-screen on mobile, slides in when open */}
      <div style={{
        position: isMobile ? "fixed" : "sticky",
        top: 0, left: 0,
        height: isMobile ? "100vh" : undefined,
        transform: isMobile ? (showSidebar ? "translateX(0)" : "translateX(-100%)") : "none",
        transition: "transform 0.26s ease",
        zIndex: 150,
        flexShrink: 0,
      }}>
        <Sidebar page={page} setPage={handleNav} user={sidebarUser} onSignOut={() => supabase.auth.signOut()} />
      </div>

      <main style={{
        flex: 1,
        padding: isMobile ? "16px 16px 80px" : "36px 40px",
        overflowY: "auto",
        maxHeight: "100vh",
        minWidth: 0,
      }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16,
          }}>
            <button
              onClick={() => setShowSidebar(v => !v)}
              aria-label={showSidebar ? "Close navigation" : "Open navigation"}
              aria-expanded={showSidebar}
              style={{
                background: "none", border: `1px solid ${C.border}`,
                borderRadius: 8, width: 44, height: 44, cursor: "pointer",
                color: C.text, display: "inline-flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <IconMenu />
            </button>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
              letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent,
            }}>
              Season
            </span>
            <div style={{ width: 44 }} />
          </div>
        )}
        <Suspense fallback={
          <div style={{ padding: "48px 0", textAlign: "center", fontSize: 14, color: C.textMuted }}>
            Loading…
          </div>
        }>
          {PAGES[page] ?? <Dashboard {...sharedProps} setPage={setPage} />}
        </Suspense>
      </main>
    </div>
  );
}
