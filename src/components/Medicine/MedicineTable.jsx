import { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { FaCheck, FaEdit, FaPlus, FaSortAlphaDown, FaTrash } from "react-icons/fa";
import {
  addMedicine as addMedicineToStorage,
  deleteMedicine as deleteMedicineFromStorage,
  updateMedicine as updateMedicineInStorage,
  updateMedicineStatus,
} from "../../services/medicineService";
import MedicineModal from "./MedicineModal";

function MedicineTable({ medicines, setMedicines, addActivity }) {
  // ============================
  // State
  // ============================

  const [showModal, setShowModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAZ, setSortAZ] = useState(true);

  // ============================
  // Modal Handlers
  // ============================

  const handleOpen = () => {
    setSelectedMedicine(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedMedicine(null);
  };

  const editMedicine = (medicine) => {
    setSelectedMedicine(medicine);
    setShowModal(true);
  };

  // ============================
  // CRUD Functions
  // ============================

  const addMedicine = async (medicine) => {
    // Service saves the medicine first, then returns the latest list for React state.
    const updatedMedicines = await addMedicineToStorage(medicine);

    setMedicines(updatedMedicines);
    addActivity("add", medicine.name);
  };

  const updateMedicine = async (updatedMedicine) => {
    const updatedMedicines = await updateMedicineInStorage(updatedMedicine);

    setMedicines(updatedMedicines);
    addActivity("edit", updatedMedicine.name);
    handleClose();
  };

  const deleteMedicine = async (id) => {
    const medicineToDelete = medicines.find((medicine) => medicine.id === id);
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa thuốc này?");

    if (confirmDelete && medicineToDelete) {
      const updatedMedicines = await deleteMedicineFromStorage(id);

      setMedicines(updatedMedicines);
      addActivity("delete", medicineToDelete.name);
    }
  };

  const markAsTaken = async (id) => {
    const medicineToMark = medicines.find((medicine) => medicine.id === id);

    if (!medicineToMark || medicineToMark.status === "Đã uống") return;

    const updatedMedicines = await updateMedicineStatus(id, "Đã uống");

    setMedicines(updatedMedicines);
    addActivity("taken", medicineToMark.name);
  };

  // ============================
  // Display Data
  // ============================

  // Filter and sort a derived list without changing the original React state.
  const displayedMedicines = medicines
    .filter((medicine) => medicine.name.toLowerCase().includes(search.toLowerCase()))
    .sort((firstMedicine, secondMedicine) =>
      sortAZ
        ? firstMedicine.name.localeCompare(secondMedicine.name)
        : secondMedicine.name.localeCompare(firstMedicine.name),
    );

  // ============================
  // Render
  // ============================

  return (
    <section className="container-fluid px-3 px-md-4 pb-4 mt-4">
      <div className="medicine-management-card card">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
            <div>
              <h3 className="h4 fw-bold mb-1">Quản lý thuốc</h3>
              <p className="text-muted mb-0">Tổng số thuốc đang quản lý: <b>{medicines.length}</b></p>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <Button variant="outline-secondary" onClick={() => setSortAZ(!sortAZ)}>
                <FaSortAlphaDown className="me-2" />{sortAZ ? "A → Z" : "Z → A"}
              </Button>
              <Button variant="primary" onClick={handleOpen}>
                <FaPlus className="me-2" />Thêm thuốc
              </Button>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-lg-5">
              <input
                className="form-control medicine-search-input"
                placeholder="🔍 Tìm tên thuốc..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Tìm tên thuốc"
              />
            </div>
          </div>

          <MedicineModal
            show={showModal}
            handleClose={handleClose}
            addMedicine={addMedicine}
            updateMedicine={updateMedicine}
            selectedMedicine={selectedMedicine}
          />

          <Table striped hover responsive className="medicine-table align-middle">
            <thead className="table-primary">
              <tr>
                <th>Tên thuốc</th>
                <th>Liều lượng</th>
                <th>Giờ uống</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayedMedicines.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">Không tìm thấy thuốc phù hợp.</td>
                </tr>
              ) : (
                displayedMedicines.map((medicine) => (
                  <tr key={medicine.id}>
                    <td className="fw-semibold">{medicine.name}</td>
                    <td>{medicine.dosage}</td>
                    <td><span className="badge text-bg-light border text-dark px-3 py-2">{medicine.time}</span></td>
                    <td>
                      <span className={`badge px-3 py-2 ${medicine.status === "Đã uống" ? "text-bg-success" : "text-bg-warning"}`}>
                        {medicine.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <Button variant="outline-warning" size="sm" className="medicine-action-button" onClick={() => editMedicine(medicine)}>
                          <FaEdit className="me-1" />Sửa
                        </Button>
                        <Button variant="outline-danger" size="sm" className="medicine-action-button" onClick={() => deleteMedicine(medicine.id)}>
                          <FaTrash className="me-1" />Xóa
                        </Button>
                        <Button
                          variant={medicine.status === "Đã uống" ? "success" : "outline-success"}
                          size="sm"
                          className="medicine-action-button"
                          disabled={medicine.status === "Đã uống"}
                          onClick={() => markAsTaken(medicine.id)}
                        >
                          <FaCheck className="me-1" />{medicine.status === "Đã uống" ? "Đã uống" : "Đánh dấu đã uống"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </section>
  );
}

export default MedicineTable;
