import { getKnockoutWinnerCode } from "./knockoutUtils";

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
  const decidedOnPenalties =
    match.home_goals === match.away_goals
    && match.penalties
    && match.penalties.home != null
    && match.penalties.away != null
    && match.penalties.home !== match.penalties.away;
  if (decidedOnPenalties || (match.decision === "penalties" && match.penalties)) {
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

  const winnerCode = getKnockoutWinnerCode(prediction.sample_score);
  return winnerCode === prediction.home_team.code
    ? prediction.home_team
    : winnerCode === prediction.away_team.code
      ? prediction.away_team
      : null;
}

export function getPredictionSampleWinnerCode(prediction) {
  if (!prediction) {
    return null;
  }

  return getKnockoutWinnerCode(prediction.sample_score);
}
