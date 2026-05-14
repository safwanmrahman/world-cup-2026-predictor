from __future__ import annotations

from typing import Any

from .data_service import get_group_fixtures, get_groups_raw, get_team_lookup, get_teams_payload
from .match_service import simulate_match

ROUND_OF_32_TEMPLATE = [
    {"match_id": 73, "round": "Round of 32", "home": "A2", "away": "B2"},
    {"match_id": 74, "round": "Round of 32", "home": "E1", "away": "TP_A_B_C_D_F"},
    {"match_id": 75, "round": "Round of 32", "home": "F1", "away": "C2"},
    {"match_id": 76, "round": "Round of 32", "home": "C1", "away": "F2"},
    {"match_id": 77, "round": "Round of 32", "home": "I1", "away": "TP_C_D_F_G_H"},
    {"match_id": 78, "round": "Round of 32", "home": "E2", "away": "I2"},
    {"match_id": 79, "round": "Round of 32", "home": "A1", "away": "TP_C_E_F_H_I"},
    {"match_id": 80, "round": "Round of 32", "home": "L1", "away": "TP_E_H_I_J_K"},
    {"match_id": 81, "round": "Round of 32", "home": "D1", "away": "TP_B_E_F_I_J"},
    {"match_id": 82, "round": "Round of 32", "home": "G1", "away": "TP_A_E_H_I_J"},
    {"match_id": 83, "round": "Round of 32", "home": "K2", "away": "L2"},
    {"match_id": 84, "round": "Round of 32", "home": "H1", "away": "J2"},
    {"match_id": 85, "round": "Round of 32", "home": "B1", "away": "TP_E_F_G_I_J"},
    {"match_id": 86, "round": "Round of 32", "home": "J1", "away": "H2"},
    {"match_id": 87, "round": "Round of 32", "home": "K1", "away": "TP_D_E_I_J_L"},
    {"match_id": 88, "round": "Round of 32", "home": "D2", "away": "G2"},
]

THIRD_PLACE_ELIGIBILITY = {
    "TP_A_B_C_D_F": {"A", "B", "C", "D", "F"},
    "TP_C_D_F_G_H": {"C", "D", "F", "G", "H"},
    "TP_C_E_F_H_I": {"C", "E", "F", "H", "I"},
    "TP_E_H_I_J_K": {"E", "H", "I", "J", "K"},
    "TP_B_E_F_I_J": {"B", "E", "F", "I", "J"},
    "TP_A_E_H_I_J": {"A", "E", "H", "I", "J"},
    "TP_E_F_G_I_J": {"E", "F", "G", "I", "J"},
    "TP_D_E_I_J_L": {"D", "E", "I", "J", "L"},
}

KNOCKOUT_ROUND_LINKS = {
    "Round of 16": [(89, 74, 77), (90, 73, 75), (91, 76, 78), (92, 79, 80), (93, 83, 84), (94, 81, 82), (95, 86, 88), (96, 85, 87)],
    "Quarterfinals": [(97, 89, 90), (98, 93, 94), (99, 91, 92), (100, 95, 96)],
    "Semifinals": [(101, 97, 98), (102, 99, 100)],
    "Final": [(104, 101, 102)],
}

GROUP_LETTERS = "ABCDEFGHIJKL"


def _standings_sort_key(row: dict[str, Any]) -> tuple[int, int, int, int]:
    return (
        row["points"],
        row["goal_difference"],
        row["goals_for"],
        row["elo_rating"],
    )


def _create_goal_totals() -> dict[str, int]:
    return {team["code"]: 0 for team in get_teams_payload()}


def _blank_standings(group: dict[str, Any]) -> dict[str, dict[str, Any]]:
    team_lookup = get_team_lookup()
    standings = {}

    for code in group["teams"]:
        team = team_lookup[code]
        standings[code] = {
            "team_code": code,
            "team_name": team["name"],
            "flag": team["flag"],
            "confederation": team["confederation"],
            "points": 0,
            "played": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "goals_for": 0,
            "goals_against": 0,
            "goal_difference": 0,
            "elo_rating": team["elo_rating"],
        }

    return standings


def _update_group_table(standings: dict[str, dict[str, Any]], match_result: dict[str, Any]) -> None:
    home = standings[match_result["home_team"]]
    away = standings[match_result["away_team"]]

    home["played"] += 1
    away["played"] += 1
    home["goals_for"] += match_result["home_goals"]
    home["goals_against"] += match_result["away_goals"]
    away["goals_for"] += match_result["away_goals"]
    away["goals_against"] += match_result["home_goals"]
    home["goal_difference"] = home["goals_for"] - home["goals_against"]
    away["goal_difference"] = away["goals_for"] - away["goals_against"]

    if match_result["home_goals"] > match_result["away_goals"]:
        home["wins"] += 1
        away["losses"] += 1
        home["points"] += 3
    elif match_result["away_goals"] > match_result["home_goals"]:
        away["wins"] += 1
        home["losses"] += 1
        away["points"] += 3
    else:
        home["draws"] += 1
        away["draws"] += 1
        home["points"] += 1
        away["points"] += 1


def _simulate_group_stage() -> tuple[
    list[dict[str, Any]],
    list[dict[str, Any]],
    dict[str, dict[str, Any]],
    int,
    dict[str, int],
]:
    groups_raw = get_groups_raw()
    group_fixtures = get_group_fixtures()
    team_lookup = get_team_lookup()
    group_results = []
    third_place_rows = []
    placements: dict[str, dict[str, Any]] = {}
    total_group_goals = 0
    goal_totals = _create_goal_totals()

    for group_index, group in enumerate(groups_raw):
        group_letter = GROUP_LETTERS[group_index]
        standings = _blank_standings(group)
        played_matches = []

        for fixture in group_fixtures[group["name"]]:
            result = simulate_match(
                team_lookup[fixture["home_team"]],
                team_lookup[fixture["away_team"]],
                stage="group",
            )
            total_group_goals += result["home_goals"] + result["away_goals"]
            goal_totals[result["home_team"]] += result["home_goals"]
            goal_totals[result["away_team"]] += result["away_goals"]
            played_matches.append(result)
            _update_group_table(standings, result)

        table = sorted(standings.values(), key=_standings_sort_key, reverse=True)
        for placement, row in enumerate(table, start=1):
            placements[f"{group_letter}{placement}"] = row

        third_place_row = dict(table[2])
        third_place_row["group_letter"] = group_letter
        third_place_rows.append(third_place_row)
        group_results.append(
            {
                "name": group["name"],
                "letter": group_letter,
                "table": table,
                "matches": played_matches,
            }
        )

    best_third_places = sorted(third_place_rows, key=_standings_sort_key, reverse=True)[:8]
    return group_results, best_third_places, placements, total_group_goals, goal_totals


def _resolve_third_place_slots(best_third_places: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    remaining = sorted(best_third_places, key=_standings_sort_key, reverse=True)
    slot_assignments: dict[str, dict[str, Any]] = {}

    for slot_key, allowed_groups in THIRD_PLACE_ELIGIBILITY.items():
        for index, team in enumerate(remaining):
            if team["group_letter"] in allowed_groups:
                slot_assignments[slot_key] = remaining.pop(index)
                break
        else:
            slot_assignments[slot_key] = remaining.pop(0)

    return slot_assignments


def _build_round_of_32(
    placements: dict[str, dict[str, Any]],
    best_third_places: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    slot_assignments = _resolve_third_place_slots(best_third_places)
    matches = []

    for template in ROUND_OF_32_TEMPLATE:
        home_row = placements.get(template["home"]) or slot_assignments[template["home"]]
        away_row = placements.get(template["away"]) or slot_assignments[template["away"]]
        matches.append(
            {
                "match_id": template["match_id"],
                "round": template["round"],
                "home_team": home_row["team_code"],
                "away_team": away_row["team_code"],
            }
        )

    return matches


def _play_round(matches: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[int, dict[str, Any]], int, dict[str, int]]:
    team_lookup = get_team_lookup()
    completed_matches = []
    winners_by_match_id = {}
    goals_in_round = 0
    goal_totals = _create_goal_totals()

    for match in matches:
        result = simulate_match(
            team_lookup[match["home_team"]],
            team_lookup[match["away_team"]],
            stage="knockout",
        )
        goals_in_round += result["home_goals"] + result["away_goals"]
        goal_totals[result["home_team"]] += result["home_goals"]
        goal_totals[result["away_team"]] += result["away_goals"]
        completed_match = {
            **match,
            "home_goals": result["home_goals"],
            "away_goals": result["away_goals"],
            "winner": result["winner"],
            "decision": result["decision"],
            "penalties": result["penalties"],
        }
        completed_matches.append(completed_match)
        winners_by_match_id[match["match_id"]] = completed_match

    return completed_matches, winners_by_match_id, goals_in_round, goal_totals


def _merge_goal_totals(*totals: dict[str, int]) -> dict[str, int]:
    merged = _create_goal_totals()
    for total_set in totals:
        for code, goals in total_set.items():
            merged[code] += goals
    return merged


def _build_follow_up_round(
    round_name: str,
    previous_round_winners: dict[int, dict[str, Any]],
) -> list[dict[str, Any]]:
    matches = []

    for match_id, home_source, away_source in KNOCKOUT_ROUND_LINKS[round_name]:
        matches.append(
            {
                "match_id": match_id,
                "round": round_name,
                "home_team": previous_round_winners[home_source]["winner"],
                "away_team": previous_round_winners[away_source]["winner"],
            }
        )

    return matches


def simulate_tournament_once() -> dict[str, Any]:
    group_results, best_third_places, placements, group_goals, group_goal_totals = _simulate_group_stage()
    round_of_32_matches = _build_round_of_32(placements, best_third_places)

    round_of_32_results, r32_winners, r32_goals, r32_goal_totals = _play_round(round_of_32_matches)
    round_of_16_matches = _build_follow_up_round("Round of 16", r32_winners)
    round_of_16_results, r16_winners, r16_goals, r16_goal_totals = _play_round(round_of_16_matches)
    quarterfinal_matches = _build_follow_up_round("Quarterfinals", r16_winners)
    quarterfinal_results, quarterfinal_winners, quarterfinal_goals, quarterfinal_goal_totals = _play_round(quarterfinal_matches)
    semifinal_matches = _build_follow_up_round("Semifinals", quarterfinal_winners)
    semifinal_results, semifinal_winners, semifinal_goals, semifinal_goal_totals = _play_round(semifinal_matches)
    semifinal_losers = [
        match["away_team"] if match["winner"] == match["home_team"] else match["home_team"]
        for match in semifinal_results
    ]
    third_place_results, _, third_place_goals, third_place_goal_totals = _play_round(
        [
            {
                "match_id": 103,
                "round": "Third Place",
                "home_team": semifinal_losers[0],
                "away_team": semifinal_losers[1],
            }
        ]
    )
    final_matches = _build_follow_up_round("Final", semifinal_winners)
    final_results, _, final_goals, final_goal_totals = _play_round(final_matches)

    team_goal_totals = _merge_goal_totals(
        group_goal_totals,
        r32_goal_totals,
        r16_goal_totals,
        quarterfinal_goal_totals,
        semifinal_goal_totals,
        third_place_goal_totals,
        final_goal_totals,
    )

    final_match = final_results[0]
    third_place_match = third_place_results[0]
    champion = final_match["winner"]
    runner_up = (
        final_match["away_team"]
        if champion == final_match["home_team"]
        else final_match["home_team"]
    )

    qualified_codes = {
        row["team_code"]
        for group in group_results
        for row in group["table"][:2]
    }
    qualified_codes.update(team["team_code"] for team in best_third_places)

    return {
        "group_results": group_results,
        "best_third_places": best_third_places,
        "bracket": {
            "round_of_32": round_of_32_results,
            "round_of_16": round_of_16_results,
            "quarterfinals": quarterfinal_results,
            "semifinals": semifinal_results,
            "third_place": third_place_results,
            "final": final_results,
        },
        "qualified_for_round_of_32": sorted(qualified_codes),
        "round_of_16_teams": sorted(match["winner"] for match in round_of_32_results),
        "quarterfinalists": sorted(match["winner"] for match in round_of_16_results),
        "semifinalists": sorted(match["winner"] for match in quarterfinal_results),
        "finalists": sorted(match["winner"] for match in semifinal_results),
        "champion": champion,
        "runner_up": runner_up,
        "third_place": third_place_match["winner"],
        "third_place_match": third_place_match,
        "team_goal_totals": team_goal_totals,
        "total_goals": (
            group_goals
            + r32_goals
            + r16_goals
            + quarterfinal_goals
            + semifinal_goals
            + third_place_goals
            + final_goals
        ),
        "total_matches": 104,
    }


def simulate_tournament(simulations: int) -> dict[str, Any]:
    teams = get_teams_payload()
    counters = {
        team["code"]: {
            "round_of_32": 0,
            "round_of_16": 0,
            "quarterfinal": 0,
            "semifinal": 0,
            "final": 0,
            "champion": 0,
            "goals_scored": 0,
            "goals_against": 0,
        }
        for team in teams
    }
    sampled_tournament = None
    total_goals = 0

    for index in range(simulations):
        tournament = simulate_tournament_once()
        total_goals += tournament["total_goals"]
        sampled_tournament = tournament if index == simulations - 1 else sampled_tournament

        for code, goals in tournament["team_goal_totals"].items():
            counters[code]["goals_scored"] += goals

        tournament_matches = [
            *[match for group in tournament["group_results"] for match in group["matches"]],
            *(tournament["bracket"]["round_of_32"] or []),
            *(tournament["bracket"]["round_of_16"] or []),
            *(tournament["bracket"]["quarterfinals"] or []),
            *(tournament["bracket"]["semifinals"] or []),
            *(tournament["bracket"]["final"] or []),
            *([tournament["third_place_match"]] if tournament.get("third_place_match") else []),
        ]
        for match in tournament_matches:
            counters[match["home_team"]]["goals_against"] += match["away_goals"]
            counters[match["away_team"]]["goals_against"] += match["home_goals"]

        qualified_codes = {
            row["team_code"]
            for group in tournament["group_results"]
            for row in group["table"][:2]
        }
        qualified_codes.update(team["team_code"] for team in tournament["best_third_places"])

        for code in qualified_codes:
            counters[code]["round_of_32"] += 1
        for code in tournament["round_of_16_teams"]:
            counters[code]["round_of_16"] += 1
        for code in tournament["quarterfinalists"]:
            counters[code]["quarterfinal"] += 1
        for code in tournament["semifinalists"]:
            counters[code]["semifinal"] += 1
        for code in tournament["finalists"]:
            counters[code]["final"] += 1

        counters[tournament["champion"]]["champion"] += 1

    probabilities = []
    for team in teams:
        count = counters[team["code"]]
        probabilities.append(
            {
                "team": team,
                "round_of_32": count["round_of_32"] / simulations,
                "round_of_16": count["round_of_16"] / simulations,
                "quarterfinal": count["quarterfinal"] / simulations,
                "semifinal": count["semifinal"] / simulations,
                "final": count["final"] / simulations,
                "champion": count["champion"] / simulations,
                "champion_wins": count["champion"],
                "average_goals_scored": count["goals_scored"] / simulations,
                "average_goals_against": count["goals_against"] / simulations,
            }
        )

    probabilities.sort(
        key=lambda entry: (
            entry["champion"],
            entry["average_goals_scored"],
            entry["final"],
            entry["semifinal"],
            entry["quarterfinal"],
            entry["round_of_16"],
            entry["round_of_32"],
            -entry["team"]["fifa_ranking"],
        ),
        reverse=True,
    )
    most_likely_winner = probabilities[0]

    return {
        "simulations": simulations,
        "summary": {
            "most_likely_winner": most_likely_winner["team"],
            "average_goals_per_match": total_goals / (simulations * 104),
            "average_goals_for_most_likely_winner": most_likely_winner["average_goals_scored"],
        },
        "probabilities": probabilities,
        "sample_tournament": sampled_tournament,
    }
