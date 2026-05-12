import Modal from "./Modal";
import Button from "./Button";

export default function ResetConfirmationModal({ config, onClose, onConfirm }) {
  if (!config) {
    return null;
  }

  return (
    <Modal isOpen={Boolean(config)} onClose={onClose} className="group-modal reset-confirm-modal">
      <div className="modal-header">
        <div className="section-kicker">CONFIRM RESET</div>
        <h3>{config.title}</h3>
      </div>
      <div className="modal-section reset-confirm-content">
        <p>{config.description}</p>
        <div className="reset-confirm-impact">
          {config.impacts.map((impact) => (
            <div className="reset-confirm-impact-row" key={impact}>
              {impact}
            </div>
          ))}
        </div>
        <div className="reset-confirm-actions">
          <Button className="button-secondary" onClick={onClose}>Cancel</Button>
          <Button className={config.confirmTone} onClick={onConfirm}>{config.confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
