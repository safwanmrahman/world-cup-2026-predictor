import { useRef } from "react";
import TeamFlag from "../shared/TeamFlag";
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
  const allowCardOpen = isInteractive;
  const suppressOpenUntilRef = useRef(0);

  function suppressCardOpen(durationMs) {
    suppressOpenUntilRef.current = Math.max(
      suppressOpenUntilRef.current,
      Date.now() + durationMs,
    );
  }

  function handleCardOpen(event) {
    const target = event?.target;
    if (target instanceof Element && target.closest(".group-row-drag-handle, button, input, select, textarea, a")) {
      return;
    }

    if (Date.now() < suppressOpenUntilRef.current) {
      return;
    }

    onOpen(group);
  }

  return (
    <article
      className={`group-card ${isReorderable ? "group-card-reorderable" : ""}`.trim()}
      onClick={allowCardOpen ? handleCardOpen : undefined}
      onKeyDown={allowCardOpen && typeof onKeyDown === "function" ? (event) => onKeyDown(event, group) : undefined}
      tabIndex={allowCardOpen ? 0 : undefined}
      role={allowCardOpen ? "button" : undefined}
      aria-label={allowCardOpen ? `${group.name}${isManual ? "" : " results"}` : undefined}
    >
      <div className="group-watermark">{group.letter || group.name.replace("Group ", "")}</div>
      <div className="group-card-header">
        {isReorderable ? (
          <button
            type="button"
            className="group-card-open-button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen?.(group);
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
            }}
            aria-label={`Edit ${group.name}`}
          >
            {group.name}
          </button>
        ) : (
          <span className="group-card-label">{group.name}</span>
        )}
      </div>

      {group.table ? (
        <StandingsTable
          rows={group.table}
          getTeam={getTeam}
          qualifiedCodes={qualifiedCodes}
          className="group-standings"
          reorderable={isReorderable}
          onHandlePointerDown={() => {
            suppressCardOpen(1500);
          }}
          onDragStart={() => {
            suppressCardOpen(2000);
          }}
          onDragEnd={() => {
            suppressCardOpen(300);
          }}
          onDragCancel={() => {
            suppressCardOpen(300);
          }}
          onReorderRows={(nextOrder) =>
            onReorderGroup(
              group.name,
              nextOrder,
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
