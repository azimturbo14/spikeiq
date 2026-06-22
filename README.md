# SpikeIQ

SpikeIQ is a React + TypeScript web app for AI-powered volleyball spike analysis. It uses a premium sport-tech interface inspired by Whoop and Hudl: near-black surfaces, a single electric teal accent, responsive dashboards, and Framer Motion entrance animations. The current live analysis path is browser-side local heuristic analysis; the Node API folder is inactive/experimental.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Build

```bash
npm run build
```

## Routes

- `/` — Landing page with the product promise, CTA buttons, and animated volleyball court background.
- `/analyze` — Unified analysis hub with Quick Analysis, Gameplay Batch, Stamina Test, and player history.
- `/upload`, `/sessions`, `/stamina` — Redirect to `/analyze` with the matching mode selected.
- `/session/:id` — Main session report for the active player. Use `/session/latest` to open the latest session.
- `/trends` — Multi-session trend dashboard using only the active player's analyzed sessions.
- `/plan` — Weekly training calendar generated from the active player's latest analyzed session.

## Local analysis

The live analysis path is `src/lib/localVideoAnalysis.ts`. It runs in the browser, samples video frames, and returns first-pass heuristic estimates for spike attempts, direction accuracy, approach angle, contact consistency, estimated spike height, and training focus.

These outputs are estimates from frame-motion analysis, not verified biomechanical measurements. The current engine does not yet perform full block geometry, ball trajectory, court calibration, or exact jump-height measurement.

## Backend API status

`npm run dev` starts the Vite frontend. The local Node API remains available separately through `npm run dev:api`, but the backend API is inactive/experimental. Frontend backend calls are disabled by `BACKEND_ANALYSIS_ENABLED = false` in `src/lib/analysisApi.ts`.

See `server/README.md` for the backend WIP status. The backend is not required for the working local analysis flow.

## Player separation

SpikeIQ stores profiles, sessions, videos, and the active player selection locally in the browser and scopes sessions by player ID. There are no demo players, demo sessions, or demo trends. Each player must be created before uploading videos, and dashboards only read that player's own data.

## Project structure

- `src/components/` — Shared UI, charts, dashboard layout, sidebar, metric cards, empty states, and animated page wrapper.
- `src/pages/` — Route-level pages.
- `src/types/` — Typed profile, session, and trend models.
- `src/lib/` — Theme palette, user profile storage, session storage helpers, and analysis API client.
- `server/` — Local analysis API that accepts uploaded videos, extracts frames, estimates first-pass spike metrics, and exposes job status.

## Design notes

- Tailwind is the primary styling system.
- The SpikeIQ palette is extended in `tailwind.config.ts`.
- Metric cards include animated teal left borders that scale in on load.
- Recharts containers are responsive and use stored session data.
- The sidebar is persistent on dashboard routes and collapses into a drawer on mobile.
