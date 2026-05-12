import { useEffect } from "react";
import { CloseIcon } from "./Icons";

export default function Modal({ isOpen, onClose, className = "group-modal", children }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeydown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={className} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}
