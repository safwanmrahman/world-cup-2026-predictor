import { useEffect, useMemo, useRef, useState } from "react";
import {
  MANUAL_SHARE_PREFIX,
  autoFillRemainingPrediction,
  buildManualTournament,
  buildPersistedManualState,
  encodePredictionHash,
  loadManualPredictionState,
  quickPickGroupMatch,
  quickPickKnockoutMatch,
  resetManualGroups,
  resetManualKnockouts,
  resetManualPrediction,
  saveManualPredictionState,
  setGroupOverrideOrder,
  updateGroupScore,
  updateKnockoutMatch,
  updateSelectedThirdPlaces,
} from "../manualPrediction";
import { deriveTournamentRecapData } from "../utils/simulationUtils";
import { exportBracketImage } from "../utils/exportUtils";

export function usePredictorState({ groups, fixtures, teams, teamLookup, sampleTournament, getTeam, setError }) {
  const [selectedManualGroup, setSelectedManualGroup] = useState(null);
  const [manualPredictionState, setManualPredictionState] = useState(null);
  const [pendingResetAction, setPendingResetAction] = useState(null);
  const [activeManualAction, setActiveManualAction] = useState(null);
  const [manualSaved, setManualSaved] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [activeManualTab, setActiveManualTab] = useState("groups");
  const manualBracketRef = useRef(null);

  function switchManualTab(tabId) {
    setActiveManualTab(tabId);
  }

  function switchManualToKnockout() {
    switchManualTab("knockout");
  }

  function switchManualToGroups() {
    switchManualTab("groups");
  }

  useEffect(() => {
    if (!groups.length || !fixtures.length) {
      return;
    }

    const hasSharedPrediction = window.location.hash.startsWith(MANUAL_SHARE_PREFIX);
    const loaded = hasSharedPrediction
      ? loadManualPredictionState(groups, fixtures)
      : resetManualPrediction(groups, fixtures);
    setManualPredictionState(loaded);
    switchManualToGroups();
  }, [groups, fixtures]);

  const manualTournament = useMemo(() => {
    if (!manualPredictionState || !groups.length || !fixtures.length || !teams.length) {
      return null;
    }

    return buildManualTournament(manualPredictionState, groups, fixtures, teamLookup);
  }, [manualPredictionState, groups, fixtures, teamLookup, teams.length]);

  useEffect(() => {
    if (!manualPredictionState || !manualTournament) {
      return;
    }

    const persisted = buildPersistedManualState(manualPredictionState, manualTournament);
    saveManualPredictionState(persisted);
    setManualSaved(true);
  }, [manualPredictionState, manualTournament]);

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

  function handleReorderGroup(groupName, nextOrder) {
    setManualSaved(false);
    setManualPredictionState((current) => ({
      ...current,
      groupOverrides: setGroupOverrideOrder(
        groupName,
        nextOrder,
        current.groupOverrides,
      ),
      updatedAt: Date.now(),
    }));
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

  function handleAutoFillRemaining() {
    setActiveManualAction("autofill");
    setManualSaved(false);
    setManualPredictionState((current) => autoFillRemainingPrediction(current, groups, fixtures, teamLookup));
    setShareStatus("Remaining picks auto-filled");
    switchManualToKnockout();
  }

  function handleOpenResetConfirmation(action) {
    setActiveManualAction(action);
    setPendingResetAction(action);
  }

  function handleCloseResetConfirmation() {
    setPendingResetAction(null);
  }

  function handleConfirmReset() {
    if (!groups.length || !fixtures.length) {
      return;
    }

    setManualSaved(false);

    if (pendingResetAction === "groups") {
      setManualPredictionState((current) => resetManualGroups(current));
      setShareStatus("Group stage reset");
      switchManualToGroups();
    } else if (pendingResetAction === "knockouts") {
      setManualPredictionState((current) => resetManualKnockouts(current));
      setShareStatus("Knockout stage reset");
      switchManualToKnockout();
    }
    setPendingResetAction(null);
  }

  function openManualGroupEditor(groupName) {
    setSelectedManualGroup(groupName);
  }

  async function handleExportBracketImage() {
    if (!manualBracketRef.current) {
      return;
    }

    setActiveManualAction("export");
    try {
      await exportBracketImage(manualBracketRef.current);
      setShareStatus("Bracket image exported");
    } catch (caughtError) {
      const exportErrorMessage = caughtError?.message
        ? `Could not export the bracket image. Please try again. If it keeps failing, refresh the page and try once more. (${caughtError.message})`
        : "Could not export the bracket image. Please try again. If it keeps failing, refresh the page and try once more.";
      setError?.(exportErrorMessage);
    }
  }

  async function handleCopyShareLink() {
    if (!manualPredictionState) {
      return;
    }

    setActiveManualAction("share");
    const hash = encodePredictionHash(buildPersistedManualState(manualPredictionState, manualTournament));
    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
      setShareStatus("Share link copied");
    } catch {
      setError?.("Could not copy the share link.");
    }
  }

  function handleKnockoutModalPick(match, selectedOutcome) {
    setManualSaved(false);
    setManualPredictionState((current) => quickPickKnockoutMatch(current, match, teamLookup, selectedOutcome));
  }

  const manualQualifiedCodes = useMemo(() => new Set(manualTournament?.qualifiedForRoundOf32 ?? []), [manualTournament]);
  const manualRecapData = useMemo(
    () => {
      try {
        return deriveTournamentRecapData(manualTournament, manualTournament?.thirdPlaceMatch, teams, getTeam);
      } catch (error) {
        console.error("Failed to derive predictor recap data", error);
        return null;
      }
    },
    [manualTournament, teams, getTeam],
  );
  const hasManualRecapStats = (manualRecapData?.completedMatches ?? 0) > 0;
  const manualAverageGoals = manualRecapData?.averageGoals ?? null;
  const manualTopScorerGoals = hasManualRecapStats ? (manualRecapData?.topGoals ?? null) : null;
  const manualTopScoringTeams = hasManualRecapStats && (manualRecapData?.topGoals ?? 0) > 0
    ? (manualRecapData?.topScorers ?? [])
    : [];
  const manualBestDefenseGoalsAgainst = hasManualRecapStats ? (manualRecapData?.minConceded ?? null) : null;
  const manualBestDefenseTeams = hasManualRecapStats ? (manualRecapData?.bestDefenseTeams ?? []) : [];

  const resetModalConfig = {
    groups: {
      title: "Reset Groups",
      description: "Clear every group-stage pick and score, then rebuild Predictor Mode from an empty group phase.",
      impacts: [
        "All group picks and standings will be cleared.",
        "Third-place qualifiers will be recalculated from scratch.",
        "All knockout picks will be cleared because the qualifiers change.",
      ],
      confirmLabel: "Reset Groups",
      confirmTone: "button-primary",
    },
    knockouts: {
      title: "Reset Knockouts",
      description: "Keep your current group-stage picks and qualifiers, but clear every knockout winner and scoreline.",
      impacts: [
        "Group-stage picks and standings will stay exactly as they are.",
        "Qualified teams will remain in place.",
        "All knockout-round predictions, including third-place and final picks, will be removed.",
      ],
      confirmLabel: "Reset Knockouts",
      confirmTone: "button-primary",
    },
  }[pendingResetAction];

  return {
    manualBracketRef,
    selectedManualGroup,
    setSelectedManualGroup,
    manualPredictionState,
    manualTournament,
    activeManualAction,
    manualSaved,
    shareStatus,
    activeManualTab,
    setActiveManualTab: switchManualTab,
    manualQualifiedCodes,
    manualAverageGoals,
    manualTopScorerGoals,
    manualTopScoringTeams,
    manualBestDefenseGoalsAgainst,
    manualBestDefenseTeams,
    resetModalConfig,
    handleManualGroupScoreChange,
    handleManualGroupQuickPick,
    handleReorderGroup,
    handleThirdPlaceToggle,
    handleKnockoutMatchChange,
    handleKnockoutQuickPick,
    handleAutoFillRemaining,
    handleOpenResetConfirmation,
    handleCloseResetConfirmation,
    handleConfirmReset,
    openManualGroupEditor,
    handleExportBracketImage,
    handleCopyShareLink,
    handleKnockoutModalPick,
  };
}
