import { Modal } from "react-bootstrap";
import MedicineForm from "./MedicineForm";

function MedicineModal({ show, handleClose, addMedicine, updateMedicine, selectedMedicine }) {
  return (
    <Modal show={show} onHide={handleClose} centered className="medicine-modal">
      <Modal.Header closeButton className="border-0 pb-0 px-4 pt-4">
        <Modal.Title className="h5 fw-bold">
          {selectedMedicine ? "Cập nhật thuốc" : "Thêm thuốc mới"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* key giúp form luôn được khởi tạo lại khi đổi giữa thêm và sửa. */}
        <MedicineForm
          key={selectedMedicine ? selectedMedicine.id : "new"}
          addMedicine={addMedicine}
          updateMedicine={updateMedicine}
          handleClose={handleClose}
          selectedMedicine={selectedMedicine}
        />
      </Modal.Body>
    </Modal>
  );
}

export default MedicineModal;
