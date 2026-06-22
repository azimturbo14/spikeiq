# Backend analysis API — inactive / experimental

This folder contains an early Express, Multer, and FFmpeg-based analysis API prototype. It is **not** the live analysis path used by SpikeIQ today.

## Current live path

The working app path is browser-side local analysis through `src/lib/localVideoAnalysis.ts`.

- Runs inside the browser.
- Uses a hidden `<video>` element and canvas frame sampling.
- Produces first-pass heuristic estimates for motion, direction, contact consistency, and estimated spike height.
- Does not require the backend API to be running.

## Backend status

The backend API is inactive/experimental:

- Jobs are stored in memory only.
- There is no persistent queue.
- FFmpeg/core setup is not part of the current working app path.
- Frontend backend calls are disabled by `BACKEND_ANALYSIS_ENABLED = false` in `src/lib/analysisApi.ts`.

Do not treat this folder as the production analysis architecture. It is kept as a reference/WIP only until a persistent, tested backend analysis system is ready.
