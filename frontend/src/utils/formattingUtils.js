export function waitForNextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDecimal(value) {
  return Number(value ?? 0).toFixed(2);
}

export function formatWholeNumber(value) {
  return String(Math.round(Number(value ?? 0)));
}

export function formatMatchScore(match) {
  if (
    !match
    || !("home_goals" in match)
    || !("away_goals" in match)
    || match.home_goals == null
    || match.away_goals == null
  ) {
    return null;
  }

  const baseScore = `${match.home_goals} - ${match.away_goals}`;
  if (match.decision === "penalties" && match.penalties) {
    return `${baseScore} (${match.penalties.home}-${match.penalties.away} pens)`;
  }

  return baseScore;
}

export function formatPredictionScore(prediction) {
  if (!prediction) {
    return "VS";
  }

  return formatMatchScore(prediction.sample_score);
}

export function getPredictionAdvancingTeam(prediction) {
  if (!prediction || prediction.stage !== "knockout") {
    return null;
  }

  return prediction.sample_score.winner === prediction.home_team.code
    ? prediction.home_team
    : prediction.away_team;
}

export function getPredictionSampleWinnerCode(prediction) {
  if (!prediction) {
    return null;
  }

  if (prediction.sample_score.winner) {
    return prediction.sample_score.winner;
  }

  if (prediction.sample_score.home_goals > prediction.sample_score.away_goals) {
    return prediction.home_team.code;
  }

  if (prediction.sample_score.away_goals > prediction.sample_score.home_goals) {
    return prediction.away_team.code;
  }

  return null;
}
