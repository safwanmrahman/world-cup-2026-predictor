import { formatMatchScore } from "./formattingUtils";
import {
  getKnockoutLoserCode,
  getKnockoutWinnerCode,
  getUpsetClassification,
} from "./knockoutUtils";

const RECAP_BIG_TEAM_CODES = new Set([
  "ARG",
  "BEL",
  "BRA",
  "ENG",
  "ESP",
  "FRA",
  "GER",
  "NED",
  "POR",
]);

const RECAP_UPSET_ROUND_PRIORITY = {
  "Round of 32": 1,
  "Round of 16": 2,
  Quarterfinals: 3,
  Semifinals: 4,
  Final: 5,
};

function buildUpsetCandidate(match, getTeam) {
  const winnerCode = getKnockoutWinnerCode(match);
  const loserCode = getKnockoutLoserCode(match);
  const winner = getTeam(winnerCode);
  const loser = getTeam(loserCode);
  if (!winner || !loser) {
    return null;
  }

  const upset = getUpsetClassification(winner, loser);
  if (upset.type === "none") {
    return null;
  }

  return {
    match,
    winner,
    loser,
    rankingSwing: upset.gap,
    upsetType: upset.type,
    upsetLabel: upset.label,
  };
}

function compareFallbackUpsetCandidates(left, right) {
  return (
    (left.winner.fifa_ranking ?? -Infinity) - (right.winner.fifa_ranking ?? -Infinity)
    || (right.loser.fifa_ranking ?? Infinity) - (left.loser.fifa_ranking ?? Infinity)
    || left.winner.name.localeCompare(right.winner.name)
  );
}

function compareGenericUpsetCandidates(left, right) {
  return (
    Number(left.upsetType === "major") - Number(right.upsetType === "major")
    || left.rankingSwing - right.rankingSwing
    || Number(RECAP_BIG_TEAM_CODES.has(left.loser.code)) - Number(RECAP_BIG_TEAM_CODES.has(right.loser.code))
    || (RECAP_UPSET_ROUND_PRIORITY[left.match.round] ?? 0) - (RECAP_UPSET_ROUND_PRIORITY[right.match.round] ?? 0)
    || compareFallbackUpsetCandidates(left, right)
  );
}

function isMajorBigTeamUpset(candidate) {
  return candidate?.upsetType === "major" && RECAP_BIG_TEAM_CODES.has(candidate.loser.code);
}

function compareMajorBigTeamUpsetCandidates(left, right) {
  return (
    left.rankingSwing - right.rankingSwing
    || (left.winner.fifa_ranking ?? -Infinity) - (right.winner.fifa_ranking ?? -Infinity)
    || (right.loser.fifa_ranking ?? Infinity) - (left.loser.fifa_ranking ?? Infinity)
    || (RECAP_UPSET_ROUND_PRIORITY[left.match.round] ?? 0) - (RECAP_UPSET_ROUND_PRIORITY[right.match.round] ?? 0)
    || compareFallbackUpsetCandidates(left, right)
  );
}

function selectBestCandidate(candidates, comparator) {
  return candidates.reduce((best, candidate) => {
    if (!best) {
      return candidate;
    }

    return comparator(candidate, best) > 0 ? candidate : best;
  }, null);
}

function formatChampionPathScore(match, championCode) {
  if (
    !match
    || !championCode
    || match.home_goals == null
    || match.away_goals == null
  ) {
    return formatMatchScore(match);
  }

  if (match.home_team === championCode) {
    return `${match.home_goals} - ${match.away_goals}`;
  }

  if (match.away_team === championCode) {
    return `${match.away_goals} - ${match.home_goals}`;
  }

  return formatMatchScore(match);
}

export function deriveDisplayedTournamentGoalData(tournament, thirdPlaceMatch, teams, getTeam) {
  if (!tournament) {
    return null;
  }

  const totals = Object.fromEntries(teams.map((team) => [team.code, 0]));
  const allMatches = [
    ...(tournament.group_results ?? tournament.groupResults ?? []).flatMap((group) => group.matches ?? []),
    ...(tournament.bracket?.round_of_32 ?? []),
    ...(tournament.bracket?.round_of_16 ?? []),
    ...(tournament.bracket?.quarterfinals ?? []),
    ...(tournament.bracket?.semifinals ?? []),
    ...(tournament.bracket?.final ?? []),
    ...(thirdPlaceMatch ? [thirdPlaceMatch] : []),
  ];

  let totalGoals = 0;
  for (const match of allMatches) {
    if (match?.home_team && match?.home_goals != null) {
      totals[match.home_team] = (totals[match.home_team] ?? 0) + match.home_goals;
      totalGoals += match.home_goals;
    }
    if (match?.away_team && match?.away_goals != null) {
      totals[match.away_team] = (totals[match.away_team] ?? 0) + match.away_goals;
      totalGoals += match.away_goals;
    }
  }

  const topGoals = Math.max(...Object.values(totals));
  const topTeams = Object.entries(totals)
    .filter(([, goals]) => goals === topGoals)
    .map(([code]) => getTeam(code))
    .filter(Boolean);

  return {
    totals,
    totalGoals,
    totalMatches: allMatches.length,
    topGoals,
    topTeams,
  };
}

export function collectTournamentMatches(tournament, thirdPlaceMatch) {
  if (!tournament) {
    return [];
  }

  return [
    ...(tournament.group_results ?? tournament.groupResults ?? []).flatMap((group) => group.matches ?? []),
    ...(tournament.bracket?.round_of_32 ?? []),
    ...(tournament.bracket?.round_of_16 ?? []),
    ...(tournament.bracket?.quarterfinals ?? []),
    ...(tournament.bracket?.semifinals ?? []),
    ...(tournament.bracket?.final ?? []),
    ...(thirdPlaceMatch ? [thirdPlaceMatch] : []),
  ];
}

export function isCompleteMatch(match) {
  return match?.home_team && match?.away_team && match.home_goals != null && match.away_goals != null;
}

function getRoundOf16QualifiedTeamCodes(tournament) {
  const qualifiedFromResults = tournament.round_of_16_teams ?? tournament.roundOf16Teams ?? null;
  if (qualifiedFromResults?.length) {
    return qualifiedFromResults;
  }

  const roundOf16Matches = tournament.bracket?.round_of_16 ?? [];
  return roundOf16Matches
    .flatMap((match) => [match.home_team, match.away_team])
    .filter(Boolean);
}

export function deriveTournamentRecapData(tournament, thirdPlaceMatch, teams, getTeam) {
  if (!tournament) {
    return null;
  }

  const allMatches = collectTournamentMatches(tournament, thirdPlaceMatch);
  const completedMatches = allMatches.filter(isCompleteMatch);
  const goalsFor = Object.fromEntries(teams.map((team) => [team.code, 0]));
  const goalsAgainst = Object.fromEntries(teams.map((team) => [team.code, 0]));

  completedMatches.forEach((match) => {
    goalsFor[match.home_team] = (goalsFor[match.home_team] ?? 0) + match.home_goals;
    goalsFor[match.away_team] = (goalsFor[match.away_team] ?? 0) + match.away_goals;
    goalsAgainst[match.home_team] = (goalsAgainst[match.home_team] ?? 0) + match.away_goals;
    goalsAgainst[match.away_team] = (goalsAgainst[match.away_team] ?? 0) + match.home_goals;
  });

  const topGoals = Math.max(0, ...Object.values(goalsFor));
  const topScorers = Object.entries(goalsFor)
    .filter(([, goals]) => goals === topGoals && goals > 0)
    .map(([code]) => getTeam(code))
    .filter(Boolean);
  const roundOf16QualifiedCodes = Array.from(new Set(getRoundOf16QualifiedTeamCodes(tournament)));
  const semifinalistCodes = tournament.semifinalists
    ?? tournament.bracket?.semifinals?.flatMap((match) => [match.home_team, match.away_team]).filter(Boolean)
    ?? [];
  const bestDefensePool = roundOf16QualifiedCodes;
  const eligibleGoalsAgainst = bestDefensePool
    .map((code) => goalsAgainst[code])
    .filter((value) => Number.isFinite(value));
  const minConceded = eligibleGoalsAgainst.length ? Math.min(...eligibleGoalsAgainst) : null;
  const bestDefenseTeams = minConceded == null
    ? []
    : bestDefensePool
      .filter((code) => goalsAgainst[code] === minConceded)
      .map((code) => getTeam(code))
      .filter(Boolean);
  const completedKnockoutMatches = [
    ...(tournament.bracket?.round_of_32 ?? []),
    ...(tournament.bracket?.round_of_16 ?? []),
    ...(tournament.bracket?.quarterfinals ?? []),
    ...(tournament.bracket?.semifinals ?? []),
    ...(tournament.bracket?.final ?? []),
    ...(thirdPlaceMatch ? [thirdPlaceMatch] : []),
  ].filter((match) => isCompleteMatch(match) && getKnockoutWinnerCode(match));
  const upsetCandidates = completedKnockoutMatches
    .map((match) => buildUpsetCandidate(match, getTeam))
    .filter(Boolean);
  const majorBigTeamUpsetCandidates = upsetCandidates.filter(isMajorBigTeamUpset);
  const biggestUpset = majorBigTeamUpsetCandidates.length
    ? selectBestCandidate(majorBigTeamUpsetCandidates, compareMajorBigTeamUpsetCandidates)
    : selectBestCandidate(upsetCandidates, compareGenericUpsetCandidates);

  const finalMatch = tournament.bracket?.final?.[0] ?? null;
  const championCode = getKnockoutWinnerCode(finalMatch) ?? tournament.champion ?? null;
  const champion = championCode ? getTeam(championCode) : null;
  const runnerUpCode = getKnockoutLoserCode(finalMatch) ?? tournament.runner_up ?? tournament.runnerUp ?? null;
  const runnerUp = runnerUpCode ? getTeam(runnerUpCode) : null;
  const thirdPlaceCode = getKnockoutWinnerCode(thirdPlaceMatch) ?? tournament.third_place ?? tournament.thirdPlace ?? null;
  const thirdPlace = thirdPlaceCode ? getTeam(thirdPlaceCode) : null;
  const semifinalists = semifinalistCodes.map((code) => getTeam(code)).filter(Boolean);
  const averageGoals = completedMatches.length
    ? (completedMatches.reduce((sum, match) => sum + match.home_goals + match.away_goals, 0) / completedMatches.length)
    : null;
  const championGoals = champion ? goalsFor[champion.code] ?? 0 : null;
  const championGoalsAgainst = champion ? goalsAgainst[champion.code] ?? 0 : null;
  const semifinalResults = (tournament.bracket?.semifinals ?? []).map((match) => ({
    ...match,
    homeTeam: getTeam(match.home_team),
    awayTeam: getTeam(match.away_team),
  }));
  const championPath = champion
    ? [
        ...(tournament.bracket?.round_of_32 ?? []),
        ...(tournament.bracket?.round_of_16 ?? []),
        ...(tournament.bracket?.quarterfinals ?? []),
        ...(tournament.bracket?.semifinals ?? []),
        ...(tournament.bracket?.final ?? []),
      ]
        .filter((match) => getKnockoutWinnerCode(match) === champion.code)
        .map((match) => {
          const opponentCode = match.home_team === champion.code ? match.away_team : match.home_team;
          return {
            round: match.round,
            opponent: getTeam(opponentCode),
            score: formatChampionPathScore(match, champion.code),
            decision: match.decision,
            penalties: match.penalties ?? null,
          };
        })
    : [];

  return {
    champion,
    runnerUp,
    thirdPlace,
    semifinalists,
    averageGoals,
    completedMatches: completedMatches.length,
    topScorers,
    topGoals,
    bestDefenseTeams,
    minConceded,
    biggestUpset,
    championGoals,
    championGoalsAgainst,
    semifinalResults,
    totalGoals: completedMatches.reduce((sum, match) => sum + match.home_goals + match.away_goals, 0),
    championPath,
  };
}
