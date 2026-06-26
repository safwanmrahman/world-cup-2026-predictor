import { GROUP_MATCHDAY_LABELS } from "../../manualPrediction";
import Modal from "../shared/Modal";
import StandingsTable from "./StandingsTable";
import GroupMatchRow from "./GroupMatchRow";

export default function GroupEditorModal({
  group,
  qualifiedCodes,
  getTeam,
  onClose,
  onScoreChange,
  onQuickPick,
}) {
  if (!group) {
    return null;
  }

  const groupedMatches = GROUP_MATCHDAY_LABELS.map((label, index) => ({
    label,
    matches: (group.matches ?? []).slice(index * 2, index * 2 + 2),
  }));

  return (
    <Modal isOpen={Boolean(group)} onClose={onClose} className="group-modal manual-group-modal">
      <div className="modal-header">
        <div className="section-kicker">{group.name.toUpperCase()}</div>
        <h3>{group.name}</h3>
      </div>

      <div className="modal-section">
        <StandingsTable
          rows={group.table}
          getTeam={getTeam}
          qualifiedCodes={qualifiedCodes}
          className="modal-standings manual-modal-standings"
          showExtended
        />
      </div>

      <div className="modal-section manual-group-section">
        <div className="manual-group-fixtures">
          {groupedMatches.map((matchday) => (
            <div className="matchday-block" key={matchday.label}>
              <div className="matchday-label">{matchday.label}</div>
              <div className="fixture-list">
                {matchday.matches.map((match) => (
                  <GroupMatchRow
                    key={match.match_id}
                    match={match}
                    getTeam={getTeam}
                    onScoreChange={onScoreChange}
                    onQuickPick={onQuickPick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
