# World Cup 2026 Simulator

A full-stack World Cup predictor and simulator with a Vite + React frontend, a FastAPI backend, and repo-local tournament JSON data.

## Tech Stack

- Frontend: React 19, Vite 7, plain CSS
- Backend: FastAPI, Uvicorn
- Data: `data/*.json`
- Deployment shape: static frontend + separate Python API

## Project Structure

```text
backend/
  app/
    main.py
    models/
    routes/
    services/
    utils/
  .env.example
  requirements.txt
frontend/
  public/
  src/
  .env.example
  package.json
  vite.config.js
  vercel.json
data/
  fixtures.json
  groups.json
  ratings.json
  teams.json
README.md
run.sh
setup.sh
```

## Runtime Overview

- The frontend calls the backend for `/teams`, `/groups`, `/fixtures`, `/predict-match`, `/simulate-one`, and `/simulate-tournament`.
- Manual prediction state is browser-side and can be restored from the URL hash and local storage.
- The backend loads tournament data from the repo-level `data/` directory.
- Static frontend assets live in `frontend/public/`.

## Environment Variables

### Frontend

Copy the example file for local use:

```bash
cp frontend/.env.example frontend/.env
```

Available variable:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Notes:

- Local dev falls back to `http://127.0.0.1:8000` if `VITE_API_BASE_URL` is unset.
- Production builds do not fall back to localhost. Set `VITE_API_BASE_URL` to your deployed backend URL.

### Backend

Copy the example file for local use:

```bash
cp backend/.env.example backend/.env
```

Available variables:

```text
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

- `ALLOWED_ORIGINS` is a comma-separated allowlist for CORS.
- In production, set `APP_ENV=production` and define `ALLOWED_ORIGINS` explicitly.
- The backend reads `backend/.env` first, then a repo-root `.env` if present. Real environment variables override both.

## Local Development

Quick start:

```bash
chmod +x setup.sh run.sh
./setup.sh
./run.sh
```

Manual start:

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

Local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

## Production Deployment

Recommended split:

- Backend on Render, Railway, or Fly.io
- Frontend on Vercel or Netlify

### Backend

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Required production env:

```text
APP_ENV=production
ENABLE_API_DOCS=false
ALLOWED_ORIGINS=https://your-frontend-domain.example
```

Recommended working-directory setup:

- Use `backend` as the service root or working directory.
- Keep the full repo available in the deployment so the API can read the shared `data/` directory.

Provider notes:

- Render: create a Web Service rooted at `backend`, use the start command above, and set `ALLOWED_ORIGINS` to your frontend origin.
- Railway: set the root directory to `backend`, add the same env vars, and use the same start command.
- Fly.io: deploy the Python service from `backend`, expose the platform `PORT`, and set `ALLOWED_ORIGINS` to the public frontend domain.

### Frontend

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

Required production env:

```text
VITE_API_BASE_URL=https://your-backend-domain.example
```

Provider notes:

- Vercel: set the root directory to `frontend`, configure `VITE_API_BASE_URL`, and deploy. `frontend/vercel.json` rewrites all paths to `index.html`.
- Netlify: set the base directory to `frontend`, publish `dist`, configure `VITE_API_BASE_URL`, and deploy. `frontend/public/_redirects` provides SPA refresh and deep-link fallback.

## Deployment Readiness Notes

- Frontend API calls now use `VITE_API_BASE_URL` when provided instead of shipping a production localhost fallback.
- Local frontend development still works with the existing backend default on `127.0.0.1:8000`.
- Backend CORS is controlled through `ALLOWED_ORIGINS`.
- In production, missing `ALLOWED_ORIGINS` now resolves to no allowed origins instead of a localhost-only fallback.
- Static assets in `frontend/public/` remain deploy-safe through the Vite build.
- Deep links and refreshes are covered for Vercel and Netlify SPA hosting.

## Verification

Frontend production build:

```bash
cd frontend
npm run build
```

Backend syntax/import sanity check:

```bash
cd backend
python3 -m compileall app
```

## Favicon Assets

Source artwork:

```text
frontend/public/branding/app-icon-source.png
```

Regenerate the favicon set:

```bash
cd frontend
npm run generate:favicons
```
