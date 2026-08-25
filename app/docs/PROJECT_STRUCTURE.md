# ACM TSEC Project Structure

The ACM TSEC repository is organized into three primary packages to separate concerns: Frontend, Backend API, and Content Management.

## Packages

### 1. `app/` (Frontend)
Built with React (Vite) and Tailwind CSS.
- **`src/App.jsx`**: The thin router shell handling all top-level routes using `react-router-dom`. Uses `React.lazy` for route-based code splitting.
- **`src/pages/`**: Contains page-level components (Home, About, Events, Team, etc.).
- **`src/components/layout/`**: Structural components like `Navbar.jsx` and `NeuralFlow.jsx` (the 3D background).
- **`src/components/ui/`**: Reusable micro-components like `TiltCard`, `MagneticButton`, and `GlitchText`.
- **`src/hooks/`**: Custom hooks, mainly `useSanityData.js` which handles fetching data from the CMS.
- **`src/lib/`**: Utilities like `sanity.js` (Sanity client configuration) and `utils.js` (Google Drive URL parsers).

### 2. `api/` (Backend Server)
A lightweight Express.js server bridging the frontend to third-party services.
- **`server.js`**: Defines REST endpoints:
  - `POST /upload`: Uploads files from memory to Google Drive and makes them public.
  - `POST /submit-quiz`: Validates quiz data, saves to Sanity, and logs to a Google Sheet.
  - `POST /registrations`: Forwards event registrations from the frontend to Sanity securely.
  - `POST /messages`: Forwards contact form messages to Sanity.
  - `POST /backup` & `POST /restore`: Interfaces for the Google Sheets Backup & Restore feature.
- **Credentials**: Relies on a `credentials.json` (Google Service Account) which is explicitly `.gitignore`d.

### 3. `studio-a_c_m/` (Sanity CMS)
The Sanity Studio used by the committee for all content management.
- **`sanity.config.ts`**: The main configuration file defining plugins, the Structure Builder, and custom tools.
- **`schemaTypes/`**: Contains schema definitions for all data types (Member, Event, Quiz, Registration, Message, Gallery).
- **`components/`**: Custom React components built for the Sanity dashboard (e.g., `BackupDashboard.tsx` and `ProctoringDashboard.tsx`).

## Deployment & Routing Flow
- **Data Flow**: `Frontend (app/)` -> `Backend API (api/)` -> `Sanity (studio-a_c_m/)`
- **Reads**: The Frontend reads directly from Sanity using a read-only token to minimize latency and API hops.
- **Writes**: The Frontend sends data to the `api/` server, which then securely authenticates with Sanity using a private write token and/or Google Drive for uploads.
