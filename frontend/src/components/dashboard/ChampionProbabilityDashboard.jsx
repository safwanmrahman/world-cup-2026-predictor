import { ChartIcon } from "../shared/Icons";
import LoadingSkeleton from "../shared/LoadingSkeleton";
import ProbabilityBar from "./ProbabilityBar";

export default function ChampionProbabilityDashboard({ simulationData, probabilityRows }) {
  return (
    <section className="surface-card dashboard-panel">
      <div className="section-kicker">SIMULATION DASHBOARD</div>
      <h2 className="section-title">Champion Probability</h2>
      {simulationData ? (
        <div className="dashboard-bars">
          {probabilityRows.map((entry, index) => (
            <ProbabilityBar key={entry.team.code} entry={entry} index={index} />
          ))}
        </div>
      ) : (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-icon"><ChartIcon /></div>
          <div className="dashboard-empty-copy">
            <strong>Probability board locked until the first run</strong>
            <p>Launch a single tournament or a batch to reveal title odds, scoring trends, and the leaders across the field.</p>
          </div>
          <LoadingSkeleton />
        </div>
      )}
    </section>
  );
}
