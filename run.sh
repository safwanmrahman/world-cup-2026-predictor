#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [ ! -x "$BACKEND_DIR/.venv/bin/uvicorn" ]; then
  echo "Backend dependencies are missing."
  echo "Run ./setup.sh first."
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Frontend dependencies are missing."
  echo "Run ./setup.sh first."
  exit 1
fi

cleanup() {
  if [ -n "${BACKEND_PID:-}" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "${FRONTEND_PID:-}" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting backend on http://127.0.0.1:8000 ..."
cd "$BACKEND_DIR"
"$BACKEND_DIR/.venv/bin/uvicorn" app.main:app --reload &
BACKEND_PID=$!

echo "Starting frontend on http://127.0.0.1:5173 ..."
cd "$FRONTEND_DIR"
npm run dev -- --host 127.0.0.1 &
FRONTEND_PID=$!

echo
echo "World Cup 2026 Simulator is starting."
echo "Frontend: http://127.0.0.1:5173"
echo "Backend docs: http://127.0.0.1:8000/docs"
echo "Press Ctrl+C to stop both servers."

wait "$BACKEND_PID" "$FRONTEND_PID"
