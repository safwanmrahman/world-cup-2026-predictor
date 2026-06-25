import TeamFlag from "../shared/TeamFlag";

export default function ThirdPlaceAdvancers({ title, description, teams = [], getTeam }) {
  return (
    <section className="surface-card full-span third-place-section">
      <div className="section-kicker">THIRD-PLACE ADVANCERS</div>
      <h2 className="section-title">{title}</h2>
      <p className="third-place-description">{description}</p>
      <div className="third-place-selector">
        {teams.map((team) => {
          const resolvedTeam = getTeam(team.team_code);
          if (!resolvedTeam) {
            return null;
          }

          return (
            <div
              key={`${team.group_name}-${team.team_code}`}
              className="third-place-chip active third-place-chip-static"
            >
              <TeamFlag code={resolvedTeam.code} size="sm" alt={`${resolvedTeam.name} flag`} />
              <span>{team.group_name}</span>
              <strong>{resolvedTeam.name}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
