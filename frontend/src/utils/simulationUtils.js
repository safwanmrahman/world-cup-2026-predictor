import { formatMatchScore } from "./formattingUtils";
import { getUpsetClassification } from "./knockoutUtils";

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
  const semifinalistCodes = tournament.semifinalists
    ?? tournament.bracket?.semifinals?.flatMap((match) => [match.home_team, match.away_team]).filter(Boolean)
    ?? [];
  const bestDefensePool = semifinalistCodes.length ? semifinalistCodes : teams.map((team) => team.code);
  const minConceded = Math.min(
    ...bestDefensePool.map((code) => goalsAgainst[code]).filter((value) => Number.isFinite(value)),
  );
  const bestDefenseTeams = bestDefensePool
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
  ].filter((match) => isCompleteMatch(match) && match.winner);
  const biggestUpset = completedKnockoutMatches.reduce((best, match) => {
    const winner = getTeam(match.winner);
    const loserCode = match.winner === match.home_team ? match.away_team : match.home_team;
    const loser = getTeam(loserCode);
    if (!winner || !loser) {
      return best;
    }

    const upset = getUpsetClassification(winner, loser);
    if (upset.type === "none") {
      return best;
    }

    if (
      !best
      || upset.gap > best.rankingSwing
      || (upset.gap === best.rankingSwing && upset.type === "major" && best.upsetType !== "major")
    ) {
      return { match, winner, loser, rankingSwing: upset.gap, upsetType: upset.type, upsetLabel: upset.label };
    }

    return best;
  }, null);

  const champion = tournament.champion ? getTeam(tournament.champion) : null;
  const runnerUpCode = tournament.runner_up ?? tournament.runnerUp ?? null;
  const runnerUp = runnerUpCode ? getTeam(runnerUpCode) : null;
  const thirdPlaceCode = tournament.third_place ?? tournament.thirdPlace ?? thirdPlaceMatch?.winner ?? null;
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
        .filter((match) => match.winner === champion.code)
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
