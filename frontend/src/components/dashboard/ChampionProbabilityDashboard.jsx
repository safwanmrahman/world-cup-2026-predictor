import { ChartIcon } from "../shared/Icons";
import TeamFlag from "../shared/TeamFlag";
import LoadingSkeleton from "../shared/LoadingSkeleton";
import ProbabilityBar from "./ProbabilityBar";
import { formatDecimal } from "../../utils/formattingUtils";

export default function ChampionProbabilityDashboard({
  simulationData,
  probabilityRows,
  simulationCount,
  hasBatchSimulationResults,
  batchMostWinsTeams,
  batchMostWinsCount,
  batchTopScoringTeams,
  batchTopScorerGoals,
}) {
  return (
    <section className="surface-card dashboard-panel">
      <div className="dashboard-panel-head">
        <div>
          <div className="section-kicker">SIMULATION DASHBOARD</div>
          <h2 className="section-title">Champion Probability</h2>
        </div>
        <div className="dashboard-head-chips">
          {simulationCount != null ? (
            <span className="dashboard-head-chip dashboard-head-chip-count">
              {simulationCount.toLocaleString()} simulations
            </span>
          ) : null}
          {hasBatchSimulationResults && batchMostWinsTeams?.length ? (
            <span className="dashboard-head-chip">
              <strong>Most Wins</strong>
              <span>{batchMostWinsCount}</span>
              {batchMostWinsTeams.map((entry) => (
                <span className="dashboard-head-chip-team" key={entry.team.code}>
                  <TeamFlag code={entry.team.code} size="sm" alt={`${entry.team.name} flag`} />
                  {entry.team.name}
                </span>
              ))}
            </span>
          ) : null}
          {hasBatchSimulationResults && batchTopScoringTeams?.length ? (
            <span className="dashboard-head-chip">
              <strong>Batch Top Scorer</strong>
              <span>{formatDecimal(batchTopScorerGoals)}</span>
              {batchTopScoringTeams.map((team) => (
                <span className="dashboard-head-chip-team" key={team.code}>
                  <TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />
                  {team.name}
                </span>
              ))}
            </span>
          ) : null}
        </div>
      </div>
      {simulationData ? (
        <div className="dashboard-bars">
          {probabilityRows.map((entry, index) => (
            <ProbabilityBar
              key={entry.team.code}
              entry={entry}
              index={index}
              showBatchTrophyCount={hasBatchSimulationResults}
            />
          ))}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-icon"><ChartIcon /></div>
          <div className="dashboard-empty-copy">
            <strong>Probability board locked until the first run</strong>
            <p>Run a multi-tournament batch to reveal title odds, trophy counts, and scoring trends across the field.</p>
          </div>
          <LoadingSkeleton />
        </div>
      )}
    </section>
  );
}
