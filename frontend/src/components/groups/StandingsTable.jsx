import { useState } from "react";
import TeamFlag from "../shared/TeamFlag";

export default function StandingsTable({
  rows,
  getTeam,
  qualifiedCodes = new Set(),
  className = "group-standings",
  showExtended = false,
  nameAccessor = (team, row) => team?.name ?? row.team_code,
  reorderable = false,
  onReorderRows,
}) {
  const [draggedCode, setDraggedCode] = useState(null);
  const [dropTargetCode, setDropTargetCode] = useState(null);

  function resetDragState() {
    setDraggedCode(null);
    setDropTargetCode(null);
  }

  return (
    <table className={className}>
      <thead>
        <tr>
          <th>Team</th>
          <th>PTS</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          {showExtended ? (
            <>
              <th>GF</th>
              <th>GA</th>
            </>
          ) : null}
          <th>GD</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const team = getTeam(row.team_code);
          const rowClasses = [
            qualifiedCodes.has(row.team_code) || index < 2 ? "qualified" : "",
            reorderable ? "group-standings-draggable-row" : "",
            draggedCode === row.team_code ? "dragging" : "",
            dropTargetCode === row.team_code && draggedCode !== row.team_code ? "drop-target" : "",
          ].filter(Boolean).join(" ");

          return (
            <tr
              key={row.team_code}
              className={rowClasses}
              draggable={reorderable}
              onPointerDown={reorderable ? (event) => event.stopPropagation() : undefined}
              onClick={reorderable ? (event) => event.stopPropagation() : undefined}
              onDragStart={reorderable ? (event) => {
                event.stopPropagation();
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", row.team_code);
                setDraggedCode(row.team_code);
                setDropTargetCode(row.team_code);
              } : undefined}
              onDragOver={reorderable ? (event) => {
                if (draggedCode === row.team_code) {
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                if (dropTargetCode !== row.team_code) {
                  setDropTargetCode(row.team_code);
                }
              } : undefined}
              onDrop={reorderable ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                const draggedTeamCode = event.dataTransfer.getData("text/plain") || draggedCode;
                if (draggedTeamCode && draggedTeamCode !== row.team_code) {
                  onReorderRows?.(draggedTeamCode, row.team_code);
                }
                resetDragState();
              } : undefined}
              onDragEnd={reorderable ? resetDragState : undefined}
            >
              <td>
                <div className="group-team-cell group-modal-team">
                  <TeamFlag code={row.team_code} size={showExtended ? "md" : "sm"} alt={`${team?.name ?? row.team_code} flag`} />
                  <span>{nameAccessor(team, row)}</span>
                </div>
              </td>
              <td>{row.points}</td>
              <td>{row.wins}</td>
              <td>{row.draws}</td>
              <td>{row.losses}</td>
              {showExtended ? (
                <>
                  <td>{row.goals_for}</td>
                  <td>{row.goals_against}</td>
                </>
              ) : null}
              <td>{row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
