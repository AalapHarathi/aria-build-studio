# ARIA XAI Build Studio — Codex Handoff

**Updated:** 27 November 2026  
**Repository:** [AalapHarathi/aria-build-studio](https://github.com/AalapHarathi/aria-build-studio)  
**Branch:** `main`

## Current status

The Studio Overview is implemented in the existing ARIA XAI Build Studio app. The current scope is the overview and its supporting navigation, workspace selection, sample data, and direct links into review and test records. The next major screen has not been started; wait for the user to review the overview and provide visual approval first.

The latest work was pushed to `main` in these commits:

- `abab42d` — Build Studio Overview dashboard
- `c36496c` — Match dashboard panel heights and contain overflow
- `ddda6ba` — Replace Lovable favicon with ARIA mark

## What is in the overview

- Four top-level metrics for Teammates, reusable Taskmates, configured workflows, and releases in progress.
- Teammate lifecycle counts, derived from the seeded teammate records, with clickable stage filters.
- Role-aware pending work and workspace-scoped views.
- Search, notifications, workspace/environment selectors, role switching, and theme switching in the app shell.
- Engine health cards that honestly show unknown or unavailable values when a health source is not connected.
- Operational issues with links to their matching test traces or workflows; pending review items link to the selected review record.
- Activity and records labelled as illustrative or seeded where applicable.
- Dashboard panels align to equal heights within desktop rows. Long content scrolls inside its panel; narrower layouts stack the panels.
- The Lovable favicon was removed and replaced with a cyan ARIA “a” SVG mark.

## Data and integration limits

This repository currently provides a local sample experience, not a connected production backend. Workspace and teammate records are seeded demo data; the workspace selection is persisted in the browser. Sandbox is the available environment. Staging and Production are not connected. Engine health, governance events, and several Control Centre readiness signals do not have live sources, so the UI marks them unavailable instead of inventing values. Recent activity is illustrative.

## Run locally

From the repository root:

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 8080
```

Then open <http://localhost:8080/>. If port `8080` is already occupied, choose another port and use that URL. In the current session, the preview is running at `http://localhost:8080/`.

## Verification recorded

After the overview work, `npm test -- --run` passed (7 tests across 2 files), and `npm run build` succeeded. The build reports existing Vite configuration and large-chunk warnings. Desktop panel height and overflow behavior was checked in the running browser preview. Tablet/mobile layouts were implemented but not visually inspected in that pass.

## Key implementation files

- `src/routes/index.tsx` — Studio Overview content and panel layout.
- `src/components/aria/app-shell.tsx` — navigation, workspace/environment controls, search, notifications, and role/theme controls.
- `src/components/aria/ui.tsx` — shared panel component with configurable scrollable content.
- `src/lib/aria-data.ts` and `src/lib/app-state.tsx` — seeded records and persisted UI state.
- `src/routes/reviews.tsx` and `src/routes/testing.tsx` — deep links from overview items.
- `src/routes/__root.tsx` and `public/favicon.svg` — app metadata and ARIA favicon.

## Handoff point

Please review the Studio Overview at <http://localhost:8080/>. Make any requested adjustments to this screen, then wait for explicit visual approval before moving to another major screen. Continue committing and pushing work to the `main` branch of the repository above, as previously requested.
