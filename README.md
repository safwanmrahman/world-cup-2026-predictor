# FIFA World Cup 2026 Predictor

A lightweight full-stack web app for predicting and simulating the 2026 FIFA World Cup. The app combines a FastAPI simulation backend, local JSON tournament data, an Elo-informed Poisson score model, a full manual bracket builder, and a polished React dashboard with group tables, match prediction, tournament probabilities, sharing tools, and a visual knockout bracket.

## Project Structure

```text
backend/
  app/
    models/
    routes/
    services/
    utils/
  .env.example
  requirements.txt
frontend/
  .env.example
  package.json
  src/
    main.jsx
    App.jsx
    components/
      dashboard/
      groups/
      hero/
      knockout/
      predictor/
      recap/
      shared/
    data/
    hooks/
    styles/
    utils/
data/
  teams.json
  groups.json
  fixtures.json
  ratings.json
README.md
setup.sh
run.sh
```

## Tech Stack

- Backend: Python, FastAPI, Uvicorn
- Frontend: React with Vite
- Data: local JSON files
- Model: Elo-adjusted expected goals with Poisson score simulation
- Simulation: Monte Carlo tournament runs
- Manual prediction: client-side editable bracket + localStorage persistence
- Exports: bundled `html2canvas` image export
- Styling: custom CSS with responsive layouts, sports-broadcast inspired presentation, and light/dark themes
- Flags: shared TeamFlag rendering backed by FlagCDN assets with graceful fallbacks

## Current Features

- Full 48-team tournament data with 12 groups of 4 teams
- Two main modes:
  - `Simulator Mode`: Monte Carlo tournament runs and probability views
  - `Predictor Mode`: manual group and knockout prediction builder
- Group-stage simulation with matchday results and live standings
- Group table sorting by points, goal difference, and goals scored
- Top 2 teams from each group advance automatically
- Best 8 third-place teams advance using points, goal difference, and goals scored
- Knockout simulation through Round of 32, Round of 16, Quarter Final, Semi Final, Final, and Third Place
- Elo-informed match predictor with expected goals, likely scorelines, and win/draw/loss probabilities
- Knockout match prediction that surfaces advancement odds and sampled penalty shootout results
- Single-tournament simulation mode with champion, runner-up, third-place, group tables, and generated bracket
- Batch simulation mode for tournament probabilities
- Dashboard showing champion probability, finalist probability, semifinal probability, quarterfinal probability, Round of 32 probability, average goals, and most likely winner
- Champion probability dashboard with animated bars, theme-aware contrast, and premium empty/loading states
- Full-width left/right visual bracket with round columns, connecting lines, winner indicators, and penalty notes
- Bracket route highlighting on hover/click to trace a team's visible knockout path
- Champion banner displayed at the top of the center bracket column (between round headers and the Final card), with flag and team name
- Finals podium showing champion, runner-up, and third-place with flag images
- Clickable group cards that open matchday drill-down details after a simulation
- Tournament tabs for `Group Stage`, `Knockout Stage`, and `Recap` in both simulator and predictor workflows
- Editorial-style recap pages with podium cards, awards, stats, upset watch, champion route, and tournament story sections
- Knockout match details modals for simulator and predictor mode, including rankings, advancement odds, upset indicators, path-so-far context, and in-modal predictor editing
- Manual prediction builder with:
  - summary-first group cards that open into a dedicated group editor modal
  - click-to-pick group-stage winners and draws with optional score editing
  - realistic auto-generated scorelines based on team strength
  - completion tracking and optional advanced override tools
  - auto-updating group tables
  - manual standings override controls behind an advanced toggle
  - automatic best eight third-place advancement logic aligned with simulator mode
  - compact knockout cards that open a detailed editing modal
  - click-to-pick knockout winners with optional score and penalty editing
  - auto-advancing teams through the full bracket
- Manual prediction persistence in `localStorage`
- Shareable manual prediction links encoded in the URL hash
- Exportable bracket image using `html2canvas`
- Auto-fill remaining picks for untouched predictor matches
- Split predictor resets for groups, knockouts, and full bracket reset with confirmation modals
- Light/dark mode toggle stored in `localStorage`
- Flag rendering standardized through a reusable component for sharper, more consistent display
- Environment-based frontend API configuration with `VITE_API_BASE_URL`
- Environment-based backend CORS, API docs, and request throttling controls

## Backend API

Available endpoints:

- `GET /teams`
- `GET /groups`
- `GET /fixtures`
- `POST /predict-match`
- `POST /simulate-one`
- `POST /simulate-tournament`

Example match prediction request:

```json
{
  "home_team_code": "USA",
  "away_team_code": "ARG",
  "stage": "group"
}
```

Example batch simulation request:

```json
{
  "simulations": 500
}
```

## How the Model Works

The model is intentionally simple and fast enough to run locally:

1. Each team has an Elo rating and FIFA ranking in the local JSON data.
2. USA, Canada, and Mexico receive host nation advantage.
3. Elo difference is converted into expected goals for each team.
4. Actual scores are sampled with a Poisson goal model.
5. Group matches can end in draws.
6. Knockout matches are resolved with a winner, including tie-breaking logic when needed.
7. Monte Carlo simulations repeat the full tournament and count how often each team reaches each stage.

Tracked stages include:

- Round of 32
- Round of 16
- Quarter-Final
- Semi-Final
- Final
- Champion

The app also tracks average goals per match and average team goals across simulation runs.

## Manual Prediction Mode

`Predictor Mode` lets users build an entire World Cup path by hand:

1. Quick-pick any group-stage match by clicking Team A, Team B, or Draw.
2. Let the app auto-generate a realistic scoreline, or manually edit the score afterward.
3. Watch the group tables recalculate automatically as the predictor state updates.
4. Open advanced override controls only when you want to manually reorder standings.
5. Let the app resolve the best eight third-place teams using the same criteria as simulator mode.
6. Click through the knockout bracket to open match details, then pick winners and edit scores or penalties inside the modal.
7. Save that state automatically in the browser.
8. Share the bracket through a copied link or export it as a PNG.

The manual state is stored as a structured object that includes scores, quick-pick outcomes, overrides, group expansion state, third-place selections, knockout results, and derived outcomes such as champion, runner-up, and third-place finisher.

## Run Locally

### Quick Start

From the project root:

```bash
chmod +x setup.sh run.sh
./setup.sh
./run.sh
```

This installs backend and frontend dependencies, then starts both servers.

To override local defaults, copy the example env files first:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Open:

- Frontend: `http://127.0.0.1:5173`
- Backend API docs: `http://127.0.0.1:8000/docs`

### Manual Backend Start

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

### Manual Frontend Start

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

## Build Check

To verify the frontend production build:

```bash
cd frontend
npm run build
```

## Environment Variables

### Frontend

Create `frontend/.env` from `frontend/.env.example` when you need to point the app at a different API:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For production, set `VITE_API_BASE_URL` to your deployed HTTPS backend URL.

### Backend

Create `backend/.env` from `backend/.env.example` or configure these variables through your deployment platform:

```bash
APP_ENV=development
ENABLE_API_DOCS=true
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_PREDICT_MATCH=120
RATE_LIMIT_SIMULATE_ONE=30
RATE_LIMIT_SIMULATE_BATCH=12
PUBLIC_SIMULATION_MAX=2000
```

Notes:

- `ALLOWED_ORIGINS` is comma-separated.
- `ENABLE_API_DOCS=false` is recommended in production unless you intentionally want public docs.
- `PUBLIC_SIMULATION_MAX` sets the public cap for batch simulations.

## Production Notes

- `run.sh` is a development convenience script only. It uses `uvicorn --reload` and should not be used as a production entrypoint.
- In production, run FastAPI with a proper process manager and an HTTPS-aware reverse proxy.
- Configure `ALLOWED_ORIGINS` explicitly for your deployed frontend origin.
- The API now applies basic in-memory throttling to:
  - `POST /predict-match`
  - `POST /simulate-one`
  - `POST /simulate-tournament`
- Oversized batch simulation requests are rejected by the backend if they exceed `PUBLIC_SIMULATION_MAX`.
- Before release, run dependency checks such as:
  - `cd frontend && npm audit --omit=dev`
  - `pip-audit` in the backend environment

## Frontend Architecture

The frontend is organized by feature so the app can keep growing without centralizing all logic in one file:

- `components/hero`: hero masthead, mode switcher, action buttons, and theme toggle
- `components/dashboard`: stat cards, head-to-head model, champion probability dashboard, and probability bars
- `components/groups`: simulator group tables, predictor group cards, standings, third-place view, and group editor/results modals
- `components/knockout`: bracket layout, match cards, champion banner, and knockout details modal
- `components/predictor`: predictor toolbar, tournament tabs, and simulator/predictor view composition
- `components/recap`: podium and tournament recap presentation
- `components/shared`: reusable UI primitives such as buttons, badges, modal shell, flags, icons, and loading states
- `hooks`: theme persistence, tournament orchestration, and predictor state management
- `utils`: formatting helpers, knockout helpers, simulation display shaping, and export helpers
- `styles`: split global, theme, and animation entrypoints

## Future Improvements

### Simulation Model
- Use FIFA's official third-place bracket placement matrix (currently uses best 8 by points/GD/GF)
- Add full group tie-breaker chain: head-to-head record → fair play points → drawing of lots
- Support user-adjustable Elo ratings and host advantage multiplier
- Improve penalty shootout modeling (current implementation uses a lightweight deterministic edge)

### UI and Visualisation
- Add chart views for semifinals, finals, and Round of 32 probabilities — not just champion
- Add filtering and sorting controls to the simulation dashboard table
- Add richer empty states and contextual onboarding for first-time simulator and predictor users

### Data and History
- Track and display simulation history across multiple runs
- Export simulation results as CSV or JSON
- Compare two different simulation runs side by side
- Add team profile pages with per-team probability breakdowns across all stages

### Infrastructure
- Add deployment configuration (Vercel frontend + Railway/Fly.io backend)
- Cache simulation results server-side to avoid re-running on every page refresh

## Credits

- [FlagCDN](https://flagcdn.com): country flag assets
- [Google Fonts](https://fonts.google.com): Inter typeface
- [FIFA World Rankings](https://www.fifa.com/fifa-world-ranking/men): ranking reference used to shape sample team data
