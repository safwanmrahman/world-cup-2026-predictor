import Button from "../shared/Button";

export default function PredictorToolbar({
  activeManualAction,
  onExport,
  onShare,
  onAutofill,
  onResetGroups,
  onResetKnockouts,
}) {
  return (
    <section className="surface-card manual-toolbar">
      <div>
        <div className="section-kicker">MY PREDICTION</div>
        <h2 className="section-title">Build Your Bracket</h2>
      </div>
      <div className="manual-toolbar-actions">
        <div className="manual-toolbar-button-row">
          <Button className={activeManualAction === "export" ? "button-primary" : "button-secondary"} onClick={onExport}>
            Export Bracket Image
          </Button>
          <Button className={activeManualAction === "share" ? "button-primary" : "button-secondary"} onClick={onShare}>
            Copy Share Link
          </Button>
        </div>
        <div className="manual-toolbar-button-row">
          <Button className={activeManualAction === "autofill" ? "button-primary" : "button-secondary"} onClick={onAutofill}>
            Auto-fill Remaining
          </Button>
        </div>
        <div className="manual-toolbar-button-row">
          <Button className={`button-reset ${activeManualAction === "groups" ? "active" : ""}`} onClick={onResetGroups}>
            Reset Groups
          </Button>
          <Button className={`button-reset ${activeManualAction === "knockouts" ? "active" : ""}`} onClick={onResetKnockouts}>
            Reset Knockouts
          </Button>
        </div>
      </div>
    </section>
  );
}
