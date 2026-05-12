import { GROUP_MATCHDAY_LABELS } from "../../manualPrediction";
import Badge from "../shared/Badge";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import StandingsTable from "./StandingsTable";
import GroupMatchRow from "./GroupMatchRow";

function getManualMatchStatus(match, stage) {
  const labels = [];
  if (match.source === "quick-pick-generated-score") {
    labels.push({ label: "Quick Pick", tone: "gold" });
    labels.push({ label: "Generated Score", tone: "muted" });
  } else if (match.source === "manual-score") {
    labels.push({ label: "Manual Score", tone: "green" });
  }

  if (match.selected_outcome === "draw" && stage === "group") {
    labels.push({ label: "Draw", tone: "muted" });
  }

  if (match.result_type === "PENS") {
    labels.push({ label: "Pens", tone: "gold" });
  }

  return labels;
}

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

  return (
    <Modal isOpen={Boolean(group)} onClose={onClose} className="group-modal manual-group-modal">
      <div className="modal-header">
        <div className="section-kicker">{group.name.toUpperCase()}</div>
        <h3>{group.name} Editor</h3>
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
          <Badge label={`${group.completedMatches}/${group.totalMatches} picked`} tone={group.isComplete ? "green" : "muted"} />
        </div>
        <div className="manual-group-fixtures">
          {(group.matches ?? []).map((match) => (
            <GroupMatchRow
              key={match.match_id}
              match={match}
              getTeam={getTeam}
              onScoreChange={onScoreChange}
              onQuickPick={onQuickPick}
              labels={getManualMatchStatus(match, "group")}
            />
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
