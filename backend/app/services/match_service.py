from __future__ import annotations

import random
from typing import Any

from ..utils.math_utils import clamp, poisson_pmf, sample_poisson

HOST_ELO_BOOST = 65
MAX_GOALS_FOR_PROBABILITY = 7


def _adjusted_elo(team: dict[str, Any], opponent: dict[str, Any]) -> int:
    boost = HOST_ELO_BOOST if team["host_nation"] and not opponent["host_nation"] else 0
    return team["elo_rating"] + boost


def expected_goals(home_team: dict[str, Any], away_team: dict[str, Any]) -> tuple[float, float]:
    adjusted_home = _adjusted_elo(home_team, away_team)
    adjusted_away = _adjusted_elo(away_team, home_team)
    elo_difference = adjusted_home - adjusted_away
    shift = elo_difference / 500

    home_xg = clamp(1.24 + shift, 0.25, 3.6)
    away_xg = clamp(1.14 - shift, 0.2, 3.2)
    return home_xg, away_xg


def scoreline_probabilities(home_xg: float, away_xg: float) -> list[dict[str, float | str]]:
    scorelines = []

    for home_goals in range(MAX_GOALS_FOR_PROBABILITY + 1):
        for away_goals in range(MAX_GOALS_FOR_PROBABILITY + 1):
            probability = poisson_pmf(home_goals, home_xg) * poisson_pmf(away_goals, away_xg)
            scorelines.append(
                {
                    "score": f"{home_goals}-{away_goals}",
                    "probability": probability,
                }
            )

    scorelines.sort(key=lambda item: item["probability"], reverse=True)
    return scorelines[:5]


def knockout_advance_probabilities(
    home_win_probability: float,
    draw_probability: float,
    away_win_probability: float,
    home_xg: float,
    away_xg: float,
) -> tuple[float, float]:
    edge = clamp(0.5 + (home_xg - away_xg) * 0.18, 0.35, 0.65)
    home_advance = home_win_probability + draw_probability * edge
    away_advance = away_win_probability + draw_probability * (1 - edge)
    return home_advance, away_advance


def sample_penalty_score(winner: str, home_code: str, away_code: str) -> dict[str, int]:
    winner_score = random.choice([4, 5])
    loser_score = random.randint(2, winner_score - 1)

    if winner == home_code:
        return {"home": winner_score, "away": loser_score}
    return {"home": loser_score, "away": winner_score}


def match_probabilities(
    home_team: dict[str, Any],
    away_team: dict[str, Any],
    stage: str = "group",
) -> dict[str, Any]:
    home_xg, away_xg = expected_goals(home_team, away_team)
    home_win_probability = 0.0
    draw_probability = 0.0
    away_win_probability = 0.0

    for home_goals in range(MAX_GOALS_FOR_PROBABILITY + 1):
        home_goal_probability = poisson_pmf(home_goals, home_xg)
        for away_goals in range(MAX_GOALS_FOR_PROBABILITY + 1):
            probability = home_goal_probability * poisson_pmf(away_goals, away_xg)
            if home_goals > away_goals:
                home_win_probability += probability
            elif home_goals == away_goals:
                draw_probability += probability
            else:
                away_win_probability += probability

    residual_probability = max(
        0.0,
        1.0 - (home_win_probability + draw_probability + away_win_probability),
    )
    stronger_side = "home" if home_xg >= away_xg else "away"
    if residual_probability:
        if stronger_side == "home":
            home_win_probability += residual_probability * 0.6
            away_win_probability += residual_probability * 0.4
        else:
            away_win_probability += residual_probability * 0.6
            home_win_probability += residual_probability * 0.4

    probabilities: dict[str, Any] = {
        "home_win": home_win_probability,
        "draw": draw_probability,
        "away_win": away_win_probability,
        "expected_goals": {
            "home": home_xg,
            "away": away_xg,
        },
        "top_scorelines": scoreline_probabilities(home_xg, away_xg),
    }

    if stage == "knockout":
        home_advance, away_advance = knockout_advance_probabilities(
            home_win_probability,
            draw_probability,
            away_win_probability,
            home_xg,
            away_xg,
        )
        probabilities["home_advance"] = home_advance
        probabilities["away_advance"] = away_advance

    return probabilities


def simulate_match(
    home_team: dict[str, Any],
    away_team: dict[str, Any],
    stage: str = "group",
) -> dict[str, Any]:
    probabilities = match_probabilities(home_team, away_team, stage)
    home_xg = probabilities["expected_goals"]["home"]
    away_xg = probabilities["expected_goals"]["away"]
    home_goals = sample_poisson(home_xg)
    away_goals = sample_poisson(away_xg)
    decision = "full_time"
    penalties_winner = None
    penalties = None

    if stage == "knockout" and home_goals == away_goals:
        decision = "extra_time"
        home_goals += sample_poisson(home_xg * 0.3)
        away_goals += sample_poisson(away_xg * 0.3)

        if home_goals == away_goals:
            decision = "penalties"
            home_advance_probability = probabilities["home_advance"]
            penalties_winner = (
                home_team["code"]
                if home_advance_probability >= probabilities["away_advance"]
                else away_team["code"]
            )
            penalties = sample_penalty_score(
                penalties_winner,
                home_team["code"],
                away_team["code"],
            )

    if home_goals > away_goals:
        winner = home_team["code"]
    elif away_goals > home_goals:
        winner = away_team["code"]
    else:
        winner = penalties_winner

    return {
        "home_team": home_team["code"],
        "away_team": away_team["code"],
        "home_goals": home_goals,
        "away_goals": away_goals,
        "winner": winner,
        "decision": decision,
        "penalties": penalties,
        "probabilities": probabilities,
    }


def predict_match(home_team: dict[str, Any], away_team: dict[str, Any], stage: str) -> dict[str, Any]:
    probabilities = match_probabilities(home_team, away_team, stage)
    sampled_result = simulate_match(home_team, away_team, stage)

    return {
        "home_team": home_team,
        "away_team": away_team,
        "stage": stage,
        "probabilities": probabilities,
        "sample_score": {
            "home_goals": sampled_result["home_goals"],
            "away_goals": sampled_result["away_goals"],
            "decision": sampled_result["decision"],
            "winner": sampled_result["winner"],
            "penalties": sampled_result["penalties"],
        },
    }
