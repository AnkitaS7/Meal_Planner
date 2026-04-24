import { useState, useEffect } from "react";
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
  if (!user || !profile) return <Login />;

  const sidebarUser = {
    name:   profile.name,
    handle: profile.handle,
    avatar: profile.avatar_initials,
  };

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
    profile:     <Profile     profile={profile} setProfile={setProfile} userId={user.id} dishCount={dishes.length} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <Sidebar page={page} setPage={setPage} user={sidebarUser} onSignOut={() => supabase.auth.signOut()} />
      <main style={{
        flex: 1,
        padding: "36px 40px",
        overflowY: "auto",
        maxHeight: "100vh",
        maxWidth: 1280,
      }}>
        {PAGES[page] ?? <Dashboard {...sharedProps} setPage={setPage} />}
      </main>
    </div>
  );
}
