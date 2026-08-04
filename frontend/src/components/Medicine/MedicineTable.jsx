// ==========================================================
// MedicineTable.jsx
// Quản lý và hiển thị danh sách thuốc từ Backend API Flask
// Tương tác trực tiếp với MySQL qua medicineService
// ==========================================================

import { useCallback, useEffect, useState } from "react";
import { Button, Table } from "react-bootstrap";
import { FaCheck, FaEdit, FaExclamationTriangle, FaPlus, FaSortAlphaDown, FaSpinner, FaTrash } from "react-icons/fa";
import medicineService from "../../services/medicineService";
import MedicineModal from "./MedicineModal";

/**
 * Chuẩn hóa đối tượng thuốc từ Backend API sang định dạng hiển thị Frontend
 */
const normalizeMedicine = (med) => {
  if (!med) return null;
  return {
    ...med,
    id: med.medicine_id || med.id,
    medicine_id: med.medicine_id || med.id,
    name: med.medicine_name || med.name || "",
    dosage: med.dosage || "",
    time: med.frequency || med.time || "08:00",
    status: med.status || "Chưa uống",
    quantity: med.quantity !== undefined ? med.quantity : 10,
    expire_date: med.expire_date || "",
  };
};

function MedicineTable({ addActivity }) {
  // ============================
  // State
  // ============================

  const [medicines, setMedicines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAZ, setSortAZ] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Tải danh sách thuốc từ Backend API
  // ============================

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (search.trim()) {
        data = await medicineService.search(search.trim());
      } else {
        data = await medicineService.getAll();
      }
      const normalized = (data || []).map(normalizeMedicine);
      setMedicines(normalized);
    } catch (err) {
      console.error("Lỗi khi tải danh sách thuốc:", err);
      setError(err.message || "Không thể tải danh sách thuốc từ cơ sở dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  // ============================
  // Xử lý Modal
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
  // Thao tác CRUD kết nối Flask API & MySQL
  // ============================

  const addMedicine = async (medicineData) => {
    setLoading(true);
    try {
      const payload = {
        medicine_name: (medicineData.name || medicineData.medicine_name || "").trim(),
        dosage: medicineData.dosage || "1 viên",
        frequency: medicineData.time || medicineData.frequency || "08:00",
        quantity: medicineData.quantity ? parseInt(medicineData.quantity, 10) : 10,
        expire_date: medicineData.expire_date || "2026-12-31",
        note: medicineData.note || "",
      };

      await medicineService.create(payload);
      alert("Thêm mới thuốc thành công!");
      if (addActivity) addActivity("add", payload.medicine_name);
      handleClose();
      await loadMedicines();
    } catch (err) {
      console.error("Lỗi khi thêm thuốc:", err);
      alert(err.message || "Không thể thêm thuốc mới.");
    } finally {
      setLoading(false);
    }
  };

  const updateMedicine = async (updatedMedicineData) => {
    setLoading(true);
    try {
      const targetId = updatedMedicineData.medicine_id || updatedMedicineData.id;
      const payload = {
        medicine_name: (updatedMedicineData.name || updatedMedicineData.medicine_name || "").trim(),
        dosage: updatedMedicineData.dosage || "1 viên",
        frequency: updatedMedicineData.time || updatedMedicineData.frequency || "08:00",
        quantity: updatedMedicineData.quantity ? parseInt(updatedMedicineData.quantity, 10) : 10,
        expire_date: updatedMedicineData.expire_date || "2026-12-31",
        note: updatedMedicineData.note || "",
      };

      await medicineService.update(targetId, payload);
      alert("Cập nhật thông tin thuốc thành công!");
      if (addActivity) addActivity("edit", payload.medicine_name);
      handleClose();
      await loadMedicines();
    } catch (err) {
      console.error("Lỗi khi cập nhật thuốc:", err);
      alert(err.message || "Không thể cập nhật thông tin thuốc.");
    } finally {
      setLoading(false);
    }
  };

  const deleteMedicine = async (id) => {
    const medicineToDelete = medicines.find((med) => (med.medicine_id || med.id) === id);
    const medicineName = medicineToDelete?.name || "loại thuốc này";

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa thuốc ${medicineName}?`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await medicineService.delete(id);
      alert(`Đã xóa thuốc ${medicineName} thành công!`);
      if (addActivity) addActivity("delete", medicineName);
      await loadMedicines();
    } catch (err) {
      console.error("Lỗi khi xóa thuốc:", err);
      alert(err.message || "Không thể xóa thuốc.");
    } finally {
      setLoading(false);
    }
  };

  const markAsTaken = (id) => {
    const medicineToMark = medicines.find((med) => (med.medicine_id || med.id) === id);
    if (!medicineToMark || medicineToMark.status === "Đã uống") return;

    setMedicines((prev) =>
      prev.map((med) => ((med.medicine_id || med.id) === id ? { ...med, status: "Đã uống" } : med))
    );
    if (addActivity) addActivity("taken", medicineToMark.name);
  };

  // ============================
  // Sắp xếp danh sách
  // ============================

  const displayedMedicines = [...medicines].sort((first, second) =>
    sortAZ
      ? first.name.localeCompare(second.name)
      : second.name.localeCompare(first.name)
  );

  // ============================
  // Render Interface
  // ============================

  return (
    <section className="container-fluid px-3 px-md-4 pb-4 mt-4">
      <div className="medicine-management-card card border-0 shadow-sm rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
            <div>
              <h3 className="h4 fw-bold mb-1">Quản lý thuốc</h3>
              <p className="text-muted mb-0">
                Tổng số thuốc đang quản lý: <b>{medicines.length}</b>
              </p>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <Button variant="outline-secondary" onClick={() => setSortAZ(!sortAZ)}>
                <FaSortAlphaDown className="me-2" />
                {sortAZ ? "A → Z" : "Z → A"}
              </Button>
              <Button variant="primary" onClick={handleOpen} disabled={loading}>
                <FaPlus className="me-2" />
                Thêm thuốc
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

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4">
              <FaExclamationTriangle className="fs-5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {loading && (
            <div className="text-center py-4 text-primary">
              <FaSpinner className="spinner-border spinner-border-sm me-2" role="status" />
              <span>Đang tải dữ liệu từ Backend...</span>
            </div>
          )}

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
                  <td colSpan="5" className="text-center text-muted py-4">
                    Chưa có danh sách thuốc nào trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                displayedMedicines.map((medicine) => {
                  const medId = medicine.medicine_id || medicine.id;
                  return (
                    <tr key={medId}>
                      <td className="fw-semibold">{medicine.name}</td>
                      <td>{medicine.dosage}</td>
                      <td>
                        <span className="badge text-bg-light border text-dark px-3 py-2">
                          {medicine.time}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge px-3 py-2 ${
                            medicine.status === "Đã uống" ? "text-bg-success" : "text-bg-warning"
                          }`}
                        >
                          {medicine.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="medicine-action-button"
                            onClick={() => editMedicine(medicine)}
                          >
                            <FaEdit className="me-1" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="medicine-action-button"
                            onClick={() => deleteMedicine(medId)}
                          >
                            <FaTrash className="me-1" />
                            Xóa
                          </Button>
                          <Button
                            variant={medicine.status === "Đã uống" ? "success" : "outline-success"}
                            size="sm"
                            className="medicine-action-button"
                            disabled={medicine.status === "Đã uống"}
                            onClick={() => markAsTaken(medId)}
                          >
                            <FaCheck className="me-1" />
                            {medicine.status === "Đã uống" ? "Đã uống" : "Đánh dấu đã uống"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </section>
  );
}

export default MedicineTable;
