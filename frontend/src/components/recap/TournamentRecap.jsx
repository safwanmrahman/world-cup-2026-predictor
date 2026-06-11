import { useMemo } from "react";
import TeamFlag from "../shared/TeamFlag";
import EmptyState from "../shared/EmptyState";
import { BallIcon, BootIcon, CalendarIcon, ChartIcon, FireIcon, RouteIcon, ShieldIcon, TrophyIcon } from "../shared/Icons";
import { formatDecimal, formatMatchScore, formatWholeNumber } from "../../utils/formattingUtils";
import { deriveTournamentRecapData } from "../../utils/simulationUtils";

export default function TournamentRecap({
  tournament,
  thirdPlaceMatch,
  teams,
  getTeam,
  title,
  subtitle,
  recapLabel,
  showHighlightUpset = true,
  extraContent = null,
}) {
  const recap = useMemo(
    () => deriveTournamentRecapData(tournament, thirdPlaceMatch, teams, getTeam),
    [getTeam, teams, thirdPlaceMatch, tournament],
  );

  if (!tournament || !recap) {
    return (
      <section className="surface-card full-span recap-panel">
        <div className="section-kicker">{recapLabel}</div>
        <h2 className="section-title">{title}</h2>
        <EmptyState>{subtitle}</EmptyState>
      </section>
    );
  }

  const bestAttackNames = recap.topScorers.map((team) => team.name);
  const bestDefenseNames = recap.bestDefenseTeams.map((team) => team.name);
  const summaryText = recap.champion && recap.runnerUp
    ? `${recap.champion.name} beat ${recap.runnerUp.name} in the final, while ${recap.thirdPlace?.name ?? "the third-place finisher"} completed the podium. ${bestAttackNames.join(", ") || "No team"} led the scoring with ${formatWholeNumber(recap.topGoals)} goals, and the tournament averaged ${formatDecimal(recap.averageGoals)} goals per match.`
    : "Finish the tournament to unlock the full recap.";

  const statHighlights = [
    { label: "Matches Completed", value: String(recap.completedMatches ?? "--"), detail: "From opener to final", icon: <CalendarIcon />, tone: "gold" },
    { label: "Total Goals", value: formatWholeNumber(recap.totalGoals), detail: "Across the full event", icon: <ChartIcon />, tone: "chart" },
    { label: "Avg Goals / Match", value: recap.averageGoals != null ? formatDecimal(recap.averageGoals) : "--", detail: "Tournament rhythm", icon: <BallIcon />, tone: "gold" },
    {
      label: "Best Attack",
      value: recap.topScorers.length ? (
        <span className="recap-inline-team-list recap-highlight-team-list">
          {recap.topScorers.map((team) => (
            <span className="recap-inline-team recap-highlight-team" key={team.code}>
              <TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />
              {team.name}
            </span>
          ))}
        </span>
      ) : "--",
      detail: `${formatWholeNumber(recap.topGoals)} goals scored`,
      icon: <BootIcon />,
      tone: "boot",
    },
    {
      label: "Best Defense",
      value: recap.bestDefenseTeams.length ? (
        <span className="recap-inline-team-list recap-highlight-team-list">
          {recap.bestDefenseTeams.map((team) => (
            <span className="recap-inline-team recap-highlight-team" key={team.code}>
              <TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />
              {team.name}
            </span>
          ))}
        </span>
      ) : "--",
      detail: `${formatWholeNumber(recap.minConceded)} goals conceded`,
      icon: <ShieldIcon />,
      tone: "shield",
    },
    {
      label: "Dark Horse",
      value: recap.darkHorse?.team ? (
        <span className="recap-inline-team-list recap-highlight-team-list">
          <span className="recap-inline-team recap-highlight-team">
            <TeamFlag code={recap.darkHorse.team.code} size="sm" alt={`${recap.darkHorse.team.name} flag`} />
            {recap.darkHorse.team.name}
          </span>
        </span>
      ) : "--",
      detail: recap.darkHorse?.team
        ? `${recap.darkHorse.stage} · FIFA #${recap.darkHorse.team.fifa_ranking ?? "--"}`
        : "No non-big team knockout run yet",
      icon: <RouteIcon />,
      tone: "gold",
    },
    ...(showHighlightUpset ? [{
      label: "Biggest Upset",
      value: recap.biggestUpset ? (
        <span className="recap-inline-team-list recap-highlight-team-list">
          <span className="recap-inline-team recap-highlight-team">
            <TeamFlag code={recap.biggestUpset.winner.code} size="sm" alt={`${recap.biggestUpset.winner.name} flag`} />
            {recap.biggestUpset.winner.name}
          </span>
          <span className="recap-highlight-versus">over</span>
          <span className="recap-inline-team recap-highlight-team recap-highlight-team-secondary">
            <TeamFlag code={recap.biggestUpset.loser.code} size="sm" alt={`${recap.biggestUpset.loser.name} flag`} />
            {recap.biggestUpset.loser.name}
          </span>
        </span>
      ) : "--",
      detail: recap.biggestUpset ? `${recap.biggestUpset.upsetLabel} · ${recap.biggestUpset.rankingSwing} ranking places lower` : "No knockout upset yet",
      icon: <FireIcon />,
      tone: "fire",
    }] : []),
  ];

  return (
    <section className="surface-card full-span recap-panel recap-fade-in">
      <div className="recap-header">
        <div className="section-kicker">{recapLabel}</div>
        <h2 className="section-title recap-title">{title}</h2>
        <p className="recap-intro">{subtitle}</p>
      </div>
      {recap.champion && recap.runnerUp && recap.thirdPlace ? (
        <section className="recap-hero">
          <article className="recap-podium-card recap-podium-side">
            <div className="recap-podium-label">Runner-up</div>
            <TeamFlag code={recap.runnerUp.code} size="hero" alt={`${recap.runnerUp.name} flag`} />
            <strong>{recap.runnerUp.name}</strong>
            <span>{recap.runnerUp.code}</span>
          </article>
          <article className="recap-podium-card recap-podium-champion">
            <div className="recap-podium-label">Champion</div>
            <div className="recap-podium-crown"><TrophyIcon /></div>
            <TeamFlag code={recap.champion.code} size="hero" alt={`${recap.champion.name} flag`} />
            <strong>{recap.champion.name}</strong>
            <span>{recap.champion.code}</span>
          </article>
          <article className="recap-podium-card recap-podium-side">
            <div className="recap-podium-label">3rd Place</div>
            <TeamFlag code={recap.thirdPlace.code} size="hero" alt={`${recap.thirdPlace.name} flag`} />
            <strong>{recap.thirdPlace.name}</strong>
            <span>{recap.thirdPlace.code}</span>
          </article>
        </section>
      ) : null}
      <section className="recap-highlight-grid">
        {statHighlights.map((item) => (
          <article className={`recap-highlight-card recap-highlight-${item.tone}`} key={item.label}>
            <div className="recap-highlight-icon">{item.icon}</div>
            <div className="recap-highlight-label">{item.label}</div>
            <div className="recap-highlight-value">{item.value}</div>
            <div className="recap-highlight-detail">{item.detail}</div>
          </article>
        ))}
      </section>
      <div className="recap-grid">
        <section className="recap-card recap-final-four-card">
          <div className="section-kicker">Final Four</div>
          <h3 className="recap-card-title">Semifinalists</h3>
          <div className="recap-chip-row">
            {recap.semifinalists.length ? recap.semifinalists.map((team) => (
              <span className="stat-support-chip recap-flag-chip" key={team.code}>
                <TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />
                {team.name}
              </span>
            )) : <EmptyState>Awaiting semifinalists.</EmptyState>}
          </div>
          <div className="recap-semifinal-results">
            {recap.semifinalResults.length ? recap.semifinalResults.map((match) => (
              <article className="recap-semifinal-card" key={match.match_id}>
                <div className="recap-semifinal-team">
                  <TeamFlag code={match.homeTeam?.code ?? match.home_team} size="sm" alt={`${match.homeTeam?.name ?? match.home_team} flag`} />
                  <span>{match.homeTeam?.name ?? match.home_team}</span>
                </div>
                <div className="recap-semifinal-center">
                  <strong className="recap-semifinal-score">{match.home_goals} - {match.away_goals}</strong>
                  {match.decision === "penalties" && match.penalties ? <span className="recap-semifinal-note">Pens {match.penalties.home}-{match.penalties.away}</span> : null}
                </div>
                <div className="recap-semifinal-team recap-semifinal-team-right">
                  <span>{match.awayTeam?.name ?? match.away_team}</span>
                  <TeamFlag code={match.awayTeam?.code ?? match.away_team} size="sm" alt={`${match.awayTeam?.name ?? match.away_team} flag`} />
                </div>
              </article>
            )) : null}
          </div>
        </section>
        <section className="recap-card">
          <div className="section-kicker">Awards</div>
          <h3 className="recap-card-title">Tournament Awards</h3>
          <div className="recap-awards">
            <div className="recap-award recap-award-featured">
              <div className="recap-award-icon"><BootIcon /></div>
              <span>Best Attack</span>
              <strong className="recap-inline-team-list">{recap.topScorers.length ? recap.topScorers.map((team) => <span className="recap-inline-team" key={team.code}><TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />{team.name}</span>) : "--"}</strong>
              <small>{formatWholeNumber(recap.topGoals)} goals scored</small>
            </div>
            <div className="recap-award recap-award-featured">
              <div className="recap-award-icon"><ShieldIcon /></div>
              <span>Best Defense</span>
              <strong className="recap-inline-team-list">{recap.bestDefenseTeams.length ? recap.bestDefenseTeams.map((team) => <span className="recap-inline-team" key={team.code}><TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />{team.name}</span>) : "--"}</strong>
              <small>{formatWholeNumber(recap.minConceded)} goals conceded</small>
            </div>
            <div className="recap-award recap-award-champion">
              <div className="recap-award-icon"><TrophyIcon /></div>
              <span>Champion Attack</span>
              <strong className="recap-inline-team">{recap.champion ? <><TeamFlag code={recap.champion.code} size="sm" alt={`${recap.champion.name} flag`} />{recap.champion.name}</> : "--"}</strong>
              <small>{formatWholeNumber(recap.championGoals)} goals scored</small>
            </div>
            <div className="recap-award recap-award-champion">
              <div className="recap-award-icon"><ShieldIcon /></div>
              <span>Champion Defense</span>
              <strong className="recap-inline-team">{recap.champion ? <><TeamFlag code={recap.champion.code} size="sm" alt={`${recap.champion.name} flag`} />{recap.champion.name}</> : "--"}</strong>
              <small>{formatWholeNumber(recap.championGoalsAgainst)} goals conceded</small>
            </div>
          </div>
        </section>
        <section className="recap-card recap-stats-card">
          <div className="section-kicker">Stats</div>
          <h3 className="recap-card-title">Tournament Stats</h3>
          <div className="recap-stat-list">
            <div className="recap-stat-tile"><div className="recap-stat-icon"><ChartIcon /></div><div className="recap-stat-copy"><span>Total Goals</span><strong>{formatWholeNumber(recap.totalGoals)}</strong></div></div>
            <div className="recap-stat-tile"><div className="recap-stat-icon"><BallIcon /></div><div className="recap-stat-copy"><span>Avg Goals</span><strong>{recap.averageGoals != null ? formatDecimal(recap.averageGoals) : "--"}</strong></div></div>
            <div className="recap-stat-tile recap-stat-team-tile"><div className="recap-stat-icon"><TrophyIcon /></div><div className="recap-stat-copy"><span>Champion</span>{recap.champion ? <strong className="recap-inline-team"><TeamFlag code={recap.champion.code} size="sm" alt={`${recap.champion.name} flag`} />{recap.champion.name}</strong> : <strong>--</strong>}</div></div>
            <div className="recap-stat-tile recap-stat-team-tile"><div className="recap-stat-icon"><RouteIcon /></div><div className="recap-stat-copy"><span>Runner-up</span>{recap.runnerUp ? <strong className="recap-inline-team"><TeamFlag code={recap.runnerUp.code} size="sm" alt={`${recap.runnerUp.name} flag`} />{recap.runnerUp.name}</strong> : <strong>--</strong>}</div></div>
            <div className="recap-stat-tile recap-stat-team-tile"><div className="recap-stat-icon"><BootIcon /></div><div className="recap-stat-copy"><span>Best Attack</span>{recap.topScorers.length ? <strong className="recap-inline-team-list">{recap.topScorers.map((team) => <span className="recap-inline-team" key={team.code}><TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />{team.name}</span>)}</strong> : <strong>--</strong>}</div></div>
            <div className="recap-stat-tile recap-stat-team-tile"><div className="recap-stat-icon"><ShieldIcon /></div><div className="recap-stat-copy"><span>Best Defense</span>{recap.bestDefenseTeams.length ? <strong className="recap-inline-team-list">{recap.bestDefenseTeams.map((team) => <span className="recap-inline-team" key={team.code}><TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />{team.name}</span>)}</strong> : <strong>--</strong>}</div></div>
          </div>
        </section>
        <section className="recap-card recap-upset-watch-card">
          <div className="section-kicker">Upset Watch</div>
          <h3 className="recap-card-title">Biggest Upset</h3>
          {recap.biggestUpset ? (
            <div className={`recap-upset recap-upset-editorial recap-upset-editorial-${recap.biggestUpset.upsetType}`}>
              <div className="recap-award-icon"><FireIcon /></div>
              <strong className="recap-inline-team"><TeamFlag code={recap.biggestUpset.winner.code} size="sm" alt={`${recap.biggestUpset.winner.name} flag`} />{recap.biggestUpset.winner.name}</strong>
              <span className="recap-upset-copy recap-upset-line">
                {recap.biggestUpset.winner.name} beat
                <span className="recap-inline-team"><TeamFlag code={recap.biggestUpset.loser.code} size="sm" alt={`${recap.biggestUpset.loser.name} flag`} />{recap.biggestUpset.loser.name}</span>
                in the {recap.biggestUpset.match.round}
              </span>
              <div className="recap-upset-scoreline">
                <span className="recap-inline-team">
                  <TeamFlag code={recap.biggestUpset.match.home_team} size="sm" alt={`${getTeam(recap.biggestUpset.match.home_team)?.name ?? recap.biggestUpset.match.home_team} flag`} />
                  {getTeam(recap.biggestUpset.match.home_team)?.name ?? recap.biggestUpset.match.home_team}
                </span>
                <span className="recap-upset-score">{formatMatchScore(recap.biggestUpset.match) ?? "--"}</span>
                <span className="recap-inline-team">
                  <TeamFlag code={recap.biggestUpset.match.away_team} size="sm" alt={`${getTeam(recap.biggestUpset.match.away_team)?.name ?? recap.biggestUpset.match.away_team} flag`} />
                  {getTeam(recap.biggestUpset.match.away_team)?.name ?? recap.biggestUpset.match.away_team}
                </span>
              </div>
              <small>{recap.biggestUpset.upsetLabel} · {recap.biggestUpset.rankingSwing} ranking places lower</small>
            </div>
          ) : <EmptyState>No knockout upset yet.</EmptyState>}
        </section>
      </div>
      <div className="recap-bottom-grid">
        <section className="recap-card recap-path-card">
          <div className="section-kicker">Champion Route</div>
          <h3 className="recap-card-title">Knockout Path</h3>
          <div className="recap-path-list">
            {recap.championPath.length ? recap.championPath.map((step, index) => (
              <div className="recap-path-row" key={`${step.round}-${step.opponent?.code ?? "pending"}`}>
                <div className="recap-path-icon"><RouteIcon /></div>
                <div className="recap-path-copy">
                  <strong>{step.round}</strong>
                  <span className="recap-path-opponent">
                    <span className="recap-path-champion"><TeamFlag code={recap.champion?.code} size="sm" alt={`${recap.champion?.name ?? "Champion"} flag`} />{recap.champion?.name ?? "Champion"}</span>
                    <span className="recap-path-versus">vs</span>
                    {step.opponent ? <span className="recap-inline-team"><TeamFlag code={step.opponent.code} size="sm" alt={`${step.opponent.name} flag`} />{step.opponent.name}</span> : "TBD"}
                  </span>
                </div>
                <div className="recap-path-score">
                  {step.score ?? "--"}
                  {step.decision === "penalties" && step.penalties ? <span className="recap-path-pens">Pens {step.penalties.home}-{step.penalties.away}</span> : null}
                  {index === recap.championPath.length - 1 ? <span className="recap-path-winner-tag">Title Won</span> : null}
                </div>
              </div>
            )) : <EmptyState>Finish the bracket to reveal the champion path.</EmptyState>}
          </div>
        </section>
        <section className="recap-card recap-summary-card">
          <div className="section-kicker">Tournament Summary</div>
          <h3 className="recap-card-title">Story of the Tournament</h3>
          <div className="recap-summary-head"><div className="recap-award-icon recap-summary-icon"><TrophyIcon /></div></div>
          <p className="recap-summary-text">
            {recap.champion && recap.runnerUp ? (
              <>
                <span className="recap-highlight-word">{recap.champion.name}</span> lifted the trophy after defeating{" "}
                <span className="recap-highlight-word">{recap.runnerUp.name}</span> in the final, with{" "}
                <span className="recap-highlight-word">{recap.thirdPlace?.name ?? "the third-place finisher"}</span> rounding out the podium.{" "}
                <span className="recap-highlight-word">{bestAttackNames.join(", ") || "No team"}</span> supplied the tournament's sharpest attack with{" "}
                {formatWholeNumber(recap.topGoals)} goals, while{" "}
                <span className="recap-highlight-word">{bestDefenseNames.join(", ") || "no team"}</span> proved the toughest side to break down.{" "}
                {recap.biggestUpset ? <>The defining surprise came when <span className="recap-highlight-word">{recap.biggestUpset.winner.name}</span> knocked out <span className="recap-highlight-word">{recap.biggestUpset.loser.name}</span> in the {recap.biggestUpset.match.round}.</> : null}
              </>
            ) : summaryText}
          </p>
        </section>
      </div>
      {extraContent}
    </section>
  );
}
