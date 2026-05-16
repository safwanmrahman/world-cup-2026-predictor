import { useEffect, useState } from "react";
import { buildApiUrl } from "../../data/constants";
import { validateScoreInput } from "../../manualPrediction";
import { formatMatchScore, formatPercent } from "../../utils/formattingUtils";
import {
  getKnockoutUpset,
  getKnockoutMatchOpponent,
  getLowerRatedTeamCode,
  getTeamPreviousKnockoutMatch,
} from "../../utils/knockoutUtils";
import Modal from "../shared/Modal";
import Badge from "../shared/Badge";
import Button from "../shared/Button";
import TeamFlag from "../shared/TeamFlag";
import { FireIcon } from "../shared/Icons";

function ManualScoreInput({ value, onChange }) {
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

function getManualMatchStatus(match) {
  const labels = [];
  if (match.source === "quick-pick-generated-score") {
    labels.push({ label: "Quick Pick", tone: "gold" });
    labels.push({ label: "Generated Score", tone: "muted" });
  } else if (match.source === "manual-score") {
    labels.push({ label: "Manual Score", tone: "green" });
  }
  if (match.result_type === "PENS") {
    labels.push({ label: "Pens", tone: "gold" });
  }
  return labels;
}

export default function KnockoutMatchDetailsModal({
  match,
  mode,
  getTeam,
  matchPool,
  onClose,
  onPickWinner,
  onMatchChange,
}) {
  const [probabilityData, setProbabilityData] = useState(null);

  useEffect(() => {
    async function loadProbability() {
      if (!match?.home_team || !match?.away_team) {
        setProbabilityData(null);
        return;
      }

      try {
        const response = await fetch(buildApiUrl("/predict-match"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            home_team_code: match.home_team,
            away_team_code: match.away_team,
            stage: "knockout",
          }),
        });

        if (!response.ok) {
          throw new Error("Could not load match probabilities.");
        }

        setProbabilityData(await response.json());
      } catch {
        setProbabilityData(null);
      }
    }

    loadProbability();
  }, [match?.away_team, match?.home_team, mode]);

  if (!match?.home_team || !match?.away_team) {
    return null;
  }

  const homeTeam = getTeam(match.home_team);
  const awayTeam = getTeam(match.away_team);
  const winner = match.winner ? getTeam(match.winner) : null;
  const upset = getKnockoutUpset(match, getTeam);
  const lowerRatedCode = getLowerRatedTeamCode(homeTeam, awayTeam);
  const lowerRatedTeam = lowerRatedCode ? getTeam(lowerRatedCode) : null;
  const favoriteTeam = lowerRatedCode === homeTeam?.code ? awayTeam : lowerRatedCode === awayTeam?.code ? homeTeam : null;
  const currentPickLabel = match.winner ? `${winner?.name ?? match.winner} selected` : "Awaiting pick";
  const homePrevious = getTeamPreviousKnockoutMatch(matchPool ?? [], match.round, match.home_team);
  const awayPrevious = getTeamPreviousKnockoutMatch(matchPool ?? [], match.round, match.away_team);
  const homePreviousOpponent = homePrevious ? getTeam(getKnockoutMatchOpponent(homePrevious, match.home_team)) : null;
  const awayPreviousOpponent = awayPrevious ? getTeam(getKnockoutMatchOpponent(awayPrevious, match.away_team)) : null;
  const homeAdvanceProbability = probabilityData?.probabilities.home_advance ?? null;
  const awayAdvanceProbability = probabilityData?.probabilities.away_advance ?? null;
  const tieAfterNinety = match.home_goals != null && match.away_goals != null && match.home_goals === match.away_goals;
  const manualStatusLabels = mode === "manual" ? getManualMatchStatus(match) : [];

  return (
    <Modal isOpen={Boolean(match)} onClose={onClose} className="group-modal knockout-modal">
      <div className="modal-header">
        <div className="section-kicker">{mode === "simulator" ? "MATCH DETAILS" : "MATCH EDITOR"}</div>
        <div className="knockout-round-badge">{match.round}</div>
        <h3>{match.round}</h3>
      </div>
      <div className="knockout-modal-divider" />
      <div className="modal-section knockout-modal-body">
        <div className="knockout-modal-scoreboard">
          <div className={`knockout-modal-team ${match.winner === match.home_team ? "winner" : ""} ${match.winner && match.winner !== match.home_team ? "loser" : ""}`}>
            <TeamFlag code={homeTeam?.code ?? match.home_team} size="lg" alt={`${homeTeam?.name ?? match.home_team} flag`} />
            <strong>{homeTeam?.name ?? match.home_team}</strong>
            <span>{homeTeam?.code ?? match.home_team}</span>
            <div className="knockout-team-tags">
              {favoriteTeam?.code === homeTeam?.code ? <Badge label="Favorite" tone="gold" /> : null}
              {lowerRatedTeam?.code === homeTeam?.code ? <Badge label="Underdog" tone="muted" /> : null}
            </div>
          </div>
          <div className="knockout-modal-score">
            <div className="knockout-modal-scoreline">{formatMatchScore(match) ?? "VS"}</div>
            {winner ? <div className="knockout-modal-winner-banner">{winner.name} advance</div> : null}
            {match.penalties ? <div className="knockout-modal-note knockout-modal-note-pens">Decided on penalties: {match.penalties.home}-{match.penalties.away}</div> : null}
          </div>
          <div className={`knockout-modal-team ${match.winner === match.away_team ? "winner" : ""} ${match.winner && match.winner !== match.away_team ? "loser" : ""}`}>
            <TeamFlag code={awayTeam?.code ?? match.away_team} size="lg" alt={`${awayTeam?.name ?? match.away_team} flag`} />
            <strong>{awayTeam?.name ?? match.away_team}</strong>
            <span>{awayTeam?.code ?? match.away_team}</span>
            <div className="knockout-team-tags">
              {favoriteTeam?.code === awayTeam?.code ? <Badge label="Favorite" tone="gold" /> : null}
              {lowerRatedTeam?.code === awayTeam?.code ? <Badge label="Underdog" tone="muted" /> : null}
            </div>
          </div>
        </div>
        <div className="knockout-modal-divider" />
        <div className="knockout-modal-meta">
          <div className="knockout-meta-section">
            <div className="section-kicker">Advancement Probability</div>
            <div className="knockout-meta-grid">
              <div className="knockout-meta-card knockout-meta-card-probability">
                <span>Win Probability</span>
                <strong className="knockout-meta-team"><TeamFlag code={homeTeam?.code ?? match.home_team} size="sm" alt={`${homeTeam?.name ?? match.home_team} flag`} />{homeTeam?.name ?? match.home_team}</strong>
                <small>{probabilityData ? formatPercent(probabilityData.probabilities.home_advance) : "--"}</small>
                <div className="knockout-mini-bar"><div className="knockout-mini-bar-fill" style={{ width: `${homeAdvanceProbability != null ? homeAdvanceProbability * 100 : 0}%` }} /></div>
              </div>
              <div className="knockout-meta-card knockout-meta-card-probability">
                <span>Win Probability</span>
                <strong className="knockout-meta-team"><TeamFlag code={awayTeam?.code ?? match.away_team} size="sm" alt={`${awayTeam?.name ?? match.away_team} flag`} />{awayTeam?.name ?? match.away_team}</strong>
                <small>{probabilityData ? formatPercent(probabilityData.probabilities.away_advance) : "--"}</small>
                <div className="knockout-mini-bar"><div className="knockout-mini-bar-fill muted" style={{ width: `${awayAdvanceProbability != null ? awayAdvanceProbability * 100 : 0}%` }} /></div></div>
            </div>
          </div>
          <div className="knockout-meta-section">
            <div className="section-kicker">FIFA Ranking</div>
            <div className="knockout-meta-grid">
              <div className="knockout-meta-card"><span>FIFA Ranking</span><strong className="knockout-meta-team"><TeamFlag code={homeTeam?.code ?? match.home_team} size="sm" alt={`${homeTeam?.name ?? match.home_team} flag`} />{homeTeam?.name ?? match.home_team}</strong><small>#{homeTeam?.fifa_ranking ?? "--"}</small></div>
              <div className="knockout-meta-card"><span>FIFA Ranking</span><strong className="knockout-meta-team"><TeamFlag code={awayTeam?.code ?? match.away_team} size="sm" alt={`${awayTeam?.name ?? match.away_team} flag`} />{awayTeam?.name ?? match.away_team}</strong><small>#{awayTeam?.fifa_ranking ?? "--"}</small></div>
            </div>
          </div>
          {mode === "simulator" ? (
            <>
              <div className="knockout-status-line"><strong>Winner:</strong> {winner?.name ?? "Pending"}</div>
              {upset.type !== "none" ? (
                <div className={`knockout-upset-indicator knockout-upset-indicator-${upset.type}`}>
                  <FireIcon />
                  <span>{upset.label}: {upset.winner?.name ?? "Lower-ranked team"} eliminated {upset.loser?.name ?? "the favorite"} despite trailing by {upset.gap} FIFA ranking places.</span>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="knockout-status-line"><strong>Current Pick:</strong> {currentPickLabel}</div>
              {upset.type !== "none" ? (
                <div className={`knockout-upset-indicator knockout-upset-indicator-${upset.type}`}>
                  <FireIcon />
                  <span>{upset.label}: {upset.winner?.name ?? "Lower-ranked team"} is currently picked over {upset.loser?.name ?? "the favorite"} despite trailing by {upset.gap} FIFA ranking places.</span>
                </div>
              ) : null}
              <div className="knockout-editor-panel">
                <div className="section-kicker">Edit Prediction</div>
                <div className="knockout-editor-status">
                  {manualStatusLabels.length ? manualStatusLabels.map((badge) => <Badge key={`${match.match_id}-${badge.label}`} label={badge.label} tone={badge.tone} />) : <Badge label="Awaiting Pick" tone="muted" />}
                </div>
                <div className="knockout-modal-actions">
                  <Button className={match.winner === match.home_team ? "button-primary" : "button-secondary"} onClick={() => onPickWinner?.(match, "teamA")}>Pick {homeTeam?.name ?? "Team A"}</Button>
                  <Button className={match.winner === match.away_team ? "button-primary" : "button-secondary"} onClick={() => onPickWinner?.(match, "teamB")}>Pick {awayTeam?.name ?? "Team B"}</Button>
                </div>
                <div className="knockout-editor-score-grid">
                  <label className="manual-mini-field"><span>{homeTeam?.name ?? match.home_team}</span><ManualScoreInput value={match.home_goals ?? ""} onChange={(value) => onMatchChange?.(match, { homeGoals: value })} /></label>
                  <label className="manual-mini-field"><span>{awayTeam?.name ?? match.away_team}</span><ManualScoreInput value={match.away_goals ?? ""} onChange={(value) => onMatchChange?.(match, { awayGoals: value })} /></label>
                </div>
                {tieAfterNinety ? (
                  <div className="knockout-editor-score-grid">
                    <label className="manual-mini-field"><span>Pens {homeTeam?.code ?? match.home_team}</span><ManualScoreInput value={match.penalties?.home ?? ""} onChange={(value) => onMatchChange?.(match, { penaltiesHome: value, resultType: "PENS" })} /></label>
                    <label className="manual-mini-field"><span>Pens {awayTeam?.code ?? match.away_team}</span><ManualScoreInput value={match.penalties?.away ?? ""} onChange={(value) => onMatchChange?.(match, { penaltiesAway: value, resultType: "PENS" })} /></label>
                  </div>
                ) : null}
              </div>
            </>
          )}
          {homePrevious || awayPrevious ? (
            <div className="knockout-path-so-far">
              <div className="knockout-modal-divider" />
              <div className="section-kicker">Path So Far</div>
              <div className="knockout-path-grid">
                {homePrevious ? <div className="knockout-path-card"><span className="knockout-path-round-label">Previous Round</span><strong>{homeTeam?.name ?? match.home_team}</strong><span>{homePrevious.round}</span><div className="knockout-path-opponent">{homePreviousOpponent ? <TeamFlag code={homePreviousOpponent.code} size="sm" alt={`${homePreviousOpponent.name} flag`} /> : null}<small>vs {homePreviousOpponent?.name ?? getKnockoutMatchOpponent(homePrevious, match.home_team) ?? "--"}</small></div><small>{formatMatchScore(homePrevious) ?? "--"}</small></div> : null}
                {awayPrevious ? <div className="knockout-path-card"><span className="knockout-path-round-label">Previous Round</span><strong>{awayTeam?.name ?? match.away_team}</strong><span>{awayPrevious.round}</span><div className="knockout-path-opponent">{awayPreviousOpponent ? <TeamFlag code={awayPreviousOpponent.code} size="sm" alt={`${awayPreviousOpponent.name} flag`} /> : null}<small>vs {awayPreviousOpponent?.name ?? getKnockoutMatchOpponent(awayPrevious, match.away_team) ?? "--"}</small></div><small>{formatMatchScore(awayPrevious) ?? "--"}</small></div> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
