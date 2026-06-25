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
  "Group Stage": 0,
  "Round of 32": 1,
  "Round of 16": 2,
  Quarterfinals: 3,
  Semifinals: 4,
  "Third Place": 4,
  Final: 5,
};

const DARK_HORSE_STAGE_PRIORITY = {
  "Round of 16": 1,
  Quarterfinalist: 2,
  Semifinalist: 3,
  "3rd Place": 4,
  "Runner-up": 5,
  Champion: 6,
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

function buildDarkHorsePool(tournament, thirdPlaceMatch) {
  const roundOf16Codes = Array.from(new Set(getRoundOf16QualifiedTeamCodes(tournament)));
  const quarterfinalistCodes = Array.from(new Set((tournament.bracket?.quarterfinals ?? []).flatMap((match) => [match.home_team, match.away_team]).filter(Boolean)));
  const semifinalistCodes = Array.from(new Set((tournament.bracket?.semifinals ?? []).flatMap((match) => [match.home_team, match.away_team]).filter(Boolean)));
  const finalMatch = tournament.bracket?.final?.[0] ?? null;
  const finalistCodes = finalMatch ? [finalMatch.home_team, finalMatch.away_team].filter(Boolean) : [];
  const championCode = getKnockoutWinnerCode(finalMatch) ?? tournament.champion ?? null;
  const runnerUpCode = getKnockoutLoserCode(finalMatch) ?? tournament.runner_up ?? tournament.runnerUp ?? null;
  const thirdPlaceCode = getKnockoutWinnerCode(thirdPlaceMatch) ?? tournament.third_place ?? tournament.thirdPlace ?? null;

  return roundOf16Codes.map((code) => {
    let stage = "Round of 16";
    if (quarterfinalistCodes.includes(code)) {
      stage = "Quarterfinalist";
    }
    if (semifinalistCodes.includes(code)) {
      stage = "Semifinalist";
    }
    if (code === thirdPlaceCode) {
      stage = "3rd Place";
    }
    if (code === runnerUpCode) {
      stage = "Runner-up";
    }
    if (code === championCode) {
      stage = "Champion";
    }

    return {
      code,
      stage,
      priority: DARK_HORSE_STAGE_PRIORITY[stage] ?? 0,
    };
  });
}

function compareDarkHorseCandidates(left, right, getTeam) {
  const leftTeam = getTeam(left.code);
  const rightTeam = getTeam(right.code);
  return (
    left.priority - right.priority
    || (leftTeam?.fifa_ranking ?? -Infinity) - (rightTeam?.fifa_ranking ?? -Infinity)
    || left.code.localeCompare(right.code)
  );
}

function selectDarkHorse(tournament, thirdPlaceMatch, getTeam) {
  const allCandidates = buildDarkHorsePool(tournament, thirdPlaceMatch)
    .filter((candidate) => candidate.code && !RECAP_BIG_TEAM_CODES.has(candidate.code));
  const quarterfinalOrBetter = allCandidates.filter((candidate) => candidate.priority >= DARK_HORSE_STAGE_PRIORITY.Quarterfinalist);
  const pool = quarterfinalOrBetter.length ? quarterfinalOrBetter : allCandidates;
  const winner = selectBestCandidate(pool, (left, right) => compareDarkHorseCandidates(left, right, getTeam));
  if (!winner) {
    return null;
  }

  return {
    team: getTeam(winner.code),
    stage: winner.stage,
  };
}

function buildGameOfTournamentCandidate(match, getTeam) {
  if (!isCompleteMatch(match)) {
    return null;
  }

  const totalGoals = (match.home_goals ?? 0) + (match.away_goals ?? 0);
  const isKnockout = match.round !== "Group Stage";
  const tiedMatch = match.home_goals === match.away_goals;
  const highScoringTiedKnockout =
    isKnockout
    && tiedMatch
    && match.home_goals >= 2
    && match.away_goals >= 2;
  const wentToPenalties =
    tiedMatch
    && match.penalties?.home != null
    && match.penalties?.away != null
    && match.penalties.home !== match.penalties.away;
  const winnerCode = getKnockoutWinnerCode(match);
  const loserCode = getKnockoutLoserCode(match);
  const winner = winnerCode ? getTeam(winnerCode) : null;
  const loser = loserCode ? getTeam(loserCode) : null;
  const upset = winner && loser ? getUpsetClassification(winner, loser) : { type: "none", gap: 0, label: "" };
  const upsetBonus = upset.type !== "none" ? 3 : 0;
  const roundPriority = RECAP_UPSET_ROUND_PRIORITY[match.round] ?? 0;
  const excitementScore =
    totalGoals
    + (wentToPenalties ? 4 : 0)
    + (highScoringTiedKnockout ? 2 : 0)
    + upsetBonus
    + roundPriority;

  return {
    match,
    winner,
    loser,
    upset,
    roundPriority,
    totalGoals,
    wentToPenalties,
    tiedKnockoutMatch: highScoringTiedKnockout,
    excitementScore,
  };
}

function compareGameOfTournamentCandidates(left, right) {
  return (
    left.excitementScore - right.excitementScore
    || left.roundPriority - right.roundPriority
    || left.totalGoals - right.totalGoals
    || Number(left.wentToPenalties) - Number(right.wentToPenalties)
    || (left.upset.gap ?? 0) - (right.upset.gap ?? 0)
  );
}

function describeGameOfTournament(candidate) {
  if (!candidate) {
    return "Awaiting a standout match.";
  }

  if (candidate.match.round === "Final") {
    return "Final classic";
  }

  if (candidate.wentToPenalties) {
    return `Penalty thriller in the ${candidate.match.round}`;
  }

  if (candidate.upset.type !== "none") {
    return `Massive upset in the ${candidate.match.round}`;
  }

  if (candidate.totalGoals >= 7 && candidate.match.round !== "Group Stage") {
    return `${candidate.totalGoals}-goal knockout classic`;
  }

  if (candidate.totalGoals >= 7) {
    return `${candidate.totalGoals}-goal classic`;
  }

  return `High-drama ${candidate.match.round.toLowerCase()}`;
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

function getCompletedMatchResult(match) {
  if (!isCompleteMatch(match)) {
    return null;
  }

  if (match.home_goals > match.away_goals) {
    return { homeOutcome: "win", awayOutcome: "loss" };
  }

  if (match.away_goals > match.home_goals) {
    return { homeOutcome: "loss", awayOutcome: "win" };
  }

  return { homeOutcome: "draw", awayOutcome: "draw" };
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

function compareStatsByTournamentPoints(left, right) {
  return (
    right.points - left.points
    || right.goalDifference - left.goalDifference
    || right.totalGoalsScored - left.totalGoalsScored
    || left.totalGoalsConceded - right.totalGoalsConceded
    || left.team.name.localeCompare(right.team.name)
  );
}

function buildEmptyTeamStatsEntry(team) {
  return {
    code: team.code,
    team,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    totalGoalsScored: 0,
    totalGoalsConceded: 0,
    goalDifference: 0,
    cleanSheets: 0,
    averageGoalsScored: 0,
    averageGoalsConceded: 0,
    record: "0-0-0",
  };
}

function getStatsEntryForCode(code, statsByCode, teams, getTeam) {
  if (!code) {
    return null;
  }

  const existing = statsByCode.get(code);
  if (existing) {
    return existing;
  }

  const team = getTeam(code) ?? teams.find((entry) => entry.code === code) ?? null;
  return team ? buildEmptyTeamStatsEntry(team) : null;
}

function getMatchLosers(matches = []) {
  return matches
    .map((match) => getKnockoutLoserCode(match))
    .filter(Boolean);
}

function buildTournamentRankingBand(codes, finishLabel, statsByCode, teams, getTeam, assignedCodes) {
  const uniqueCodes = Array.from(new Set(codes))
    .filter((code) => code && !assignedCodes.has(code));
  const entries = uniqueCodes
    .map((code) => getStatsEntryForCode(code, statsByCode, teams, getTeam))
    .filter(Boolean)
    .sort(compareStatsByTournamentPoints)
    .map((entry) => ({
      ...entry,
      finishLabel,
    }));

  entries.forEach((entry) => assignedCodes.add(entry.code));
  return entries;
}

export function deriveTournamentTeamStats(tournament, thirdPlaceMatch, teams, getTeam) {
  if (!tournament) {
    return [];
  }

  const completedMatches = collectTournamentMatches(tournament, thirdPlaceMatch).filter(isCompleteMatch);
  const teamStats = new Map();

  const ensureTeamStats = (code) => {
    if (!code || teamStats.has(code)) {
      return teamStats.get(code) ?? null;
    }

    const team = getTeam(code) ?? teams.find((entry) => entry.code === code) ?? null;
    if (!team) {
      return null;
    }

    const entry = {
      code,
      team,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      totalGoalsScored: 0,
      totalGoalsConceded: 0,
      goalDifference: 0,
      cleanSheets: 0,
      averageGoalsScored: 0,
      averageGoalsConceded: 0,
      record: "0-0-0",
    };
    teamStats.set(code, entry);
    return entry;
  };

  completedMatches.forEach((match) => {
    const homeEntry = ensureTeamStats(match.home_team);
    const awayEntry = ensureTeamStats(match.away_team);
    if (!homeEntry || !awayEntry) {
      return;
    }

    const outcome = getCompletedMatchResult(match);
    if (!outcome) {
      return;
    }

    homeEntry.matchesPlayed += 1;
    awayEntry.matchesPlayed += 1;
    homeEntry.totalGoalsScored += match.home_goals;
    homeEntry.totalGoalsConceded += match.away_goals;
    awayEntry.totalGoalsScored += match.away_goals;
    awayEntry.totalGoalsConceded += match.home_goals;

    if (match.away_goals === 0) {
      homeEntry.cleanSheets += 1;
    }
    if (match.home_goals === 0) {
      awayEntry.cleanSheets += 1;
    }

    if (outcome.homeOutcome === "win") {
      homeEntry.wins += 1;
      homeEntry.points += 3;
      awayEntry.losses += 1;
    } else if (outcome.awayOutcome === "win") {
      awayEntry.wins += 1;
      awayEntry.points += 3;
      homeEntry.losses += 1;
    } else {
      homeEntry.draws += 1;
      awayEntry.draws += 1;
      homeEntry.points += 1;
      awayEntry.points += 1;
    }
  });

  return Array.from(teamStats.values())
    .filter((entry) => entry.matchesPlayed > 0)
    .map((entry) => {
      const averageGoalsScored = entry.totalGoalsScored / entry.matchesPlayed;
      const averageGoalsConceded = entry.totalGoalsConceded / entry.matchesPlayed;
      const goalDifference = entry.totalGoalsScored - entry.totalGoalsConceded;
      return {
        ...entry,
        averageGoalsScored,
        averageGoalsConceded,
        goalDifference,
        record: `${entry.wins}-${entry.draws}-${entry.losses}`,
      };
    });
}

export function deriveTournamentRanking(tournament, thirdPlaceMatch, teams, getTeam, providedStats = null) {
  if (!tournament) {
    return [];
  }

  const teamStats = providedStats ?? deriveTournamentTeamStats(tournament, thirdPlaceMatch, teams, getTeam);
  const statsByCode = new Map(teamStats.map((entry) => [entry.code, entry]));
  const assignedCodes = new Set();
  const ranking = [];
  const finalMatch = tournament.bracket?.final?.[0] ?? null;
  const championCode = getKnockoutWinnerCode(finalMatch) ?? tournament.champion ?? null;
  const runnerUpCode = getKnockoutLoserCode(finalMatch) ?? tournament.runner_up ?? tournament.runnerUp ?? null;
  const semifinalLosers = getMatchLosers(tournament.bracket?.semifinals ?? []);
  const thirdPlaceWinnerCode = getKnockoutWinnerCode(thirdPlaceMatch) ?? tournament.third_place ?? tournament.thirdPlace ?? null;
  const thirdPlaceLoserCode = getKnockoutLoserCode(thirdPlaceMatch);

  [
    [championCode, "Champion"],
    [runnerUpCode, "Runner-up"],
  ].forEach(([code, finishLabel]) => {
    const entry = getStatsEntryForCode(code, statsByCode, teams, getTeam);
    if (!entry || assignedCodes.has(code)) {
      return;
    }

    assignedCodes.add(code);
    ranking.push({
      ...entry,
      finishLabel,
    });
  });

  if (thirdPlaceWinnerCode && thirdPlaceLoserCode) {
    [
      [thirdPlaceWinnerCode, "3rd Place"],
      [thirdPlaceLoserCode, "4th Place"],
    ].forEach(([code, finishLabel]) => {
      const entry = getStatsEntryForCode(code, statsByCode, teams, getTeam);
      if (!entry || assignedCodes.has(code)) {
        return;
      }

      assignedCodes.add(code);
      ranking.push({
        ...entry,
        finishLabel,
      });
    });
  } else {
    ranking.push(
      ...buildTournamentRankingBand(semifinalLosers, "Semifinalist", statsByCode, teams, getTeam, assignedCodes),
    );
  }

  ranking.push(
    ...buildTournamentRankingBand(
      getMatchLosers(tournament.bracket?.quarterfinals ?? []),
      "Quarterfinalist",
      statsByCode,
      teams,
      getTeam,
      assignedCodes,
    ),
    ...buildTournamentRankingBand(
      getMatchLosers(tournament.bracket?.round_of_16 ?? []),
      "Round of 16",
      statsByCode,
      teams,
      getTeam,
      assignedCodes,
    ),
    ...buildTournamentRankingBand(
      getMatchLosers(tournament.bracket?.round_of_32 ?? []),
      "Round of 32",
      statsByCode,
      teams,
      getTeam,
      assignedCodes,
    ),
  );

  const knockoutParticipants = new Set(
    [
      ...(tournament.bracket?.round_of_32 ?? []),
      ...(tournament.bracket?.round_of_16 ?? []),
      ...(tournament.bracket?.quarterfinals ?? []),
      ...(tournament.bracket?.semifinals ?? []),
      ...(tournament.bracket?.final ?? []),
      ...(thirdPlaceMatch ? [thirdPlaceMatch] : []),
    ].flatMap((match) => [match?.home_team, match?.away_team]).filter(Boolean),
  );
  const allTeamCodes = teams.map((team) => team.code);
  const groupStageCodes = allTeamCodes.filter((code) => !knockoutParticipants.has(code));

  ranking.push(
    ...buildTournamentRankingBand(groupStageCodes, "Group Stage", statsByCode, teams, getTeam, assignedCodes),
  );

  return ranking.map((entry, index) => ({
    ...entry,
    tournamentRank: index + 1,
  }));
}

export function deriveTournamentRecapData(tournament, thirdPlaceMatch, teams, getTeam) {
  if (!tournament) {
    return null;
  }

  const allMatches = collectTournamentMatches(tournament, thirdPlaceMatch);
  const completedMatches = allMatches.filter(isCompleteMatch);
  const teamStats = deriveTournamentTeamStats(tournament, thirdPlaceMatch, teams, getTeam);
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
  const darkHorse = selectDarkHorse(tournament, thirdPlaceMatch, getTeam);
  const completedKnockoutMatches = [
    ...(tournament.bracket?.round_of_32 ?? []),
    ...(tournament.bracket?.round_of_16 ?? []),
    ...(tournament.bracket?.quarterfinals ?? []),
    ...(tournament.bracket?.semifinals ?? []),
    ...(tournament.bracket?.final ?? []),
  ].filter((match) => isCompleteMatch(match) && getKnockoutWinnerCode(match));
  const upsetCandidates = completedKnockoutMatches
    .map((match) => buildUpsetCandidate(match, getTeam))
    .filter(Boolean);
  const majorBigTeamUpsetCandidates = upsetCandidates.filter(isMajorBigTeamUpset);
  const biggestUpset = majorBigTeamUpsetCandidates.length
    ? selectBestCandidate(majorBigTeamUpsetCandidates, compareMajorBigTeamUpsetCandidates)
    : selectBestCandidate(upsetCandidates, compareGenericUpsetCandidates);
  const gameOfTournamentCandidate = selectBestCandidate(
    allMatches
      .filter(isCompleteMatch)
      .map((match) => buildGameOfTournamentCandidate(match, getTeam))
      .filter(Boolean),
    compareGameOfTournamentCandidates,
  );

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
    darkHorse,
    biggestUpset,
    gameOfTournament: gameOfTournamentCandidate
      ? {
          ...gameOfTournamentCandidate,
          reason: describeGameOfTournament(gameOfTournamentCandidate),
        }
      : null,
    championGoals,
    championGoalsAgainst,
    semifinalResults,
    totalGoals: completedMatches.reduce((sum, match) => sum + match.home_goals + match.away_goals, 0),
    championPath,
    teamStats,
  };
}
