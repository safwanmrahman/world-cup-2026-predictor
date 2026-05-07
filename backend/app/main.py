from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.tournament import router as tournament_router

app = FastAPI(title="World Cup 2026 Simulator API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tournament_router)
