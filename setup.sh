#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "Setting up backend virtual environment..."
rm -rf "$BACKEND_DIR/.venv"
python3 -m venv "$BACKEND_DIR/.venv"
"$BACKEND_DIR/.venv/bin/pip" install --upgrade pip
"$BACKEND_DIR/.venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"

echo "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install

echo
echo "Setup complete."
echo "Run the app with:"
echo "  ./run.sh"
