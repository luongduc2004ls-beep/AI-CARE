// ==========================================================
// ElderlyPage.jsx
// Trang quản lý danh sách người cao tuổi / bệnh nhân
// Tích hợp hoàn toàn với Backend Flask API qua patientService
// ==========================================================

import { useCallback, useEffect, useState } from "react";
import { FaExclamationTriangle, FaPlus, FaSearch, FaSpinner, FaUsers } from "react-icons/fa";
import ElderlyForm from "../components/Elderly/ElderlyForm";
import ElderlyModal from "../components/Elderly/ElderlyModal";
import ElderlyTable from "../components/Elderly/ElderlyTable";
import patientService from "../services/patientService";

/**
 * Chuẩn hóa dữ liệu bệnh nhân từ Backend sang định dạng giao diện Frontend
 */
const normalizePatient = (patient) => {
  if (!patient) return null;
  return {
    ...patient,
    id: patient.patient_id || patient.id,
    fullName: patient.full_name || patient.fullName || "",
    age: patient.age || 0,
    gender: patient.gender || "Nam",
    phone: patient.phone || "",
    address: patient.address || "",
    medicalConditions: patient.medical_history || patient.medicalConditions || "",
    bloodType: patient.blood_group || patient.bloodType || "",
    height: patient.height_cm || patient.height || "",
    weight: patient.weight_kg || patient.weight || "",
    allergy: patient.allergy || "Không có",
    relativeName: patient.caregiver_name || patient.emergency_contact || patient.relativeName || "",
    relativePhone: patient.caregiver_phone || patient.emergency_phone || patient.relativePhone || "",
    dateOfBirth: patient.dateOfBirth || "",
    notes: patient.notes || "",
    image: patient.image || "",
  };
};

function ElderlyPage() {
  // ============================
  // State
  // ============================

  const [elderlyPeople, setElderlyPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Tải dữ liệu từ Backend API
  // ============================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientService.getPaginated({
        page,
        per_page: perPage,
        keyword: searchTerm.trim() || undefined,
      });
      const normalizedData = (res.items || []).map(normalizePatient);
      setElderlyPeople(normalizedData);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error("Lỗi khi tải danh sách người cao tuổi:", err);
      setError(err.message || "Không thể tải danh sách người cao tuổi từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  // ============================
  // Handlers cho Modal
  // ============================

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPerson(null);
  };

  const handleAdd = () => {
    setSelectedPerson(null);
    setModalMode("add");
    setShowModal(true);
  };

  const handleView = (person) => {
    setSelectedPerson(person);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEdit = (person) => {
    setSelectedPerson(person);
    setModalMode("edit");
    setShowModal(true);
  };

  // ============================
  // CRUD Functions kết nối API Backend
  // ============================

  const handleSave = async (personData) => {
    setLoading(true);
    try {
      let calculatedAge = parseInt(personData.age, 10);
      if (isNaN(calculatedAge) || calculatedAge <= 0) {
        if (personData.dateOfBirth) {
          const birthYear = new Date(personData.dateOfBirth).getFullYear();
          const currentYear = new Date().getFullYear();
          calculatedAge = currentYear - birthYear;
        } else {
          calculatedAge = 65;
        }
      }

      const payload = {
        full_name: (personData.fullName || personData.full_name || "").trim(),
        age: calculatedAge,
        gender: personData.gender || "Nam",
        phone: personData.phone || "",
        address: personData.address || "",
        allergy: personData.allergy || "",
        emergency_contact: personData.relativeName || personData.emergency_contact || "",
        emergency_phone: personData.relativePhone || personData.emergency_phone || "",
        medical_history: personData.medicalConditions || personData.medical_history || "",
      };


      if (modalMode === "edit" && selectedPerson) {
        const targetId = selectedPerson.patient_id || selectedPerson.id;
        await patientService.update(targetId, payload);
        alert("Cập nhật hồ sơ người cao tuổi thành công!");
      } else {
        await patientService.create(payload);
        alert("Thêm mới hồ sơ người cao tuổi thành công!");
      }

      handleCloseModal();
      await loadData();
    } catch (err) {
      console.error("Lỗi khi lưu thông tin người cao tuổi:", err);
      alert(err.message || "Không thể lưu thông tin. Vui lòng kiểm tra lại dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const personToDelete = elderlyPeople.find((person) => (person.patient_id || person.id) === id);
    const personName = personToDelete?.fullName || personToDelete?.full_name || "người này";

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ của ${personName}?`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await patientService.delete(id);
      alert(`Đã xóa thành công hồ sơ của ${personName}!`);
      await loadData();
    } catch (err) {
      console.error("Lỗi khi xóa hồ sơ:", err);
      alert(err.message || "Không thể xóa hồ sơ người cao tuổi.");
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = {
    add: "Thêm người cao tuổi",
    edit: "Cập nhật hồ sơ người cao tuổi",
    view: "Thông tin chi tiết",
  }[modalMode];

  return (
    <section className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 text-primary mb-2">
            <FaUsers className="fs-4" />
            <span className="fw-semibold">Quản lý hồ sơ</span>
          </div>
          <h1 className="h3 fw-bold mb-2">Người cao tuổi</h1>
          <p className="text-muted mb-0">Theo dõi và quản lý thông tin sức khỏe cơ bản của người cao tuổi.</p>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={loading}>
          <FaPlus className="me-2" />Thêm người cao tuổi
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="input-group" style={{ maxWidth: "420px" }}>
            <span className="input-group-text bg-light border-end-0"><FaSearch /></span>
            <input
              type="search"
              className="form-control bg-light border-start-0"
              placeholder="Tìm theo họ tên, sđt, mã..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
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
          <span>Đang xử lý dữ liệu từ Backend...</span>
        </div>
      )}

      <ElderlyTable
        elderlyPeople={elderlyPeople}
        totalRecords={totalRecords}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />


      <ElderlyModal show={showModal} onHide={handleCloseModal} title={modalTitle}>
        <ElderlyForm
          key={selectedPerson?.id || selectedPerson?.patient_id || modalMode}
          initialData={selectedPerson}
          onSubmit={handleSave}
          onCancel={handleCloseModal}
          readOnly={modalMode === "view"}
        />
      </ElderlyModal>
    </section>
  );
}

export default ElderlyPage;
