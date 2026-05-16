from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def _load_local_env() -> None:
    project_root = Path(__file__).resolve().parents[2]
    candidate_paths = [project_root / "backend" / ".env", project_root / ".env"]

    for env_path in candidate_paths:
        if not env_path.exists():
            continue

        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            cleaned_value = value.strip().strip("\"'")
            os.environ.setdefault(key.strip(), cleaned_value)


def _parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_origins(value: str | None, *, app_env: str) -> list[str]:
    if not value:
        if app_env == "production":
            return []
        return ["http://localhost:5173", "http://127.0.0.1:5173"]
    if value.strip() == "*":
        return ["*"]
    return [origin.strip() for origin in value.split(",") if origin.strip()]


_load_local_env()
app_env = os.getenv("APP_ENV", "development").strip().lower()
enable_docs = _parse_bool(os.getenv("ENABLE_API_DOCS"), app_env != "production")

from .routes.tournament import router as tournament_router

app = FastAPI(
    title="World Cup 2026 Simulator API",
    version="0.2.0",
    docs_url="/docs" if enable_docs else None,
    redoc_url="/redoc" if enable_docs else None,
    openapi_url="/openapi.json" if enable_docs else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_origins(os.getenv("ALLOWED_ORIGINS"), app_env=app_env),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tournament_router)
