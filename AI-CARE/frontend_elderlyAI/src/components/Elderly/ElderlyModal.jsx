import React from "react";
import { Modal } from "react-bootstrap";

function ElderlyModal({ show, onHide, title, children }) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="xl"
      scrollable
      className="elderly-modal"
      contentClassName="bg-body-tertiary text-body border-0 rounded-4 shadow-lg border overflow-hidden"
    >
      <Modal.Header closeButton className="border-bottom border-secondary border-opacity-10 px-4 py-3 bg-body">
        <Modal.Title className="h5 fw-bold text-primary mb-0 d-flex align-items-center gap-2">
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4 bg-body-tertiary">
        {children}
      </Modal.Body>
    </Modal>
  );
}

export default ElderlyModal;
