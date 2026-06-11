import { DEFAULT_SIMULATION_COUNT, PUBLIC_SIMULATION_MAX } from "../../data/constants";
import Button from "../shared/Button";

export default function HeroActions({
  activeSimulationAction,
  runSingleTournament,
  runSimulationBatch,
  normalizedSimulationCount,
  simulationCount,
  setSimulationCount,
  simulating,
}) {
  return (
    <div className="hero-footer">
      <div className="hero-actions">
        <Button
          className={activeSimulationAction === "default" ? "button-primary" : "button-hero-primary"}
          onClick={() => runSimulationBatch(DEFAULT_SIMULATION_COUNT, "default")}
          disabled={simulating}
        >
          Simulate {DEFAULT_SIMULATION_COUNT} Tournaments
        </Button>
        <Button
          className={activeSimulationAction === "single" ? "button-secondary button-selected" : "button-secondary"}
          onClick={runSingleTournament}
          disabled={simulating}
        >
          Simulate One Tournament
        </Button>
        <Button
          className={activeSimulationAction === "custom" ? "button-secondary button-selected" : "button-secondary"}
          onClick={() => runSimulationBatch(normalizedSimulationCount, "custom")}
          disabled={simulating}
        >
          Run Custom Batch
        </Button>
      </div>

      <div className="hero-controls">
        <label className="inline-field">
          <span>CUSTOM COUNT</span>
          <input
            type="number"
            min="1"
            max={PUBLIC_SIMULATION_MAX}
            value={simulationCount}
            onChange={(event) => {
              const rawValue = event.target.value;
              if (rawValue === "") {
                setSimulationCount("");
                return;
              }

              const normalized = String(Math.min(PUBLIC_SIMULATION_MAX, Math.max(1, Number(rawValue))));
              setSimulationCount(normalized);
            }}
          />
        </label>
      </div>
    </div>
  );
}
