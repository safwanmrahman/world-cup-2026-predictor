export const SLIGHT_UPSET_RANKING_GAP = 8;
export const MAJOR_UPSET_RANKING_GAP = 15;
export const KNOCKOUT_BIG_TEAM_CODES = new Set([
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

export function getLowerRatedTeamCode(homeTeam, awayTeam) {
  if (!homeTeam || !awayTeam) {
    return null;
  }

  const homeElo = homeTeam.elo_rating ?? 0;
  const awayElo = awayTeam.elo_rating ?? 0;
  if (homeElo === awayElo) {
    return null;
  }

  return homeElo < awayElo ? homeTeam.code : awayTeam.code;
}

export function getUpsetClassification(winnerTeam, loserTeam) {
  if (!winnerTeam || !loserTeam) {
    return { type: "none", gap: 0, label: "" };
  }

  const winnerRanking = winnerTeam.fifa_ranking;
  const loserRanking = loserTeam.fifa_ranking;
  if (!Number.isFinite(winnerRanking) || !Number.isFinite(loserRanking)) {
    return { type: "none", gap: 0, label: "" };
  }
  if (winnerRanking <= 10) {
    return { type: "none", gap: 0, label: "" };
  }

  const gap = winnerRanking - loserRanking;
  if (gap >= MAJOR_UPSET_RANKING_GAP) {
    return { type: "major", gap, label: "Major upset" };
  }

  if (gap >= SLIGHT_UPSET_RANKING_GAP) {
    return { type: "slight", gap, label: "Slight upset" };
  }

  return { type: "none", gap, label: "" };
}

export function getKnockoutUpset(match, getTeam) {
  if (!match?.home_team || !match?.away_team || !match?.winner) {
    return { type: "none", gap: 0, label: "", winner: null, loser: null };
  }

  const homeTeam = getTeam(match.home_team);
  const awayTeam = getTeam(match.away_team);
  const winnerTeam = match.winner === homeTeam?.code ? homeTeam : match.winner === awayTeam?.code ? awayTeam : null;
  const loserTeam = winnerTeam?.code === homeTeam?.code ? awayTeam : winnerTeam?.code === awayTeam?.code ? homeTeam : null;
  const upset = getUpsetClassification(winnerTeam, loserTeam);

  return {
    ...upset,
    winner: winnerTeam,
    loser: loserTeam,
  };
}

function getKnockoutWinnerAndLoser(match, getTeam) {
  if (!match?.home_team || !match?.away_team || !match?.winner) {
    return { winner: null, loser: null };
  }

  const homeTeam = getTeam(match.home_team);
  const awayTeam = getTeam(match.away_team);
  const winner = match.winner === homeTeam?.code ? homeTeam : match.winner === awayTeam?.code ? awayTeam : null;
  const loser = winner?.code === homeTeam?.code ? awayTeam : winner?.code === awayTeam?.code ? homeTeam : null;

  return { winner, loser };
}

export function getKnockoutResultIndicators(match, getTeam) {
  if (
    !match?.home_team
    || !match?.away_team
    || !match?.winner
    || match.home_goals == null
    || match.away_goals == null
  ) {
    return [];
  }

  const { winner, loser } = getKnockoutWinnerAndLoser(match, getTeam);
  if (!winner || !loser) {
    return [];
  }

  const goalDifference = Math.abs(match.home_goals - match.away_goals);
  const indicators = [];

  if (KNOCKOUT_BIG_TEAM_CODES.has(loser.code) && goalDifference >= 3) {
    indicators.push({
      type: "shocker",
      label: "Shocker",
      winner,
      loser,
      goalDifference,
    });
  }

  if (goalDifference >= 4) {
    indicators.push({
      type: "thrashing",
      label: "Thrashing",
      winner,
      loser,
      goalDifference,
    });
  }

  return indicators;
}

export function isKnockoutUpset(match, getTeam) {
  return getKnockoutUpset(match, getTeam).type !== "none";
}

export function getTournamentKnockoutMatches(tournament, thirdPlaceMatch) {
  if (!tournament?.bracket) {
    return [];
  }

  return [
    ...(tournament.bracket.round_of_32 ?? []),
    ...(tournament.bracket.round_of_16 ?? []),
    ...(tournament.bracket.quarterfinals ?? []),
    ...(tournament.bracket.semifinals ?? []),
    ...(tournament.bracket.final ?? []),
    ...(thirdPlaceMatch ? [thirdPlaceMatch] : []),
  ];
}

export function getPreviousKnockoutRound(roundName) {
  return {
    "Round of 16": "Round of 32",
    Quarterfinals: "Round of 16",
    Semifinals: "Quarterfinals",
    Final: "Semifinals",
    "Third Place": "Semifinals",
  }[roundName] ?? null;
}

export function getTeamPreviousKnockoutMatch(matchPool, roundName, teamCode) {
  const previousRound = getPreviousKnockoutRound(roundName);
  if (!previousRound || !teamCode) {
    return null;
  }

  return matchPool.find((match) => match.round === previousRound && match.winner === teamCode) ?? null;
}

export function getKnockoutMatchOpponent(match, teamCode) {
  if (!match || !teamCode) {
    return null;
  }

  return match.home_team === teamCode ? match.away_team : match.home_team;
}

export function compareProbabilityRows(left, right) {
  return (
    right.champion - left.champion
    || right.average_goals_scored - left.average_goals_scored
    || right.final - left.final
    || right.semifinal - left.semifinal
    || right.quarterfinal - left.quarterfinal
    || right.round_of_16 - left.round_of_16
    || right.round_of_32 - left.round_of_32
    || left.team.name.localeCompare(right.team.name)
  );
}
