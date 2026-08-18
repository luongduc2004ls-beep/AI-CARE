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
import { useAuth } from "../../context/AuthContext";

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
    patient_name: med.patient_name || med.user_name || ""
  };
};

function MedicineTable({ addActivity }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

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

  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedMedicine(null);
  };

  // ============================
  // Thao tác CRUD kết nối Flask API & MySQL
  // ============================

  const createMedicine = async (medicineData) => {
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
      alert(err.message || "Không thể cập nhật thuốc.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const targetMed = medicines.find((item) => (item.medicine_id || item.id) === id);
    const medName = targetMed?.name || "loại thuốc này";

    if (!window.confirm(`Bạn có chắc muốn xóa "${medName}"?`)) return;

    setLoading(true);
    try {
      await medicineService.delete(id);
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
    const medicineToMark = medicines.find((item) => (item.medicine_id || item.id) === id);
    if (!medicineToMark) return;

    const newStatus = medicineToMark.status === "Đã uống" ? "Chưa uống" : "Đã uống";

    setMedicines((prev) =>
      prev.map((item) =>
        (item.medicine_id || item.id) === id ? { ...item, status: newStatus } : item
      )
    );

    try {
      await medicineService.updateStatus(id, newStatus);
    } catch (err) {
      console.error("Không thể lưu trạng thái thuốc lên máy chủ:", err);
    }

    if (addActivity) addActivity("taken", medicineToMark.name);
  };

  const addMedicine = createMedicine;
  const editMedicine = handleEdit;
  const deleteMedicine = handleDelete;
  const markAsTaken = handleToggleStatus;

  // ============================
  // Lọc & Sắp xếp danh sách đơn thuốc cá nhân vs Admin
  // ============================
  const DEFAULT_PERSONAL_SCHEDULE = [
    {
      id: "p_1",
      medicine_id: "p_1",
      name: "Amlodipine 5mg (Thuốc Huyết Áp)",
      dosage: "1 viên",
      time: "08:00 (Sáng)",
      status: "Chưa uống",
      quantity: 30,
      expire_date: "2026-12-31",
      patient_name: "Cụ Nguyễn Văn A",
      note: "Uống sau khi ăn sáng 15 phút"
    },
    {
      id: "p_2",
      medicine_id: "p_2",
      name: "Metformin 500mg (Kiểm Soát Đường Huyết)",
      dosage: "1 viên",
      time: "12:00 (Trưa)",
      status: "Đã uống",
      quantity: 45,
      expire_date: "2026-11-20",
      patient_name: "Cụ Nguyễn Văn A",
      note: "Uống kèm trong bữa ăn trưa"
    },
    {
      id: "p_3",
      medicine_id: "p_3",
      name: "Glucosamine 500mg (Bổ Xương Khớp)",
      dosage: "2 viên",
      time: "18:00 (Tối)",
      status: "Chưa uống",
      quantity: 60,
      expire_date: "2027-05-15",
      patient_name: "Cụ Nguyễn Văn A",
      note: "Uống cùng nước ấm sau ăn tối"
    },
    {
      id: "p_4",
      medicine_id: "p_4",
      name: "Vitamin C 1000mg (Tăng Đề Kháng)",
      dosage: "1 sủi",
      time: "09:00 (Sáng)",
      status: "Đã uống",
      quantity: 20,
      expire_date: "2026-10-10",
      patient_name: "Cụ Nguyễn Văn A",
      note: "Pha sủi 200ml nước lọc"
    }
  ];

  const personalPrescribedKeywords = [
    "amlodipine", "metformin", "panadol", "glucosamine", "vitamin c",
    "paracetamol", "losartan", "omeprazole", "atorvastatin"
  ];

  const scopeFiltered = (() => {
    if (isAdmin) return medicines; // Admin hiển thị toàn bộ 301+ loại thuốc hệ thống

    // Lọc các thuốc khớp đơn cá nhân từ backend
    const apiPersonal = medicines.filter((m) => {
      const pName = (m.patient_name || m.user_name || "").toLowerCase();
      const medName = (m.name || m.medicine_name || "").toLowerCase();
      if (pName.includes("nguyễn văn a") || pName.includes("cụ a")) return true;
      return personalPrescribedKeywords.some((key) => medName.includes(key));
    });

    // Nếu từ backend có thuốc khớp thì hiển thị, nếu không có sẵn thì nạp Lịch Uống Thuốc Cá Nhân Chuẩn của Cụ A
    return apiPersonal.length > 0 ? apiPersonal : DEFAULT_PERSONAL_SCHEDULE;
  })();

  const displayedMedicines = [...scopeFiltered].sort((first, second) => {
    const nameA = first?.name || first?.medicine_name || "";
    const nameB = second?.name || second?.medicine_name || "";
    return sortAZ ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  // ============================
  // Render Interface
  // ============================

  return (
    <section className="container-fluid px-3 px-md-4 pb-4 mt-4">
      <div className="medicine-management-card card border-0 shadow-sm rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
            <div>
              <h3 className="h4 fw-bold mb-1">{isAdmin ? "Quản Lý Đơn Thuốc Hệ Thống" : "Lịch Uống Thuốc Của Cụ Nguyễn Văn A"}</h3>
              <p className="text-muted mb-0">
                {isAdmin ? "Danh sách đơn thuốc của tất cả bệnh nhân trên hệ thống: " : "Đơn thuốc dành riêng cho người thân gia đình: "}
                <b>{displayedMedicines.length}</b> đơn thuốc
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
                        <span
                          className="badge px-3 py-2 fw-semibold"
                          style={{
                            backgroundColor: "var(--bg-card-subtle)",
                            color: "var(--text-main)",
                            border: "1px solid var(--border-color)"
                          }}
                        >
                          {medicine.time}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge px-3 py-2 fw-semibold ${
                            medicine.status === "Đã uống" ? "bg-success text-white" : "bg-warning text-dark"
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
