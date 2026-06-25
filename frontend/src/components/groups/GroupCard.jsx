import StandingsTable from "./StandingsTable";

export default function GroupCard({
  group,
  getTeam,
  qualifiedCodes,
  onOpen,
  onReorderGroup,
  isManual = false,
  onKeyDown,
}) {
  const isInteractive = typeof onOpen === "function";
  const isReorderable = isManual && typeof onReorderGroup === "function";

  return (
    <article
      className="group-card"
      onClick={isInteractive ? () => onOpen(group) : undefined}
      onKeyDown={isInteractive && typeof onKeyDown === "function" ? (event) => onKeyDown(event, group) : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? "button" : undefined}
      aria-label={isInteractive ? `${group.name}${isManual ? "" : " results"}` : undefined}
    >
      <div className="group-watermark">{group.letter || group.name.replace("Group ", "")}</div>
      <div className="group-card-header">
        <span className="group-card-label">{group.name}</span>
        {isReorderable ? <span className="group-card-hint">Drag teams to reorder</span> : null}
      </div>

      {group.table ? (
        <StandingsTable
          rows={group.table}
          getTeam={getTeam}
          qualifiedCodes={qualifiedCodes}
          className="group-standings"
          reorderable={isReorderable}
          onReorderRows={(draggedTeamCode, targetTeamCode) =>
            onReorderGroup(
              group.name,
              group.table.map((row) => row.team_code),
              draggedTeamCode,
              targetTeamCode,
            )}
        />
      ) : (
        <div className="group-team-list">
          {group.teams.map((team) => (
            <div className="group-team-item" key={team.code}>
              <div className="group-team-name">
                <TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />
                <span>{team.name}</span>
              </div>
              <span className="group-team-rank">#{team.fifa_ranking}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
