import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, closestCenter, pointerWithin, rectIntersection, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TeamFlag from "../shared/TeamFlag";

const BASE_COLUMNS = [
  { key: "team", label: "Team", width: "minmax(0, 2.6fr)", align: "start" },
  { key: "points", label: "PTS", width: "0.72fr", align: "center" },
  { key: "wins", label: "W", width: "0.62fr", align: "center" },
  { key: "draws", label: "D", width: "0.62fr", align: "center" },
  { key: "losses", label: "L", width: "0.62fr", align: "center" },
];

const EXTENDED_COLUMNS = [
  { key: "goals_for", label: "GF", width: "0.72fr", align: "center" },
  { key: "goals_against", label: "GA", width: "0.72fr", align: "center" },
];

const GOAL_DIFFERENCE_COLUMN = { key: "goal_difference", label: "GD", width: "0.72fr", align: "center" };
const HANDLE_COLUMN = { key: "handle", label: "", width: "42px", align: "center" };

function resolveGroupRowCollision(args) {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }

  return closestCenter(args);
}

function buildColumns(showExtended, reorderable) {
  return [
    ...(reorderable ? [HANDLE_COLUMN] : []),
    ...BASE_COLUMNS,
    ...(showExtended ? EXTENDED_COLUMNS : []),
    GOAL_DIFFERENCE_COLUMN,
  ];
}

function formatCellValue(row, key) {
  if (key === "goal_difference") {
    return row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference;
  }

  return row[key];
}

function TeamCell({ team, row, showExtended, nameAccessor }) {
  return (
    <div className="group-team-cell group-modal-team">
      <TeamFlag code={row.team_code} size={showExtended ? "md" : "sm"} alt={`${team?.name ?? row.team_code} flag`} />
      <span>{nameAccessor(team, row)}</span>
    </div>
  );
}

function DragHandle({ attributes, listeners, onPointerDown }) {
  const {
    onPointerDown: dndOnPointerDown,
    onMouseDown: dndOnMouseDown,
    onTouchStart: dndOnTouchStart,
    onClick: dndOnClick,
    ...restListeners
  } = listeners ?? {};

  return (
    <button
      type="button"
      className="group-row-drag-handle"
      aria-label="Drag to reorder"
      {...attributes}
      {...restListeners}
      onPointerDown={(event) => {
        onPointerDown?.();
        event.stopPropagation();
        dndOnPointerDown?.(event);
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        dndOnMouseDown?.(event);
      }}
      onTouchStart={(event) => {
        event.stopPropagation();
        dndOnTouchStart?.(event);
      }}
      onClick={(event) => {
        event.stopPropagation();
        dndOnClick?.(event);
      }}
    >
      <span className="group-row-drag-dots" aria-hidden="true">
        ⋮⋮
      </span>
    </button>
  );
}

function SortableRow({
  row,
  index,
  team,
  columns,
  gridTemplateColumns,
  qualifiedCodes,
  showExtended,
  nameAccessor,
  isOverlay = false,
  onHandlePointerDown,
  dragActive = false,
}) {
  const sortable = useSortable({
    id: row.team_code,
    disabled: isOverlay,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const style = isOverlay
    ? { gridTemplateColumns }
    : {
        gridTemplateColumns,
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition: dragActive ? transition : undefined,
      };

  const isQualified = qualifiedCodes.has(row.team_code) || index < 2;

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      className={`group-standings-sortable-row ${index % 2 === 0 ? "is-alt" : ""} ${isQualified ? "qualified" : ""} ${isDragging ? "is-drag-source" : ""} ${isOverlay ? "is-overlay" : ""}`.trim()}
      style={style}
    >
      {columns.map((column) => {
        if (column.key === "handle") {
          return (
            <div key="handle" className="group-standings-sortable-cell align-center group-standings-handle-cell">
              {!isOverlay ? (
                <DragHandle
                  attributes={attributes}
                  listeners={listeners}
                  onPointerDown={onHandlePointerDown}
                />
              ) : <span className="group-row-drag-placeholder" aria-hidden="true">⋮⋮</span>}
            </div>
          );
        }

        if (column.key === "team") {
          return (
            <div key="team" className="group-standings-sortable-cell align-start">
              <TeamCell team={team} row={row} showExtended={showExtended} nameAccessor={nameAccessor} />
            </div>
          );
        }

        return (
          <div
            key={column.key}
            className={`group-standings-sortable-cell align-${column.align}`}
          >
            {formatCellValue(row, column.key)}
          </div>
        );
      })}
    </div>
  );
}

function SortableStandingsTable({
  rows,
  getTeam,
  qualifiedCodes,
  className,
  showExtended,
  nameAccessor,
  onReorderRows,
  onHandlePointerDown,
  onDragStart,
  onDragEnd,
  onDragCancel,
}) {
  const columns = useMemo(() => buildColumns(showExtended, true), [showExtended]);
  const gridTemplateColumns = useMemo(() => columns.map((column) => column.width).join(" "), [columns]);
  const incomingOrderedCodes = useMemo(() => rows.map((row) => row.team_code), [rows]);
  const incomingOrderSignature = useMemo(() => incomingOrderedCodes.join("|"), [incomingOrderedCodes]);
  const [orderedCodes, setOrderedCodes] = useState(incomingOrderedCodes);
  const [activeCode, setActiveCode] = useState(null);
  const orderedCodesRef = useRef(incomingOrderedCodes);

  useEffect(() => {
    setOrderedCodes((current) => {
      const currentSignature = current.join("|");
      if (currentSignature === incomingOrderSignature) {
        return current;
      }

      return incomingOrderedCodes;
    });
  }, [incomingOrderedCodes, incomingOrderSignature]);

  useEffect(() => {
    orderedCodesRef.current = orderedCodes;
  }, [orderedCodes]);

  const rowByCode = useMemo(
    () => new Map(rows.map((row) => [row.team_code, row])),
    [rows],
  );

  const orderedRows = orderedCodes
    .map((code) => rowByCode.get(code))
    .filter(Boolean);

  const activeRow = activeCode ? rowByCode.get(activeCode) : null;
  const activeTeam = activeRow ? getTeam(activeRow.team_code) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  function handleDragStart(event) {
    setActiveCode(String(event.active.id));
    onDragStart?.(event);
  }

  function handleDragOver() {}

  function handleDragEnd(event) {
    const { active, over } = event;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;
    setActiveCode(null);

    if (!overId || activeId === overId) {
      onDragEnd?.(event);
      return;
    }

    const current = orderedCodesRef.current;
    const oldIndex = current.indexOf(activeId);
    const newIndex = current.indexOf(overId);

    if (oldIndex < 0 || newIndex < 0) {
      onDragEnd?.(event);
      return;
    }

    const nextRows = arrayMove(current, oldIndex, newIndex);
    orderedCodesRef.current = nextRows;
    setOrderedCodes(nextRows);
    onReorderRows?.(nextRows);
    onDragEnd?.(event);
  }

  function handleDragCancel() {
    setActiveCode(null);
    setOrderedCodes(rows.map((row) => row.team_code));
    onDragCancel?.();
  }

  return (
    <div className={`${className} group-standings-sortable`}>
      <div className="group-standings-sortable-head" style={{ gridTemplateColumns }}>
        {columns.map((column) => (
          <div
            key={column.key}
            className={`group-standings-sortable-cell group-standings-sortable-head-cell align-${column.align}`}
          >
            {column.label}
          </div>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={resolveGroupRowCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={orderedCodes} strategy={verticalListSortingStrategy}>
          <div className="group-standings-sortable-body">
            {orderedRows.map((row, index) => (
              <SortableRow
                key={row.team_code}
                row={row}
                index={index}
                team={getTeam(row.team_code)}
                columns={columns}
                gridTemplateColumns={gridTemplateColumns}
                qualifiedCodes={qualifiedCodes}
                showExtended={showExtended}
                nameAccessor={nameAccessor}
                onHandlePointerDown={onHandlePointerDown}
                dragActive={activeCode != null}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeRow ? (
            <div className="group-standings-drag-overlay">
              <SortableRow
                row={activeRow}
                index={orderedCodes.indexOf(activeRow.team_code)}
                team={activeTeam}
                columns={columns}
                gridTemplateColumns={gridTemplateColumns}
                qualifiedCodes={qualifiedCodes}
                showExtended={showExtended}
                nameAccessor={nameAccessor}
                isOverlay
                dragActive={activeCode != null}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default function StandingsTable({
  rows,
  getTeam,
  qualifiedCodes = new Set(),
  className = "group-standings",
  showExtended = false,
  nameAccessor = (team, row) => team?.name ?? row.team_code,
  reorderable = false,
  onReorderRows,
  onHandlePointerDown,
  onDragStart,
  onDragEnd,
  onDragCancel,
}) {
  if (reorderable) {
    return (
      <SortableStandingsTable
        rows={rows}
        getTeam={getTeam}
        qualifiedCodes={qualifiedCodes}
        className={className}
        showExtended={showExtended}
        nameAccessor={nameAccessor}
        onReorderRows={onReorderRows}
        onHandlePointerDown={onHandlePointerDown}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      />
    );
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
          return (
            <tr key={row.team_code} className={qualifiedCodes.has(row.team_code) || index < 2 ? "qualified" : ""}>
              <td>
                <TeamCell team={team} row={row} showExtended={showExtended} nameAccessor={nameAccessor} />
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
