import TeamFlag from "../shared/TeamFlag";
import { formatDecimal, formatPercent } from "../../utils/formattingUtils";

export default function ProbabilityBar({ entry, index }) {
  return (
    <div
      className={`dashboard-bar-row ${index === 0 ? "top-team" : ""}`}
      style={{ "--bar-delay": `${index * 45}ms` }}
    >
      <div className="dashboard-team">
        <TeamFlag code={entry.team.code} size="sm" alt={`${entry.team.name} flag`} />
        <div>
          <div className="dashboard-team-name">{entry.team.name}</div>
          <div className="dashboard-team-meta">
            {entry.team.code} · Avg GF {formatDecimal(entry.average_goals_scored)}
          </div>
        </div>
      </div>
      <div className="dashboard-bar-track">
        <div className="dashboard-bar-fill" style={{ "--bar-width": `${entry.champion * 100}%` }} />
      </div>
      <div className="dashboard-bar-value">{formatPercent(entry.champion)}</div>
    </div>
  );
}
