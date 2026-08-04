// ============================
// Imports
// ============================

import { Modal } from "react-bootstrap";

function ElderlyModal({ show, onHide, title, children }) {
  // ============================
  // Render
  // ============================

  return (
    <Modal show={show} onHide={onHide} centered size="lg" scrollable>
      <Modal.Header closeButton className="border-0 px-4 pt-4 pb-0">
        <Modal.Title className="h5 fw-bold">{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {children}
      </Modal.Body>
    </Modal>
  );
}

export default ElderlyModal;
