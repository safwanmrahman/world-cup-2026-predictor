import PredictorToolbar from "./PredictorToolbar";
import TournamentTabs from "./TournamentTabs";
import TournamentSummaryCards from "../dashboard/TournamentSummaryCards";
import GroupStage from "../groups/GroupStage";
import ThirdPlaceAdvancers from "../groups/ThirdPlaceAdvancers";
import KnockoutBracket from "../knockout/KnockoutBracket";
import { ManualKnockoutMatchCard } from "../knockout/KnockoutMatchCard";
import TournamentRecap from "../recap/TournamentRecap";
import PodiumSection from "../recap/PodiumSection";
import TournamentStatsPanel from "../recap/TournamentStatsPanel";
import { deriveTournamentRanking, deriveTournamentTeamStats } from "../../utils/simulationUtils";

export default function PredictorModeView(props) {
  const {
    toolbarProps,
    activeManualTab,
    setActiveManualTab,
    manualTournament,
    getTeam,
    manualQualifiedCodes,
    openManualGroupEditor,
    handleReorderGroup,
    thirdPlaceDescription,
    activeBracketHighlightTeamCode,
    hoveredBracketTeamCode,
    pinnedBracketTeamCode,
    handleBracketTeamHover,
    handleBracketTeamLeave,
    handleBracketTeamPin,
    handleOpenKnockoutDetails,
    handleKnockoutMatchChange,
    handleKnockoutQuickPick,
    manualAverageGoals,
    manualTopScorerGoals,
    manualTopScoringTeams,
    manualBestDefenseGoalsAgainst,
    manualBestDefenseTeams,
    teams,
    manualBracketRef,
  } = props;
  const championTeam = manualTournament?.champion ? getTeam(manualTournament.champion) : null;
  const runnerUpTeam = manualTournament?.runnerUp ? getTeam(manualTournament.runnerUp) : null;
  const thirdPlaceTeam = manualTournament?.thirdPlace ? getTeam(manualTournament.thirdPlace) : null;
  const predictorTeamStats = deriveTournamentTeamStats(manualTournament, manualTournament?.thirdPlaceMatch, teams, getTeam);
  const predictorTournamentRanking = deriveTournamentRanking(
    manualTournament,
    manualTournament?.thirdPlaceMatch,
    teams,
    getTeam,
    predictorTeamStats,
  );

  return (
    <>
      <PredictorToolbar {...toolbarProps} />
      <PodiumSection championTeam={championTeam} runnerUpTeam={runnerUpTeam} thirdPlaceTeam={thirdPlaceTeam} />
      <TournamentSummaryCards
        mostLikelyWinner={championTeam}
        averageGoals={manualAverageGoals}
        bestAttackValue={manualTopScorerGoals}
        bestAttackTeams={manualTopScoringTeams}
        bestAttackMode="total"
        bestDefenseValue={manualBestDefenseGoalsAgainst}
        bestDefenseTeams={manualBestDefenseTeams}
        bestDefenseMode="total"
        emptyLabel="Awaiting picks"
      />
      <TournamentTabs activeTab={activeManualTab} onChange={setActiveManualTab} />

      {activeManualTab === "groups" ? (
        <div className="tab-panel recap-fade-in">
          <GroupStage
            title="Tables"
            groups={manualTournament?.groupResults ?? []}
            getTeam={getTeam}
            qualifiedCodes={manualQualifiedCodes}
            onOpenGroup={(group) => openManualGroupEditor(group.name)}
            onReorderGroup={handleReorderGroup}
            onGroupKeyDown={(event, group) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openManualGroupEditor(group.name);
              }
            }}
            isManual
          />
          <ThirdPlaceAdvancers
            title="Automatic Best Eight Third-Place Teams"
            description={thirdPlaceDescription}
            teams={manualTournament?.bestThirdPlaces ?? []}
            getTeam={getTeam}
          />
        </div>
      ) : null}

      {activeManualTab === "knockout" ? (
        <section className="surface-card full-span bracket-section manual-bracket-section tab-panel recap-fade-in">
          {manualTournament ? (
            <KnockoutBracket
              bracket={manualTournament.bracket}
              thirdPlaceMatch={manualTournament.thirdPlaceMatch}
              getTeam={getTeam}
              bracketRef={manualBracketRef}
              onOpenDetails={(match) => handleOpenKnockoutDetails(match, "manual")}
              highlightedTeamCode={activeBracketHighlightTeamCode}
              hoveredTeamCode={hoveredBracketTeamCode}
              pinnedTeamCode={pinnedBracketTeamCode}
              onTeamHover={handleBracketTeamHover}
              onTeamLeave={handleBracketTeamLeave}
              onTeamPin={handleBracketTeamPin}
              renderMatch={(match) => (
                <ManualKnockoutMatchCard
                  match={match}
                  getTeam={getTeam}
                  onOpenDetails={(editableMatch) => handleOpenKnockoutDetails(editableMatch, "manual")}
                  onMatchChange={handleKnockoutMatchChange}
                  onQuickPick={handleKnockoutQuickPick}
                  highlightedTeamCode={activeBracketHighlightTeamCode}
                  hoveredTeamCode={hoveredBracketTeamCode}
                  pinnedTeamCode={pinnedBracketTeamCode}
                  onTeamHover={handleBracketTeamHover}
                  onTeamLeave={handleBracketTeamLeave}
                  onTeamPin={handleBracketTeamPin}
                />
              )}
            />
          ) : (
            <div className="empty-message">Loading manual prediction builder...</div>
          )}
        </section>
      ) : null}

      {activeManualTab === "recap" ? (
        <div className="tab-panel recap-fade-in">
          <TournamentRecap
            tournament={manualTournament}
            thirdPlaceMatch={manualTournament?.thirdPlaceMatch}
            teams={teams}
            getTeam={getTeam}
            recapLabel="PREDICTOR RECAP"
            title="Bracket Recap"
            subtitle="A full look at your current bracket story, including the podium, standout performers, and the path your tournament took."
            showHighlightUpset={false}
          />
        </div>
      ) : null}

      {activeManualTab === "stats" ? (
        <div className="tab-panel recap-fade-in">
          <TournamentStatsPanel stats={predictorTeamStats} ranking={predictorTournamentRanking} />
        </div>
      ) : null}
    </>
  );
}
