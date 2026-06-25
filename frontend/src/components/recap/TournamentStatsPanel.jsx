import { useMemo, useState } from "react";
import TeamFlag from "../shared/TeamFlag";
import EmptyState from "../shared/EmptyState";
import { BallIcon, BootIcon, CalendarIcon, ShieldIcon, TrophyIcon } from "../shared/Icons";
import { formatDecimal, formatPercent, formatWholeNumber } from "../../utils/formattingUtils";

const SORT_COMPARATORS = {
  totalGoalsScored_desc: (a, b) => b.totalGoalsScored - a.totalGoalsScored || a.team.name.localeCompare(b.team.name),
  totalGoalsScored_asc: (a, b) => a.totalGoalsScored - b.totalGoalsScored || a.team.name.localeCompare(b.team.name),
  averageGoalsScored_desc: (a, b) => b.averageGoalsScored - a.averageGoalsScored || b.totalGoalsScored - a.totalGoalsScored || a.team.name.localeCompare(b.team.name),
  averageGoalsScored_asc: (a, b) => a.averageGoalsScored - b.averageGoalsScored || a.totalGoalsScored - b.totalGoalsScored || a.team.name.localeCompare(b.team.name),
  totalGoalsConceded_desc: (a, b) => b.totalGoalsConceded - a.totalGoalsConceded || a.team.name.localeCompare(b.team.name),
  totalGoalsConceded_asc: (a, b) => a.totalGoalsConceded - b.totalGoalsConceded || a.team.name.localeCompare(b.team.name),
  averageGoalsConceded_desc: (a, b) => b.averageGoalsConceded - a.averageGoalsConceded || b.totalGoalsConceded - a.totalGoalsConceded || a.team.name.localeCompare(b.team.name),
  averageGoalsConceded_asc: (a, b) => a.averageGoalsConceded - b.averageGoalsConceded || a.totalGoalsConceded - b.totalGoalsConceded || a.team.name.localeCompare(b.team.name),
  cleanSheets_desc: (a, b) => b.cleanSheets - a.cleanSheets || (b.cleanSheets / b.matchesPlayed) - (a.cleanSheets / a.matchesPlayed) || a.team.name.localeCompare(b.team.name),
  cleanSheets_asc: (a, b) => a.cleanSheets - b.cleanSheets || (a.cleanSheets / a.matchesPlayed) - (b.cleanSheets / b.matchesPlayed) || a.team.name.localeCompare(b.team.name),
  cleanSheetsRate_desc: (a, b) => (b.cleanSheets / b.matchesPlayed) - (a.cleanSheets / a.matchesPlayed) || b.cleanSheets - a.cleanSheets || a.team.name.localeCompare(b.team.name),
  cleanSheetsRate_asc: (a, b) => (a.cleanSheets / a.matchesPlayed) - (b.cleanSheets / b.matchesPlayed) || a.cleanSheets - b.cleanSheets || a.team.name.localeCompare(b.team.name),
};

const STAT_TABS = [
  {
    id: "ranking",
    label: "Tournament Ranking",
    icon: <TrophyIcon />,
    defaultSort: null,
    sort: (left, right) => left.tournamentRank - right.tournamentRank,
    columns: [
      { key: "finishLabel", label: "Finish", render: (entry) => entry.finishLabel ?? "--" },
      { key: "points", label: "Pts", render: (entry) => formatWholeNumber(entry.points) },
      { key: "record", label: "W-D-L", render: (entry) => entry.record },
    ],
  },
  {
    id: "points",
    label: "Points / Record",
    icon: <CalendarIcon />,
    defaultSort: null,
    sort: (left, right) => (
      right.points - left.points
      || right.goalDifference - left.goalDifference
      || right.totalGoalsScored - left.totalGoalsScored
      || left.totalGoalsConceded - right.totalGoalsConceded
      || left.team.name.localeCompare(right.team.name)
    ),
    columns: [
      { key: "points", label: "Pts", render: (entry) => formatWholeNumber(entry.points) },
      { key: "record", label: "W-D-L", render: (entry) => entry.record },
      { key: "goalDifference", label: "GD", render: (entry) => `${entry.goalDifference > 0 ? "+" : ""}${formatWholeNumber(entry.goalDifference)}` },
    ],
  },
  {
    id: "bestAttack",
    label: "Best Attack",
    icon: <BootIcon />,
    defaultSort: { key: "totalGoalsScored", dir: "desc" },
    sort: null,
    columns: [
      { key: "totalGoalsScored", label: "Goals", render: (entry) => formatWholeNumber(entry.totalGoalsScored), sortable: true, defaultDir: "desc" },
      { key: "averageGoalsScored", label: "Avg", render: (entry) => formatDecimal(entry.averageGoalsScored), sortable: true, defaultDir: "desc" },
      { key: "matchesPlayed", label: "MP", render: (entry) => formatWholeNumber(entry.matchesPlayed) },
    ],
  },
  {
    id: "bestDefense",
    label: "Best Defense",
    icon: <ShieldIcon />,
    defaultSort: { key: "totalGoalsConceded", dir: "asc" },
    sort: null,
    columns: [
      { key: "totalGoalsConceded", label: "Goals", render: (entry) => formatWholeNumber(entry.totalGoalsConceded), sortable: true, defaultDir: "asc" },
      { key: "averageGoalsConceded", label: "Avg", render: (entry) => formatDecimal(entry.averageGoalsConceded), sortable: true, defaultDir: "asc" },
      { key: "matchesPlayed", label: "MP", render: (entry) => formatWholeNumber(entry.matchesPlayed) },
    ],
  },
  {
    id: "goalDifference",
    label: "Goal Difference",
    icon: <BallIcon />,
    defaultSort: null,
    sort: (left, right) => (
      right.goalDifference - left.goalDifference
      || right.totalGoalsScored - left.totalGoalsScored
      || left.totalGoalsConceded - right.totalGoalsConceded
      || left.team.name.localeCompare(right.team.name)
    ),
    columns: [
      { key: "goalDifference", label: "GD", render: (entry) => `${entry.goalDifference > 0 ? "+" : ""}${formatWholeNumber(entry.goalDifference)}` },
      { key: "totalGoalsScored", label: "GF", render: (entry) => formatWholeNumber(entry.totalGoalsScored) },
      { key: "totalGoalsConceded", label: "GA", render: (entry) => formatWholeNumber(entry.totalGoalsConceded) },
    ],
  },
  {
    id: "cleanSheets",
    label: "Clean Sheets",
    icon: <TrophyIcon />,
    defaultSort: { key: "cleanSheets", dir: "desc" },
    sort: null,
    columns: [
      { key: "cleanSheets", label: "CS", render: (entry) => formatWholeNumber(entry.cleanSheets), sortable: true, defaultDir: "desc" },
      { key: "cleanSheetsRate", label: "%", render: (entry) => formatPercent(entry.matchesPlayed > 0 ? entry.cleanSheets / entry.matchesPlayed : 0), sortable: true, defaultDir: "desc" },
      { key: "matchesPlayed", label: "MP", render: (entry) => formatWholeNumber(entry.matchesPlayed) },
    ],
  },
];

export default function TournamentStatsPanel({ stats = [], ranking = [] }) {
  const [activeTab, setActiveTab] = useState("ranking");
  const [columnSort, setColumnSort] = useState(null);

  const activeConfig = STAT_TABS.find((tab) => tab.id === activeTab) ?? STAT_TABS[0];
  const activeEntries = activeTab === "ranking" ? ranking : stats;

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    setColumnSort(null);
  }

  function handleColumnSort(col) {
    if (!col.sortable) return;
    setColumnSort((prev) => {
      if (prev?.key === col.key) {
        return { key: col.key, dir: prev.dir === "desc" ? "asc" : "desc" };
      }
      return { key: col.key, dir: col.defaultDir ?? "desc" };
    });
  }

  const effectiveSort = columnSort ?? activeConfig.defaultSort;

  const rankedStats = useMemo(() => {
    const sorted = [...activeEntries];
    if (activeConfig.sort) {
      sorted.sort(activeConfig.sort);
    } else if (effectiveSort) {
      const comparatorKey = `${effectiveSort.key}_${effectiveSort.dir}`;
      const comparator = SORT_COMPARATORS[comparatorKey];
      if (comparator) sorted.sort(comparator);
    }
    return sorted;
  }, [activeConfig, activeEntries, effectiveSort]);

  return (
    <section className="recap-card recap-stats-panel">
      <div className="section-kicker">Tournament Stats</div>
      <h3 className="recap-card-title">Team Leaderboards</h3>
      <div className="recap-stat-tabs" role="tablist" aria-label="Tournament stats tabs">
        {STAT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`recap-stat-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="recap-stat-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="recap-team-stats-table-wrap">
        {rankedStats.length ? (
          <table className="recap-team-stats-table">
            <thead>
              <tr>
                <th className="recap-team-stats-rank-col">#</th>
                <th>Team</th>
                {activeConfig.columns.map((col) => {
                  const isActive = effectiveSort?.key === col.key;
                  return (
                    <th
                      key={col.key}
                      className={col.sortable ? `recap-team-stats-sortable-col${isActive ? " active-sort" : ""}` : ""}
                      onClick={col.sortable ? () => handleColumnSort(col) : undefined}
                      style={col.sortable ? { cursor: "pointer", userSelect: "none" } : undefined}
                    >
                      {col.label}
                      {col.sortable && (
                        <span className="recap-sort-indicator">
                          {isActive ? (effectiveSort.dir === "desc" ? " ↓" : " ↑") : " ↕"}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rankedStats.map((entry, index) => (
                <tr key={entry.code}>
                  <td className="recap-team-stats-rank-col">{index + 1}</td>
                  <td>
                    <span className="recap-team-stats-team">
                      <TeamFlag code={entry.team.code} size="sm" alt={`${entry.team.name} flag`} />
                      <span className="recap-team-stats-team-copy">
                        <strong>{entry.team.name}</strong>
                        <small>{entry.team.code}</small>
                      </span>
                    </span>
                  </td>
                  {activeConfig.columns.map((col) => (
                    <td key={col.key}>{col.render(entry)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="recap-team-stats-empty">
            <EmptyState>Finish the tournament to unlock team leaderboards.</EmptyState>
          </div>
        )}
      </div>
    </section>
  );
}
