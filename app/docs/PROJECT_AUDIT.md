# ACM TSEC — Project Structure Audit & Refactoring Guide

> **Generated:** 2026-07-18 | **Scope:** Full monorepo audit covering `app/`, `api/`, `studio-a_c_m/`

---

## 1. Overview of the Monorepo

The project is a **3-package monorepo** at `c:\Rushabh\PROJECTS\A_c_m\`:

```
A_c_m/
├── app/              ← React 19 + Vite 8 (Public website)
├── api/              ← Node.js + Express (Google Drive upload proxy)
└── studio-a_c_m/    ← Sanity Studio v6 (Content Management System)
```

There is **no root `package.json`**, meaning the three packages are managed independently — no shared scripts, no workspace hoisting.

---

## 2. Detailed File Tree

### 2a. `app/` — Frontend (React + Vite)

```
app/
├── src/
│   ├── App.jsx              ← ⚠️ MONOLITH: 2,013 lines, 11+ page components
│   ├── App.css              ← Mostly empty/unused (Tailwind is used)
│   ├── index.css            ← Tailwind base styles + custom CSS vars
│   ├── main.jsx             ← React root entry point
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg        ← 🗑️ Unused Vite scaffold artifact
│   │   └── vite.svg         ← 🗑️ Unused Vite scaffold artifact
│   ├── components/
│   │   ├── Quiz.jsx         ← Quiz submission form (standalone)
│   │   ├── Quiz/
│   │   │   ├── QuizEngine.jsx   ← Full proctored exam engine
│   │   │   └── QuizLogin.jsx    ← Quiz authentication screen
│   │   └── Registration/
│   │       └── EventRegistration.jsx ← Event registration form
│   └── lib/
│       └── sanity.js        ← Sanity client, writeClient, sanityFetch helpers
├── .env                     ← ⚠️ CRITICAL: Contains VITE_SANITY_API_TOKEN (write token!)
├── clean_app.cjs            ← 🗑️ Dev utility script — should not be in repo
├── refactor.cjs             ← 🗑️ Dev utility script — should not be in repo
├── refactor-app.cjs         ← 🗑️ Dev utility script — should not be in repo
├── import_members.js        ← 🗑️ One-time data import script — should not be in repo
├── google_apps_script.js    ← ⚠️ Legacy GAS backend — kept for reference only
├── index.html               ← HTML entry point
├── vite.config.js
└── package.json
```

### 2b. `api/` — Drive Upload Proxy (Node.js + Express)

```
api/
├── server.js        ← Single-file Express server (248 lines)
├── package.json
└── .gitignore       ← ⚠️ Missing: credentials.json is referenced but .gitignore not confirmed
```

### 2c. `studio-a_c_m/` — Sanity Studio (CMS)

```
studio-a_c_m/
├── schemaTypes/
│   ├── index.ts         ← Exports all schema types
│   ├── about.ts
│   ├── event.ts
│   ├── gallery.ts
│   ├── member.ts
│   ├── message.ts
│   ├── quiz.ts
│   ├── quizSession.ts
│   ├── quizSubmission.ts
│   └── registration.ts
├── components/
│   └── ProctoringDashboard  ← Custom Sanity Studio tool (proctoring UI)
├── migrate.cjs              ← 🗑️ One-time migration script — should not be in repo root
├── members.ndjson           ← 🗑️ Seed data file — should not be in repo
├── sanity.config.ts
├── sanity.cli.ts
└── package.json
```

---

## 3. Issues Found (Categorized by Severity)

### 🔴 CRITICAL

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | **Write API token exposed in `.env`** — `VITE_` prefix means it is bundled into the client-side JS build and visible to anyone who inspects the browser network tab | `app/.env` | Security breach — anyone can write to your Sanity dataset |
| C2 | **Admin authentication is broken** — The Contact form contains a secret admin handshake (`userId + email + password`) stored in `localStorage`. Anyone with DevTools can bypass this | `App.jsx:1296` | Full admin access by any visitor |
| C3 | **`api/server.js` project ID mismatch** — The API server still uses `gx7rj7pk` but the studio and app now use `9js05zdy` | `api/server.js:16` | Uploads from Studio won't be saved to the correct Sanity project |

### 🟠 HIGH

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| H1 | **Monolithic `App.jsx`** — 2,013 lines containing 11+ page components, utility hooks, 3D rendering, SEO, routing, and UI primitives all in a single file | `app/src/App.jsx` | Impossible to maintain, zero code reuse, no code splitting/lazy loading |
| H2 | **All page components still read from `localStorage`** — `Home`, `About`, `Events`, `EventDetail`, `FusionGallery`, `Team`, `Contact` all use `localStorage.getItem()` for data despite Sanity being set up | `App.jsx:407,487,658,832,946,1296,1383` | The website will show nothing after clearing localStorage |
| H3 | **No lazy loading or code splitting** — Three.js (`~600KB`), the quiz engine, and management panel are all loaded on first page visit | `main.jsx` | Poor performance, slow initial load |
| H4 | **`bcryptjs` included as frontend dependency** — A crypto library designed for server-side usage is bundled into the React app | `app/package.json` | Unnecessary bundle bloat and security misuse |

### 🟡 MEDIUM

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| M1 | **Stale utility scripts in repo** — `clean_app.cjs`, `refactor.cjs`, `refactor-app.cjs`, `import_members.js` are dev-only one-time scripts sitting in the root | `app/` | Pollutes the repo, confuses contributors |
| M2 | **Migration + seed data in Studio repo** — `migrate.cjs` and `members.ndjson` are one-time scripts that shouldn't be version controlled | `studio-a_c_m/` | Same as above |
| M3 | **`SEO` component is a React-DOM side-effect hack** — Instead of using `<title>` + Helmet in the HTML entry point, it imperatively writes to `document.head` inside a `useEffect` | `App.jsx:567` | Broken for SSR, fragile, causes flashes on navigation |
| M4 | **`App.css` is empty / redundant** — Tailwind handles all styling via `index.css` | `app/src/App.css` | Dead file |
| M5 | **Hardcoded GAS URL** — The Google Apps Script URL is hardcoded in `App.jsx` and used as a fallback in `localStorage` | `App.jsx:14` | Dead code from legacy system — the new system uses Sanity |
| M6 | **Unused assets** — `react.svg` and `vite.svg` are Vite scaffold leftovers | `app/src/assets/` | Minor bundle noise |
| M7 | **Quiz Session schema uses string for `quizRef`** — The `quizRef` field in `quizSession` is a plain `string` not a Sanity `reference` type | `studio-a_c_m/schemaTypes/quizSession.ts:15` | No referential integrity; queries cannot use GROQ joins |
| M8 | **Gallery schema uses a string for `eventSlug`** — Should be a Sanity `reference` to `event` | `studio-a_c_m/schemaTypes/gallery.ts:10` | No referential integrity |
| M9 | **`message.ts` schema uses a named default export inconsistently** — All other schemas use named exports; `message.ts` uses `export default` | `studio-a_c_m/schemaTypes/message.ts` | Inconsistent, could cause import errors |
| M10 | **No root `.gitignore` or `README`** — The root `README.md` is minimal (591 bytes); no monorepo-level `.gitignore` | root `/` | Contributors don't know how to run the project |

### 🟢 LOW

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| L1 | **`Team` component has wrong SEO tags** — Shows "Events | ACM TSEC" title and events URL on the Team page | `App.jsx:838-841` | Wrong metadata for search engines |
| L2 | **No TypeScript in frontend** — Studio uses TS but the React app is plain JS with no JSDoc | `app/src/` | Type errors caught late |
| L3 | **`FusionGallery` doubles the Navbar** — It renders `<Navbar />` inside itself, and the main `App` also renders `<Navbar />` globally | `App.jsx:1036` | Double navbar on gallery page |
| L4 | **`as any` TypeScript casts in schemas** — Multiple schema fields use `as any` to bypass type checking | `studio-a_c_m/schemaTypes/` | Loses type safety in Studio |

---

## 4. Proposed Directory Structure

### `app/src/` — Recommended Structure

```
src/
├── main.jsx
├── index.css
├── App.jsx                  ← Thin shell: only routing + global providers
│
├── pages/                   ← One file per route
│   ├── Home.jsx
│   ├── About.jsx
│   ├── Events.jsx
│   ├── EventDetail.jsx
│   ├── Team.jsx
│   ├── Gallery.jsx
│   ├── Contact.jsx
│   └── Management.jsx
│
├── components/
│   ├── ui/                  ← Reusable UI primitives
│   │   ├── MagneticButton.jsx
│   │   ├── TiltCard.jsx
│   │   ├── GlitchText.jsx
│   │   └── SEO.jsx
│   ├── layout/              ← Layout components
│   │   ├── Navbar.jsx
│   │   └── NeuralFlow.jsx   ← Three.js background
│   ├── Quiz/
│   │   ├── Quiz.jsx
│   │   ├── QuizEngine.jsx
│   │   └── QuizLogin.jsx
│   ├── Registration/
│   │   └── EventRegistration.jsx
│   └── Team/
│       └── TeamPersonaCard.jsx
│
├── hooks/                   ← Custom React hooks
│   ├── useSanityFetch.js    ← Generic Sanity data hook with loading/error
│   └── useMousePosition.js
│
├── lib/
│   └── sanity.js            ← Sanity client (read-only token only!)
│
└── assets/
    └── hero.png             ← Remove react.svg, vite.svg
```

### Monorepo Root — Recommended Structure

```
A_c_m/
├── .gitignore               ← NEW: Root-level gitignore
├── README.md                ← Improve: full dev setup guide
├── docs/                    ← NEW: Documentation folder
│   ├── PROJECT_AUDIT.md     ← This document
│   └── DATABASE.md          ← Database schema docs
├── scripts/                 ← NEW: One-time/dev scripts moved here
│   ├── migrate.cjs
│   └── import_members.js
├── app/
├── api/
└── studio-a_c_m/
```

---

## 5. Step-by-Step Refactoring Guide

### Phase 1 — Security Fixes (Do First!)

#### Step 1.1 — Remove Write Token from Frontend

> [!CAUTION]
> The `VITE_SANITY_API_TOKEN` in `app/.env` is a **write token** that gets bundled into the browser. This must be removed immediately.

**Fix:**
1. Remove `VITE_SANITY_API_TOKEN` from `app/.env`.
2. In `app/src/lib/sanity.js`, delete the `writeClient` entirely. The frontend should only **read** from Sanity.
3. All write operations (contact form messages, registrations) should be routed through the `api/` Express server which holds the token securely in its own `.env`.
4. Generate a new **read-only token** in Sanity dashboard for `app/` and store it as `VITE_SANITY_READ_TOKEN`.

#### Step 1.2 — Fix Admin Authentication

**Fix:**
1. Remove the admin handshake from the Contact form.
2. The `/management` route should redirect to the Sanity Studio for content management.
3. If a custom admin login is required, implement it server-side in `api/server.js` using JWT tokens — never authenticate in the browser.

#### Step 1.3 — Fix API Server Project ID

**Fix:**
In `api/server.js` line 16, change `gx7rj7pk` → `9js05zdy` (and ideally load it from an env var).

---

### Phase 2 — Component Extraction (Refactor `App.jsx`)

Extract components in this order (each step is safe independently):

#### Step 2.1 — Extract UI Primitives
Create the following files and **cut-paste** the code from `App.jsx`:
- `src/components/ui/MagneticButton.jsx` ← lines 77–104
- `src/components/ui/TiltCard.jsx` ← lines 107–147
- `src/components/ui/GlitchText.jsx` ← search for `GlitchText`
- `src/components/ui/SEO.jsx` ← lines 567–635

#### Step 2.2 — Extract Layout Components
- `src/components/layout/Navbar.jsx` ← extract Navbar component
- `src/components/layout/NeuralFlow.jsx` ← lines 149–291 (Three.js)

#### Step 2.3 — Extract Sub-Components
- `src/components/Team/TeamPersonaCard.jsx` ← lines 872–926
- `src/components/FusionGallery/FusionCard.jsx` ← lines 1072–1195

#### Step 2.4 — Extract Pages (One at a Time)
Move each page into its own file, wiring up Sanity data fetching:

```jsx
// src/pages/Events.jsx (example)
import { useState, useEffect } from 'react';
import { sanityFetch } from '../lib/sanity';
import TiltCard from '../components/ui/TiltCard';
import SEO from '../components/ui/SEO';

const EVENTS_QUERY = `*[_type == "event"] | order(_createdAt desc) {
  title, "slug": slug.current, category, dateText, desc, images
}`;

export default function Events() {
  const [events, setEvents] = useState([]);
  useEffect(() => { sanityFetch(EVENTS_QUERY).then(setEvents); }, []);
  // ... render
}
```

---

### Phase 3 — Data Layer (Replace `localStorage` with Sanity)

Replace all `localStorage.getItem` calls with `sanityFetch`:

| Component | Old | New GROQ Query |
|-----------|-----|----------------|
| `Home` | `localStorage.getItem('acm_about')` | `*[_type == "about"][0]{homeHeading1, homeDesc}` |
| `About` | `localStorage.getItem('acm_about')` | `*[_type == "about"][0]{whatIsAcm, vision, mission, stats, legacyLogs}` |
| `Events` | `localStorage.getItem('acm_events')` | `*[_type == "event"] \| order(_createdAt desc)` |
| `EventDetail` | `localStorage.getItem('acm_events')` | `*[_type == "event" && slug.current == $slug][0]` |
| `Team` | `localStorage.getItem('acm_team')` | `*[_type == "member"] \| order(category asc)` |
| `FusionGallery` | `localStorage` for both events+gallery | Two parallel fetches |
| `Contact` | `localStorage.setItem('acm_messages')` | POST to `api/server.js` → Sanity |

---

### Phase 4 — Performance (Code Splitting)

Add React lazy loading in `App.jsx`:

```jsx
import React, { lazy, Suspense } from 'react';

// Eagerly loaded (needed on first render)
import Navbar from './components/layout/Navbar';

// Lazy loaded (loaded only when user navigates to the route)
const Home = lazy(() => import('./pages/Home'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const NeuralFlow = lazy(() => import('./components/layout/NeuralFlow'));
// ...etc

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <NeuralFlow />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          {/* ... */}
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
```

---

### Phase 5 — Schema Fixes

Fix the following issues in `studio-a_c_m/schemaTypes/`:

#### Step 5.1 — Fix `quizSession.ts` — Use Reference for `quizRef`
```typescript
// Change from:
defineField({ name: 'quizRef', title: 'Quiz Reference', type: 'string' }),
// Change to:
defineField({ name: 'quizRef', title: 'Quiz Reference', type: 'reference', to: [{ type: 'quiz' }] }),
```

#### Step 5.2 — Fix `gallery.ts` — Use Reference for `eventSlug`
```typescript
// Change from:
defineField({ name: 'eventSlug', title: 'Event Reference (Slug)', type: 'string' }),
// Change to:
defineField({ name: 'event', title: 'Related Event', type: 'reference', to: [{ type: 'event' }] }),
```

#### Step 5.3 — Fix `message.ts` — Use Named Export
```typescript
// Change from:
export default defineType({ ... });
// Change to:
export const message = defineType({ ... });
```

---

### Phase 6 — Cleanup

| Action | Files to Delete/Move |
|--------|---------------------|
| Delete scaffold assets | `app/src/assets/react.svg`, `app/src/assets/vite.svg` |
| Delete empty CSS | `app/src/App.css` |
| Move scripts | `app/clean_app.cjs`, `app/refactor.cjs`, `app/refactor-app.cjs`, `app/import_members.js` → `scripts/` |
| Move studio scripts | `studio-a_c_m/migrate.cjs`, `studio-a_c_m/members.ndjson` → `scripts/` |
| Remove GAS URL | `App.jsx:14` — `const ACM_MASTER_GAS_URL = ...` |
| Remove `bcryptjs` | `app/package.json` — `npm uninstall bcryptjs` |

---

## 6. Priority Order (Recommended)

| Priority | Phase | Estimated Effort |
|----------|-------|-----------------|
| 🔴 Do Now | Phase 1 — Security Fixes | 1 hour |
| 🟠 This Week | Phase 3 — Replace localStorage | 2–3 hours |
| 🟡 Next Week | Phase 2 — Extract Components | 3–5 hours |
| 🟢 Ongoing | Phases 4, 5, 6 — Polish | 2–4 hours |
