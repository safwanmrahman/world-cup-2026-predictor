import TeamFlag from "../shared/TeamFlag";

export default function StandingsTable({
  rows,
  getTeam,
  qualifiedCodes = new Set(),
  className = "group-standings",
  showExtended = false,
  nameAccessor = (team, row) => team?.name ?? row.team_code,
}) {
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
          return (
            <tr key={row.team_code} className={qualifiedCodes.has(row.team_code) || index < 2 ? "qualified" : ""}>
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
