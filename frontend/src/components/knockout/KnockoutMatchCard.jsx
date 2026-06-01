import { useEffect, useState } from "react";
import Badge from "../shared/Badge";
import Button from "../shared/Button";
import TeamFlag from "../shared/TeamFlag";
import { validateScoreInput } from "../../manualPrediction";
import { formatMatchScore } from "../../utils/formattingUtils";
import { getKnockoutWinnerCode } from "../../utils/knockoutUtils";

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
  const winnerCode = getKnockoutWinnerCode(match);
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
        className={`bracket-team-row ${winnerCode === match.home_team ? "winner" : ""} ${highlightedTeamCode === match.home_team ? "route-team-highlighted" : ""}`}
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
        className={`bracket-team-row ${winnerCode === match.away_team ? "winner" : ""} ${highlightedTeamCode === match.away_team ? "route-team-highlighted" : ""}`}
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
  onMatchChange,
  onQuickPick,
  highlightedTeamCode = null,
  onTeamHover,
  onTeamLeave,
  onTeamPin,
}) {
  const [editingSide, setEditingSide] = useState(null);

  useEffect(() => {
    setEditingSide(null);
  }, [match?.match_id]);

  if (!match?.home_team || !match?.away_team) {
    return <div className="bracket-placeholder">Awaiting previous result</div>;
  }

  const home = getTeam(match.home_team);
  const away = getTeam(match.away_team);
  const statusLabels = getManualKnockoutCardBadges(match);
  const winnerCode = getKnockoutWinnerCode(match);
  const isRouteHighlighted = highlightedTeamCode && [match.home_team, match.away_team].includes(highlightedTeamCode);
  const matchScore = formatMatchScore(match);
  const penaltyNote = match.result_type === "PENS" && match.penalties
    ? `Pens ${match.penalties.home}-${match.penalties.away}`
    : null;
  const tiedAfterNinety = match.home_goals != null && match.away_goals != null && match.home_goals === match.away_goals;
  const advancingTeamName = winnerCode === match.home_team
    ? home?.name ?? match.home_team
    : winnerCode === match.away_team
      ? away?.name ?? match.away_team
      : null;

  function renderEditableScore(side) {
    const scoreValue = side === "home" ? match.home_goals : match.away_goals;
    const patchKey = side === "home" ? "homeGoals" : "awayGoals";
    const isEditing = editingSide === side;

    if (isEditing) {
      return (
        <input
          type="number"
          min="0"
          max="20"
          className="bracket-score-input"
          value={scoreValue ?? ""}
          inputMode="numeric"
          autoFocus
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onMatchChange?.(match, { [patchKey]: validateScoreInput(event.target.value) })}
          onBlur={() => setEditingSide(null)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") {
              event.currentTarget.blur();
            }
          }}
        />
      );
    }

    return (
      <button
        type="button"
        className={`bracket-score-trigger ${scoreValue == null ? "is-empty" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          setEditingSide(side);
        }}
        aria-label={`Edit ${side === "home" ? home?.name ?? match.home_team : away?.name ?? match.away_team} score`}
      >
        {scoreValue ?? "-"}
      </button>
    );
  }

  return (
    <div
      className={`bracket-match-card manual-bracket-card knockout-card-shell ${isRouteHighlighted ? "route-highlighted" : ""} ${match.className ?? ""}`.trim()}
      onMouseLeave={() => onTeamLeave?.()}
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
        className={`bracket-team-row ${winnerCode === match.home_team ? "winner" : ""} ${highlightedTeamCode === match.home_team ? "route-team-highlighted" : ""}`}
        onMouseEnter={() => onTeamHover?.(match.home_team)}
        onClick={() => {
          onTeamPin?.(match.home_team);
          onQuickPick?.(match, "teamA");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onTeamPin?.(match.home_team);
            onQuickPick?.(match, "teamA");
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Advance ${home?.name ?? match.home_team}`}
      >
        <div className="bracket-team-meta">
          <TeamFlag code={match.home_team} size="sm" alt={`${home?.name ?? match.home_team} flag`} />
          <span>{home?.name ?? match.home_team}</span>
        </div>
        {renderEditableScore("home")}
      </div>
      <div
        className={`bracket-team-row ${winnerCode === match.away_team ? "winner" : ""} ${highlightedTeamCode === match.away_team ? "route-team-highlighted" : ""}`}
        onMouseEnter={() => onTeamHover?.(match.away_team)}
        onClick={() => {
          onTeamPin?.(match.away_team);
          onQuickPick?.(match, "teamB");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onTeamPin?.(match.away_team);
            onQuickPick?.(match, "teamB");
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Advance ${away?.name ?? match.away_team}`}
      >
        <div className="bracket-team-meta">
          <TeamFlag code={match.away_team} size="sm" alt={`${away?.name ?? match.away_team} flag`} />
          <span>{away?.name ?? match.away_team}</span>
        </div>
        {renderEditableScore("away")}
      </div>
      <div className="manual-bracket-foot">
        <div className="manual-bracket-summary">
          {matchScore ? <span className="manual-result-note">{matchScore}</span> : <span className="manual-result-placeholder">Click score to edit</span>}
          {penaltyNote ? <span className="manual-bracket-pens-note">{penaltyNote}</span> : null}
          {tiedAfterNinety && advancingTeamName && !penaltyNote ? <span className="manual-bracket-pens-note">{advancingTeamName} advance</span> : null}
        </div>
        {tiedAfterNinety ? (
          <div className="manual-inline-advance-picker" onClick={(event) => event.stopPropagation()}>
            <span className="manual-inline-advance-label">Advances</span>
            <div className="manual-inline-advance-actions">
              <Button
                className={winnerCode === match.home_team ? "button-primary manual-inline-advance-button" : "button-secondary manual-inline-advance-button"}
                onClick={() => onMatchChange?.(match, { advancedTeamId: match.home_team })}
              >
                {home?.code ?? match.home_team}
              </Button>
              <Button
                className={winnerCode === match.away_team ? "button-primary manual-inline-advance-button" : "button-secondary manual-inline-advance-button"}
                onClick={() => onMatchChange?.(match, { advancedTeamId: match.away_team })}
              >
                {away?.code ?? match.away_team}
              </Button>
            </div>
          </div>
        ) : null}
        <div className="manual-bracket-actions">
          {tiedAfterNinety ? <span className="manual-result-placeholder">Use details for penalty scores</span> : null}
        </div>
      </div>
    </div>
  );
}
