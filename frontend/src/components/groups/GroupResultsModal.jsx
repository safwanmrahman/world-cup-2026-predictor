import { GROUP_MATCHDAY_LABELS } from "../../manualPrediction";
import Modal from "../shared/Modal";
import StandingsTable from "./StandingsTable";
import { TeamRow } from "./GroupMatchRow";

export default function GroupResultsModal({ group, onClose, getTeam }) {
  if (!group) {
    return null;
  }

  const qualifiedCodes = new Set(group.qualified_team_codes ?? []);
  const groupedMatches = GROUP_MATCHDAY_LABELS.map((label, index) => ({
    label,
    matches: (group.matches ?? []).slice(index * 2, index * 2 + 2),
  }));

  return (
    <Modal isOpen={Boolean(group)} onClose={onClose}>
      <div className="modal-header">
        <div className="section-kicker">{group.name.toUpperCase()}</div>
        <h3>Group {group.letter} Results</h3>
      </div>

      <div className="modal-section">
        <StandingsTable rows={group.table} getTeam={getTeam} qualifiedCodes={qualifiedCodes} className="modal-standings" showExtended />
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
    </Modal>
  );
}
