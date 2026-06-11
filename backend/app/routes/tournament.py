from fastapi import APIRouter, Depends, HTTPException, Request

from ..models.schemas import MatchPredictionRequest, TournamentSimulationRequest
from ..services.data_service import get_group_fixtures_flat, get_group_payload, get_team_by_code, get_teams_payload
from ..services.match_service import predict_match
from ..services.tournament_service import simulate_tournament, simulate_tournament_once
from ..utils.security import (
    PUBLIC_SIMULATION_MAX,
    PREDICT_MATCH_RULE,
    SIMULATE_ONE_RULE,
    enforce_weighted_batch_budget,
    throttle,
)

router = APIRouter()


@router.get("/teams")
def get_teams() -> dict:
    return {"teams": get_teams_payload()}


@router.get("/groups")
def get_groups() -> dict:
    return {"groups": get_group_payload()}


@router.get("/fixtures")
def get_fixtures() -> dict:
    return {"group_stage": get_group_fixtures_flat()}


@router.post("/predict-match")
def predict_match_route(
    payload: MatchPredictionRequest,
    _rate_limit: None = Depends(throttle("predict-match", PREDICT_MATCH_RULE)),
) -> dict:
    if payload.home_team_code.upper() == payload.away_team_code.upper():
        raise HTTPException(status_code=400, detail="Teams must be different.")

    home_team = get_team_by_code(payload.home_team_code)
    away_team = get_team_by_code(payload.away_team_code)

    if home_team is None or away_team is None:
        missing_code = payload.home_team_code if home_team is None else payload.away_team_code
        raise HTTPException(status_code=404, detail=f"Team '{missing_code}' was not found.")

    return predict_match(home_team, away_team, payload.stage)


@router.post("/simulate-one")
def simulate_one_route(
    _rate_limit: None = Depends(throttle("simulate-one", SIMULATE_ONE_RULE)),
) -> dict:
    return simulate_tournament_once()


@router.post("/simulate-tournament")
def simulate_tournament_route(
    request: Request,
    payload: TournamentSimulationRequest,
) -> dict:
    if payload.simulations > PUBLIC_SIMULATION_MAX:
        raise HTTPException(
            status_code=400,
            detail=f"Simulation count exceeds the public limit of {PUBLIC_SIMULATION_MAX}.",
        )
    enforce_weighted_batch_budget(request, payload.simulations)
    return simulate_tournament(payload.simulations)
