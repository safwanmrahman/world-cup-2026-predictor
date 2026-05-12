import Badge from "../shared/Badge";
import Button from "../shared/Button";

export default function PredictorToolbar({
  manualSaved,
  shareStatus,
  activeManualAction,
  onExport,
  onShare,
  onAutofill,
  onResetGroups,
  onResetKnockouts,
  onFullReset,
}) {
  return (
    <section className="surface-card manual-toolbar">
      <div>
        <div className="section-kicker">MY PREDICTION</div>
        <h2 className="section-title">Build Your Bracket</h2>
      </div>
      <div className="badge-row">
        <Badge label="Manual" tone="gold" />
        <Badge label={manualSaved ? "Saved" : "Editing"} tone={manualSaved ? "green" : "muted"} />
        {shareStatus ? <Badge label={shareStatus} tone="muted" /> : null}
      </div>
      <div className="manual-toolbar-actions">
        <div className="manual-toolbar-group">
          <div className="manual-toolbar-group-label">Share / Export</div>
          <div className="manual-toolbar-button-row">
            <Button className={activeManualAction === "export" ? "button-primary" : "button-secondary"} onClick={onExport}>
              Export Bracket Image
            </Button>
            <Button className={activeManualAction === "share" ? "button-primary" : "button-secondary"} onClick={onShare}>
              Copy Share Link
            </Button>
          </div>
        </div>
        <div className="manual-toolbar-group">
          <div className="manual-toolbar-group-label">Auto-fill</div>
          <div className="manual-toolbar-button-row">
            <Button className={activeManualAction === "autofill" ? "button-primary" : "button-secondary"} onClick={onAutofill}>
              Auto-fill Remaining
            </Button>
          </div>
        </div>
        <div className="manual-toolbar-group manual-toolbar-group-reset">
          <div className="manual-toolbar-group-label">Reset</div>
          <div className="manual-toolbar-button-row">
            <Button className={`button-reset ${activeManualAction === "groups" ? "active" : ""}`} onClick={onResetGroups}>
              Reset Groups
            </Button>
            <Button className={`button-reset ${activeManualAction === "knockouts" ? "active" : ""}`} onClick={onResetKnockouts}>
              Reset Knockouts
            </Button>
            <Button className={`button-reset ${activeManualAction === "full" ? "active" : ""}`} onClick={onFullReset}>
              Full Reset
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
