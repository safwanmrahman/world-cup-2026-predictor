import HeroActions from "./HeroActions";
import ThemeToggle from "./ThemeToggle";

export default function HeroSection({
  theme,
  onToggleTheme,
  activeMode,
  setActiveMode,
  activeSimulationAction,
  runSingleTournament,
  runSimulationBatch,
  normalizedSimulationCount,
  simulationCount,
  setSimulationCount,
  simulating,
}) {
  return (
    <header className="hero-shell">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />

      <div className="hero-copy">
        <h1 className="hero-title">
          <span className="hero-title-prefix">FIFA World Cup 2026</span>
          <span className="hero-title-highlight">Predictor</span>
        </h1>
      </div>

      <section className="mode-switcher">
        <button
          type="button"
          className={`mode-tab ${activeMode === "simulator" ? "active" : ""}`}
          onClick={() => setActiveMode("simulator")}
        >
          Simulator Mode
        </button>
        <button
          type="button"
          className={`mode-tab ${activeMode === "manual" ? "active" : ""}`}
          onClick={() => setActiveMode("manual")}
        >
          Predictor Mode
        </button>
      </section>

      {activeMode === "simulator" ? (
        <HeroActions
          activeSimulationAction={activeSimulationAction}
          runSingleTournament={runSingleTournament}
          runSimulationBatch={runSimulationBatch}
          normalizedSimulationCount={normalizedSimulationCount}
          simulationCount={simulationCount}
          setSimulationCount={setSimulationCount}
          simulating={simulating}
        />
      ) : null}
    </header>
  );
}
