from typing import Literal

from pydantic import BaseModel, Field


class MatchPredictionRequest(BaseModel):
    home_team_code: str = Field(..., min_length=3, max_length=3)
    away_team_code: str = Field(..., min_length=3, max_length=3)
    stage: Literal["group", "knockout"] = "group"


class TournamentSimulationRequest(BaseModel):
    simulations: int = Field(default=1000, ge=1, le=5000)
