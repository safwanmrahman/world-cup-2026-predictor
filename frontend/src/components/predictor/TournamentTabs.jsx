import { TOURNAMENT_TABS } from "../../data/constants";

export default function TournamentTabs({ activeTab, onChange }) {
  return (
    <div className="tournament-tabs-shell">
      <div className="section-kicker">TOURNAMENT VIEW</div>
      <div className="tournament-tabs" role="tablist" aria-label="Tournament sections">
        {TOURNAMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tournament-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
