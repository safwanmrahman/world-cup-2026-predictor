import Badge from "../shared/Badge";
import TeamFlag from "../shared/TeamFlag";
import StandingsTable from "./StandingsTable";

export default function GroupCard({
  group,
  getTeam,
  qualifiedCodes,
  onOpen,
  isManual = false,
  onKeyDown,
}) {
  const completedLabel = `${group.completedMatches}/${group.totalMatches} picked`;

  return (
    <article
      className={`group-card ${isManual ? "manual-group-card" : ""}`}
      onClick={() => onOpen(group)}
      onKeyDown={(event) => onKeyDown(event, group)}
      tabIndex={0}
      role="button"
    >
      <div className="group-watermark">{group.letter || group.name.replace("Group ", "")}</div>
      <div className="group-card-header">
        {isManual ? (
          <div className="manual-group-toggle">
            <div>
              <span className="group-card-label">{group.name}</span>
              <div className="manual-group-summary">
                {group.teams.map((team) => (
                  <span className="manual-group-summary-team" key={team.code}>
                    <TeamFlag code={team.code} size="sm" alt={`${team.name} flag`} />
                    <span>{team.code}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="badge-row">
              <Badge label={completedLabel} tone={group.isComplete ? "green" : "muted"} />
              <Badge label="Edit Group" tone="muted" />
            </div>
          </div>
        ) : (
          <span className="group-card-label">{group.name}</span>
        )}
      </div>

      {isManual ? (
        <div className="badge-row">
          <Badge label={group.autoCalculated ? "Auto-calculated" : "Manual"} tone={group.autoCalculated ? "muted" : "gold"} />
        </div>
      ) : null}

      {group.table ? (
        <StandingsTable
          rows={group.table}
          getTeam={getTeam}
          qualifiedCodes={qualifiedCodes}
          className={isManual ? "group-standings manual-group-standings" : "group-standings"}
          nameAccessor={(team, row) => (isManual ? team?.name ?? row.team_code : row.team_code)}
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
