from typing import Literal

from pydantic import BaseModel, Field

from ..utils.security import PUBLIC_SIMULATION_MAX


class MatchPredictionRequest(BaseModel):
    home_team_code: str = Field(..., min_length=3, max_length=3)
    away_team_code: str = Field(..., min_length=3, max_length=3)
    stage: Literal["group", "knockout"] = "group"


class TournamentSimulationRequest(BaseModel):
    simulations: int = Field(default=1000, ge=1, le=PUBLIC_SIMULATION_MAX)
