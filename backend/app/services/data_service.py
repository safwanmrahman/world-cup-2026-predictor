from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data"
HOST_CODES = {"USA", "CAN", "MEX"}

FLAG_BY_CODE = {
    "ALG": "🇩🇿",
    "ARG": "🇦🇷",
    "AUS": "🇦🇺",
    "AUT": "🇦🇹",
    "BEL": "🇧🇪",
    "BIH": "🇧🇦",
    "BRA": "🇧🇷",
    "CAN": "🇨🇦",
    "CIV": "🇨🇮",
    "COD": "🇨🇩",
    "COL": "🇨🇴",
    "CPV": "🇨🇻",
    "CRO": "🇭🇷",
    "CUW": "🇨🇼",
    "CZE": "🇨🇿",
    "ECU": "🇪🇨",
    "EGY": "🇪🇬",
    "ENG": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "ESP": "🇪🇸",
    "FRA": "🇫🇷",
    "GER": "🇩🇪",
    "GHA": "🇬🇭",
    "HAI": "🇭🇹",
    "IRN": "🇮🇷",
    "IRQ": "🇮🇶",
    "JOR": "🇯🇴",
    "JPN": "🇯🇵",
    "KOR": "🇰🇷",
    "KSA": "🇸🇦",
    "MAR": "🇲🇦",
    "MEX": "🇲🇽",
    "NED": "🇳🇱",
    "NOR": "🇳🇴",
    "NZL": "🇳🇿",
    "PAN": "🇵🇦",
    "PAR": "🇵🇾",
    "POR": "🇵🇹",
    "QAT": "🇶🇦",
    "RSA": "🇿🇦",
    "SCO": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "SEN": "🇸🇳",
    "SUI": "🇨🇭",
    "SWE": "🇸🇪",
    "TUN": "🇹🇳",
    "TUR": "🇹🇷",
    "URU": "🇺🇾",
    "USA": "🇺🇸",
    "UZB": "🇺🇿",
}


def _load_json(filename: str) -> Any:
    with (DATA_DIR / filename).open("r", encoding="utf-8") as file:
        return json.load(file)


@lru_cache
def get_teams_payload() -> list[dict[str, Any]]:
    teams: list[dict[str, Any]] = _load_json("teams.json")
    enriched_teams = []

    for team in teams:
        enriched_team = dict(team)
        enriched_team["host_nation"] = team["code"] in HOST_CODES
        enriched_team["flag"] = FLAG_BY_CODE.get(team["code"], "🏳️")
        enriched_teams.append(enriched_team)

    return enriched_teams


@lru_cache
def get_team_lookup() -> dict[str, dict[str, Any]]:
    return {team["code"]: team for team in get_teams_payload()}


@lru_cache
def get_group_payload() -> list[dict[str, Any]]:
    groups_data = _load_json("groups.json")["groups"]
    team_lookup = get_team_lookup()

    return [
        {
            "name": group["name"],
            "teams": [team_lookup[code] for code in group["teams"]],
        }
        for group in groups_data
    ]


@lru_cache
def get_groups_raw() -> list[dict[str, Any]]:
    return _load_json("groups.json")["groups"]


@lru_cache
def get_group_fixtures() -> dict[str, list[dict[str, Any]]]:
    fixtures = _load_json("fixtures.json")["group_stage"]
    grouped: dict[str, list[dict[str, Any]]] = {}

    for fixture in fixtures:
        grouped.setdefault(fixture["group"], []).append(fixture)

    return grouped


@lru_cache
def get_group_fixtures_flat() -> list[dict[str, Any]]:
    return _load_json("fixtures.json")["group_stage"]


def get_team_by_code(code: str) -> dict[str, Any] | None:
    return get_team_lookup().get(code.upper())
