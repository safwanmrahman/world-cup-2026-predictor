import Button from "../shared/Button";
import TeamFlag from "../shared/TeamFlag";
import {
  formatDecimal,
  formatPercent,
  formatPredictionScore,
  getPredictionAdvancingTeam,
  getPredictionSampleWinnerCode,
} from "../../utils/formattingUtils";

export default function HeadToHeadPredictor({
  predicting,
  prediction,
  predictionForm,
  setPredictionForm,
  sortedTeams,
  getTeam,
  onPredictMatch,
}) {
  const homeTeam = getTeam(predictionForm.home_team_code);
  const awayTeam = getTeam(predictionForm.away_team_code);
  const isKnockoutPrediction = prediction?.stage === "knockout";
  const predictionAdvancingTeam = getPredictionAdvancingTeam(prediction);
  const predictionWinnerCode = getPredictionSampleWinnerCode(prediction);

  return (
    <section className="surface-card predictor-panel">
      <div className="section-kicker">MATCH PREDICTOR</div>
      <h2 className="section-title">Head-To-Head Model</h2>

      <form className="predictor-form" onSubmit={onPredictMatch}>
        <label className="field-block">
          <span>HOME TEAM</span>
          <select
            value={predictionForm.home_team_code}
            onChange={(event) =>
              setPredictionForm((current) => ({
                ...current,
                home_team_code: event.target.value,
              }))
            }
          >
            {sortedTeams.map((team) => (
              <option key={team.code} value={team.code}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field-block">
          <span>AWAY TEAM</span>
          <select
            value={predictionForm.away_team_code}
            onChange={(event) =>
              setPredictionForm((current) => ({
                ...current,
                away_team_code: event.target.value,
              }))
            }
          >
            {sortedTeams.map((team) => (
              <option key={team.code} value={team.code}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field-block">
          <span>STAGE</span>
          <select
            value={predictionForm.stage}
            onChange={(event) =>
              setPredictionForm((current) => ({
                ...current,
                stage: event.target.value,
              }))
            }
          >
            <option value="group">Group Stage</option>
            <option value="knockout">Knockout</option>
          </select>
        </label>

        <div className="vs-card">
          <div className={`vs-team ${predictionWinnerCode === homeTeam?.code ? "vs-team-winner" : ""}`}>
            <TeamFlag code={homeTeam?.code} size="hero" alt={`${homeTeam?.name ?? ""} flag`} />
            <div className="vs-name">{homeTeam?.name}</div>
            <div className="vs-code">{homeTeam?.code}</div>
          </div>
          <div className={`vs-pill ${prediction ? "vs-score" : ""}`}>{formatPredictionScore(prediction)}</div>
          <div className={`vs-team ${predictionWinnerCode === awayTeam?.code ? "vs-team-winner" : ""}`}>
            <TeamFlag code={awayTeam?.code} size="hero" alt={`${awayTeam?.name ?? ""} flag`} />
            <div className="vs-name">{awayTeam?.name}</div>
            <div className="vs-code">{awayTeam?.code}</div>
          </div>
        </div>

        <Button type="submit" className="button-primary full-width" disabled={predicting}>
          {predicting ? "Calculating..." : "Predict Match"}
        </Button>
      </form>

      {prediction ? (
        <div className="predictor-results">
          <div className="result-meta-row">
            <span className="result-tag">{prediction.stage.toUpperCase()}</span>
            <span className="result-scoreline">
              {predictionAdvancingTeam ? `${predictionAdvancingTeam.name} advances` : "MODEL SNAPSHOT"}
            </span>
          </div>

          <div className="metric-pair-grid">
            <div className="metric-tile">
              <span>EXPECTED GOALS</span>
              <strong>
                {formatDecimal(prediction.probabilities.expected_goals.home)} -{" "}
                {formatDecimal(prediction.probabilities.expected_goals.away)}
              </strong>
            </div>
            <div className="metric-tile">
              <span>LIKELY SCORELINES</span>
              <strong>{prediction.probabilities.top_scorelines[0]?.score}</strong>
            </div>
          </div>

          <div className="probability-stack">
            <div className="probability-row">
              <span>{prediction.home_team.name} win</span>
              <div className="mini-meter">
                <div className="mini-meter-fill" style={{ width: `${prediction.probabilities.home_win * 100}%` }} />
              </div>
              <strong>{formatPercent(prediction.probabilities.home_win)}</strong>
            </div>
            <div className="probability-row">
              <span>{isKnockoutPrediction ? "Draw after 90" : "Draw"}</span>
              <div className="mini-meter">
                <div className="mini-meter-fill gold" style={{ width: `${prediction.probabilities.draw * 100}%` }} />
              </div>
              <strong>{formatPercent(prediction.probabilities.draw)}</strong>
            </div>
            <div className="probability-row">
              <span>{prediction.away_team.name} win</span>
              <div className="mini-meter">
                <div className="mini-meter-fill muted" style={{ width: `${prediction.probabilities.away_win * 100}%` }} />
              </div>
              <strong>{formatPercent(prediction.probabilities.away_win)}</strong>
            </div>
            {isKnockoutPrediction ? (
              <>
                <div className="probability-row">
                  <span>{prediction.home_team.name} advance</span>
                  <div className="mini-meter">
                    <div className="mini-meter-fill" style={{ width: `${prediction.probabilities.home_advance * 100}%` }} />
                  </div>
                  <strong>{formatPercent(prediction.probabilities.home_advance)}</strong>
                </div>
                <div className="probability-row">
                  <span>{prediction.away_team.name} advance</span>
                  <div className="mini-meter">
                    <div className="mini-meter-fill muted" style={{ width: `${prediction.probabilities.away_advance * 100}%` }} />
                  </div>
                  <strong>{formatPercent(prediction.probabilities.away_advance)}</strong>
                </div>
              </>
            ) : null}
          </div>

          <div className="scoreline-chip-row">
            {prediction.probabilities.top_scorelines.map((scoreline) => (
              <div className="scoreline-chip" key={scoreline.score}>
                <span>{scoreline.score}</span>
                <strong>{formatPercent(scoreline.probability)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
