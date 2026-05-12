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
        <h1 className="hero-title">FIFA WORLD CUP 2026 PREDICTOR</h1>
        <p className="hero-subtitle">
          Simulate the full 48-team World Cup with score-based match outcomes, live group tables,
          a real knockout path, and a cleaner matchday experience.
        </p>
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
