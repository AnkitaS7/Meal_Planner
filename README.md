# 🍽 Mise en Place — Meal Planner

A full-featured, beautifully designed meal planning web application built with React + Vite.

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | At-a-glance daily overview — meals, nutrients, suggestions, shopping alerts |
| **Meal Planner** | Interactive weekly grid to plan Breakfast/Lunch/Dinner/Snack for each day |
| **Dish Database** | Browse, filter, and add dishes with ingredients, recipes, YouTube links, and nutrition |
| **Pantry** | Track available ingredients with quantities, categories, and expiry dates |
| **Shopping Cart** | Auto-generated shopping list from meal plan; pantry items excluded automatically |
| **Suggestions** | Recipe suggestions sorted by pantry readiness (ready / almost there / missing most) |
| **Nutrients** | Daily target rings, weekly calorie bar chart, macro pie chart, per-dish table |
| **Bill Scanner** | Drag-and-drop receipt scanner that extracts items and adds them to pantry |
| **Community** | Follow/unfollow cooks, view their latest meals, browse dishes and menus |
| **Profile** | Editable profile, dietary preferences, activity stats, account settings |

---

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — build tool & dev server
- **Recharts** — charts (bar, pie, radar)
- No CSS framework — all styling is inline with a custom design token system

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
meal-planner/
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── package.json
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Root component, page routing, global state
    ├── index.css               # Global CSS reset & animations
    ├── theme.js                # Design tokens (colors, fonts, shadows)
    ├── data/
    │   └── mockData.js         # All mock data & constants
    ├── hooks/
    │   └── useLocalStorage.js  # Persistent state hook
    ├── components/
    │   ├── ui.jsx              # Reusable UI components (Btn, Card, Input, etc.)
    │   └── Sidebar.jsx         # Navigation sidebar
    └── pages/
        ├── Dashboard.jsx
        ├── Planner.jsx
        ├── Dishes.jsx
        ├── Pantry.jsx
        ├── Shopping.jsx
        ├── Suggestions.jsx
        ├── Nutrients.jsx
        ├── Scanner.jsx
        ├── Social.jsx
        └── Profile.jsx
```

---

## Design System

The app uses a warm organic editorial aesthetic:

| Token | Value | Usage |
|---|---|---|
| `bg` | `#F7F3EE` | Page background |
| `sidebar` | `#1C2B1C` | Deep forest green sidebar |
| `accent` | `#D4724A` | Terracotta — primary CTA color |
| `sage` | `#6B8F71` | Sage green — secondary actions |
| `gold` | `#C9A84C` | Warm gold — highlights |

Fonts: **Playfair Display** (headings) + **Jost** (body)

---

## Extending the App

### Adding a new page

1. Create `src/pages/MyPage.jsx`
2. Add entry in `NAV_ITEMS` inside `src/components/Sidebar.jsx`
3. Import and wire it up in `src/App.jsx`

### Adding new dishes

Use the **Dish Database → Add New Dish** form in the UI, or extend `MOCK_DISHES` in `src/data/mockData.js`.

### Connecting a backend

Replace the state initializations in `App.jsx` with `useEffect` data fetches. The `useLocalStorage` hook in `src/hooks/useLocalStorage.js` can be dropped in anywhere you want persistence without a backend.
