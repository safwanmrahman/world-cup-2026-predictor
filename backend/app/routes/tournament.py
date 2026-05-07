from fastapi import APIRouter, HTTPException

from ..models.schemas import MatchPredictionRequest, TournamentSimulationRequest
from ..services.data_service import get_group_payload, get_team_by_code, get_teams_payload
from ..services.match_service import predict_match
from ..services.tournament_service import simulate_tournament, simulate_tournament_once

router = APIRouter()


@router.get("/teams")
def get_teams() -> dict:
    return {"teams": get_teams_payload()}


@router.get("/groups")
def get_groups() -> dict:
    return {"groups": get_group_payload()}


@router.post("/predict-match")
def predict_match_route(payload: MatchPredictionRequest) -> dict:
    if payload.home_team_code.upper() == payload.away_team_code.upper():
        raise HTTPException(status_code=400, detail="Teams must be different.")

    home_team = get_team_by_code(payload.home_team_code)
    away_team = get_team_by_code(payload.away_team_code)

    if home_team is None or away_team is None:
        missing_code = payload.home_team_code if home_team is None else payload.away_team_code
        raise HTTPException(status_code=404, detail=f"Team '{missing_code}' was not found.")

    return predict_match(home_team, away_team, payload.stage)


@router.post("/simulate-one")
def simulate_one_route() -> dict:
    return simulate_tournament_once()


@router.post("/simulate-tournament")
def simulate_tournament_route(payload: TournamentSimulationRequest) -> dict:
    return simulate_tournament(payload.simulations)
