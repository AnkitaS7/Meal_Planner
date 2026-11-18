import { useState, useEffect, lazy, Suspense } from "react";
import { initThemeMode } from "./theme";
import { SvgDefs } from "./components/art";
import { supabase, arrivedFromRecoveryLink } from "./lib/supabase";

initThemeMode();
import { fetchDishes, fetchPantry, fetchProfile, fetchAppEnums } from "./lib/db";
import { TopBar, Dock, Menu, useNight } from "./components/Shell";
import { Loading, PageHeader, WorldContext } from "./components/ui";
import Login       from "./pages/Login";
import Dashboard   from "./pages/Dashboard";

const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));

// Every page beyond the two first-paint ones loads on demand. This keeps
// heavyweight page-only dependencies (recharts lives solely in Nutrients)
// out of the initial bundle.
const Planner     = lazy(() => import("./pages/Planner"));
const Dishes      = lazy(() => import("./pages/Dishes"));
const Pantry      = lazy(() => import("./pages/Pantry"));
const Shopping    = lazy(() => import("./pages/Shopping"));
const Nutrients   = lazy(() => import("./pages/Nutrients"));
const Scanner     = lazy(() => import("./pages/Scanner"));
const Social      = lazy(() => import("./pages/Social"));
const Profile     = lazy(() => import("./pages/Profile"));

function LoadingScreen() {
  // SvgDefs is mounted here too: this screen returns before the main app
  // tree renders, so shared symbols must be available on its own.
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--world-bg)", color: "var(--world-fg)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <SvgDefs />
      <Loading label="Setting the table…" size={64} />
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
  const [pendingDishesTab, setPendingDishesTab] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [night, toggleNight] = useNight();
  const [recovery, setRecovery]     = useState(arrivedFromRecoveryLink);

  // Track auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Fires for the code-exchange reset flow, which leaves no recovery
      // fragment for arrivedFromRecoveryLink to spot.
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Each section is its own world: tell the document which one is showing
  // (the body colour follows it) and start every visit at the top.
  useEffect(() => {
    document.documentElement.dataset.world = user ? page : "dashboard";
    window.scrollTo(0, 0);
  }, [page, user]);

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
    // feeds the planner/nutrients pages and the suggested-dishes tab as
    // soon as it lands.
    fetchDishes(user.id)
      .then(setDishes)
      .catch(console.error);
  }, [user?.id]);

  const leaveRecovery = () => {
    // Drop any auth remnants so a refresh doesn't reopen the reset screen.
    window.history.replaceState({}, "", window.location.pathname);
    setRecovery(false);
  };

  if (authLoading) return <LoadingScreen />;
  // The reset screen owns the whole view until it's dismissed — it must not
  // wait on the app's data fetches, and it applies signed in or not.
  if (recovery) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <UpdatePassword onDone={leaveRecovery} />
      </Suspense>
    );
  }
  if (dataLoading) return <LoadingScreen />;
  if (!user) return <Login />;

  const sidebarUser = {
    name:   profile?.name   ?? user.email?.split("@")[0] ?? "User",
    handle: profile?.handle ?? "@user",
    avatar: profile?.avatar_initials ?? "?",
  };

  const sharedProps = { dishes, setDishes, pantry, setPantry, userId: user.id };

  const PAGES = {
    dashboard:   <Dashboard   {...sharedProps} profileName={profile?.name} setPage={setPage} onOpenSuggestions={() => { setPendingDishesTab("suggested"); setPage("dishes"); }} />,
    planner:     <Planner     dishes={dishes} userId={user.id} />,
    dishes:      <Dishes      dishes={dishes} setDishes={setDishes} pantry={pantry} userId={user.id} dishCategories={enums.dishCategories} dietaryOptions={enums.dietaryOptions} pendingTab={pendingDishesTab} onClearPendingTab={() => setPendingDishesTab(null)} />,
    pantry:      <Pantry      pantry={pantry} setPantry={setPantry} userId={user.id} pantryCategories={enums.pantryCategories} pantryUnits={enums.pantryUnits} onScan={() => setPage("scanner")} />,
    shopping:    <Shopping    dishes={dishes} pantry={pantry} setPantry={setPantry} userId={user.id} />,
    nutrients:   <Nutrients   dishes={dishes} userId={user.id} />,
    scanner:     <Scanner     setPantry={setPantry} userId={user.id} pantryCategories={enums.pantryCategories} pantryUnits={enums.pantryUnits} />,
    social:      <Social      userId={user.id} />,
    profile:     profile ? <Profile profile={profile} setProfile={setProfile} userId={user.id} dishCount={dishes.length} dietaryOptions={enums.dietaryOptions} /> : <LoadingScreen />,
  };

  const signOut = () => { setMenuOpen(false); setPage("dashboard"); supabase.auth.signOut(); };

  return (
    <div className="world" data-world={page}>
      <SvgDefs />
      <div className="world-inner">
        <TopBar
          page={page} setPage={setPage} user={sidebarUser} night={night} onToggleNight={toggleNight}
          onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen}
        />
        <WorldContext.Provider value={page}>
          <main key={page}>
            {/* While a page's code loads, its photograph is already up. */}
            <Suspense fallback={<><PageHeader title="" /><Loading size={44} label="Setting the table…" /></>}>
              {PAGES[page] ?? PAGES.dashboard}
            </Suspense>
          </main>
        </WorldContext.Provider>
      </div>
      <Dock page={page} setPage={setPage} onOpenMenu={() => setMenuOpen(true)} />
      {menuOpen && (
        <Menu
          page={page} setPage={setPage} user={sidebarUser} night={night}
          onToggleNight={toggleNight} onSignOut={signOut} onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
