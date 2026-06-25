import { GROUP_MATCHDAY_LABELS } from "../../manualPrediction";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import StandingsTable from "./StandingsTable";
import GroupMatchRow from "./GroupMatchRow";

export default function GroupEditorModal({
  group,
  qualifiedCodes,
  getTeam,
  overrideVisible,
  onClose,
  onToggleOverride,
  onScoreChange,
  onQuickPick,
  onMoveOverride,
  onClearOverride,
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
        <div className="manual-subheading">
          <span>Click-to-pick Matches</span>
        </div>
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

      <div className="modal-section manual-group-section">
        <div className="manual-subheading">
          <span>Standings Override</span>
          <Button className="button-secondary" onClick={() => onToggleOverride(group.name)}>
            {overrideVisible ? "Hide Advanced Override" : "Show Advanced Override"}
          </Button>
        </div>
        {overrideVisible ? (
          <div className="manual-order-stack">
            {group.table.map((row, index) => {
              const team = getTeam(row.team_code);
              return (
                <div className="manual-order-row" key={row.team_code}>
                  <div className="manual-order-rank">{index + 1}</div>
                  <div className="manual-order-team">
                    <span>{team?.name ?? row.team_code}</span>
                  </div>
                  <div className="manual-order-actions">
                    <button type="button" className="icon-button" onClick={() => onMoveOverride(group.name, row.team_code, "up", group.table)}>↑</button>
                    <button type="button" className="icon-button" onClick={() => onMoveOverride(group.name, row.team_code, "down", group.table)}>↓</button>
                  </div>
                </div>
              );
            })}
            <Button className="button-secondary" onClick={() => onClearOverride(group.name)}>Clear Override</Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
