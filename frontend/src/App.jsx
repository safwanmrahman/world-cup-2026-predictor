import { useEffect, useMemo } from "react";
import HeroSection from "./components/hero/HeroSection";
import SimulatorModeView from "./components/predictor/SimulatorModeView";
import PredictorModeView from "./components/predictor/PredictorModeView";
import GroupResultsModal from "./components/groups/GroupResultsModal";
import GroupEditorModal from "./components/groups/GroupEditorModal";
import ResetConfirmationModal from "./components/shared/ResetConfirmationModal";
import KnockoutMatchDetailsModal from "./components/knockout/KnockoutMatchDetailsModal";
import { useTheme } from "./hooks/useTheme";
import { useTournamentState } from "./hooks/useTournamentState";
import { usePredictorState } from "./hooks/usePredictorState";
import { getTournamentKnockoutMatches } from "./utils/knockoutUtils";

function App() {
  const [theme, setTheme] = useTheme();
  const tournament = useTournamentState();
  const predictor = usePredictorState({
    groups: tournament.groups,
    fixtures: tournament.fixtures,
    teams: tournament.teams,
    teamLookup: tournament.teamLookup,
    sampleTournament: tournament.sampleTournament,
    getTeam: tournament.getTeam,
    setError: tournament.setError,
  });

  useEffect(() => {
    if (window.location.hash.startsWith("#prediction=") && tournament.groups.length && tournament.fixtures.length) {
      tournament.setActiveMode("manual");
    }
  }, [tournament.groups.length, tournament.fixtures.length, tournament.setActiveMode]);

  useEffect(() => {
    tournament.resetBracketHighlights();
  }, [tournament.activeMode, tournament.activeSimulatorTab, predictor.activeManualTab]);

  const activeKnockoutMatch = useMemo(
    () => tournament.activeKnockoutMatchFrom(predictor.manualTournament),
    [tournament, predictor.manualTournament],
  );

  const predictionProps = {
    predicting: tournament.predicting,
    prediction: tournament.prediction,
    predictionForm: tournament.predictionForm,
    setPredictionForm: tournament.setPredictionForm,
    sortedTeams: tournament.sortedTeams,
    getTeam: tournament.getTeam,
    onPredictMatch: tournament.handlePredictMatch,
  };

  const simulatorViewProps = {
    sampleTournament: tournament.sampleTournament,
    championTeam: tournament.championTeam,
    runnerUpTeam: tournament.runnerUpTeam,
    thirdPlaceTeam: tournament.thirdPlaceTeam,
    statsMostLikelyWinner: tournament.statsMostLikelyWinner,
    statsAverageGoals: tournament.statsAverageGoals,
    statsSimulationCount: tournament.statsSimulationCount,
    hasBatchSimulationResults: tournament.hasBatchSimulationResults,
    batchMostWinsTeams: tournament.batchMostWinsTeams,
    batchMostWinsCount: tournament.batchMostWinsCount,
    batchTopScorerGoals: tournament.batchTopScorerGoals,
    batchTopScoringTeams: tournament.batchTopScoringTeams,
    batchBestDefenseGoalsAgainst: tournament.batchBestDefenseGoalsAgainst,
    batchBestDefenseTeams: tournament.batchBestDefenseTeams,
    summaryBestAttackValue: tournament.summaryBestAttackValue,
    summaryBestAttackTeams: tournament.summaryBestAttackTeams,
    summaryBestAttackMode: tournament.summaryBestAttackMode,
    summaryBestDefenseValue: tournament.summaryBestDefenseValue,
    summaryBestDefenseTeams: tournament.summaryBestDefenseTeams,
    summaryBestDefenseMode: tournament.summaryBestDefenseMode,
    predictionProps,
    simulationData: tournament.simulationData,
    probabilityRows: tournament.probabilityRows,
    activeSimulatorTab: tournament.activeSimulatorTab,
    setActiveSimulatorTab: tournament.setActiveSimulatorTab,
    loadingInitial: tournament.loadingInitial,
    displayedGroups: tournament.displayedGroups,
    getTeam: tournament.getTeam,
    qualifiedGroupCodes: tournament.qualifiedGroupCodes,
    openGroupDetails: tournament.openGroupDetails,
    handleGroupCardKeydown: tournament.handleGroupCardKeydown,
    thirdPlaceMatch: tournament.thirdPlaceMatch,
    activeBracketHighlightTeamCode: tournament.activeBracketHighlightTeamCode,
    hoveredBracketTeamCode: tournament.hoveredBracketTeamCode,
    pinnedBracketTeamCode: tournament.pinnedBracketTeamCode,
    handleBracketTeamHover: tournament.handleBracketTeamHover,
    handleBracketTeamLeave: tournament.handleBracketTeamLeave,
    handleBracketTeamPin: tournament.handleBracketTeamPin,
    handleOpenKnockoutDetails: tournament.handleOpenKnockoutDetails,
    teams: tournament.teams,
  };

  const predictorViewProps = {
    toolbarProps: {
      manualSaved: predictor.manualSaved,
      shareStatus: predictor.shareStatus,
      activeManualAction: predictor.activeManualAction,
      onExport: predictor.handleExportBracketImage,
      onShare: predictor.handleCopyShareLink,
      onAutofill: predictor.handleAutoFillRemaining,
      onResetGroups: () => predictor.handleOpenResetConfirmation("groups"),
      onResetKnockouts: () => predictor.handleOpenResetConfirmation("knockouts"),
      onFullReset: () => predictor.handleOpenResetConfirmation("full"),
    },
    activeManualTab: predictor.activeManualTab,
    setActiveManualTab: predictor.setActiveManualTab,
    manualTournament: predictor.manualTournament,
    getTeam: tournament.getTeam,
    manualQualifiedCodes: predictor.manualQualifiedCodes,
    openManualGroupEditor: predictor.openManualGroupEditor,
    thirdPlaceDescription: "Predictor mode auto-selects the best eight third-place teams using points, goal difference, and goals scored, just like simulator mode.",
    activeBracketHighlightTeamCode: tournament.activeBracketHighlightTeamCode,
    hoveredBracketTeamCode: tournament.hoveredBracketTeamCode,
    pinnedBracketTeamCode: tournament.pinnedBracketTeamCode,
    handleBracketTeamHover: tournament.handleBracketTeamHover,
    handleBracketTeamLeave: tournament.handleBracketTeamLeave,
    handleBracketTeamPin: tournament.handleBracketTeamPin,
    handleOpenKnockoutDetails: tournament.handleOpenKnockoutDetails,
    handleKnockoutMatchChange: predictor.handleKnockoutMatchChange,
    handleKnockoutQuickPick: predictor.handleKnockoutQuickPick,
    manualAverageGoals: predictor.manualAverageGoals,
    manualTopScorerGoals: predictor.manualTopScorerGoals,
    manualTopScoringTeams: predictor.manualTopScoringTeams,
    manualBestDefenseGoalsAgainst: predictor.manualBestDefenseGoalsAgainst,
    manualBestDefenseTeams: predictor.manualBestDefenseTeams,
    teams: tournament.teams,
    manualBracketRef: predictor.manualBracketRef,
  };

  return (
    <div className="app-shell">
      <div className={`loading-overlay ${tournament.simulating ? "visible" : ""}`}>
        <div className="spinner" />
        <p>Running tournament simulations...</p>
      </div>

      <HeroSection
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        activeMode={tournament.activeMode}
        setActiveMode={tournament.setActiveMode}
        activeSimulationAction={tournament.activeSimulationAction}
        runSingleTournament={tournament.runSingleTournament}
        runSimulationBatch={tournament.runSimulationBatch}
        normalizedSimulationCount={tournament.normalizedSimulationCount}
        simulationCount={tournament.simulationCount}
        setSimulationCount={tournament.setSimulationCount}
        simulating={tournament.simulating}
      />

      {tournament.error ? <div className="error-banner">{tournament.error}</div> : null}

      {tournament.activeMode === "simulator" ? (
        <SimulatorModeView {...simulatorViewProps} />
      ) : (
        <PredictorModeView {...predictorViewProps} />
      )}

      <GroupResultsModal
        group={tournament.selectedGroup}
        onClose={() => tournament.setSelectedGroup(null)}
        getTeam={tournament.getTeam}
      />

      <GroupEditorModal
        group={predictor.manualTournament?.groupResults.find((group) => group.name === predictor.selectedManualGroup) ?? null}
        qualifiedCodes={predictor.manualQualifiedCodes}
        getTeam={tournament.getTeam}
        overrideVisible={predictor.manualPredictionState?.advancedOverrideGroups?.includes(predictor.selectedManualGroup ?? "")}
        onClose={() => predictor.setSelectedManualGroup(null)}
        onToggleOverride={predictor.handleToggleAdvancedOverride}
        onScoreChange={predictor.handleManualGroupScoreChange}
        onQuickPick={predictor.handleManualGroupQuickPick}
        onMoveOverride={predictor.handleMoveGroupOverride}
        onClearOverride={predictor.handleClearGroupOverride}
      />

      <ResetConfirmationModal
        config={predictor.resetModalConfig}
        onClose={predictor.handleCloseResetConfirmation}
        onConfirm={predictor.handleConfirmReset}
      />

      <KnockoutMatchDetailsModal
        match={activeKnockoutMatch}
        mode={tournament.selectedKnockoutMode}
        getTeam={tournament.getTeam}
        matchPool={tournament.selectedKnockoutMode === "simulator"
          ? getTournamentKnockoutMatches(tournament.sampleTournament, tournament.thirdPlaceMatch)
          : getTournamentKnockoutMatches(predictor.manualTournament, predictor.manualTournament?.thirdPlaceMatch)}
        onClose={tournament.handleCloseKnockoutDetails}
        onPickWinner={predictor.handleKnockoutModalPick}
        onMatchChange={predictor.handleKnockoutMatchChange}
      />
    </div>
  );
}

export default App;
