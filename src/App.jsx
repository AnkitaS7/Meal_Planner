import { useState, useEffect, useRef } from "react";
import { C } from "./theme";
import { supabase } from "./lib/supabase";
import { fetchDishes, fetchPantry, fetchProfile } from "./lib/db";
import Sidebar     from "./components/Sidebar";
import Login       from "./pages/Login";
import Dashboard   from "./pages/Dashboard";
import Planner     from "./pages/Planner";
import Dishes      from "./pages/Dishes";
import Pantry      from "./pages/Pantry";
import Shopping    from "./pages/Shopping";
import Suggestions from "./pages/Suggestions";
import Nutrients   from "./pages/Nutrients";
import Scanner     from "./pages/Scanner";
import Social      from "./pages/Social";
import Profile     from "./pages/Profile";

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
  const [page, setPage]     = useState("dashboard");

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

  // Load data when user authenticates
  useEffect(() => {
    if (!user) {
      setDishes([]);
      setPantry([]);
      setProfile(null);
      return;
    }

    setDataLoading(true);
    Promise.all([
      fetchDishes(user.id),
      fetchPantry(user.id),
      fetchProfile(user.id),
    ])
      .then(([d, p, prof]) => {
        setDishes(d);
        setPantry(p);
        setProfile(prof);
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [user?.id]);

  if (authLoading || dataLoading) return <LoadingScreen />;
  if (!user) return <Login />;

  const sidebarUser = {
    name:   profile?.name   ?? user.email?.split("@")[0] ?? "User",
    handle: profile?.handle ?? "@user",
    avatar: profile?.avatar_initials ?? "?",
  };

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 700);
  const [showSidebar, setShowSidebar] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const handler = e => { setIsMobile(e.matches); if (!e.matches) setShowSidebar(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const sharedProps = { dishes, setDishes, pantry, setPantry, userId: user.id };

  const PAGES = {
    dashboard:   <Dashboard   {...sharedProps} setPage={setPage} />,
    planner:     <Planner     dishes={dishes} userId={user.id} />,
    dishes:      <Dishes      dishes={dishes} setDishes={setDishes} userId={user.id} />,
    pantry:      <Pantry      pantry={pantry} setPantry={setPantry} userId={user.id} />,
    shopping:    <Shopping    dishes={dishes} pantry={pantry} userId={user.id} />,
    suggestions: <Suggestions dishes={dishes} pantry={pantry} />,
    nutrients:   <Nutrients   dishes={dishes} userId={user.id} />,
    scanner:     <Scanner     setPantry={setPantry} />,
    social:      <Social      userId={user.id} />,
    profile:     profile ? <Profile profile={profile} setProfile={setProfile} userId={user.id} dishCount={dishes.length} /> : <LoadingScreen />,
  };

  const handleNav = (p) => { setPage(p); setShowSidebar(false); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      {/* Mobile overlay */}
      {isMobile && showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 149 }}
        />
      )}

      {/* Sidebar — hidden off-screen on mobile, slide in when open */}
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
        maxWidth: 1280,
      }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16,
          }}>
            <button
              onClick={() => setShowSidebar(v => !v)}
              style={{
                background: "none", border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                fontSize: 18, color: C.text,
              }}
            >
              ☰
            </button>
            <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 18, color: C.text }}>
              Mise en Place
            </span>
            <div style={{ width: 42 }} />
          </div>
        )}
        {PAGES[page] ?? <Dashboard {...sharedProps} setPage={setPage} />}
      </main>
    </div>
  );
}
