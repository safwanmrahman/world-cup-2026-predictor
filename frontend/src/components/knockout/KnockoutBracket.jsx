import { LEFT_BRACKET_TREE, RIGHT_BRACKET_TREE } from "../../manualPrediction";
import { TROPHY_PNG_URL } from "../../data/constants";
import { getKnockoutWinnerCode } from "../../utils/knockoutUtils";
import TeamFlag from "../shared/TeamFlag";
import { KnockoutMatchCard } from "./KnockoutMatchCard";

function KnockoutRound({
  tree,
  matchesById,
  getTeam,
  side,
  renderMatch,
  onOpenDetails,
  highlightedTeamCode,
  hoveredTeamCode,
  pinnedTeamCode,
  onTeamHover,
  onTeamLeave,
  onTeamPin,
}) {
  const isRight = side === "right";

  const rounds = [
    {
      key: "round32",
      label: "Round of 32",
      className: "bracket-round32",
      matches: tree.roundOf32.map((id, index) => ({ id, match: matchesById[id], rowStart: index + 1, rowEnd: index + 2 })),
    },
    {
      key: "round16",
      label: "Round of 16",
      className: "bracket-round16",
      matches: tree.roundOf16.map((id, index) => ({ id, match: matchesById[id], rowStart: index * 2 + 1, rowEnd: index * 2 + 3 })),
    },
    {
      key: "qf",
      label: "Quarter-Final",
      className: "bracket-quarterfinals",
      matches: tree.quarterfinals.map((id, index) => ({ id, match: matchesById[id], rowStart: index * 4 + 1, rowEnd: index * 4 + 5 })),
    },
    {
      key: "sf",
      label: "Semi-Final",
      className: "bracket-semifinals",
      matches: [{ id: tree.semifinal, match: matchesById[tree.semifinal], rowStart: 1, rowEnd: 9 }],
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
                style={{ gridRow: `${item.rowStart} / ${item.rowEnd}` }}
              >
                <span className="bracket-connector bracket-connector-in" aria-hidden="true" />
                {renderMatch
                  ? renderMatch(item.match)
                  : (
                    <KnockoutMatchCard
                      match={item.match}
                      getTeam={getTeam}
                      onOpenDetails={onOpenDetails}
                      highlightedTeamCode={highlightedTeamCode}
                      hoveredTeamCode={hoveredTeamCode}
                      pinnedTeamCode={pinnedTeamCode}
                      onTeamHover={onTeamHover}
                      onTeamLeave={onTeamLeave}
                      onTeamPin={onTeamPin}
                    />
                  )}
                <span className="bracket-connector bracket-connector-out" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function KnockoutBracket({
  bracket,
  thirdPlaceMatch,
  getTeam,
  renderMatch,
  bracketRef,
  onOpenDetails,
  highlightedTeamCode = null,
  hoveredTeamCode = null,
  pinnedTeamCode = null,
  onTeamHover,
  onTeamLeave,
  onTeamPin,
}) {
  const allMatches = [
    ...bracket.round_of_32,
    ...bracket.round_of_16,
    ...bracket.quarterfinals,
    ...bracket.semifinals,
  ];
  const matchesById = Object.fromEntries(allMatches.map((match) => [match.match_id, match]));
  const finalMatch = bracket.final?.[0];
  const championCode = getKnockoutWinnerCode(finalMatch);
  const champion = championCode ? getTeam(championCode) : null;

  return (
    <div className="bracket-export-shell" ref={bracketRef}>
      <div className="bracketology-grid">
        <KnockoutRound
          tree={LEFT_BRACKET_TREE}
          matchesById={matchesById}
          getTeam={getTeam}
          side="left"
          renderMatch={renderMatch}
          onOpenDetails={onOpenDetails}
          highlightedTeamCode={highlightedTeamCode}
          hoveredTeamCode={hoveredTeamCode}
          pinnedTeamCode={pinnedTeamCode}
          onTeamHover={onTeamHover}
          onTeamLeave={onTeamLeave}
          onTeamPin={onTeamPin}
        />

        <div className="bracket-finals-core">
          {champion ? (
            <div className="champion-banner">
              <div className="champion-banner-label">2026 World Cup Champion</div>
              <div className="champion-banner-body">
                <img src={TROPHY_PNG_URL} alt="" className="trophy-png" />
                <TeamFlag code={champion.code} size="lg" alt={`${champion.name} flag`} />
                <strong className="champion-banner-name">{champion.name}</strong>
              </div>
            </div>
          ) : null}
          <div className="bracket-finals-matches">
            <div className="bracket-finals-section bracket-finals-section-final">
              <div className="bracket-column-title">WORLD CUP FINAL</div>
              <div className="bracket-finals-stack">
                {bracket.final.map((match) => (
                  renderMatch
                    ? (
                      <div key={match.match_id} className="bracket-final-card-wrap">
                        {renderMatch({ ...match, className: "world-cup-final-card" })}
                      </div>
                    )
                    : <KnockoutMatchCard key={match.match_id} match={match} getTeam={getTeam} className="world-cup-final-card" onOpenDetails={onOpenDetails} highlightedTeamCode={highlightedTeamCode} hoveredTeamCode={hoveredTeamCode} pinnedTeamCode={pinnedTeamCode} onTeamHover={onTeamHover} onTeamLeave={onTeamLeave} onTeamPin={onTeamPin} />
                ))}
              </div>
            </div>
            <div className="bracket-finals-section bracket-finals-section-third">
              <div className="bracket-column-title third-place-title">THIRD PLACE PLAYOFF</div>
              <div className="bracket-finals-stack">
                {thirdPlaceMatch ? (
                  renderMatch
                    ? renderMatch(thirdPlaceMatch)
                    : <KnockoutMatchCard match={thirdPlaceMatch} getTeam={getTeam} onOpenDetails={onOpenDetails} highlightedTeamCode={highlightedTeamCode} hoveredTeamCode={hoveredTeamCode} pinnedTeamCode={pinnedTeamCode} onTeamHover={onTeamHover} onTeamLeave={onTeamLeave} onTeamPin={onTeamPin} />
                ) : (
                  <div className="bracket-placeholder">Awaiting semifinal results</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <KnockoutRound
          tree={RIGHT_BRACKET_TREE}
          matchesById={matchesById}
          getTeam={getTeam}
          side="right"
          renderMatch={renderMatch}
          onOpenDetails={onOpenDetails}
          highlightedTeamCode={highlightedTeamCode}
          hoveredTeamCode={hoveredTeamCode}
          pinnedTeamCode={pinnedTeamCode}
          onTeamHover={onTeamHover}
          onTeamLeave={onTeamLeave}
          onTeamPin={onTeamPin}
        />
      </div>
    </div>
  );
}
