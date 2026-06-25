import EmptyState from "../shared/EmptyState";
import GroupCard from "./GroupCard";

export default function GroupStage({
  title,
  groups,
  getTeam,
  qualifiedCodes,
  onOpenGroup,
  onReorderGroup,
  onGroupKeyDown,
  loading = false,
  isManual = false,
}) {
  return (
    <section className="surface-card full-span">
      <div className="section-kicker">GROUP STAGE</div>
      <h2 className="section-title">{title}</h2>
      {loading ? (
        <EmptyState>Loading group data...</EmptyState>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <GroupCard
              key={group.name}
              group={group}
              getTeam={getTeam}
              qualifiedCodes={qualifiedCodes}
              onOpen={onOpenGroup}
              onReorderGroup={onReorderGroup}
              isManual={isManual}
              onKeyDown={onGroupKeyDown}
            />
          ))}
        </div>
      )}
    </section>
  );
}
