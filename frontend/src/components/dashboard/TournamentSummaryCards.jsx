import StatCard from "./StatCard";
import TeamFlag from "../shared/TeamFlag";
import { BallIcon, BootIcon, ShieldIcon, TrophyIcon } from "../shared/Icons";
import { formatDecimal, formatWholeNumber } from "../../utils/formattingUtils";

function TeamChips({ teams }) {
  if (!teams?.length) {
    return null;
  }

  return (
    <div className="stat-support stat-support-multi">
      {teams.map((team) => (
        <span className="stat-support-chip" key={team.code}>
          <TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />
          {team.name}
        </span>
      ))}
    </div>
  );
}

function formatMetricValue(value, mode) {
  if (value == null) {
    return "--";
  }

  return mode === "average" ? formatDecimal(value) : formatWholeNumber(value);
}

export default function TournamentSummaryCards({
  mostLikelyWinner,
  averageGoals,
  bestAttackValue,
  bestAttackTeams,
  bestAttackMode,
  bestDefenseValue,
  bestDefenseTeams,
  bestDefenseMode,
  emptyLabel = "Awaiting results",
}) {
  return (
    <section className="stats-grid">
      <StatCard
        label="MOST LIKELY WINNER"
        icon={<TrophyIcon />}
        value={mostLikelyWinner ? (
          <span className="winner-inline">
            <TeamFlag code={mostLikelyWinner.code} size="sm" alt={`${mostLikelyWinner.name} flag`} />
            {mostLikelyWinner.name}
          </span>
        ) : emptyLabel}
      />

      <StatCard
        label="AVG GOALS / MATCH"
        icon={<BallIcon />}
        value={averageGoals != null ? formatDecimal(averageGoals) : "--"}
        detail="Across the current tournament view"
      />

      <StatCard
        label="BEST ATTACK"
        icon={<BootIcon />}
        value={formatMetricValue(bestAttackValue, bestAttackMode)}
        detail={bestAttackMode === "average" ? "Avg goals scored" : "Goals scored"}
      >
        <TeamChips teams={bestAttackTeams} />
      </StatCard>

      <StatCard
        label="BEST DEFENSE"
        icon={<ShieldIcon />}
        value={formatMetricValue(bestDefenseValue, bestDefenseMode)}
        detail={bestDefenseMode === "average" ? "Avg goals allowed" : "Goals allowed"}
      >
        <TeamChips teams={bestDefenseTeams} />
      </StatCard>
    </section>
  );
}
