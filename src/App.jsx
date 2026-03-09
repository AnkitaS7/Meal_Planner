import { useState } from "react";
import { C } from "./theme";
import Sidebar from "./components/Sidebar";
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
import { MOCK_DISHES, MOCK_PANTRY, MOCK_USER } from "./data/mockData";

export default function App() {
  const [page, setPage]     = useState("dashboard");
  const [dishes, setDishes] = useState(MOCK_DISHES);
  const [pantry, setPantry] = useState(MOCK_PANTRY);

  const sharedProps = { dishes, setDishes, pantry, setPantry };

  const PAGES = {
    dashboard:   <Dashboard   {...sharedProps} setPage={setPage} />,
    planner:     <Planner     dishes={dishes} />,
    dishes:      <Dishes      dishes={dishes} setDishes={setDishes} />,
    pantry:      <Pantry      pantry={pantry} setPantry={setPantry} />,
    shopping:    <Shopping    dishes={dishes} pantry={pantry} />,
    suggestions: <Suggestions dishes={dishes} pantry={pantry} />,
    nutrients:   <Nutrients   dishes={dishes} />,
    scanner:     <Scanner     setPantry={setPantry} />,
    social:      <Social />,
    profile:     <Profile />,
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: C.bg,
    }}>
      <Sidebar page={page} setPage={setPage} user={MOCK_USER} />

      <main style={{
        flex: 1,
        padding: "36px 40px",
        overflowY: "auto",
        maxHeight: "100vh",
        // Prevent content from stretching too wide on ultra-wide screens
        maxWidth: 1280,
      }}>
        {PAGES[page] ?? <Dashboard {...sharedProps} setPage={setPage} />}
      </main>
    </div>
  );
}
