import Button from "../shared/Button";
import TeamFlag from "../shared/TeamFlag";
import Badge from "../shared/Badge";
import { validateScoreInput } from "../../manualPrediction";

export function ManualGroupScoreInput({ value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      max="20"
      className="manual-score-input"
      value={value}
      onChange={(event) => onChange(validateScoreInput(event.target.value))}
    />
  );
}

export function TeamRow({ teamCode, teamName, emphasized, dimmed, score, winner, align = "left" }) {
  return (
    <div className={`fixture-team-row fixture-team-${align} ${winner ? "winner" : ""} ${dimmed ? "dimmed" : ""}`}>
      <div className="fixture-team-meta">
        <TeamFlag code={teamCode} size="sm" alt={`${teamName} flag`} />
        <span className={emphasized ? "team-strong" : ""}>{teamName}</span>
      </div>
      {score !== undefined ? <strong>{score}</strong> : null}
    </div>
  );
}

export default function GroupMatchRow({ match, getTeam, onScoreChange, onQuickPick, labels = [] }) {
  const home = getTeam(match.home_team);
  const away = getTeam(match.away_team);

  return (
    <div className="manual-group-fixture-card">
      {labels.length ? (
        <div className="badge-row manual-match-badges">
          {labels.map((badge) => (
            <Badge key={`${match.match_id}-${badge.label}`} label={badge.label} tone={badge.tone} />
          ))}
        </div>
      ) : null}
      <div className="manual-group-fixture">
        <Button className={`manual-pick-button ${match.selected_outcome === "teamA" ? "active" : ""}`} onClick={() => onQuickPick(match, "teamA")}>
          <TeamFlag code={match.home_team} size="sm" alt={`${home?.name ?? match.home_team} flag`} />
          <span>{home?.name ?? match.home_team}</span>
        </Button>
        <ManualGroupScoreInput value={match.home_goals ?? ""} onChange={(value) => onScoreChange(match, "home", value)} />
        <Button className={`manual-draw-button ${match.selected_outcome === "draw" ? "active" : ""}`} onClick={() => onQuickPick(match, "draw")}>
          Draw
        </Button>
        <ManualGroupScoreInput value={match.away_goals ?? ""} onChange={(value) => onScoreChange(match, "away", value)} />
        <Button className={`manual-pick-button manual-pick-button-right ${match.selected_outcome === "teamB" ? "active" : ""}`} onClick={() => onQuickPick(match, "teamB")}>
          <span>{away?.name ?? match.away_team}</span>
          <TeamFlag code={match.away_team} size="sm" alt={`${away?.name ?? match.away_team} flag`} />
        </Button>
      </div>
    </div>
  );
}
