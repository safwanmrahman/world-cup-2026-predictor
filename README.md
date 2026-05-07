# FIFA World Cup 2026 Predictor

A lightweight full-stack web app for predicting and simulating the 2026 FIFA World Cup. The app combines a FastAPI simulation backend, local JSON tournament data, an Elo-informed Poisson score model, and a polished React dashboard with group tables, match prediction, tournament probabilities, and a visual knockout bracket.

## Project Structure

```text
backend/
  app/
    models/
    routes/
    services/
    utils/
  requirements.txt
frontend/
  src/
    App.jsx
    main.jsx
    styles.css
  package.json
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
- Styling: custom CSS with Barlow typography, responsive layouts, and light/dark themes
- Flags: FlagCDN PNG assets using ISO country codes

## Current Features

- Full 48-team tournament data with 12 groups of 4 teams
- Group-stage simulation with matchday results and live standings
- Group table sorting by points, goal difference, and goals scored
- Top 2 teams from each group advance automatically
- Best 8 third-place teams advance using points, goal difference, and goals scored
- Knockout simulation through Round of 32, Round of 16, Quarter Final, Semi Final, Final, and Third Place
- Elo-informed match predictor with expected goals, likely scorelines, and win/draw/loss probabilities
- Single-tournament simulation mode with champion, runner-up, third-place, group tables, and generated bracket
- Batch simulation mode for tournament probabilities
- Dashboard showing champion probability, finalist probability, semifinal probability, quarterfinal probability, Round of 32 probability, average goals, and most likely winner
- Top-12 champion probability chart with animated bars and scrollable results area
- Full-width left/right visual bracket with round columns, connecting lines, winner indicators, and penalty notes
- Champion banner displayed at the top of the center bracket column (between round headers and the Final card), with flag and team name
- Finals podium showing champion, runner-up, and third-place with flag images
- Clickable group cards that open matchday drill-down details after a simulation
- Light/dark mode toggle stored in `localStorage`
- Flag images from FlagCDN with safe fallback rendering

## Backend API

Available endpoints:

- `GET /teams`
- `GET /groups`
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
- Quarter Final
- Semi Final
- Final
- Champion

The app also tracks average goals per match and average team goals across simulation runs.

## Run Locally

### Quick Start

From the project root:

```bash
chmod +x setup.sh run.sh
./setup.sh
./run.sh
```

This installs backend and frontend dependencies, then starts both servers.

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

## Credits

- [FlagCDN](https://flagcdn.com): country flag PNG assets
- [Google Fonts](https://fonts.google.com): Barlow typeface
- [FIFA World Rankings](https://www.fifa.com/fifa-world-ranking/men): ranking reference used to shape sample team data

## Future Improvements
### User Experience
- Let users enter their own scorelines for any group or knockout match and manually override the simulated result
- Let users pick which teams advance through the bracket themselves, creating a fully custom prediction path
- Add a "My Prediction" mode alongside the simulator where users build their own bracket without running a simulation
- Save user predictions to `localStorage` so they persist across page refreshes
- Allow users to share their bracket predictions via a generated link or exported image
- Show a side-by-side comparison between the user's prediction and the Monte Carlo simulation result

### Simulation Model
- Use FIFA's official third-place bracket placement matrix (currently uses best 8 by points/GD/GF)
- Add full group tie-breaker chain: head-to-head record → fair play points → drawing of lots
- Support user-adjustable Elo ratings and host advantage multiplier
- Improve penalty shootout modeling (current implementation uses 50/50 by default)

### UI and Visualisation
- Add a mobile-friendly / responsive bracket layout
- Add chart views for semifinals, finals, and Round of 32 probabilities — not just champion
- Add filtering and sorting controls to the simulation dashboard table
- Show bracket connectors scaling smoothly to narrower viewports

### Data and History
- Track and display simulation history across multiple runs
- Export simulation results as CSV or JSON
- Compare two different simulation runs side by side
- Add team profile pages with per-team probability breakdowns across all stages

### Infrastructure
- Add deployment configuration (Vercel frontend + Railway/Fly.io backend)
- Cache simulation results server-side to avoid re-running on every page refresh
