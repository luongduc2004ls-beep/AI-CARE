// ==========================================================
// MedicineTable.jsx
// Quản lý và hiển thị danh sách thuốc từ Backend API Flask
// Tương tác trực tiếp với Cơ sở dữ liệu qua medicineService (100% Real Database)
// ==========================================================

import { useCallback, useEffect, useState } from "react";
import { Button, Table } from "react-bootstrap";
import { FaCheck, FaEdit, FaExclamationTriangle, FaPlus, FaSortAlphaDown, FaSpinner, FaTrash } from "react-icons/fa";
import medicineService from "../../services/medicineService";
import MedicineModal from "./MedicineModal";
import { useAuth } from "../../context/AuthContext";

/**
 * Chuẩn hóa đối tượng thuốc từ Backend API sang định dạng hiển thị Frontend
 */
const normalizeMedicine = (med) => {
  if (!med) return null;
  return {
    ...med,
    id: med.prescription_item_id || med.medicine_id || med.id,
    medicine_id: med.medicine_id || med.id,
    prescription_item_id: med.prescription_item_id,
    prescription_id: med.prescription_id,
    name: med.medicine_name || med.name || "",
    dosage: med.dosage || "1 viên",
    time: med.frequency || med.time || "08:00",
    status: med.status || "Chưa uống",
    quantity: med.quantity !== undefined ? med.quantity : 10,
    expire_date: med.expire_date || med.end_date || "",
    patient_name: med.patient_name || med.full_name || "",
    instruction: med.instruction || "",
  };
};

function MedicineTable({ addActivity, patientId }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";
  const activePatientId = patientId || currentUser?.patient_code || "PAT10000";

  const [medicines, setMedicines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAZ, setSortAZ] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Tải danh sách thuốc từ Backend API (100% Real DB)
  // ============================
  const loadMedicines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (search.trim()) {
        data = await medicineService.search(search.trim());
      } else if (isAdmin && !patientId) {
        data = await medicineService.getAll();
      } else {
        data = await medicineService.getPatientMedications(activePatientId);
      }
      const normalized = (data || []).map(normalizeMedicine).filter(Boolean);
      setMedicines(normalized);
    } catch (err) {
      console.error("Lỗi khi tải danh sách thuốc:", err);
      setError(err.message || "Không thể tải danh sách thuốc từ máy chủ Backend.");
    } finally {
      setLoading(false);
    }
  }, [search, isAdmin, patientId, activePatientId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedicines();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadMedicines]);

  // ============================
  // Xử lý Modal
  // ============================
  const handleOpen = () => {
    setSelectedMedicine(null);
    setShowModal(true);
  };

  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedMedicine(null);
  };

  // ============================
  // Thao tác CRUD kết nối Flask API & CSDL
  // ============================
  const createMedicine = async (medicineData) => {
    setLoading(true);
    try {
      if (isAdmin && !patientId) {
        const payload = {
          medicine_name: (medicineData.name || medicineData.medicine_name || "").trim(),
          dosage: medicineData.dosage || "1 viên",
          frequency: medicineData.time || medicineData.frequency || "08:00",
          quantity: medicineData.quantity ? parseInt(medicineData.quantity, 10) : 10,
          expire_date: medicineData.expire_date || "2026-12-31",
          instruction: medicineData.instruction || medicineData.note || "",
        };
        await medicineService.create(payload);
      } else {
        // Tạo đơn thuốc cho bệnh nhân cụ thể
        const payload = {
          doctor_name: currentUser?.full_name || "BS. Điều trị",
          diagnosis: "Kê đơn điều trị",
          items: [
            {
              medicine_name: (medicineData.name || medicineData.medicine_name || "").trim(),
              dosage: medicineData.dosage || "1 viên",
              frequency: medicineData.time || medicineData.frequency || "08:00",
              quantity: medicineData.quantity ? parseInt(medicineData.quantity, 10) : 30,
              instruction: medicineData.instruction || medicineData.note || "Uống sau ăn",
              times: [medicineData.time || "08:00"],
            },
          ],
        };
        await medicineService.createPatientPrescription(activePatientId, payload);
      }

      alert("Thêm mới thuốc thành công!");
      if (addActivity) addActivity("add", medicineData.name || medicineData.medicine_name);
      handleClose();
      await loadMedicines();
    } catch (err) {
      console.error("Lỗi khi thêm thuốc:", err);
      alert(err.message || "Không thể thêm thuốc mới.");
    } finally {
      setLoading(false);
    }
  };

  const updateMedicine = async (updatedData) => {
    setLoading(true);
    try {
      if (updatedData.prescription_item_id) {
        // Sửa chi tiết thuốc trong đơn bệnh nhân
        await medicineService.updatePrescriptionItem(updatedData.prescription_item_id, {
          dosage: updatedData.dosage || "1 viên",
          frequency: updatedData.time || updatedData.frequency || "1 lần/ngày",
          quantity: updatedData.quantity ? parseInt(updatedData.quantity, 10) : 30,
          instruction: updatedData.instruction || updatedData.note || "",
        });
      } else {
        // Sửa kho dược
        const targetId = updatedData.medicine_id || updatedData.id;
        await medicineService.update(targetId, {
          medicine_name: (updatedData.name || updatedData.medicine_name || "").trim(),
          dosage: updatedData.dosage || "1 viên",
          frequency: updatedData.time || updatedData.frequency || "08:00",
          quantity: updatedData.quantity ? parseInt(updatedData.quantity, 10) : 10,
          expire_date: updatedData.expire_date || "2026-12-31",
          instruction: updatedData.instruction || updatedData.note || "",
        });
      }

      alert("Cập nhật thông tin thuốc thành công!");
      if (addActivity) addActivity("edit", updatedData.name || updatedData.medicine_name);
      handleClose();
      await loadMedicines();
    } catch (err) {
      console.error("Lỗi khi cập nhật thuốc:", err);
      alert(err.message || "Không thể cập nhật thuốc.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const targetMed = medicines.find((item) => (item.prescription_item_id || item.medicine_id || item.id) === id);
    const medName = targetMed?.name || "loại thuốc này";

    if (!window.confirm(`Bạn có chắc muốn xóa "${medName}"?`)) return;

    setLoading(true);
    try {
      if (targetMed?.prescription_item_id) {
        await medicineService.deletePrescriptionItem(targetMed.prescription_item_id);
      } else {
        await medicineService.delete(id);
      }
      alert(`Đã xóa thành công "${medName}"!`);
      await loadMedicines();
    } catch (err) {
      console.error("Lỗi khi xóa thuốc:", err);
      alert(err.message || "Không thể xóa thuốc.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    const targetMed = medicines.find((item) => (item.prescription_item_id || item.medicine_id || item.id) === id);
    if (!targetMed) return;

    const newStatus = targetMed.status === "Đã uống" ? "Chưa uống" : "Đã uống";

    // Optimistic UI update
    setMedicines((prev) =>
      prev.map((item) =>
        (item.prescription_item_id || item.medicine_id || item.id) === id ? { ...item, status: newStatus } : item
      )
    );

    try {
      if (targetMed.prescription_item_id) {
        await medicineService.takeMedicineByItem(
          targetMed.prescription_item_id,
          newStatus,
          currentUser?.full_name || "Người chăm sóc"
        );
      } else if (targetMed.schedule_id) {
        await medicineService.takeMedicine(activePatientId, targetMed.schedule_id, {
          status: newStatus,
          taken_by: currentUser?.full_name || "Người chăm sóc",
        });
      } else {
        await medicineService.updateStatus(targetMed.medicine_id || id, newStatus);
      }
    } catch (err) {
      console.error("Không thể lưu trạng thái thuốc lên máy chủ:", err);
      alert(err.message || "Không thể cập nhật trạng thái uống thuốc.");
      await loadMedicines();
    }

    if (addActivity) addActivity("taken", targetMed.name);
  };

  const displayedMedicines = [...medicines].sort((first, second) => {
    const nameA = first?.name || first?.medicine_name || "";
    const nameB = second?.name || second?.medicine_name || "";
    return sortAZ ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  return (
    <section className="container-fluid px-3 px-md-4 pb-4 mt-4">
      <div className="medicine-management-card card border-0 shadow-sm rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
            <div>
              <h3 className="h4 fw-bold mb-1">
                {isAdmin && !patientId ? "Quản Lý Kho Dược & Danh Mục Thuốc" : `Đơn Thuốc Bệnh Nhân (${activePatientId})`}
              </h3>
              <p className="text-muted mb-0">
                {isAdmin && !patientId
                  ? "Danh mục dược phẩm trên hệ thống: "
                  : `Danh sách thuốc kê đơn thực tế: `}
                <b>{displayedMedicines.length}</b> loại thuốc
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
                placeholder="🔍 Tìm tên thuốc trong CSDL..."
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
              <span>Đang tải dữ liệu từ CSDL Backend...</span>
            </div>
          )}

          <MedicineModal
            show={showModal}
            handleClose={handleClose}
            addMedicine={createMedicine}
            updateMedicine={updateMedicine}
            selectedMedicine={selectedMedicine}
          />

          <Table striped hover responsive className="medicine-table align-middle">
            <thead className="table-primary">
              <tr>
                <th>Tên thuốc</th>
                <th>Liều lượng</th>
                <th>Giờ uống / Tần suất</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayedMedicines.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    {loading ? "Đang truy vấn CSDL..." : "Chưa có danh sách thuốc nào trong cơ sở dữ liệu."}
                  </td>
                </tr>
              ) : (
                displayedMedicines.map((item) => {
                  const itemId = item.prescription_item_id || item.medicine_id || item.id;
                  const isTaken = item.status === "Đã uống";

                  return (
                    <tr key={itemId}>
                      <td className="fw-semibold">{item.name}</td>
                      <td>
                        <span className="badge bg-secondary text-wrap">{item.dosage}</span>
                      </td>
                      <td>
                        <span className="badge bg-info text-dark text-wrap">{item.time}</span>
                      </td>
                      <td>
                        <span className={`badge ${isTaken ? "bg-success" : "bg-warning text-dark"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline-warning"
                            onClick={() => handleEdit(item)}
                            title="Sửa thông tin thuốc"
                          >
                            <FaEdit className="me-1" /> Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(itemId)}
                            title="Xóa thuốc khỏi CSDL"
                          >
                            <FaTrash className="me-1" /> Xóa
                          </Button>
                          <Button
                            size="sm"
                            variant={isTaken ? "outline-secondary" : "outline-success"}
                            onClick={() => handleToggleStatus(itemId)}
                            title="Đánh dấu đã uống / chưa uống"
                          >
                            <FaCheck className="me-1" />
                            {isTaken ? "Đã uống" : "Đánh dấu đã uống"}
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
