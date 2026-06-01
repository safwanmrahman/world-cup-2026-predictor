import { startTransition, useEffect, useMemo, useState } from "react";
import { DEFAULT_CUSTOM_SIMULATION_COUNT, buildApiUrl } from "../data/constants";
import {
  compareProbabilityRows,
  getKnockoutLoserCode,
  getKnockoutWinnerCode,
  getTournamentKnockoutMatches,
} from "../utils/knockoutUtils";
import { deriveTournamentRecapData } from "../utils/simulationUtils";
import {
  getPredictionAdvancingTeam,
  getPredictionSampleWinnerCode,
  waitForNextPaint,
} from "../utils/formattingUtils";

async function readErrorMessage(response, fallbackMessage) {
  try {
    const body = await response.json();
    return body.detail || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function useTournamentState() {
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
  const [simulationCount, setSimulationCount] = useState(DEFAULT_CUSTOM_SIMULATION_COUNT);
  const [simulationData, setSimulationData] = useState(null);
  const [sampleTournament, setSampleTournament] = useState(null);
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedKnockoutMatchId, setSelectedKnockoutMatchId] = useState(null);
  const [selectedKnockoutMode, setSelectedKnockoutMode] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [activeSimulationAction, setActiveSimulationAction] = useState("default");
  const [activeSimulatorTab, setActiveSimulatorTab] = useState("groups");
  const [hoveredBracketTeamCode, setHoveredBracketTeamCode] = useState(null);
  const [pinnedBracketTeamCode, setPinnedBracketTeamCode] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");

  const activeBracketHighlightTeamCode = hoveredBracketTeamCode ?? pinnedBracketTeamCode;

  function switchSimulatorTab(tabId) {
    setActiveSimulatorTab(tabId);
  }

  function switchSimulatorToKnockout() {
    switchSimulatorTab("knockout");
  }

  useEffect(() => {
    setHoveredBracketTeamCode(null);
    setPinnedBracketTeamCode(null);
  }, [activeMode, activeSimulatorTab]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingInitial(true);
        const [groupsResponse, teamsResponse, fixturesResponse] = await Promise.all([
          fetch(buildApiUrl("/groups")),
          fetch(buildApiUrl("/teams")),
          fetch(buildApiUrl("/fixtures")),
        ]);

        if (!groupsResponse.ok || !teamsResponse.ok || !fixturesResponse.ok) {
          throw new Error("Could not load the API. Check VITE_API_BASE_URL and make sure the backend is running.");
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

      const semifinalLosers = sampleTournament.bracket.semifinals
        .map((match) => getKnockoutLoserCode(match))
        .filter(Boolean);

      if (semifinalLosers.length !== 2) {
        setThirdPlaceMatch(null);
        return;
      }

      try {
        const response = await fetch(buildApiUrl("/predict-match"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            home_team_code: semifinalLosers[0],
            away_team_code: semifinalLosers[1],
            stage: "knockout",
          }),
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response, "Could not generate third-place match."));
        }

        const data = await response.json();
        const winner = getKnockoutWinnerCode(data.sample_score);

        setThirdPlaceMatch({
          match_id: "3P",
          home_team: data.home_team.code,
          away_team: data.away_team.code,
          home_goals: data.sample_score.home_goals,
          away_goals: data.sample_score.away_goals,
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

  const teamLookup = useMemo(() => Object.fromEntries(teams.map((team) => [team.code, team])), [teams]);
  const sortedTeams = useMemo(
    () => [...teams].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" })),
    [teams],
  );
  const getTeam = (code) => teamLookup[code];

  useEffect(() => {
    setPrediction(null);
  }, [predictionForm.home_team_code, predictionForm.away_team_code, predictionForm.stage]);

  async function handlePredictMatch(event) {
    event.preventDefault();
    setPredicting(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/predict-match"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictionForm),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Prediction failed."));
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
    setActiveSimulationAction("single");
    setError("");
    setSimulationData(null);

    try {
      await waitForNextPaint();
      const response = await fetch(buildApiUrl("/simulate-one"), { method: "POST" });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Single tournament simulation failed."));
      }
      const data = await response.json();
      startTransition(() => {
        setSampleTournament(data);
        switchSimulatorToKnockout();
        setSimulating(false);
      });
    } catch (caughtError) {
      setError(caughtError.message);
      setSimulating(false);
    }
  }

  async function runSimulationBatch(count, action = "custom") {
    setSimulating(true);
    setActiveSimulationAction(action);
    setError("");

    try {
      await waitForNextPaint();
      const response = await fetch(buildApiUrl("/simulate-tournament"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulations: count }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Tournament simulation failed."));
      }

      const data = await response.json();
      startTransition(() => {
        setSimulationData(data);
        setSampleTournament(data.sample_tournament);
        switchSimulatorToKnockout();
        setSimulating(false);
      });
    } catch (caughtError) {
      setError(caughtError.message);
      setSimulating(false);
    }
  }

  function handleBracketTeamHover(teamCode) {
    setHoveredBracketTeamCode(teamCode);
  }

  function handleBracketTeamLeave() {
    setHoveredBracketTeamCode(null);
  }

  function handleBracketTeamPin(teamCode) {
    setPinnedBracketTeamCode((current) => (current === teamCode ? null : teamCode));
    setHoveredBracketTeamCode(teamCode);
  }

  function resetBracketHighlights() {
    setHoveredBracketTeamCode(null);
    setPinnedBracketTeamCode(null);
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

  function handleOpenKnockoutDetails(match, mode) {
    if (!match?.match_id) {
      return;
    }

    setSelectedKnockoutMatchId(match.match_id);
    setSelectedKnockoutMode(mode);
  }

  function handleCloseKnockoutDetails() {
    setSelectedKnockoutMatchId(null);
    setSelectedKnockoutMode(null);
  }

  const displayedGroups = sampleTournament?.group_results ?? groups;
  const qualifiedGroupCodes = useMemo(() => new Set(sampleTournament?.qualified_for_round_of_32 ?? []), [sampleTournament]);
  const sortedProbabilityRows = useMemo(
    () => (simulationData?.probabilities ? [...simulationData.probabilities].sort(compareProbabilityRows) : []),
    [simulationData?.probabilities],
  );
  const hasBatchSimulationResults = (simulationData?.simulations ?? 0) > 1;
  const probabilityRows = sortedProbabilityRows.slice(0, 12);
  const tournamentRecapData = useMemo(
    () => deriveTournamentRecapData(sampleTournament, thirdPlaceMatch, teams, getTeam),
    [sampleTournament, thirdPlaceMatch, teams, getTeam],
  );
  const sampleAverageGoals = tournamentRecapData?.averageGoals ?? null;
  const finalMatch = sampleTournament?.bracket?.final?.[0];
  const championCode = getKnockoutWinnerCode(finalMatch);
  const runnerUpCode = getKnockoutLoserCode(finalMatch);
  const thirdPlaceCode = getKnockoutWinnerCode(thirdPlaceMatch);
  const championTeam = championCode ? getTeam(championCode) : null;
  const runnerUpTeam = runnerUpCode ? getTeam(runnerUpCode) : null;
  const thirdPlaceTeam = thirdPlaceCode ? getTeam(thirdPlaceCode) : null;
  const hasSampleTournamentStats = (tournamentRecapData?.completedMatches ?? 0) > 0;
  const sampleTopTeamGoals = hasSampleTournamentStats ? (tournamentRecapData?.topGoals ?? null) : null;
  const sampleTopScoringTeams = hasSampleTournamentStats && (tournamentRecapData?.topGoals ?? 0) > 0
    ? (tournamentRecapData?.topScorers ?? [])
    : [];
  const sampleBestDefenseGoalsAgainst = hasSampleTournamentStats ? (tournamentRecapData?.minConceded ?? null) : null;
  const sampleBestDefenseTeams = hasSampleTournamentStats ? (tournamentRecapData?.bestDefenseTeams ?? []) : [];
  const statsMostLikelyWinner = hasBatchSimulationResults ? simulationData?.summary?.most_likely_winner ?? null : championTeam;
  const statsAverageGoals = hasBatchSimulationResults ? simulationData?.summary?.average_goals_per_match ?? null : sampleAverageGoals;
  const statsSimulationCount = simulationData?.simulations ?? null;
  const batchMostWinsTeams = sortedProbabilityRows.length
    ? (() => {
        const maxChampionRate = Math.max(...sortedProbabilityRows.map((entry) => entry.champion));
        return sortedProbabilityRows.filter((entry) => entry.champion === maxChampionRate);
      })()
    : [];
  const batchMostWinsCount = hasBatchSimulationResults && batchMostWinsTeams.length
    ? batchMostWinsTeams[0].champion_wins
    : null;
  const batchTopScorerGoals = sortedProbabilityRows.length
    ? Math.max(...sortedProbabilityRows.map((entry) => entry.average_goals_scored))
    : null;
  const batchTopScoringTeams = sortedProbabilityRows.length
    ? sortedProbabilityRows.filter((entry) => entry.average_goals_scored === batchTopScorerGoals).map((entry) => entry.team)
    : [];
  const batchBestDefenseCandidates = sortedProbabilityRows.filter((entry) => entry.round_of_16 > 0);
  const batchBestDefenseGoalsAgainst = batchBestDefenseCandidates.length
    ? Math.min(...batchBestDefenseCandidates.map((entry) => entry.average_goals_against))
    : null;
  const batchBestDefenseTeams = batchBestDefenseCandidates.length
    ? batchBestDefenseCandidates.filter((entry) => entry.average_goals_against === batchBestDefenseGoalsAgainst).map((entry) => entry.team)
    : [];
  const summaryBestAttackValue = sampleTopTeamGoals;
  const summaryBestAttackTeams = sampleTopScoringTeams;
  const summaryBestAttackMode = "total";
  const summaryBestDefenseValue = sampleBestDefenseGoalsAgainst;
  const summaryBestDefenseTeams = sampleBestDefenseTeams;
  const summaryBestDefenseMode = "total";
  const normalizedSimulationCount = Math.min(10000, Math.max(1, Number(simulationCount) || DEFAULT_CUSTOM_SIMULATION_COUNT));
  const homeTeam = getTeam(predictionForm.home_team_code);
  const awayTeam = getTeam(predictionForm.away_team_code);
  const isKnockoutPrediction = prediction?.stage === "knockout";
  const predictionAdvancingTeam = getPredictionAdvancingTeam(prediction);
  const predictionWinnerCode = getPredictionSampleWinnerCode(prediction);

  return {
    activeMode,
    setActiveMode,
    groups,
    fixtures,
    teams,
    teamLookup,
    sortedTeams,
    getTeam,
    prediction,
    predictionForm,
    setPredictionForm,
    simulating,
    predicting,
    error,
    setError,
    simulationCount,
    setSimulationCount,
    simulationData,
    sampleTournament,
    thirdPlaceMatch,
    selectedGroup,
    setSelectedGroup,
    selectedKnockoutMatchId,
    selectedKnockoutMode,
    loadingInitial,
    activeSimulationAction,
    activeSimulatorTab,
    setActiveSimulatorTab: switchSimulatorTab,
    activeBracketHighlightTeamCode,
    hoveredBracketTeamCode,
    pinnedBracketTeamCode,
    displayedGroups,
    qualifiedGroupCodes,
    probabilityRows,
    runSingleTournament,
    runSimulationBatch,
    handlePredictMatch,
    openGroupDetails,
    handleGroupCardKeydown,
    handleOpenKnockoutDetails,
    handleCloseKnockoutDetails,
    handleBracketTeamHover,
    handleBracketTeamLeave,
    handleBracketTeamPin,
    resetBracketHighlights,
    statsMostLikelyWinner,
    statsAverageGoals,
    statsSimulationCount,
    hasBatchSimulationResults,
    batchMostWinsTeams,
    batchMostWinsCount,
    batchTopScorerGoals,
    batchTopScoringTeams,
    batchBestDefenseGoalsAgainst,
    batchBestDefenseTeams,
    summaryBestAttackValue,
    summaryBestAttackTeams,
    summaryBestAttackMode,
    summaryBestDefenseValue,
    summaryBestDefenseTeams,
    summaryBestDefenseMode,
    normalizedSimulationCount,
    championTeam,
    runnerUpTeam,
    thirdPlaceTeam,
    sampleTopTeamGoals,
    sampleTopScoringTeams,
    homeTeam,
    awayTeam,
    isKnockoutPrediction,
    predictionAdvancingTeam,
    predictionWinnerCode,
    activeKnockoutMatchFrom(sourceManualTournament) {
      if (!selectedKnockoutMatchId || !selectedKnockoutMode) {
        return null;
      }

      const sourceMatches = selectedKnockoutMode === "simulator"
        ? getTournamentKnockoutMatches(sampleTournament, thirdPlaceMatch)
        : getTournamentKnockoutMatches(sourceManualTournament, sourceManualTournament?.thirdPlaceMatch);

      return sourceMatches.find((match) => String(match.match_id) === String(selectedKnockoutMatchId)) ?? null;
    },
  };
}
