import ChampionProbabilityDashboard from "../dashboard/ChampionProbabilityDashboard";
import HeadToHeadPredictor from "../dashboard/HeadToHeadPredictor";
import TournamentSummaryCards from "../dashboard/TournamentSummaryCards";
import GroupStage from "../groups/GroupStage";
import ThirdPlaceAdvancers from "../groups/ThirdPlaceAdvancers";
import KnockoutBracket from "../knockout/KnockoutBracket";
import TournamentRecap from "../recap/TournamentRecap";
import PodiumSection from "../recap/PodiumSection";
import TournamentTabs from "./TournamentTabs";

export default function SimulatorModeView(props) {
  const {
    sampleTournament,
    championTeam,
    runnerUpTeam,
    thirdPlaceTeam,
    statsMostLikelyWinner,
    statsAverageGoals,
    statsSimulationCount,
    batchMostWinsTeams,
    batchMostWinsCount,
    batchTopScorerGoals,
    batchTopScoringTeams,
    hasBatchSimulationResults,
    summaryBestAttackValue,
    summaryBestAttackTeams,
    summaryBestAttackMode,
    summaryBestDefenseValue,
    summaryBestDefenseTeams,
    summaryBestDefenseMode,
    predictionProps,
    simulationData,
    probabilityRows,
    activeSimulatorTab,
    setActiveSimulatorTab,
    loadingInitial,
    displayedGroups,
    getTeam,
    qualifiedGroupCodes,
    openGroupDetails,
    handleGroupCardKeydown,
    thirdPlaceMatch,
    activeBracketHighlightTeamCode,
    handleBracketTeamHover,
    handleBracketTeamLeave,
    handleBracketTeamPin,
    handleOpenKnockoutDetails,
    teams,
  } = props;

  return (
    <>
      <PodiumSection championTeam={championTeam} runnerUpTeam={runnerUpTeam} thirdPlaceTeam={thirdPlaceTeam} />

      <TournamentSummaryCards
        mostLikelyWinner={statsMostLikelyWinner}
        averageGoals={statsAverageGoals}
        bestAttackValue={summaryBestAttackValue}
        bestAttackTeams={summaryBestAttackTeams}
        bestAttackMode={summaryBestAttackMode}
        bestDefenseValue={summaryBestDefenseValue}
        bestDefenseTeams={summaryBestDefenseTeams}
        bestDefenseMode={summaryBestDefenseMode}
        emptyLabel="Awaiting simulation"
      />

      <main className="main-grid simulator-core-grid">
        <HeadToHeadPredictor {...predictionProps} />
        <ChampionProbabilityDashboard
          simulationData={simulationData}
          probabilityRows={probabilityRows}
          simulationCount={statsSimulationCount}
          hasBatchSimulationResults={hasBatchSimulationResults}
          batchMostWinsTeams={batchMostWinsTeams}
          batchMostWinsCount={batchMostWinsCount}
          batchTopScoringTeams={batchTopScoringTeams}
          batchTopScorerGoals={batchTopScorerGoals}
        />
      </main>

      <TournamentTabs activeTab={activeSimulatorTab} onChange={setActiveSimulatorTab} />

      {activeSimulatorTab === "groups" ? (
        <div className="tab-panel recap-fade-in">
          <GroupStage
            title="Tables"
            groups={displayedGroups}
            getTeam={getTeam}
            qualifiedCodes={qualifiedGroupCodes}
            onOpenGroup={openGroupDetails}
            onGroupKeyDown={handleGroupCardKeydown}
            loading={loadingInitial}
          />
          <ThirdPlaceAdvancers
            title="Automatic Best Eight Third-Place Teams"
            description="Simulator mode auto-selects the best eight third-place teams using points, goal difference, and goals scored after the group stage wraps up."
            teams={sampleTournament?.bestThirdPlaces ?? sampleTournament?.best_third_places ?? []}
            getTeam={getTeam}
          />
        </div>
      ) : null}

      {activeSimulatorTab === "knockout" ? (
        <section className="surface-card full-span bracket-section tab-panel recap-fade-in">
          <div className="section-kicker">KNOCKOUT STAGE</div>
          <h2 className="section-title bracket-section-title">Knockout Stage</h2>
          {sampleTournament ? (
            <KnockoutBracket
              bracket={sampleTournament.bracket}
              thirdPlaceMatch={thirdPlaceMatch}
              getTeam={getTeam}
              onOpenDetails={(match) => handleOpenKnockoutDetails(match, "simulator")}
              highlightedTeamCode={activeBracketHighlightTeamCode}
              onTeamHover={handleBracketTeamHover}
              onTeamLeave={handleBracketTeamLeave}
              onTeamPin={handleBracketTeamPin}
            />
          ) : (
            <div className="empty-message">Run a tournament to generate the knockout bracket.</div>
          )}
        </section>
      ) : null}

      {activeSimulatorTab === "recap" ? (
        <div className="tab-panel recap-fade-in">
          <TournamentRecap
            tournament={sampleTournament}
            thirdPlaceMatch={thirdPlaceMatch}
            teams={teams}
            getTeam={getTeam}
            recapLabel="SIMULATOR RECAP"
            title="Tournament Recap"
            subtitle="A full tournament wrap-up with podium results, stats, standout performances, and the biggest knockout surprise."
          />
        </div>
      ) : null}
    </>
  );
}
