import { useState } from "react";
import { Button, Form } from "react-bootstrap";

function MedicineForm({ addMedicine, updateMedicine, handleClose, selectedMedicine }) {
  // ============================
  // State
  // ============================

  // MedicineModal remounts this form with a key, so initial state safely supports add and edit modes.
  const [name, setName] = useState(selectedMedicine?.name || "");
  const [dosage, setDosage] = useState(selectedMedicine?.dosage || "");
  const [time, setTime] = useState(selectedMedicine?.time || "");

  // ============================
  // Event Handlers
  // ============================

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!name.trim() || !dosage.trim() || !time) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (selectedMedicine) {
      updateMedicine({ ...selectedMedicine, name: name.trim(), dosage: dosage.trim(), time });
      return;
    }

    addMedicine({ id: Date.now(), name: name.trim(), dosage: dosage.trim(), time, status: "Chưa uống" });
    handleClose();
  };

  // ============================
  // Render
  // ============================

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">Tên thuốc</Form.Label>
        <Form.Control type="text" placeholder="Ví dụ: Paracetamol" value={name} onChange={(event) => setName(event.target.value)} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">Liều lượng</Form.Label>
        <Form.Control type="text" placeholder="Ví dụ: 1 viên, 500mg" value={dosage} onChange={(event) => setDosage(event.target.value)} />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label className="fw-semibold">Giờ uống</Form.Label>
        <Form.Control type="time" value={time} onChange={(event) => setTime(event.target.value)} />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="light" type="button" onClick={handleClose}>Hủy</Button>
        <Button variant="primary" type="submit">{selectedMedicine ? "Cập nhật" : "Lưu thuốc"}</Button>
      </div>
    </Form>
  );
}

export default MedicineForm;
