import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { FaCheckCircle, FaExclamationTriangle, FaShieldAlt } from "react-icons/fa";

/**
 * Khởi tạo dữ liệu rỗng cho form ở chế độ thêm mới
 */
const createEmptyFormData = () => ({
  image: "",
  fullName: "",
  age: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  phone: "",
  medicalConditions: "",
  bloodType: "",
  height: "",
  weight: "",
  allergy: "",
  relativeName: "",
  relativePhone: "",
  notes: "",
});

/**
 * Ánh xạ dữ liệu ban đầu (từ Backend API hoặc props) vào form
 */
const initializeFormData = (data) => {
  if (!data) return createEmptyFormData();
  return {
    image: data.image || "",
    fullName: data.fullName || data.full_name || "",
    age: data.age !== undefined && data.age !== null ? String(data.age) : "",
    dateOfBirth: data.dateOfBirth || "",
    gender: data.gender || "",
    address: data.address || "",
    phone: data.phone || "",
    medicalConditions: data.medicalConditions || data.medical_history || "",
    bloodType: data.bloodType || data.blood_group || "",
    height: data.height || data.height_cm || "",
    weight: data.weight || data.weight_kg || "",
    allergy: data.allergy || "Không có",
    relativeName: data.relativeName || data.caregiver_name || data.emergency_contact || "",
    relativePhone: data.relativePhone || data.caregiver_phone || data.emergency_phone || "",
    notes: data.notes || "",
  };
};

function ElderlyForm({ initialData, onSubmit, onCancel, readOnly = false }) {
  // ============================
  // State
  // ============================

  const [formData, setFormData] = useState(() => initializeFormData(initialData));
  const [validated, setValidated] = useState(false);

  // ============================
  // Event Handlers
  // ============================

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

    // Đóng gói dữ liệu gửi ra ngoài cho ElderlyPage xử lý gọi Service API
    onSubmit({
      ...formData,
      fullName: formData.fullName.trim(),
      full_name: formData.fullName.trim(),
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      medical_history: formData.medicalConditions,
      allergy: formData.allergy,
      emergency_contact: formData.relativeName,
      emergency_phone: formData.relativePhone,
    });
  };

  const hasAllergy = formData.allergy &&
    formData.allergy.trim() !== "" &&
    formData.allergy.toLowerCase() !== "không" &&
    formData.allergy.toLowerCase() !== "không có" &&
    formData.allergy.toLowerCase() !== "none";

  // ============================
  // Render Form UI
  // ============================

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <div className="row g-3">
        <Form.Group className="col-12">
          <Form.Label className="fw-semibold">Ảnh đại diện (đường dẫn ảnh)</Form.Label>
          <Form.Control
            type="url"
            name="image"
            placeholder="https://example.com/avatar.jpg"
            value={formData.image}
            onChange={handleChange}
            disabled={readOnly}
          />
        </Form.Group>

        <Form.Group className="col-md-6">
          <Form.Label className="fw-semibold">Họ và tên *</Form.Label>
          <Form.Control
            required
            type="text"
            name="fullName"
            placeholder="Nhập họ và tên"
            value={formData.fullName}
            onChange={handleChange}
            disabled={readOnly}
          />
          <Form.Control.Feedback type="invalid">Vui lòng nhập họ và tên.</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="col-md-3">
          <Form.Label className="fw-semibold">Tuổi / Ngày sinh *</Form.Label>
          <Form.Control
            required
            type="text"
            name="age"
            placeholder="Nhập tuổi (ví dụ: 65)"
            value={formData.age}
            onChange={handleChange}
            disabled={readOnly}
          />
          <Form.Control.Feedback type="invalid">Vui lòng nhập tuổi.</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="col-md-3">
          <Form.Label className="fw-semibold">Giới tính *</Form.Label>
          <Form.Select required name="gender" value={formData.gender} onChange={handleChange} disabled={readOnly}>
            <option value="">Chọn giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">Vui lòng chọn giới tính.</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="col-md-8">
          <Form.Label className="fw-semibold">Địa chỉ</Form.Label>
          <Form.Control type="text" name="address" placeholder="Nhập địa chỉ" value={formData.address} onChange={handleChange} disabled={readOnly} />
        </Form.Group>

        <Form.Group className="col-md-4">
          <Form.Label className="fw-semibold">Số điện thoại *</Form.Label>
          <Form.Control required type="tel" name="phone" placeholder="Nhập số điện thoại" value={formData.phone} onChange={handleChange} disabled={readOnly} />
          <Form.Control.Feedback type="invalid">Vui lòng nhập số điện thoại.</Form.Control.Feedback>
        </Form.Group>

        {/* Khối Cảnh báo / Thông tin Dị ứng */}
        <Form.Group className="col-12">
          <div className="card border-0 bg-light rounded-3 p-3">
            <div className="d-flex align-items-center gap-2 mb-2 text-danger fw-bold">
              <FaShieldAlt className="fs-5" />
              <span>Thông tin dị ứng & Chống chỉ định</span>
            </div>
            <div className="row g-2 align-items-center">
              <div className="col-md-8">
                <Form.Control
                  type="text"
                  name="allergy"
                  placeholder="Nhập thông tin dị ứng (ví dụ: Penicillin, Hải sản, Phấn hoa...)"
                  value={formData.allergy}
                  onChange={handleChange}
                  disabled={readOnly}
                  className={hasAllergy ? "border-danger text-danger fw-bold" : ""}
                />
              </div>
              <div className="col-md-4">
                {hasAllergy ? (
                  <span className="badge bg-danger text-wrap p-2 w-100 d-flex align-items-center justify-content-center gap-1">
                    <FaExclamationTriangle /> Dị ứng: {formData.allergy}
                  </span>
                ) : (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success text-wrap p-2 w-100 d-flex align-items-center justify-content-center gap-1">
                    <FaCheckCircle /> Không có dị ứng
                  </span>
                )}
              </div>
            </div>
          </div>
        </Form.Group>

        <Form.Group className="col-md-6">
          <Form.Label className="fw-semibold">Tiền sử bệnh lý / Bệnh nền</Form.Label>
          <Form.Control type="text" name="medicalConditions" placeholder="Ví dụ: Tăng huyết áp, tiểu đường" value={formData.medicalConditions} onChange={handleChange} disabled={readOnly} />
        </Form.Group>

        <Form.Group className="col-md-2">
          <Form.Label className="fw-semibold">Nhóm máu</Form.Label>
          <Form.Select name="bloodType" value={formData.bloodType} onChange={handleChange} disabled={readOnly}>
            <option value="">Chọn</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="col-md-2">
          <Form.Label className="fw-semibold">Chiều cao</Form.Label>
          <Form.Control type="number" min="0" name="height" placeholder="cm" value={formData.height} onChange={handleChange} disabled={readOnly} />
        </Form.Group>

        <Form.Group className="col-md-2">
          <Form.Label className="fw-semibold">Cân nặng</Form.Label>
          <Form.Control type="number" min="0" step="0.1" name="weight" placeholder="kg" value={formData.weight} onChange={handleChange} disabled={readOnly} />
        </Form.Group>

        <Form.Group className="col-md-6">
          <Form.Label className="fw-semibold">Người thân liên hệ khẩn cấp</Form.Label>
          <Form.Control type="text" name="relativeName" placeholder="Họ tên người thân" value={formData.relativeName} onChange={handleChange} disabled={readOnly} />
        </Form.Group>

        <Form.Group className="col-md-6">
          <Form.Label className="fw-semibold">SĐT người thân khẩn cấp</Form.Label>
          <Form.Control type="tel" name="relativePhone" placeholder="Số điện thoại người thân" value={formData.relativePhone} onChange={handleChange} disabled={readOnly} />
        </Form.Group>

        <Form.Group className="col-12">
          <Form.Label className="fw-semibold">Ghi chú</Form.Label>
          <Form.Control as="textarea" rows={3} name="notes" placeholder="Thông tin cần lưu ý thêm" value={formData.notes} onChange={handleChange} disabled={readOnly} />
        </Form.Group>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="light" type="button" onClick={onCancel}>Đóng</Button>
        {!readOnly && <Button variant="primary" type="submit">Lưu thông tin</Button>}
      </div>
    </Form>
  );
}

export default ElderlyForm;

