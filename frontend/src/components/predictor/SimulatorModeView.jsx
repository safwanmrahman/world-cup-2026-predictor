import ChampionProbabilityDashboard from "../dashboard/ChampionProbabilityDashboard";
import HeadToHeadPredictor from "../dashboard/HeadToHeadPredictor";
import StatCard from "../dashboard/StatCard";
import GroupStage from "../groups/GroupStage";
import ThirdPlaceAdvancers from "../groups/ThirdPlaceAdvancers";
import KnockoutBracket from "../knockout/KnockoutBracket";
import TournamentRecap from "../recap/TournamentRecap";
import PodiumSection from "../recap/PodiumSection";
import TeamFlag from "../shared/TeamFlag";
import TournamentTabs from "./TournamentTabs";
import { BallIcon, BootIcon, ChartIcon, TrophyIcon } from "../shared/Icons";
import { formatDecimal } from "../../utils/formattingUtils";

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
    sampleTopTeamGoals,
    sampleTopScoringTeams,
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

      <section className="stats-grid">
        <StatCard
          label="MOST LIKELY WINNER"
          icon={<TrophyIcon />}
          value={statsMostLikelyWinner ? <span className="winner-inline"><TeamFlag code={statsMostLikelyWinner.code} size="sm" alt={`${statsMostLikelyWinner.name} flag`} />{statsMostLikelyWinner.name}</span> : "Awaiting simulation"}
        />
        <StatCard label="AVG GOALS / MATCH" icon={<BallIcon />} value={statsAverageGoals != null ? formatDecimal(statsAverageGoals) : "--"} />
        <StatCard label="SIMULATIONS" icon={<ChartIcon />} value={statsSimulationCount != null ? statsSimulationCount.toLocaleString() : "--"}>
          {batchMostWinsTeams.length ? (
            <div className="stat-scroll-area">
              <div className="stat-inline-row">
                <span className="stat-stack-label">Most Wins</span>
                <div className="stat-inline-value-pair">
                  <strong>{batchMostWinsCount}</strong>
                  <div className="stat-support stat-support-multi">
                    {batchMostWinsTeams.map((entry) => (
                      <span className="stat-support-chip" key={entry.team.code}>
                        <TeamFlag code={entry.team.code} size="sm" alt={`${entry.team.name} flag`} />
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
                        <TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />
                        {team.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </StatCard>
        <StatCard label="TOP SCORER" icon={<BootIcon />} value={sampleTopTeamGoals != null ? formatDecimal(sampleTopTeamGoals) : "--"}>
          {sampleTopScoringTeams?.length ? (
            <div className="stat-support stat-support-multi">
              {sampleTopScoringTeams.map((team) => (
                <span className="stat-support-chip" key={team.code}>
                  <TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />
                  {team.name}
                </span>
              ))}
            </div>
          ) : null}
        </StatCard>
      </section>

      <main className="main-grid simulator-core-grid">
        <HeadToHeadPredictor {...predictionProps} />
        <ChampionProbabilityDashboard simulationData={simulationData} probabilityRows={probabilityRows} />
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
