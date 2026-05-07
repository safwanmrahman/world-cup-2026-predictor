import { useEffect, useMemo, useState } from "react";

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

const GROUP_MATCHDAY_LABELS = ["Matchday 1", "Matchday 2", "Matchday 3"];
const LEFT_BRACKET_TREE = {
  roundOf32: [74, 77, 73, 75, 83, 84, 81, 82],
  roundOf16: [89, 90, 93, 94],
  quarterfinals: [97, 98],
  semifinal: 101,
};
const RIGHT_BRACKET_TREE = {
  roundOf32: [76, 78, 79, 80, 86, 88, 85, 87],
  roundOf16: [91, 92, 95, 96],
  quarterfinals: [99, 100],
  semifinal: 102,
};

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
  if (!match || !("home_goals" in match) || !("away_goals" in match)) {
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

function BracketTreeSide({ tree, matchesById, getTeam, side }) {
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
                <BracketMatch match={item.match} getTeam={getTeam} />
                <span className="bracket-connector bracket-connector-out" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TournamentBracket({ bracket, thirdPlaceMatch, getTeam }) {
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
    <div className="bracketology-grid">
      <BracketTreeSide tree={LEFT_BRACKET_TREE} matchesById={matchesById} getTeam={getTeam} side="left" />

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
                <BracketMatch key={match.match_id} match={match} getTeam={getTeam} className="world-cup-final-card" />
              ))}
            </div>
          </div>
          <div>
            <div className="bracket-column-title third-place-title">THIRD PLACE</div>
            <div className="bracket-finals-stack">
              {thirdPlaceMatch ? (
                <BracketMatch match={thirdPlaceMatch} getTeam={getTeam} />
              ) : (
                <div className="bracket-placeholder">Awaiting semifinal results</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BracketTreeSide tree={RIGHT_BRACKET_TREE} matchesById={matchesById} getTeam={getTeam} side="right" />
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
                        <FlagImg code={row.team_code} size="sm" alt={`${team?.name ?? row.team_code} flag`} />
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

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "light");
  const [groups, setGroups] = useState([]);
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
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingInitial(true);
        const [groupsResponse, teamsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/groups`),
          fetch(`${API_BASE_URL}/teams`),
        ]);

        if (!groupsResponse.ok || !teamsResponse.ok) {
          throw new Error("Could not load the API. Make sure the backend is running.");
        }

        const groupsData = await groupsResponse.json();
        const teamsData = await teamsResponse.json();
        setGroups(groupsData.groups);
        setTeams(teamsData.teams);
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

  function getTeam(code) {
    return teamLookup[code];
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
  const probabilityRows = simulationData?.probabilities?.slice(0, 12) ?? [];
  const homeTeam = getTeam(predictionForm.home_team_code);
  const awayTeam = getTeam(predictionForm.away_team_code);
  const isKnockoutPrediction = prediction?.stage === "knockout";
  const predictionAdvancingTeam = getPredictionAdvancingTeam(prediction);
  const predictionWinnerCode = getPredictionSampleWinnerCode(prediction);
  const sampleAverageGoals =
    sampleTournament?.total_goals && sampleTournament?.total_matches
      ? sampleTournament.total_goals / sampleTournament.total_matches
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
    championCode && sampleTournament?.group_results
      ? sampleTournament.group_results
          .flatMap((group) => group.table)
          .find((row) => row.team_code === championCode)?.goals_for ?? null
      : null;
  const statsMostLikelyWinner = simulationData?.summary?.most_likely_winner ?? championTeam;
  const statsAverageGoals = simulationData?.summary?.average_goals_per_match ?? sampleAverageGoals;
  const statsSimulationCount = simulationData?.simulations ?? (sampleTournament ? 1 : null);
  const statsTopTeamGoals =
    simulationData?.summary?.average_goals_for_most_likely_winner ?? sampleChampionGoals;

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
            onClick={() => runSimulationBatch(simulationCount)}
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
              onChange={(event) => setSimulationCount(Number(event.target.value))}
            />
          </label>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {sampleTournament && championTeam && runnerUpTeam && thirdPlaceTeam ? (
        <section className="podium-grid">
          <PodiumCard
            label="RUNNER-UP"
            teamCode={runnerUpTeam.code}
            teamName={runnerUpTeam.name}
            tone="silver"
          />
          <PodiumCard
            label="CHAMPION"
            teamCode={championTeam.code}
            teamName={championTeam.name}
            tone="gold"
            size="featured"
          />
          <PodiumCard
            label="3RD PLACE"
            teamCode={thirdPlaceTeam.code}
            teamName={thirdPlaceTeam.name}
            tone="bronze"
          />
        </section>
      ) : null}

      <section className="stats-grid">
        <StatCard
          label="MOST LIKELY WINNER"
          value={
            statsMostLikelyWinner ? (
              <span className="winner-inline">
                <FlagImg
                  code={statsMostLikelyWinner.code}
                  size="sm"
                  alt={`${statsMostLikelyWinner.name} flag`}
                />
                {statsMostLikelyWinner.name}
              </span>
            ) : (
              "Awaiting simulation"
            )
          }
        />
        <StatCard
          label="AVG GOALS / MATCH"
          value={statsAverageGoals != null ? formatDecimal(statsAverageGoals) : "--"}
        />
        <StatCard
          label="SIMULATIONS"
          value={statsSimulationCount != null ? statsSimulationCount.toLocaleString() : "--"}
        />
        <StatCard
          label="TOP TEAM AVG GOALS"
          value={statsTopTeamGoals != null ? formatDecimal(statsTopTeamGoals) : "--"}
        />
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
                {teams.map((team) => (
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
                {teams.map((team) => (
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
              <div className={`vs-pill ${prediction ? "vs-score" : ""}`}>
                {formatPredictionScore(prediction)}
              </div>
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
                        <div
                          className="mini-meter-fill"
                          style={{ width: `${prediction.probabilities.home_advance * 100}%` }}
                        />
                      </div>
                      <strong>{formatPercent(prediction.probabilities.home_advance)}</strong>
                    </div>
                    <div className="probability-row">
                      <span>{prediction.away_team.name} advance</span>
                      <div className="mini-meter">
                        <div
                          className="mini-meter-fill muted"
                          style={{ width: `${prediction.probabilities.away_advance * 100}%` }}
                        />
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
                              <tr
                                key={row.team_code}
                                className={index < 2 || qualifiedGroupCodes.has(row.team_code) ? "qualified" : ""}
                              >
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
            <TournamentBracket
              bracket={sampleTournament.bracket}
              thirdPlaceMatch={thirdPlaceMatch}
              getTeam={getTeam}
            />
          ) : (
            <div className="empty-message">Run a tournament to generate the knockout bracket.</div>
          )}
        </section>
      </main>

      <GroupModal group={selectedGroup} onClose={() => setSelectedGroup(null)} getTeam={getTeam} />
    </div>
  );
}

export default App;
