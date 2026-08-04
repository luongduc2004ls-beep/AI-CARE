import React, { useState } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import { FaUser, FaIdCard, FaLaptopCode, FaPhone, FaHeartbeat, FaRulerVertical, FaWeight, FaTint, FaExclamationTriangle, FaUserNurse, FaEnvelope, FaNotesMedical, FaCheckCircle } from "react-icons/fa";

/**
 * Định dạng Chuẩn Mã Bệnh Nhân (PATxxxxx) không bị lặp chữ PATPAT
 */
const formatPatientCode = (id) => {
  if (!id) return "";
  const str = String(id).trim();
  if (str.toUpperCase().startsWith("PAT")) return str.toUpperCase();
  return `PAT${str.padStart(5, "0")}`;
};

/**
 * Định dạng Chuẩn Mã Thiết Bị AI (DEVxxxx / Dxxxx)
 */
const formatDeviceCode = (devId, pId) => {
  if (devId) return String(devId);
  if (!pId) return "";
  const num = String(pId).replace(/[^0-9]/g, "");
  return num ? `D${num}` : "";
};

/**
 * Khởi tạo dữ liệu rỗng cho form ở chế độ thêm mới
 */
const createEmptyFormData = () => ({
  patient_id: "",
  device_id: "",
  image: "",
  name: "",
  fullName: "",
  age: "",
  dateOfBirth: "",
  gender: "Nam",
  address: "",
  phone: "",
  medicalConditions: "",
  blood_group: "O+",
  bloodType: "O+",
  height_cm: "",
  height: "",
  weight_kg: "",
  weight: "",
  allergy: "",
  relativeName: "",
  relativeRelation: "Con trai",
  relativeAge: "",
  relativePhone: "",
  relativeEmail: "",
  notes: "",
});

/**
 * Ánh xạ dữ liệu ban đầu vào form
 */
const initializeFormData = (data) => {
  if (!data) return createEmptyFormData();
  const rawId = data.patient_id || data.user_id || data.id || "";
  const formattedId = formatPatientCode(rawId);
  const formattedDev = formatDeviceCode(data.device_id, rawId);

  return {
    patient_id: formattedId,
    device_id: formattedDev,
    image: data.image || "",
    name: data.name || data.fullName || data.full_name || "",
    fullName: data.name || data.fullName || data.full_name || "",
    age: data.age !== undefined && data.age !== null ? String(data.age) : "",
    dateOfBirth: data.dateOfBirth || "",
    gender: data.gender || "Nam",
    address: data.address || "",
    phone: data.phone || "",
    medicalConditions: data.medicalConditions || data.medical_history || "",
    blood_group: data.blood_group || data.bloodType || "O+",
    bloodType: data.blood_group || data.bloodType || "O+",
    height_cm: data.height_cm || data.height || "",
    height: data.height_cm || data.height || "",
    weight_kg: data.weight_kg || data.weight || "",
    weight: data.weight_kg || data.weight || "",
    allergy: data.allergy || "",

    // Người thân bệnh nhân
    relativeName: data.relativeName || data.caregiver_name || "",
    relativeRelation: data.relativeRelation || data.caregiver_relation || "Con trai",
    relativeAge: data.relativeAge || data.caregiver_age ? String(data.relativeAge || data.caregiver_age) : "",
    relativePhone: data.relativePhone || data.caregiver_phone || data.emergency_phone || "",
    relativeEmail: data.relativeEmail || data.caregiver_email || "",
    notes: data.notes || "",
  };
};

function ElderlyForm({ initialData, onSubmit, onCancel, readOnly = false }) {
  const [formData, setFormData] = useState(() => initializeFormData(initialData));
  const [validated, setValidated] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({ ...previousData, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (readOnly) return;

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    const patientName = (formData.fullName || formData.name || "").trim();

    onSubmit({
      ...formData,
      name: patientName,
      fullName: patientName,
      full_name: patientName,
      patient_id: formData.patient_id || `PAT${Math.floor(10000 + Math.random() * 90000)}`,
      device_id: formData.device_id || `D${Math.floor(1000 + Math.random() * 9000)}`,
      age: formData.age ? parseInt(formData.age, 10) : 70,
      height_cm: formData.height_cm ? parseFloat(formData.height_cm) : 160,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : 60,
      blood_group: formData.blood_group || formData.bloodType || "O+",
      medical_history: formData.medicalConditions || "Theo dõi sức khỏe định kỳ",
      allergy: formData.allergy || "Không có",
      caregiver_name: formData.relativeName || "Người thân",
      caregiver_relation: formData.relativeRelation || "Con trai",
      caregiver_age: formData.relativeAge ? parseInt(formData.relativeAge, 10) : 42,
      caregiver_phone: formData.relativePhone || "0987654321",
      caregiver_email: formData.relativeEmail || "family@elderly.ai",
    });
  };

  const hasAllergy = formData.allergy &&
    formData.allergy.trim() !== "" &&
    formData.allergy.toLowerCase() !== "không" &&
    formData.allergy.toLowerCase() !== "không có" &&
    formData.allergy.toLowerCase() !== "none";

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className="text-body">
      {/* HEADER CARD: XÁC THỰC THIẾT BỊ AI */}
      <div className="card border-0 bg-body-tertiary border rounded-4 p-3 mb-4 shadow-sm">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h6 className="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
              <FaNotesMedical className="text-primary fs-5" /> PHẦN 1: HỒ SƠ Y TẾ &amp; THỂ TRẠNG BỆNH NHÂN
            </h6>
            <div className="small text-body-secondary">
              🆔 Mã Bệnh Nhân: <strong className="text-primary font-monospace">{formData.patient_id || "PAT (Tự tạo)"}</strong> | 📟 Thiết Bị AI: <strong className="text-success font-monospace">{formData.device_id || "DEV (Tự tạo)"}</strong>
            </div>
          </div>
          <span className="badge bg-success text-white rounded-pill px-3 py-2 d-flex align-items-center gap-1 extra-small">
            <FaCheckCircle /> Giám Sát AI Đang Bật
          </span>
        </div>
      </div>

      {/* FORM PHẦN 1 */}
      <Row className="g-3 mb-4">
        {/* Mã Bệnh Nhân & Device ID */}
        <Form.Group as={Col} md={6}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaIdCard className="text-primary" /> Mã Bệnh Nhân (ID)
          </Form.Label>
          <Form.Control
            type="text"
            name="patient_id"
            value={formData.patient_id || "PAT (Tự động sinh mã)"}
            className="bg-body-tertiary text-body font-monospace fw-bold"
            disabled
          />
        </Form.Group>

        <Form.Group as={Col} md={6}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaLaptopCode className="text-primary" /> Mã Thiết Bị AI Giám Sát *
          </Form.Label>
          <Form.Control
            required
            type="text"
            name="device_id"
            placeholder="Ví dụ: D1000 hoặc DEV0001"
            value={formData.device_id}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body font-monospace"
          />
        </Form.Group>

        {/* Họ tên, Tuổi, Giới tính */}
        <Form.Group as={Col} md={6}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaUser className="text-primary" /> Họ Và Tên Bệnh Nhân *
          </Form.Label>
          <Form.Control
            required
            type="text"
            name="fullName"
            placeholder="Ví dụ: Hồ Thanh Khánh"
            value={formData.fullName}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body fw-semibold"
          />
          <Form.Control.Feedback type="invalid">Vui lòng nhập họ tên bệnh nhân.</Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={3}>
          <Form.Label className="fw-bold small text-body-secondary">Tuổi Bệnh Nhân *</Form.Label>
          <Form.Control
            required
            type="number"
            min="1"
            max="120"
            name="age"
            placeholder="72"
            value={formData.age}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body"
          />
        </Form.Group>

        <Form.Group as={Col} md={3}>
          <Form.Label className="fw-bold small text-body-secondary">Giới Tính *</Form.Label>
          <Form.Select required name="gender" value={formData.gender} onChange={handleChange} disabled={readOnly} className="bg-body text-body">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </Form.Select>
        </Form.Group>

        {/* SĐT, Chiều cao, Cân nặng */}
        <Form.Group as={Col} md={6}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaPhone className="text-primary" /> Số Điện Thoại Bệnh Nhân *
          </Form.Label>
          <Form.Control
            required
            type="tel"
            name="phone"
            placeholder="0912345678"
            value={formData.phone}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body"
          />
        </Form.Group>

        <Form.Group as={Col} md={3}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaRulerVertical className="text-primary" /> Chiều Cao (cm)
          </Form.Label>
          <Form.Control
            type="number"
            name="height_cm"
            placeholder="165"
            value={formData.height_cm}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body"
          />
        </Form.Group>

        <Form.Group as={Col} md={3}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaWeight className="text-primary" /> Cân Nặng (kg)
          </Form.Label>
          <Form.Control
            type="number"
            step="0.1"
            name="weight_kg"
            placeholder="62.5"
            value={formData.weight_kg}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body"
          />
        </Form.Group>

        {/* Nhóm máu, Dị ứng */}
        <Form.Group as={Col} md={4}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaTint className="text-danger" /> Nhóm Máu *
          </Form.Label>
          <Form.Select name="blood_group" value={formData.blood_group} onChange={handleChange} disabled={readOnly} className="bg-body text-body fw-bold">
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </Form.Select>
        </Form.Group>

        <Form.Group as={Col} md={8}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaExclamationTriangle className="text-warning" /> Thông Tin Dị Ứng / Phản Ứng Thuốc
          </Form.Label>
          <Form.Control
            type="text"
            name="allergy"
            placeholder="Phấn hoa, Hải sản, Penicillin... (hoặc ghi Không có)"
            value={formData.allergy}
            onChange={handleChange}
            disabled={readOnly}
            className={`bg-body text-body ${hasAllergy ? "border-danger text-danger fw-bold" : ""}`}
          />
        </Form.Group>

        {/* Tiền sử bệnh lý */}
        <Form.Group as={Col} xs={12}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaHeartbeat className="text-danger" /> Tiền Sử Bệnh Lý / Bệnh Nền Theo Dõi AI
          </Form.Label>
          <Form.Control
            type="text"
            name="medicalConditions"
            placeholder="Ví dụ: Tăng huyết áp nhẹ, Đái tháo đường Tuýp 2, Thoái hóa khớp gối..."
            value={formData.medicalConditions}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body"
          />
        </Form.Group>
      </Row>

      {/* HEADER SECTION 2: THÔNG TIN NGƯỜI THÂN */}
      <div className="card border-0 bg-body-tertiary border rounded-4 p-3 mb-4 shadow-sm border-start border-info border-4">
        <h6 className="fw-bold mb-1 text-info d-flex align-items-center gap-2">
          <FaUserNurse className="text-info fs-5" /> PHẦN 2: THÔNG TIN NGƯỜI THÂN BỆNH NHÂN (Nhận Cảnh Báo Té Ngã)
        </h6>
        <div className="small text-body-secondary">
          Người thân trực tiếp tiếp nhận cuộc gọi báo động khẩn cấp &amp; xem nhật ký chăm sóc
        </div>
      </div>

      {/* FORM PHẦN 2 */}
      <Row className="g-3">
        <Form.Group as={Col} md={6}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaUser className="text-info" /> Họ Và Tên Người Thân *
          </Form.Label>
          <Form.Control
            required
            type="text"
            name="relativeName"
            placeholder="Ví dụ: Nguyễn Văn B"
            value={formData.relativeName}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body fw-semibold"
          />
          <Form.Control.Feedback type="invalid">Vui lòng nhập tên người thân.</Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={3}>
          <Form.Label className="fw-bold small text-body-secondary">Mối Quan Hệ *</Form.Label>
          <Form.Select required name="relativeRelation" value={formData.relativeRelation} onChange={handleChange} disabled={readOnly} className="bg-body text-body">
            <option value="Con trai">Con trai</option>
            <option value="Con gái">Con gái</option>
            <option value="Vợ/Chồng">Vợ / Chồng</option>
            <option value="Cháu nội/ngoại">Cháu nội / ngoại</option>
            <option value="Anh/Chị/Em">Anh / Chị / Em</option>
            <option value="Người bảo hộ">Người bảo hộ y tế</option>
            <option value="Y tá gia đình">Y tá chăm sóc tại nhà</option>
          </Form.Select>
        </Form.Group>

        <Form.Group as={Col} md={3}>
          <Form.Label className="fw-bold small text-body-secondary">Tuổi Người Thân</Form.Label>
          <Form.Control
            type="number"
            min="18"
            max="100"
            name="relativeAge"
            placeholder="42"
            value={formData.relativeAge}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body"
          />
        </Form.Group>

        <Form.Group as={Col} md={6}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaPhone className="text-danger" /> Số Điện Thoại Khẩn Cấp (Nhận SMS SOS) *
          </Form.Label>
          <Form.Control
            required
            type="tel"
            name="relativePhone"
            placeholder="0987654321"
            value={formData.relativePhone}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body fw-bold"
          />
          <Form.Control.Feedback type="invalid">Vui lòng nhập số điện thoại khẩn cấp.</Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} md={6}>
          <Form.Label className="fw-bold small text-body-secondary d-flex align-items-center gap-1">
            <FaEnvelope className="text-info" /> Địa Chỉ Email Người Thân *
          </Form.Label>
          <Form.Control
            required
            type="email"
            name="relativeEmail"
            placeholder="nguyenvanb@gmail.com"
            value={formData.relativeEmail}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body"
          />
          <Form.Control.Feedback type="invalid">Vui lòng nhập email nhận báo động.</Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col} xs={12}>
          <Form.Label className="fw-bold small text-body-secondary">Ghi Chú Hướng Dẫn Khẩn Cấp Bác Sĩ / Y Tế</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="notes"
            placeholder="Ghi chú vị trí thuốc khẩn cấp, hướng dẫn vào nhà khi có báo động ngã..."
            value={formData.notes}
            onChange={handleChange}
            disabled={readOnly}
            className="bg-body text-body"
          />
        </Form.Group>
      </Row>

      {/* FOOTER ACTION BUTTONS */}
      <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
        <Button variant="outline-secondary" type="button" onClick={onCancel} className="rounded-pill px-4">
          Hủy Bỏ
        </Button>
        {!readOnly && (
          <Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold shadow-sm text-white">
            <FaCheckCircle className="me-2" /> Lưu Hồ Sơ Bệnh Nhân &amp; Người Thân
          </Button>
        )}
      </div>
    </Form>
  );
};

export default ElderlyForm;
