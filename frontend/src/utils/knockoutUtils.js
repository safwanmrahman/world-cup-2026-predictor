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

export function isKnockoutUpset(match, getTeam) {
  if (!match?.home_team || !match?.away_team || !match?.winner) {
    return false;
  }

  const homeTeam = getTeam(match.home_team);
  const awayTeam = getTeam(match.away_team);
  const lowerRatedCode = getLowerRatedTeamCode(homeTeam, awayTeam);
  return lowerRatedCode != null && match.winner === lowerRatedCode;
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
