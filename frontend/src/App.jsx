import { useEffect, useMemo, useRef, useState } from "react";
import {
  GROUP_MATCHDAY_LABELS,
  LEFT_BRACKET_TREE,
  RIGHT_BRACKET_TREE,
  applyGroupOverride,
  buildManualTournament,
  buildPersistedManualState,
  clearGroupOverride,
  encodePredictionHash,
  getComparisonData,
  loadManualPredictionState,
  quickPickGroupMatch,
  quickPickKnockoutMatch,
  resetManualPrediction,
  saveManualPredictionState,
  toggleAdvancedOverride,
  updateGroupScore,
  updateKnockoutMatch,
  updateSelectedThirdPlaces,
  validateScoreInput,
} from "./manualPrediction";

const API_BASE_URL = "http://127.0.0.1:8000";
const THEME_STORAGE_KEY = "wc26-theme";
const DEFAULT_SIMULATION_COUNT = 500;
const TROPHY_PNG_URL = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3c6.png";
const CODE_TO_ISO = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CIV: "ci",
  CMR: "cm",
  COL: "co",
  COD: "cd",
  CPV: "cv",
  CRC: "cr",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  DEN: "dk",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  HON: "hn",
  IRN: "ir",
  IRQ: "iq",
  ITA: "it",
  JAM: "jm",
  JOR: "jo",
  JPN: "jp",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NGA: "ng",
  NZL: "nz",
  NOR: "no",
  PAN: "pa",
  PAR: "py",
  POL: "pl",
  POR: "pt",
  QAT: "qa",
  RSA: "za",
  SEN: "sn",
  SCO: "gb-sct",
  SRB: "rs",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TUR: "tr",
  UKR: "ua",
  URU: "uy",
  USA: "us",
  UZB: "uz",
};

const MANUAL_EXPORT_SCRIPT_ID = "html2canvas-script";

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value) {
  return Number(value ?? 0).toFixed(2);
}

function formatPredictionScore(prediction) {
  if (!prediction) {
    return "VS";
  }

  const { sample_score: score } = prediction;
  const baseScore = formatMatchScore(score);

  return baseScore;
}

function getPredictionAdvancingTeam(prediction) {
  if (!prediction || prediction.stage !== "knockout") {
    return null;
  }

  return prediction.sample_score.winner === prediction.home_team.code
    ? prediction.home_team
    : prediction.away_team;
}

function getPredictionSampleWinnerCode(prediction) {
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

function formatMatchScore(match) {
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

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <path
        d="M12 1.8v2.7M12 19.5v2.7M4.5 4.5l1.9 1.9M17.6 17.6l1.9 1.9M1.8 12h2.7M19.5 12h2.7M4.5 19.5l1.9-1.9M17.6 6.4l1.9-1.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.2 14.4A8.8 8.8 0 0 1 9.6 3.8a9.4 9.4 0 1 0 10.6 10.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlagImg({ code, size = "sm", alt }) {
  const iso = CODE_TO_ISO[code];
  const [src, setSrc] = useState(null);

  if (!iso) {
    return <span className={`flag-shell flag-${size}`} aria-hidden="true" />;
  }

  const dimensions = {
    sm: { assetWidth: 40, width: 24, height: 18 },
    md: { assetWidth: 80, width: 32, height: 24 },
    lg: { assetWidth: 160, width: 64, height: 48 },
    xl: { assetWidth: 320, width: 96, height: 72 },
  }[size];
  const primarySrc = `https://flagcdn.com/w${dimensions.assetWidth}/${iso}.png`;
  const fallbackSrc = `https://flagcdn.com/24x18/${iso}.png`;

  if (src === "") {
    return <span className={`flag-shell flag-code-fallback flag-${size}`}>{code}</span>;
  }

  return (
    <img
      src={src ?? primarySrc}
      alt={alt ?? `${code} flag`}
      className={`flag-shell flag-${size}`}
      width={dimensions.width}
      height={dimensions.height}
      loading="lazy"
      onError={() => {
        setSrc((current) => (current === fallbackSrc ? "" : fallbackSrc));
      }}
    />
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button type="button" className="theme-toggle" onClick={onToggle} aria-label="Toggle theme">
      <span className="theme-toggle-icon">{theme === "dark" ? <SunIcon /> : <MoonIcon />}</span>
    </button>
  );
}

function PodiumCard({ label, teamCode, teamName, tone, size = "normal" }) {
  return (
    <div className={`podium-card podium-${tone} podium-${size}`}>
      <div className="podium-label">{label}</div>
      <FlagImg code={teamCode} size="xl" alt={`${teamName} flag`} />
      <div className="podium-name">{teamName}</div>
      <div className="podium-code">{teamCode}</div>
    </div>
  );
}

function StatCard({ label, value, children }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {children}
    </div>
  );
}

function deriveDisplayedTournamentGoalData(tournament, thirdPlaceMatch, teams, getTeam) {
  if (!tournament) {
    return null;
  }

  const totals = Object.fromEntries(teams.map((team) => [team.code, 0]));
  const allMatches = [
    ...(tournament.group_results ?? tournament.groupResults ?? []).flatMap((group) => group.matches ?? []),
    ...(tournament.bracket?.round_of_32 ?? []),
    ...(tournament.bracket?.round_of_16 ?? []),
    ...(tournament.bracket?.quarterfinals ?? []),
    ...(tournament.bracket?.semifinals ?? []),
    ...(tournament.bracket?.final ?? []),
    ...(thirdPlaceMatch ? [thirdPlaceMatch] : []),
  ];

  let totalGoals = 0;
  for (const match of allMatches) {
    if (match?.home_team && match?.home_goals != null) {
      totals[match.home_team] = (totals[match.home_team] ?? 0) + match.home_goals;
      totalGoals += match.home_goals;
    }
    if (match?.away_team && match?.away_goals != null) {
      totals[match.away_team] = (totals[match.away_team] ?? 0) + match.away_goals;
      totalGoals += match.away_goals;
    }
  }

  const topGoals = Math.max(...Object.values(totals));
  const topTeams = Object.entries(totals)
    .filter(([, goals]) => goals === topGoals)
    .map(([code]) => getTeam(code))
    .filter(Boolean);

  return {
    totals,
    totalGoals,
    totalMatches: allMatches.length,
    topGoals,
    topTeams,
  };
}

function StatusBadge({ label, tone = "default" }) {
  return <span className={`status-badge status-badge-${tone}`}>{label}</span>;
}

function TeamRow({ teamCode, teamName, emphasized, dimmed, score, winner, align = "left" }) {
  return (
    <div className={`fixture-team-row fixture-team-${align} ${winner ? "winner" : ""} ${dimmed ? "dimmed" : ""}`}>
      <div className="fixture-team-meta">
        <FlagImg code={teamCode} size="sm" alt={`${teamName} flag`} />
        <span className={emphasized ? "team-strong" : ""}>{teamName}</span>
      </div>
      {score !== undefined ? <strong>{score}</strong> : null}
    </div>
  );
}

function ManualGroupScoreInput({ value, onChange }) {
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

function getManualMatchStatus(match, stage) {
  const labels = [];
  if (match.source === "quick-pick-generated-score") {
    labels.push({ label: "Quick Pick", tone: "gold" });
    labels.push({ label: "Generated Score", tone: "muted" });
  } else if (match.source === "manual-score") {
    labels.push({ label: "Manual Score", tone: "green" });
  }

  if (match.selected_outcome === "draw" && stage === "group") {
    labels.push({ label: "Draw", tone: "muted" });
  }

  if (match.result_type === "PENS") {
    labels.push({ label: "Pens", tone: "gold" });
  }

  return labels;
}

function ManualGroupCard({
  group,
  qualifiedCodes,
  getTeam,
  onOpen,
}) {
  const completedLabel = `${group.completedMatches}/${group.totalMatches} picked`;

  return (
    <article
      className="group-card manual-group-card"
      onClick={() => onOpen(group.name)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(group.name);
        }
      }}
      tabIndex={0}
      role="button"
    >
      <div className="group-watermark">{group.letter}</div>
      <div className="group-card-header">
        <div className="manual-group-toggle">
          <div>
            <span className="group-card-label">{group.name}</span>
            <div className="manual-group-summary">
              {group.teams.map((team) => (
                <span className="manual-group-summary-team" key={team.code}>
                  <FlagImg code={team.code} size="sm" alt={`${team.name} flag`} />
                  <span>{team.code}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="badge-row">
            <StatusBadge label={completedLabel} tone={group.isComplete ? "green" : "muted"} />
            <StatusBadge label="Click to Edit" tone="gold" />
          </div>
        </div>
        <div className="badge-row">
          <StatusBadge label={group.autoCalculated ? "Auto-calculated" : "Manual"} tone={group.autoCalculated ? "muted" : "gold"} />
        </div>
      </div>

      <table className="group-standings manual-group-standings">
        <thead>
          <tr>
            <th>Team</th>
            <th>PTS</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
          </tr>
        </thead>
        <tbody>
          {group.table.map((row, index) => {
            const team = getTeam(row.team_code);
            return (
              <tr key={row.team_code} className={index < 2 || qualifiedCodes.has(row.team_code) ? "qualified" : ""}>
                <td>
                  <div className="group-team-cell">
                    <FlagImg code={row.team_code} size="sm" alt={`${team?.name ?? row.team_code} flag`} />
                    <span>{team?.name ?? row.team_code}</span>
                  </div>
                </td>
                <td>{row.points}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}

function ManualGroupModal({
  group,
  qualifiedCodes,
  getTeam,
  overrideVisible,
  onClose,
  onToggleOverride,
  onScoreChange,
  onQuickPick,
  onMoveOverride,
  onClearOverride,
}) {
  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

  if (!group) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="group-modal manual-group-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>

        <div className="modal-header">
          <div className="section-kicker">{group.name.toUpperCase()}</div>
          <h3>{group.name} Editor</h3>
        </div>

        <div className="modal-section">
          <table className="modal-standings manual-modal-standings">
            <thead>
              <tr>
                <th>Team</th>
                <th>PTS</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GD</th>
              </tr>
            </thead>
            <tbody>
              {group.table.map((row, index) => {
                const team = getTeam(row.team_code);
                return (
                  <tr key={row.team_code} className={qualifiedCodes.has(row.team_code) || index < 2 ? "qualified" : ""}>
                    <td>
                      <div className="group-modal-team">
                        <FlagImg code={row.team_code} size="md" alt={`${team?.name ?? row.team_code} flag`} />
                        <span>{team?.name ?? row.team_code}</span>
                      </div>
                    </td>
                    <td>{row.points}</td>
                    <td>{row.wins}</td>
                    <td>{row.draws}</td>
                    <td>{row.losses}</td>
                    <td>{row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="modal-section">
          <div className="manual-subheading">
            <span>Click-To-Pick Matches</span>
            <StatusBadge label={`${group.completedMatches}/${group.totalMatches} picked`} tone={group.isComplete ? "green" : "muted"} />
          </div>
          <div className="manual-group-fixtures">
            {group.matches.map((match) => {
              const home = getTeam(match.home_team);
              const away = getTeam(match.away_team);
              const statusLabels = getManualMatchStatus(match, "group");

              return (
                <div className="manual-group-fixture-card" key={match.match_id}>
                  <div className="manual-group-fixture">
                    <button
                      type="button"
                      className={`manual-pick-button ${match.selected_outcome === "teamA" ? "active" : ""}`}
                      onClick={() => onQuickPick(match, "teamA")}
                    >
                      <FlagImg code={match.home_team} size="sm" alt={`${home?.name ?? match.home_team} flag`} />
                      <span>{home?.name ?? match.home_team}</span>
                    </button>
                    <ManualGroupScoreInput
                      value={match.home_goals ?? ""}
                      onChange={(value) => onScoreChange(match, "homeGoals", value)}
                    />
                    <button
                      type="button"
                      className={`manual-draw-button ${match.selected_outcome === "draw" ? "active" : ""}`}
                      onClick={() => onQuickPick(match, "draw")}
                    >
                      Draw
                    </button>
                    <ManualGroupScoreInput
                      value={match.away_goals ?? ""}
                      onChange={(value) => onScoreChange(match, "awayGoals", value)}
                    />
                    <button
                      type="button"
                      className={`manual-pick-button manual-pick-button-right ${match.selected_outcome === "teamB" ? "active" : ""}`}
                      onClick={() => onQuickPick(match, "teamB")}
                    >
                      <span>{away?.name ?? match.away_team}</span>
                      <FlagImg code={match.away_team} size="sm" alt={`${away?.name ?? match.away_team} flag`} />
                    </button>
                  </div>
                  {statusLabels.length ? (
                    <div className="badge-row manual-match-badges">
                      {statusLabels.map((badge) => (
                        <StatusBadge key={`${match.match_id}-${badge.label}`} label={badge.label} tone={badge.tone} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-section">
          <div className="manual-subheading">
            <span>Standings Override</span>
            <div className="badge-row">
              <button type="button" className="text-button" onClick={() => onToggleOverride(group.name)}>
                {overrideVisible ? "Hide Advanced Override" : "Advanced Override"}
              </button>
              {!group.autoCalculated ? (
                <button type="button" className="text-button" onClick={() => onClearOverride(group.name)}>
                  Reset Override
                </button>
              ) : null}
            </div>
          </div>
          {overrideVisible ? (
            <div className="manual-order-stack">
              {group.table.map((row, index) => {
                const team = getTeam(row.team_code);
                return (
                  <div className="manual-order-row" key={row.team_code}>
                    <span className="manual-order-rank">{index + 1}</span>
                    <div className="manual-order-team">
                      <FlagImg code={row.team_code} size="sm" alt={`${team?.name ?? row.team_code} flag`} />
                      <span>{team?.name ?? row.team_code}</span>
                    </div>
                    <div className="manual-order-actions">
                      <button type="button" className="icon-button" onClick={() => onMoveOverride(group.name, row.team_code, "up", group.table)}>
                        ↑
                      </button>
                      <button type="button" className="icon-button" onClick={() => onMoveOverride(group.name, row.team_code, "down", group.table)}>
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DashboardBar({ entry, index }) {
  return (
    <div
      className={`dashboard-bar-row ${index === 0 ? "top-team" : ""}`}
      style={{ "--bar-delay": `${index * 45}ms` }}
    >
      <div className="dashboard-team">
        <FlagImg code={entry.team.code} size="sm" alt={`${entry.team.name} flag`} />
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

function BracketMatch({ match, getTeam, className = "" }) {
  if (!match) {
    return <div className="bracket-placeholder">Match pending</div>;
  }

  const home = getTeam(match.home_team);
  const away = getTeam(match.away_team);
  const penaltyScore = match.decision === "penalties" && match.penalties
    ? `Pens ${match.penalties.home}-${match.penalties.away}`
    : null;

  return (
    <div className={`bracket-match-card ${className}`.trim()}>
      <div className={`bracket-team-row ${match.winner === match.home_team ? "winner" : ""}`}>
        <div className="bracket-team-meta">
          <FlagImg code={match.home_team} size="sm" alt={`${home?.name ?? match.home_team} flag`} />
          <span>{home?.name ?? match.home_team}</span>
        </div>
        {"home_goals" in match ? <strong>{match.home_goals}</strong> : <span className="score-empty">-</span>}
      </div>
      <div className={`bracket-team-row ${match.winner === match.away_team ? "winner" : ""}`}>
        <div className="bracket-team-meta">
          <FlagImg code={match.away_team} size="sm" alt={`${away?.name ?? match.away_team} flag`} />
          <span>{away?.name ?? match.away_team}</span>
        </div>
        {"away_goals" in match ? <strong>{match.away_goals}</strong> : <span className="score-empty">-</span>}
      </div>
      {penaltyScore ? <div className="bracket-penalty-note">{penaltyScore}</div> : null}
    </div>
  );
}

function ManualKnockoutMatchEditor({ match, getTeam, onChange, onQuickPick }) {
  if (!match?.home_team || !match?.away_team) {
    return <div className="bracket-placeholder">Awaiting previous result</div>;
  }

  const home = getTeam(match.home_team);
  const away = getTeam(match.away_team);
  const tieAfterNinety = match.home_goals != null && match.away_goals != null && match.home_goals === match.away_goals;
  const statusLabels = getManualMatchStatus(match, "knockout");

  return (
    <div className={`bracket-match-card manual-bracket-card ${match.className ?? ""}`.trim()}>
      <div className="badge-row">
        {statusLabels.length ? statusLabels.map((badge) => (
          <StatusBadge key={`${match.match_id}-${badge.label}`} label={badge.label} tone={badge.tone} />
        )) : <StatusBadge label="Awaiting Pick" tone="muted" />}
      </div>
      <div className="manual-knockout-row">
        <button
          type="button"
          className={`manual-pick-button ${match.selected_outcome === "teamA" ? "active" : ""}`}
          onClick={() => onQuickPick(match, "teamA")}
        >
          <FlagImg code={match.home_team} size="sm" alt={`${home?.name ?? match.home_team} flag`} />
          <span>{home?.name ?? match.home_team}</span>
        </button>
        <ManualGroupScoreInput
          value={match.home_goals ?? ""}
          onChange={(value) => onChange(match, { homeGoals: value })}
        />
      </div>
      <div className="manual-knockout-row">
        <button
          type="button"
          className={`manual-pick-button ${match.selected_outcome === "teamB" ? "active" : ""}`}
          onClick={() => onQuickPick(match, "teamB")}
        >
          <FlagImg code={match.away_team} size="sm" alt={`${away?.name ?? match.away_team} flag`} />
          <span>{away?.name ?? match.away_team}</span>
        </button>
        <ManualGroupScoreInput
          value={match.away_goals ?? ""}
          onChange={(value) => onChange(match, { awayGoals: value })}
        />
      </div>
      {tieAfterNinety ? (
        <div className="manual-pens-grid">
          <label className="manual-mini-field">
            <span>Pens {home?.code ?? match.home_team}</span>
            <ManualGroupScoreInput
              value={match.penalties?.home ?? ""}
              onChange={(value) => onChange(match, { penaltiesHome: value, resultType: "PENS" })}
            />
          </label>
          <label className="manual-mini-field">
            <span>Pens {away?.code ?? match.away_team}</span>
            <ManualGroupScoreInput
              value={match.penalties?.away ?? ""}
              onChange={(value) => onChange(match, { penaltiesAway: value, resultType: "PENS" })}
            />
          </label>
        </div>
      ) : null}
      <div className="manual-winner-picks">
        <button
          type="button"
          className={`chip-button ${match.winner === match.home_team ? "active" : ""}`}
          onClick={() => onQuickPick(match, "teamA")}
        >
          {home?.name ?? match.home_team}
        </button>
        <button
          type="button"
          className={`chip-button ${match.winner === match.away_team ? "active" : ""}`}
          onClick={() => onQuickPick(match, "teamB")}
        >
          {away?.name ?? match.away_team}
        </button>
      </div>
      {formatMatchScore(match) ? <div className="manual-result-note">{formatMatchScore(match)}</div> : null}
    </div>
  );
}

function BracketTreeSide({ tree, matchesById, getTeam, side, renderMatch }) {
  const isRight = side === "right";

  const rounds = [
    {
      key: "round32",
      label: "Round of 32",
      className: "bracket-round32",
      matches: tree.roundOf32.map((id, index) => ({
        id,
        match: matchesById[id],
        rowStart: index + 1,
        rowEnd: index + 2,
      })),
    },
    {
      key: "round16",
      label: "Round of 16",
      className: "bracket-round16",
      matches: tree.roundOf16.map((id, index) => ({
        id,
        match: matchesById[id],
        rowStart: index * 2 + 1,
        rowEnd: index * 2 + 3,
      })),
    },
    {
      key: "qf",
      label: "Quarter-Final",
      className: "bracket-qf",
      matches: tree.quarterfinals.map((id, index) => ({
        id,
        match: matchesById[id],
        rowStart: index * 4 + 1,
        rowEnd: index * 4 + 5,
      })),
    },
    {
      key: "sf",
      label: "Semi-Final",
      className: "bracket-sf",
      matches: [
        {
          id: tree.semifinal,
          match: matchesById[tree.semifinal],
          rowStart: 1,
          rowEnd: 9,
        },
      ],
    },
  ];
  const orderedRounds = isRight ? [...rounds].reverse() : rounds;

  return (
    <div className={`bracket-tree-side bracket-tree-${side}`}>
      {orderedRounds.map((round) => (
        <div className={`bracket-tree-round ${round.className}`} key={round.key}>
          <div className="bracket-column-title">{round.label.toUpperCase()}</div>
          <div className="bracket-tree-track">
            {round.matches.map((item) => (
              <div
                className={`bracket-tree-slot bracket-tree-slot-${round.key}`}
                key={item.id}
                style={{
                  gridRow: `${item.rowStart} / ${item.rowEnd}`,
                }}
              >
                <span className="bracket-connector bracket-connector-in" aria-hidden="true" />
                {renderMatch ? renderMatch(item.match) : <BracketMatch match={item.match} getTeam={getTeam} />}
                <span className="bracket-connector bracket-connector-out" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TournamentBracket({ bracket, thirdPlaceMatch, getTeam, renderMatch, bracketRef }) {
  const allMatches = [
    ...bracket.round_of_32,
    ...bracket.round_of_16,
    ...bracket.quarterfinals,
    ...bracket.semifinals,
  ];
  const matchesById = Object.fromEntries(allMatches.map((match) => [match.match_id, match]));
  const finalMatch = bracket.final?.[0];
  const champion = finalMatch?.winner ? getTeam(finalMatch.winner) : null;

  return (
    <div className="bracket-export-shell" ref={bracketRef}>
      <div className="bracketology-grid">
        <BracketTreeSide tree={LEFT_BRACKET_TREE} matchesById={matchesById} getTeam={getTeam} side="left" renderMatch={renderMatch} />

        <div className="bracket-finals-core">
          {champion ? (
            <div className="champion-banner">
              <div className="champion-banner-label">2026 World Cup Champion</div>
              <div className="champion-banner-body">
                <img src={TROPHY_PNG_URL} alt="" className="trophy-png" />
                <FlagImg code={champion.code} size="lg" alt={`${champion.name} flag`} />
                <strong className="champion-banner-name">{champion.name}</strong>
              </div>
            </div>
          ) : null}
          <div className="bracket-finals-matches">
            <div>
              <div className="bracket-column-title">FINAL</div>
              <div className="bracket-finals-stack">
                {bracket.final.map((match) => (
                  renderMatch
                    ? <div key={match.match_id}>{renderMatch({ ...match, className: "world-cup-final-card" })}</div>
                    : <BracketMatch key={match.match_id} match={match} getTeam={getTeam} className="world-cup-final-card" />
                ))}
              </div>
            </div>
            <div>
              <div className="bracket-column-title third-place-title">THIRD PLACE</div>
              <div className="bracket-finals-stack">
                {thirdPlaceMatch ? (
                  renderMatch ? renderMatch(thirdPlaceMatch) : <BracketMatch match={thirdPlaceMatch} getTeam={getTeam} />
                ) : (
                  <div className="bracket-placeholder">Awaiting semifinal results</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <BracketTreeSide tree={RIGHT_BRACKET_TREE} matchesById={matchesById} getTeam={getTeam} side="right" renderMatch={renderMatch} />
      </div>
    </div>
  );
}

function GroupModal({ group, onClose, getTeam }) {
  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

  if (!group) {
    return null;
  }

  const qualifiedCodes = new Set(group.qualified_team_codes ?? []);
  const groupedMatches = GROUP_MATCHDAY_LABELS.map((label, index) => ({
    label,
    matches: (group.matches ?? []).slice(index * 2, index * 2 + 2),
  }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="group-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>

        <div className="modal-header">
          <div className="section-kicker">{group.name.toUpperCase()}</div>
          <h3>Group {group.letter} Results</h3>
        </div>

        <div className="modal-section">
          <table className="modal-standings">
            <thead>
              <tr>
                <th>Team</th>
                <th>PTS</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
              </tr>
            </thead>
            <tbody>
              {group.table.map((row, index) => {
                const team = getTeam(row.team_code);
                return (
                  <tr key={row.team_code} className={qualifiedCodes.has(row.team_code) || index < 2 ? "qualified" : ""}>
                    <td>
                      <div className="group-modal-team">
                        <FlagImg code={row.team_code} size="md" alt={`${team?.name ?? row.team_code} flag`} />
                        <span>{team?.name ?? row.team_code}</span>
                      </div>
                    </td>
                    <td>{row.points}</td>
                    <td>{row.wins}</td>
                    <td>{row.draws}</td>
                    <td>{row.losses}</td>
                    <td>{row.goals_for}</td>
                    <td>{row.goals_against}</td>
                    <td>{row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="modal-section">
          {groupedMatches.map((matchday) => (
            <div className="matchday-block" key={matchday.label}>
              <div className="matchday-label">{matchday.label}</div>
              <div className="fixture-list">
                {matchday.matches.map((match) => {
                  const home = getTeam(match.home_team);
                  const away = getTeam(match.away_team);
                  const isDraw = match.home_goals === match.away_goals;
                  return (
                    <div className="fixture-row" key={`${match.home_team}-${match.away_team}-${match.home_goals}-${match.away_goals}`}>
                      <TeamRow
                        teamCode={match.home_team}
                        teamName={home?.name ?? match.home_team}
                        emphasized={isDraw || match.home_goals > match.away_goals}
                        dimmed={!isDraw && match.home_goals < match.away_goals}
                        winner={match.home_goals > match.away_goals}
                      />
                      <div className="fixture-score">
                        {match.home_goals} - {match.away_goals}
                      </div>
                      <TeamRow
                        teamCode={match.away_team}
                        teamName={away?.name ?? match.away_team}
                        emphasized={isDraw || match.away_goals > match.home_goals}
                        dimmed={!isDraw && match.away_goals < match.home_goals}
                        winner={match.away_goals > match.home_goals}
                        align="right"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonSection({ manualTournament, simulationTournament, comparison, getTeam }) {
  if (!manualTournament || !simulationTournament || !comparison) {
    return null;
  }

  const manualChampion = manualTournament.champion ? getTeam(manualTournament.champion) : null;
  const simulatedChampion = simulationTournament.champion ? getTeam(simulationTournament.champion) : null;
  const manualRunnerUp = manualTournament.runnerUp ? getTeam(manualTournament.runnerUp) : null;
  const simulatedRunnerUp = simulationTournament.runner_up ? getTeam(simulationTournament.runner_up) : null;

  return (
    <section className="surface-card full-span comparison-panel">
      <div className="section-kicker">COMPARISON</div>
      <h2 className="section-title">My Prediction vs Monte Carlo</h2>
      <div className="comparison-grid">
        <div className="comparison-column">
          <div className="manual-subheading">
            <span>My Prediction</span>
            <StatusBadge label="Manual" tone="gold" />
          </div>
          <div className="comparison-summary">
            <div><strong>Champion:</strong> {manualChampion?.name ?? "--"}</div>
            <div><strong>Runner-up:</strong> {manualRunnerUp?.name ?? "--"}</div>
            <div><strong>Semifinalists:</strong> {manualTournament.semifinalists.map((code) => getTeam(code)?.name ?? code).join(", ") || "--"}</div>
          </div>
        </div>
        <div className="comparison-column">
          <div className="manual-subheading">
            <span>Monte Carlo Result</span>
            <StatusBadge label="Simulator" tone="muted" />
          </div>
          <div className="comparison-summary">
            <div><strong>Champion:</strong> {simulatedChampion?.name ?? "--"}</div>
            <div><strong>Runner-up:</strong> {simulatedRunnerUp?.name ?? "--"}</div>
            <div><strong>Semifinalists:</strong> {simulationTournament.semifinalists.map((code) => getTeam(code)?.name ?? code).join(", ") || "--"}</div>
          </div>
        </div>
      </div>
      <div className="comparison-split">
        <div>
          <div className="manual-subheading">
            <span>Top Group Finishers</span>
          </div>
          <div className="comparison-list">
            {manualTournament.groupResults.map((group) => {
              const manualWinner = comparison.manualFirsts[group.name];
              const simulatedWinner = comparison.simulatedFirsts[group.name];
              const differs = manualWinner !== simulatedWinner;
              return (
                <div key={group.name} className={`comparison-list-row ${differs ? "differs" : ""}`}>
                  <span>{group.name}</span>
                  <span>{getTeam(manualWinner)?.name ?? manualWinner}</span>
                  <span>{getTeam(simulatedWinner)?.name ?? simulatedWinner}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="manual-subheading">
            <span>Knockout Differences</span>
          </div>
          <div className="comparison-list">
            {comparison.knockoutDifferences.length ? (
              comparison.knockoutDifferences.map((difference) => (
                <div key={difference.match_id} className="comparison-list-row differs">
                  <span>{difference.round}</span>
                  <span>{getTeam(difference.manualWinner)?.name ?? difference.manualWinner}</span>
                  <span>{getTeam(difference.simulatedWinner)?.name ?? difference.simulatedWinner}</span>
                </div>
              ))
            ) : (
              <div className="empty-message">No knockout differences with the latest simulation.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "light");
  const [activeMode, setActiveMode] = useState("simulator");
  const [groups, setGroups] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [predictionForm, setPredictionForm] = useState({
    home_team_code: "FRA",
    away_team_code: "ARG",
    stage: "group",
  });
  const [simulationCount, setSimulationCount] = useState(DEFAULT_SIMULATION_COUNT);
  const [simulationData, setSimulationData] = useState(null);
  const [sampleTournament, setSampleTournament] = useState(null);
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedManualGroup, setSelectedManualGroup] = useState(null);
  const [manualPredictionState, setManualPredictionState] = useState(null);
  const [manualSaved, setManualSaved] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");
  const manualBracketRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingInitial(true);
        const [groupsResponse, teamsResponse, fixturesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/groups`),
          fetch(`${API_BASE_URL}/teams`),
          fetch(`${API_BASE_URL}/fixtures`),
        ]);

        if (!groupsResponse.ok || !teamsResponse.ok || !fixturesResponse.ok) {
          throw new Error("Could not load the API. Make sure the backend is running.");
        }

        const groupsData = await groupsResponse.json();
        const teamsData = await teamsResponse.json();
        const fixturesData = await fixturesResponse.json();
        setGroups(groupsData.groups);
        setTeams(teamsData.teams);
        setFixtures(fixturesData.group_stage);
      } catch (caughtError) {
        setError(caughtError.message);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadThirdPlaceMatch() {
      if (sampleTournament?.third_place_match) {
        setThirdPlaceMatch(sampleTournament.third_place_match);
        return;
      }

      if (!sampleTournament?.bracket?.semifinals?.length) {
        setThirdPlaceMatch(null);
        return;
      }

      const semifinalLosers = sampleTournament.bracket.semifinals.map((match) =>
        match.winner === match.home_team ? match.away_team : match.home_team,
      );

      if (semifinalLosers.length !== 2) {
        setThirdPlaceMatch(null);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/predict-match`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            home_team_code: semifinalLosers[0],
            away_team_code: semifinalLosers[1],
            stage: "knockout",
          }),
        });

        if (!response.ok) {
          throw new Error("Could not generate third-place match.");
        }

        const data = await response.json();
        const homeGoals = data.sample_score.home_goals;
        const awayGoals = data.sample_score.away_goals;
        let winner = data.home_team.code;

        if (awayGoals > homeGoals) {
          winner = data.away_team.code;
        } else if (homeGoals === awayGoals) {
          winner =
            data.probabilities.home_advance >= data.probabilities.away_advance
              ? data.home_team.code
              : data.away_team.code;
        }

        setThirdPlaceMatch({
          match_id: "3P",
          home_team: data.home_team.code,
          away_team: data.away_team.code,
          home_goals: homeGoals,
          away_goals: awayGoals,
          winner,
          decision: data.sample_score.decision,
          penalties: data.sample_score.penalties,
        });
      } catch {
        setThirdPlaceMatch({
          match_id: "3P",
          home_team: semifinalLosers[0],
          away_team: semifinalLosers[1],
        });
      }
    }

    loadThirdPlaceMatch();
  }, [sampleTournament]);

  const teamLookup = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.code, team])),
    [teams],
  );
  const sortedTeams = useMemo(
    () =>
      [...teams].sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
      ),
    [teams],
  );

  function getTeam(code) {
    return teamLookup[code];
  }

  useEffect(() => {
    if (!groups.length || !fixtures.length) {
      return;
    }

    const loaded = loadManualPredictionState(groups, fixtures);
    setManualPredictionState(loaded);
    if (window.location.hash.startsWith("#prediction=")) {
      setActiveMode("manual");
    }
  }, [groups, fixtures]);

  const manualTournament = useMemo(() => {
    if (!manualPredictionState || !groups.length || !fixtures.length || !teams.length) {
      return null;
    }

    const derived = buildManualTournament(manualPredictionState, groups, fixtures, teamLookup);
    return derived;
  }, [fixtures, groups, manualPredictionState, teamLookup, teams.length]);

  useEffect(() => {
    if (!manualPredictionState || !manualTournament) {
      return;
    }

    const persisted = buildPersistedManualState(manualPredictionState, manualTournament);
    saveManualPredictionState(persisted);
    setManualSaved(true);
  }, [manualPredictionState, manualTournament]);

  useEffect(() => {
    setPrediction(null);
  }, [predictionForm.home_team_code, predictionForm.away_team_code, predictionForm.stage]);

  useEffect(() => {
    if (!shareStatus) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setShareStatus(""), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [shareStatus]);

  function handleManualGroupScoreChange(match, side, value) {
    setManualSaved(false);
    setManualPredictionState((current) => updateGroupScore(current, match, side, value));
  }

  function handleManualGroupQuickPick(match, selectedOutcome) {
    setManualSaved(false);
    setManualPredictionState((current) => quickPickGroupMatch(current, match, teamLookup, selectedOutcome));
  }

  function handleMoveGroupOverride(groupName, teamCode, direction, currentTable) {
    setManualSaved(false);
    setManualPredictionState((current) => ({
      ...current,
      groupOverrides: applyGroupOverride(
        groupName,
        currentTable.map((row) => row.team_code),
        teamCode,
        direction,
        current.groupOverrides,
      ),
      updatedAt: Date.now(),
    }));
  }

  function handleClearGroupOverride(groupName) {
    setManualSaved(false);
    setManualPredictionState((current) => clearGroupOverride(current, groupName));
  }

  function handleThirdPlaceToggle(teamCode) {
    setManualSaved(false);
    setManualPredictionState((current) => {
      const baselineSelection = current.selectedThirdPlaceTeams.length
        ? current.selectedThirdPlaceTeams
        : manualTournament?.bestThirdPlaces.map((team) => team.team_code) ?? [];
      const exists = baselineSelection.includes(teamCode);
      let nextCodes = exists
        ? baselineSelection.filter((code) => code !== teamCode)
        : [...baselineSelection, teamCode];

      if (nextCodes.length > 8) {
        nextCodes = baselineSelection;
      }

      return updateSelectedThirdPlaces(current, nextCodes);
    });
  }

  function handleKnockoutMatchChange(match, patch) {
    setManualSaved(false);
    setManualPredictionState((current) => updateKnockoutMatch(current, match, patch));
  }

  function handleKnockoutQuickPick(match, selectedOutcome) {
    setManualSaved(false);
    setManualPredictionState((current) => quickPickKnockoutMatch(current, match, teamLookup, selectedOutcome));
  }

  function handleToggleAdvancedOverride(groupName) {
    setManualPredictionState((current) => toggleAdvancedOverride(current, groupName));
  }

  function openManualGroupEditor(groupName) {
    setSelectedManualGroup(groupName);
  }

  async function loadHtml2Canvas() {
    if (window.html2canvas) {
      return window.html2canvas;
    }

    const existing = document.getElementById(MANUAL_EXPORT_SCRIPT_ID);
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", () => resolve(window.html2canvas), { once: true });
        existing.addEventListener("error", reject, { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = MANUAL_EXPORT_SCRIPT_ID;
      script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      script.async = true;
      script.onload = () => resolve(window.html2canvas);
      script.onerror = () => reject(new Error("Could not load bracket export helper."));
      document.head.appendChild(script);
    });
  }

  async function handleExportBracketImage() {
    if (!manualBracketRef.current) {
      return;
    }

    try {
      const html2canvas = await loadHtml2Canvas();
      const exportThemeBackground = getComputedStyle(document.documentElement)
        .getPropertyValue("--bg-primary")
        .trim() || "#0f1117";
      const canvas = await html2canvas(manualBracketRef.current, {
        backgroundColor: exportThemeBackground,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = "world-cup-2026-my-prediction.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      setShareStatus("Bracket image exported");
    } catch (caughtError) {
      setError(caughtError.message);
    }
  }

  async function handleCopyShareLink() {
    if (!manualPredictionState) {
      return;
    }

    const hash = encodePredictionHash(buildPersistedManualState(manualPredictionState, manualTournament));
    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
      setShareStatus("Share link copied");
    } catch {
      setError("Could not copy the share link.");
    }
  }

  function handleResetManualPrediction() {
    if (!groups.length || !fixtures.length) {
      return;
    }

    setManualPredictionState(resetManualPrediction(groups, fixtures));
    setShareStatus("Manual prediction reset");
  }

  async function handlePredictMatch(event) {
    event.preventDefault();
    setPredicting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/predict-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(predictionForm),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.detail || "Prediction failed.");
      }

      setPrediction(await response.json());
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setPredicting(false);
    }
  }

  async function runSingleTournament() {
    setSimulating(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/simulate-one`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Single tournament simulation failed.");
      }
      setSampleTournament(await response.json());
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setSimulating(false);
    }
  }

  async function runSimulationBatch(count) {
    setSimulating(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/simulate-tournament`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ simulations: count }),
      });

      if (!response.ok) {
        throw new Error("Tournament simulation failed.");
      }

      const data = await response.json();
      setSimulationData(data);
      setSampleTournament(data.sample_tournament);
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setSimulating(false);
    }
  }

  function openGroupDetails(group) {
    if (!sampleTournament) {
      setError("Simulate a tournament to see group match results.");
      return;
    }
    setSelectedGroup({
      ...group,
      qualified_team_codes: sampleTournament.qualified_for_round_of_32 ?? [],
    });
  }

  function handleGroupCardKeydown(event, group) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openGroupDetails(group);
    }
  }

  const displayedGroups = sampleTournament?.group_results ?? groups;
  const qualifiedGroupCodes = useMemo(
    () => new Set(sampleTournament?.qualified_for_round_of_32 ?? []),
    [sampleTournament],
  );
  const manualQualifiedCodes = useMemo(
    () => new Set(manualTournament?.qualifiedForRoundOf32 ?? []),
    [manualTournament],
  );
  const comparisonData = useMemo(
    () => getComparisonData(manualTournament, sampleTournament),
    [manualTournament, sampleTournament],
  );
  const probabilityRows = simulationData?.probabilities?.slice(0, 12) ?? [];
  const homeTeam = getTeam(predictionForm.home_team_code);
  const awayTeam = getTeam(predictionForm.away_team_code);
  const isKnockoutPrediction = prediction?.stage === "knockout";
  const predictionAdvancingTeam = getPredictionAdvancingTeam(prediction);
  const predictionWinnerCode = getPredictionSampleWinnerCode(prediction);
  const displayedTournamentGoalData = useMemo(
    () => deriveDisplayedTournamentGoalData(sampleTournament, thirdPlaceMatch, teams, getTeam),
    [getTeam, sampleTournament, teams, thirdPlaceMatch],
  );
  const sampleAverageGoals =
    displayedTournamentGoalData?.totalMatches
      ? displayedTournamentGoalData.totalGoals / displayedTournamentGoalData.totalMatches
      : null;
  const finalMatch = sampleTournament?.bracket?.final?.[0];
  const championCode = finalMatch?.winner;
  const runnerUpCode = finalMatch
    ? finalMatch.winner === finalMatch.home_team
      ? finalMatch.away_team
      : finalMatch.home_team
    : null;
  const thirdPlaceCode = thirdPlaceMatch?.winner ?? null;
  const championTeam = championCode ? getTeam(championCode) : null;
  const runnerUpTeam = runnerUpCode ? getTeam(runnerUpCode) : null;
  const thirdPlaceTeam = thirdPlaceCode ? getTeam(thirdPlaceCode) : null;
  const sampleChampionGoals =
    championCode && displayedTournamentGoalData?.totals
      ? displayedTournamentGoalData.totals[championCode] ?? null
      : null;
  const sampleTopTeamGoals = displayedTournamentGoalData?.topGoals ?? null;
  const sampleTopScoringTeams = displayedTournamentGoalData?.topTeams ?? null;
  const statsMostLikelyWinner = simulationData?.summary?.most_likely_winner ?? championTeam;
  const statsAverageGoals = simulationData?.summary?.average_goals_per_match ?? sampleAverageGoals;
  const statsSimulationCount = simulationData?.simulations ?? (sampleTournament ? 1 : null);
  const batchMostWinsTeams =
    simulationData?.probabilities?.length
      ? (() => {
          const maxChampionRate = Math.max(...simulationData.probabilities.map((entry) => entry.champion));
          return simulationData.probabilities.filter((entry) => entry.champion === maxChampionRate);
        })()
      : [];
  const batchMostWinsCount =
    simulationData?.simulations && batchMostWinsTeams.length
      ? Math.round(batchMostWinsTeams[0].champion * simulationData.simulations)
      : null;
  const batchTopScorerGoals =
    simulationData?.probabilities?.length
      ? Math.max(...simulationData.probabilities.map((entry) => entry.average_goals_scored))
      : null;
  const batchTopScoringTeams =
    simulationData?.probabilities?.length
      ? simulationData.probabilities
          .filter((entry) => entry.average_goals_scored === batchTopScorerGoals)
          .map((entry) => entry.team)
      : [];
  const normalizedSimulationCount = Math.min(10000, Math.max(1, Number(simulationCount) || DEFAULT_SIMULATION_COUNT));
  const manualChampionTeam = manualTournament?.champion ? getTeam(manualTournament.champion) : null;
  const manualRunnerUpTeam = manualTournament?.runnerUp ? getTeam(manualTournament.runnerUp) : null;
  const manualThirdPlaceTeam = manualTournament?.thirdPlace ? getTeam(manualTournament.thirdPlace) : null;
  const manualDisplayedGoalData = useMemo(
    () => deriveDisplayedTournamentGoalData(manualTournament, manualTournament?.thirdPlaceMatch, teams, getTeam),
    [getTeam, manualTournament, teams],
  );
  const manualAverageGoals =
    manualDisplayedGoalData?.totalMatches
      ? manualDisplayedGoalData.totalGoals / manualDisplayedGoalData.totalMatches
      : null;
  const manualTopScorerGoals = manualDisplayedGoalData?.topGoals ?? null;
  const manualTopScoringTeams = manualDisplayedGoalData?.topTeams ?? null;

  return (
    <div className="app-shell">
      <div className={`loading-overlay ${simulating ? "visible" : ""}`}>
        <div className="spinner" />
        <p>Running tournament simulations...</p>
      </div>

      <header className="hero-shell">
        <ThemeToggle
          theme={theme}
          onToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        />

        <h1 className="hero-title">FIFA WORLD CUP 2026 PREDICTOR</h1>
        <p className="hero-subtitle">
          Simulate the full 48-team World Cup with score-based match outcomes, live group tables,
          a real knockout path, and a cleaner matchday experience.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => runSimulationBatch(DEFAULT_SIMULATION_COUNT)}
            disabled={simulating}
          >
            Simulate {DEFAULT_SIMULATION_COUNT} Tournaments
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={runSingleTournament}
            disabled={simulating}
          >
            Simulate One Tournament
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => runSimulationBatch(normalizedSimulationCount)}
            disabled={simulating}
          >
            Run Custom Batch
          </button>
        </div>

        <div className="hero-controls">
          <label className="inline-field">
            <span>CUSTOM COUNT</span>
            <input
              type="number"
              min="1"
              max="10000"
              value={simulationCount}
              onChange={(event) => {
                const rawValue = event.target.value;
                if (rawValue === "") {
                  setSimulationCount("");
                  return;
                }

                const normalized = String(Math.min(10000, Math.max(1, Number(rawValue))));
                setSimulationCount(normalized);
              }}
            />
          </label>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="mode-switcher">
        <button
          type="button"
          className={`mode-tab ${activeMode === "simulator" ? "active" : ""}`}
          onClick={() => setActiveMode("simulator")}
        >
          Simulator Mode
        </button>
        <button
          type="button"
          className={`mode-tab ${activeMode === "manual" ? "active" : ""}`}
          onClick={() => setActiveMode("manual")}
        >
          Predictor Mode
        </button>
      </section>

      {activeMode === "simulator" ? (
        <>
          {sampleTournament && championTeam && runnerUpTeam && thirdPlaceTeam ? (
            <section className="podium-grid">
              <PodiumCard label="RUNNER-UP" teamCode={runnerUpTeam.code} teamName={runnerUpTeam.name} tone="silver" />
              <PodiumCard label="CHAMPION" teamCode={championTeam.code} teamName={championTeam.name} tone="gold" size="featured" />
              <PodiumCard label="3RD PLACE" teamCode={thirdPlaceTeam.code} teamName={thirdPlaceTeam.name} tone="bronze" />
            </section>
          ) : null}

          <section className="stats-grid">
            <StatCard
              label="MOST LIKELY WINNER"
              value={
                statsMostLikelyWinner ? (
                  <span className="winner-inline">
                    <FlagImg code={statsMostLikelyWinner.code} size="sm" alt={`${statsMostLikelyWinner.name} flag`} />
                    {statsMostLikelyWinner.name}
                  </span>
                ) : (
                  "Awaiting simulation"
                )
              }
            />
            <StatCard label="AVG GOALS / MATCH" value={statsAverageGoals != null ? formatDecimal(statsAverageGoals) : "--"} />
            <StatCard label="SIMULATIONS" value={statsSimulationCount != null ? statsSimulationCount.toLocaleString() : "--"}>
              {batchMostWinsTeams.length ? (
                <div className="stat-scroll-area">
                  <div className="stat-inline-row">
                    <span className="stat-stack-label">Most Wins</span>
                    <div className="stat-inline-value-pair">
                      <strong>{batchMostWinsCount}</strong>
                      <div className="stat-support stat-support-multi">
                        {batchMostWinsTeams.map((entry) => (
                          <span className="stat-support-chip" key={entry.team.code}>
                            <FlagImg code={entry.team.code} size="sm" alt={`${entry.team.name} flag`} />
                            {entry.team.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="stat-inline-row">
                    <span className="stat-stack-label">Batch Top Scorer</span>
                    <div className="stat-inline-value-pair">
                      <strong>{formatDecimal(batchTopScorerGoals)}</strong>
                      <div className="stat-support stat-support-multi">
                        {batchTopScoringTeams.map((team) => (
                          <span className="stat-support-chip" key={team.code}>
                            <FlagImg code={team.code} size="sm" alt={`${team.name} flag`} />
                            {team.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </StatCard>
            <StatCard label="TOP SCORER" value={sampleTopTeamGoals != null ? formatDecimal(sampleTopTeamGoals) : "--"}>
              {sampleTopScoringTeams?.length ? (
                <div className="stat-support stat-support-multi">
                  {sampleTopScoringTeams.map((team) => (
                    <span className="stat-support-chip" key={team.code}>
                      <FlagImg code={team.code} size="sm" alt={`${team.name} flag`} />
                      {team.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </StatCard>
          </section>

          <div className="section-rule" />

          <main className="main-grid">
            <section className="surface-card predictor-panel">
              <div className="section-kicker">MATCH PREDICTOR</div>
              <h2 className="section-title">Head-To-Head Model</h2>

              <form className="predictor-form" onSubmit={handlePredictMatch}>
                <label className="field-block">
                  <span>HOME TEAM</span>
                  <select
                    value={predictionForm.home_team_code}
                    onChange={(event) =>
                      setPredictionForm((current) => ({
                        ...current,
                        home_team_code: event.target.value,
                      }))
                    }
                  >
                    {sortedTeams.map((team) => (
                      <option key={team.code} value={team.code}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-block">
                  <span>AWAY TEAM</span>
                  <select
                    value={predictionForm.away_team_code}
                    onChange={(event) =>
                      setPredictionForm((current) => ({
                        ...current,
                        away_team_code: event.target.value,
                      }))
                    }
                  >
                    {sortedTeams.map((team) => (
                      <option key={team.code} value={team.code}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-block">
                  <span>STAGE</span>
                  <select
                    value={predictionForm.stage}
                    onChange={(event) =>
                      setPredictionForm((current) => ({
                        ...current,
                        stage: event.target.value,
                      }))
                    }
                  >
                    <option value="group">Group Stage</option>
                    <option value="knockout">Knockout</option>
                  </select>
                </label>

                <div className="vs-card">
                  <div className={`vs-team ${predictionWinnerCode === homeTeam?.code ? "vs-team-winner" : ""}`}>
                    <FlagImg code={homeTeam?.code} size="lg" alt={`${homeTeam?.name ?? ""} flag`} />
                    <div className="vs-name">{homeTeam?.name}</div>
                    <div className="vs-code">{homeTeam?.code}</div>
                  </div>
                  <div className={`vs-pill ${prediction ? "vs-score" : ""}`}>{formatPredictionScore(prediction)}</div>
                  <div className={`vs-team ${predictionWinnerCode === awayTeam?.code ? "vs-team-winner" : ""}`}>
                    <FlagImg code={awayTeam?.code} size="lg" alt={`${awayTeam?.name ?? ""} flag`} />
                    <div className="vs-name">{awayTeam?.name}</div>
                    <div className="vs-code">{awayTeam?.code}</div>
                  </div>
                </div>

                <button type="submit" className="button button-primary full-width" disabled={predicting}>
                  {predicting ? "Calculating..." : "Predict Match"}
                </button>
              </form>

              {prediction ? (
                <div className="predictor-results">
                  <div className="result-meta-row">
                    <span className="result-tag">{prediction.stage.toUpperCase()}</span>
                    <span className="result-scoreline">
                      {predictionAdvancingTeam ? `${predictionAdvancingTeam.name} advances` : "MODEL SNAPSHOT"}
                    </span>
                  </div>

                  <div className="metric-pair-grid">
                    <div className="metric-tile">
                      <span>EXPECTED GOALS</span>
                      <strong>
                        {formatDecimal(prediction.probabilities.expected_goals.home)} -{" "}
                        {formatDecimal(prediction.probabilities.expected_goals.away)}
                      </strong>
                    </div>
                    <div className="metric-tile">
                      <span>LIKELY SCORELINES</span>
                      <strong>{prediction.probabilities.top_scorelines[0]?.score}</strong>
                    </div>
                  </div>

                  <div className="probability-stack">
                    <div className="probability-row">
                      <span>{prediction.home_team.name} win</span>
                      <div className="mini-meter">
                        <div className="mini-meter-fill" style={{ width: `${prediction.probabilities.home_win * 100}%` }} />
                      </div>
                      <strong>{formatPercent(prediction.probabilities.home_win)}</strong>
                    </div>
                    <div className="probability-row">
                      <span>{isKnockoutPrediction ? "Draw after 90" : "Draw"}</span>
                      <div className="mini-meter">
                        <div className="mini-meter-fill gold" style={{ width: `${prediction.probabilities.draw * 100}%` }} />
                      </div>
                      <strong>{formatPercent(prediction.probabilities.draw)}</strong>
                    </div>
                    <div className="probability-row">
                      <span>{prediction.away_team.name} win</span>
                      <div className="mini-meter">
                        <div className="mini-meter-fill muted" style={{ width: `${prediction.probabilities.away_win * 100}%` }} />
                      </div>
                      <strong>{formatPercent(prediction.probabilities.away_win)}</strong>
                    </div>
                    {isKnockoutPrediction ? (
                      <>
                        <div className="probability-row">
                          <span>{prediction.home_team.name} advance</span>
                          <div className="mini-meter">
                            <div className="mini-meter-fill" style={{ width: `${prediction.probabilities.home_advance * 100}%` }} />
                          </div>
                          <strong>{formatPercent(prediction.probabilities.home_advance)}</strong>
                        </div>
                        <div className="probability-row">
                          <span>{prediction.away_team.name} advance</span>
                          <div className="mini-meter">
                            <div className="mini-meter-fill muted" style={{ width: `${prediction.probabilities.away_advance * 100}%` }} />
                          </div>
                          <strong>{formatPercent(prediction.probabilities.away_advance)}</strong>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="scoreline-chip-row">
                    {prediction.probabilities.top_scorelines.map((scoreline) => (
                      <div className="scoreline-chip" key={scoreline.score}>
                        <span>{scoreline.score}</span>
                        <strong>{formatPercent(scoreline.probability)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="surface-card dashboard-panel">
              <div className="section-kicker">SIMULATION DASHBOARD</div>
              <h2 className="section-title">Champion Probability</h2>
              {simulationData ? (
                <div className="dashboard-bars">
                  {probabilityRows.map((entry, index) => (
                    <DashboardBar key={entry.team.code} entry={entry} index={index} />
                  ))}
                </div>
              ) : (
                <div className="empty-message">Run a batch simulation to unlock the probability dashboard.</div>
              )}
            </section>

            <section className="surface-card full-span">
              <div className="section-kicker">GROUP STAGE</div>
              <h2 className="section-title">Tables</h2>
              {loadingInitial ? (
                <div className="empty-message">Loading group data...</div>
              ) : (
                <div className="groups-grid">
                  {displayedGroups.map((group) => {
                    const letter = group.letter || group.name.replace("Group ", "");
                    return (
                      <article
                        className="group-card"
                        key={group.name}
                        onClick={() => openGroupDetails(group)}
                        onKeyDown={(event) => handleGroupCardKeydown(event, group)}
                        tabIndex={0}
                        role="button"
                      >
                        <div className="group-watermark">{letter}</div>
                        <div className="group-card-header">
                          <span className="group-card-label">{group.name}</span>
                        </div>

                        {group.table ? (
                          <table className="group-standings">
                            <thead>
                              <tr>
                                <th>TEAM</th>
                                <th>PTS</th>
                                <th>W</th>
                                <th>D</th>
                                <th>L</th>
                                <th>GD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.table.map((row, index) => {
                                const team = getTeam(row.team_code);
                                return (
                                  <tr key={row.team_code} className={index < 2 || qualifiedGroupCodes.has(row.team_code) ? "qualified" : ""}>
                                    <td>
                                      <div className="group-team-cell">
                                        <FlagImg code={row.team_code} size="sm" alt={`${team?.name ?? row.team_code} flag`} />
                                        <span>{row.team_code}</span>
                                      </div>
                                    </td>
                                    <td>{row.points}</td>
                                    <td>{row.wins}</td>
                                    <td>{row.draws}</td>
                                    <td>{row.losses}</td>
                                    <td>{row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div className="group-team-list">
                            {group.teams.map((team) => (
                              <div className="group-team-item" key={team.code}>
                                <div className="group-team-name">
                                  <FlagImg code={team.code} size="sm" alt={`${team.name} flag`} />
                                  <span>{team.name}</span>
                                </div>
                                <span className="group-team-rank">#{team.fifa_ranking}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="surface-card full-span bracket-section">
              <h2 className="section-title bracket-section-title">Knockout Stage</h2>
              {sampleTournament ? (
                <TournamentBracket bracket={sampleTournament.bracket} thirdPlaceMatch={thirdPlaceMatch} getTeam={getTeam} />
              ) : (
                <div className="empty-message">Run a tournament to generate the knockout bracket.</div>
              )}
            </section>
          </main>
        </>
      ) : (
        <>
          <section className="surface-card manual-toolbar">
            <div>
              <div className="section-kicker">MY PREDICTION</div>
              <h2 className="section-title">Build Your Bracket</h2>
            </div>
            <div className="badge-row">
              <StatusBadge label="Manual" tone="gold" />
              <StatusBadge label={manualSaved ? "Saved" : "Editing"} tone={manualSaved ? "green" : "muted"} />
              {shareStatus ? <StatusBadge label={shareStatus} tone="muted" /> : null}
            </div>
            <div className="manual-toolbar-actions">
              <button type="button" className="button button-secondary" onClick={handleExportBracketImage}>
                Export Bracket Image
              </button>
              <button type="button" className="button button-secondary" onClick={handleCopyShareLink}>
                Copy Share Link
              </button>
              <button type="button" className="button button-primary" onClick={handleResetManualPrediction}>
                Reset My Prediction
              </button>
            </div>
          </section>

          {manualTournament && manualChampionTeam && manualRunnerUpTeam && manualThirdPlaceTeam ? (
            <section className="podium-grid">
              <PodiumCard label="RUNNER-UP" teamCode={manualRunnerUpTeam.code} teamName={manualRunnerUpTeam.name} tone="silver" />
              <PodiumCard label="CHAMPION" teamCode={manualChampionTeam.code} teamName={manualChampionTeam.name} tone="gold" size="featured" />
              <PodiumCard label="3RD PLACE" teamCode={manualThirdPlaceTeam.code} teamName={manualThirdPlaceTeam.name} tone="bronze" />
            </section>
          ) : null}

          <section className="stats-grid">
            <StatCard label="AVG GOALS / MATCH" value={manualAverageGoals != null ? formatDecimal(manualAverageGoals) : "--"} />
            <StatCard label="TOP SCORER" value={manualTopScorerGoals != null ? formatDecimal(manualTopScorerGoals) : "--"}>
              {manualTopScoringTeams?.length ? (
                <div className="stat-support stat-support-multi">
                  {manualTopScoringTeams.map((team) => (
                    <span className="stat-support-chip" key={team.code}>
                      <FlagImg code={team.code} size="sm" alt={`${team.name} flag`} />
                      {team.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </StatCard>
          </section>

          <section className="surface-card full-span">
            <div className="section-kicker">GROUP STAGE</div>
            <h2 className="section-title">Group Stage</h2>
            <div className="groups-grid manual-groups-grid">
              {manualTournament?.groupResults.map((group) => (
                <ManualGroupCard
                  key={group.name}
                  group={group}
                  qualifiedCodes={manualQualifiedCodes}
                  getTeam={getTeam}
                  onOpen={openManualGroupEditor}
                />
              ))}
            </div>
          </section>

          <section className="surface-card full-span">
            <div className="section-kicker">THIRD-PLACE ADVANCERS</div>
            <h2 className="section-title">Automatic Best Eight Third-Place Teams</h2>
            <p className="empty-message">
              Predictor mode auto-selects the best eight third-place teams using points, goal difference,
              and goals scored, just like simulator mode.
            </p>
            <div className="third-place-selector">
              {manualTournament?.bestThirdPlaces.map((team) => {
                const resolvedTeam = getTeam(team.team_code);
                if (!resolvedTeam) {
                  return null;
                }

                return (
                  <div
                    key={`${team.group_name}-${team.team_code}`}
                    className="third-place-chip active third-place-chip-static"
                  >
                    <FlagImg code={resolvedTeam.code} size="sm" alt={`${resolvedTeam.name} flag`} />
                    <span>{team.group_name}</span>
                    <strong>{resolvedTeam.name}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="surface-card full-span bracket-section manual-bracket-section">
            <div className="section-kicker">MY BRACKET</div>
            <h2 className="section-title bracket-section-title">Knockout Stage</h2>
            {manualTournament ? (
              <TournamentBracket
                bracket={manualTournament.bracket}
                thirdPlaceMatch={manualTournament.thirdPlaceMatch}
                getTeam={getTeam}
                bracketRef={manualBracketRef}
                renderMatch={(match) => (
                  <ManualKnockoutMatchEditor
                    match={match}
                    getTeam={getTeam}
                    onChange={handleKnockoutMatchChange}
                    onQuickPick={handleKnockoutQuickPick}
                  />
                )}
              />
            ) : (
              <div className="empty-message">Loading manual prediction builder...</div>
            )}
          </section>

          <ComparisonSection
            manualTournament={manualTournament}
            simulationTournament={sampleTournament}
            comparison={comparisonData}
            getTeam={getTeam}
          />
        </>
      )}

      <GroupModal group={selectedGroup} onClose={() => setSelectedGroup(null)} getTeam={getTeam} />
      <ManualGroupModal
        group={manualTournament?.groupResults.find((group) => group.name === selectedManualGroup) ?? null}
        qualifiedCodes={manualQualifiedCodes}
        getTeam={getTeam}
        overrideVisible={manualPredictionState?.advancedOverrideGroups?.includes(selectedManualGroup ?? "")}
        onClose={() => setSelectedManualGroup(null)}
        onToggleOverride={handleToggleAdvancedOverride}
        onScoreChange={handleManualGroupScoreChange}
        onQuickPick={handleManualGroupQuickPick}
        onMoveOverride={handleMoveGroupOverride}
        onClearOverride={handleClearGroupOverride}
      />
    </div>
  );
}

export default App;
