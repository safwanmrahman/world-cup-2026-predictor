import Badge from "../shared/Badge";
import Button from "../shared/Button";
import TeamFlag from "../shared/TeamFlag";
import { formatMatchScore } from "../../utils/formattingUtils";

function getManualKnockoutCardBadges(match) {
  const badges = [];
  if (match.source === "quick-pick-generated-score") {
    badges.push({ label: "Auto", tone: "gold" });
  } else if (match.source === "manual-score") {
    badges.push({ label: "Manual", tone: "green" });
  }
  if (match.result_type === "PENS") {
    badges.push({ label: "Pens", tone: "muted" });
  }
  return badges;
}

export function KnockoutMatchCard({
  match,
  getTeam,
  className = "",
  onOpenDetails,
  highlightedTeamCode = null,
  onTeamHover,
  onTeamLeave,
  onTeamPin,
}) {
  if (!match) {
    return <div className="bracket-placeholder">Match pending</div>;
  }

  const home = getTeam(match.home_team);
  const away = getTeam(match.away_team);
  const isRouteHighlighted = highlightedTeamCode && [match.home_team, match.away_team].includes(highlightedTeamCode);
  const penaltyScore = match.decision === "penalties" && match.penalties
    ? `Pens ${match.penalties.home}-${match.penalties.away}`
    : null;

  return (
    <div
      className={`bracket-match-card knockout-card-shell ${isRouteHighlighted ? "route-highlighted" : ""} ${className}`.trim()}
      onClick={() => onOpenDetails?.(match)}
      onMouseLeave={() => onTeamLeave?.()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetails?.(match);
        }
      }}
      tabIndex={onOpenDetails ? 0 : -1}
      role={onOpenDetails ? "button" : undefined}
    >
      <div
        className={`bracket-team-row ${match.winner === match.home_team ? "winner" : ""} ${highlightedTeamCode === match.home_team ? "route-team-highlighted" : ""}`}
        onMouseEnter={() => onTeamHover?.(match.home_team)}
        onClickCapture={() => onTeamPin?.(match.home_team)}
      >
        <div className="bracket-team-meta">
          <TeamFlag code={match.home_team} size="sm" alt={`${home?.name ?? match.home_team} flag`} />
          <span>{home?.name ?? match.home_team}</span>
        </div>
        {"home_goals" in match ? <strong>{match.home_goals}</strong> : <span className="score-empty">-</span>}
      </div>
      <div
        className={`bracket-team-row ${match.winner === match.away_team ? "winner" : ""} ${highlightedTeamCode === match.away_team ? "route-team-highlighted" : ""}`}
        onMouseEnter={() => onTeamHover?.(match.away_team)}
        onClickCapture={() => onTeamPin?.(match.away_team)}
      >
        <div className="bracket-team-meta">
          <TeamFlag code={match.away_team} size="sm" alt={`${away?.name ?? match.away_team} flag`} />
          <span>{away?.name ?? match.away_team}</span>
        </div>
        {"away_goals" in match ? <strong>{match.away_goals}</strong> : <span className="score-empty">-</span>}
      </div>
      {penaltyScore ? <div className="bracket-penalty-note">{penaltyScore}</div> : null}
      {onOpenDetails ? (
        <Button
          className="knockout-details-trigger"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDetails(match);
          }}
        >
          View Match Details
        </Button>
      ) : null}
    </div>
  );
}

export function ManualKnockoutMatchCard({
  match,
  getTeam,
  onOpenDetails,
  highlightedTeamCode = null,
  onTeamHover,
  onTeamLeave,
  onTeamPin,
}) {
  if (!match?.home_team || !match?.away_team) {
    return <div className="bracket-placeholder">Awaiting previous result</div>;
  }

  const home = getTeam(match.home_team);
  const away = getTeam(match.away_team);
  const statusLabels = getManualKnockoutCardBadges(match);
  const isRouteHighlighted = highlightedTeamCode && [match.home_team, match.away_team].includes(highlightedTeamCode);
  const matchScore = formatMatchScore(match);
  const penaltyNote = match.result_type === "PENS" && match.penalties
    ? `Pens ${match.penalties.home}-${match.penalties.away}`
    : null;

  return (
    <div
      className={`bracket-match-card manual-bracket-card knockout-card-shell ${isRouteHighlighted ? "route-highlighted" : ""} ${match.className ?? ""}`.trim()}
      onClick={() => onOpenDetails?.(match)}
      onMouseLeave={() => onTeamLeave?.()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetails?.(match);
        }
      }}
      tabIndex={onOpenDetails ? 0 : -1}
      role={onOpenDetails ? "button" : undefined}
    >
      <div className="manual-bracket-head">
        <div className="badge-row manual-bracket-badges">
          {statusLabels.length ? statusLabels.map((badge) => (
            <Badge key={`${match.match_id}-${badge.label}`} label={badge.label} tone={badge.tone} />
          )) : <Badge label="Pending" tone="muted" />}
        </div>
        <Button
          className="knockout-details-trigger manual-details-trigger"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDetails?.(match);
          }}
          aria-label="Open match details"
        >
          Details
        </Button>
      </div>
      <div
        className={`bracket-team-row ${match.winner === match.home_team ? "winner" : ""} ${highlightedTeamCode === match.home_team ? "route-team-highlighted" : ""}`}
        onMouseEnter={() => onTeamHover?.(match.home_team)}
        onClickCapture={() => onTeamPin?.(match.home_team)}
      >
        <div className="bracket-team-meta">
          <TeamFlag code={match.home_team} size="sm" alt={`${home?.name ?? match.home_team} flag`} />
          <span>{home?.name ?? match.home_team}</span>
        </div>
        {match.home_goals != null ? <strong>{match.home_goals}</strong> : <span className="score-empty">-</span>}
      </div>
      <div
        className={`bracket-team-row ${match.winner === match.away_team ? "winner" : ""} ${highlightedTeamCode === match.away_team ? "route-team-highlighted" : ""}`}
        onMouseEnter={() => onTeamHover?.(match.away_team)}
        onClickCapture={() => onTeamPin?.(match.away_team)}
      >
        <div className="bracket-team-meta">
          <TeamFlag code={match.away_team} size="sm" alt={`${away?.name ?? match.away_team} flag`} />
          <span>{away?.name ?? match.away_team}</span>
        </div>
        {match.away_goals != null ? <strong>{match.away_goals}</strong> : <span className="score-empty">-</span>}
      </div>
      <div className="manual-bracket-foot">
        <div className="manual-bracket-summary">
          {matchScore ? <span className="manual-result-note">{matchScore}</span> : <span className="manual-result-placeholder">Open details to edit</span>}
          {penaltyNote ? <span className="manual-bracket-pens-note">{penaltyNote}</span> : null}
        </div>
      </div>
    </div>
  );
}
