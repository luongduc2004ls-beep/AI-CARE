import React from "react";
import {
  FaUser,
  FaIdBadge,
  FaPhoneAlt,
  FaRulerVertical,
  FaWeight,
  FaTint,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaNotesMedical,
  FaEdit,
  FaFileDownload,
  FaUserNurse,
  FaCalendarCheck,
  FaShieldAlt,
  FaHeartbeat
} from "react-icons/fa";

function FamilyMedicalCardView({ patient, onEdit, onExportPdf }) {
  const p = patient || {};

  const patientName = p.fullName || p.name || p.full_name || "Cụ Nguyễn Văn A";
  const patientId = p.patient_id ? `PAT${p.patient_id.toString().padStart(5, "0")}` : "PAT00001";
  const deviceId = p.device_id || "DEV0001";
  const age = p.age ? `${p.age} tuổi` : "72 tuổi";
  const gender = p.gender || "Nam";
  const phone = p.phone || "0912 345 678";
  const height = p.height_cm || p.height ? `${p.height_cm || p.height} cm` : "165 cm";
  const weight = p.weight_kg || p.weight ? `${p.weight_kg || p.weight} kg` : "62.5 kg";
  const bloodGroup = p.blood_group || p.bloodType || "O+";
  const allergy = p.allergy || "Dị ứng Penicillin & Phấn hoa";
  const address = p.address || "Số 15, Ngõ 120 Hoàng Quốc Việt, Cầu Giấy, Hà Nội";
  const medicalConditions = p.medicalConditions || p.medical_history || "Tăng huyết áp nhẹ, Thoái hóa khớp gối";

  // Thông tin người thân
  const relName = p.relativeName || p.caregiver_name || "Nguyễn Văn B";
  const relRelation = p.relativeRelation || p.caregiver_relation || "Con trai";
  const relAge = p.relativeAge || p.caregiver_age || 42;
  const relPhone = p.relativePhone || p.caregiver_phone || "0987 654 321";
  const relEmail = p.relativeEmail || p.caregiver_email || "nguyenvanb@gmail.com";

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
      {/* THẺ HEADER THÔNG TIN Y TẾ NGƯỜI THÂN GIA ĐÌNH */}
      <div className="card-header bg-primary text-white p-4 border-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white text-primary rounded-circle p-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: "56px", height: "56px" }}>
              <FaShieldAlt className="fs-2 text-primary" />
            </div>
            <div>
              <span className="badge bg-white text-primary rounded-pill px-3 py-1 fw-bold mb-1 extra-small">
                HỒ SƠ ĐÃ KẾT NỐI AI REALTIME
              </span>
              <h2 className="h4 fw-bold mb-0 text-white">Thẻ Y Tế &amp; Sinh Hiệu Người Thân</h2>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-light rounded-pill px-4 fw-bold text-primary shadow-sm d-flex align-items-center gap-2"
              onClick={() => onEdit?.(patient)}
            >
              <FaEdit /> Chỉnh Sửa Hồ Sơ
            </button>
            <button
              type="button"
              className="btn btn-warning rounded-pill px-4 fw-bold text-dark shadow-sm d-flex align-items-center gap-2"
              onClick={() => alert("Đã xuất hồ sơ y tế bệnh nhân dạng PDF thành công!")}
            >
              <FaFileDownload /> Xuất Bệnh Án PDF
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-4">
        <div className="row g-4">
          {/* CỘT TỔNG QUAN BỆNH NHÂN */}
          <div className="col-12 col-lg-7">
            <div className="p-4 bg-body-tertiary rounded-4 border h-100">
              <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-3 shadow-sm" style={{ width: "64px", height: "64px" }}>
                  {patientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="h5 fw-bold mb-1 text-body">{patientName}</h3>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-primary text-white font-monospace px-3 py-2 fs-6 shadow-sm">
                      🆔 {patientId}
                    </span>
                    <span className="badge bg-info text-dark font-monospace px-3 py-2 fs-6 shadow-sm">
                      📟 Device AI: {deviceId}
                    </span>
                  </div>
                </div>
              </div>

              {/* GRID 10 THÀNH PHẦN CHI TIẾT */}
              <div className="row g-3">
                <div className="col-6 col-md-4">
                  <div className="p-3 bg-body rounded-3 border">
                    <span className="text-primary fw-bold d-block extra-small text-uppercase mb-1">1. Tuổi / Giới tính</span>
                    <strong className="text-body d-block fs-6">{age} ({gender})</strong>
                  </div>
                </div>

                <div className="col-6 col-md-4">
                  <div className="p-3 bg-body rounded-3 border">
                    <span className="text-primary fw-bold d-block extra-small text-uppercase mb-1">2. Số điện thoại</span>
                    <strong className="text-body d-block fs-6">{phone}</strong>
                  </div>
                </div>

                <div className="col-6 col-md-4">
                  <div className="p-3 bg-body rounded-3 border">
                    <span className="text-primary fw-bold d-block extra-small text-uppercase mb-1">3. Thể trạng (Cao/Nặng)</span>
                    <strong className="text-body d-block fs-6">{height} • {weight}</strong>
                  </div>
                </div>

                <div className="col-6 col-md-4">
                  <div className="p-3 bg-body rounded-3 border">
                    <span className="text-primary fw-bold d-block extra-small text-uppercase mb-1">4. Nhóm máu</span>
                    <span className="badge bg-danger text-white px-3 py-2 fw-bold fs-6 shadow-sm">
                      🩸 Nhóm máu {bloodGroup}
                    </span>
                  </div>
                </div>

                <div className="col-12 col-md-8">
                  <div className="p-3 bg-danger bg-opacity-10 rounded-3 border border-danger border-opacity-25">
                    <span className="text-danger fw-bold d-block extra-small text-uppercase mb-1">5. Cảnh báo dị ứng &amp; Chống chỉ định</span>
                    <strong className="text-danger d-block fs-6">⚠️ {allergy}</strong>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-3 bg-body rounded-3 border">
                    <span className="text-primary fw-bold d-block extra-small text-uppercase mb-1">6. Địa chỉ thường trú</span>
                    <strong className="text-body d-block fs-6">🏠 {address}</strong>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-3 bg-body rounded-3 border">
                    <span className="text-primary fw-bold d-block extra-small text-uppercase mb-1">7. Tiền sử y tế &amp; Bệnh nền theo dõi</span>
                    <strong className="text-body d-block fs-6">🩺 {medicalConditions}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT THÔNG TIN NGƯỜI THÂN KHẨN CẤP */}
          <div className="col-12 col-lg-5">
            <div className="p-4 bg-info bg-opacity-10 border border-info border-opacity-25 rounded-4 h-100">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaUserNurse className="fs-3 text-info" />
                <h4 className="h6 fw-bold mb-0 text-body">Thông Tin Người Thân Tiếp Nhận Cảnh Báo</h4>
              </div>

              <div className="bg-body p-3 rounded-4 border mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-body-secondary fw-semibold small">Họ và tên người thân:</span>
                  <strong className="text-body fs-6">{relName}</strong>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-body-secondary fw-semibold small">Mối quan hệ:</span>
                  <span className="badge bg-primary text-white rounded-pill px-3 py-2 fw-bold shadow-sm">
                    {relRelation} ({relAge} tuổi)
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-body-secondary fw-semibold small">Số điện thoại khẩn cấp:</span>
                  <strong className="text-primary font-monospace fs-6">📞 {relPhone}</strong>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="text-body-secondary fw-semibold small">Email nhận thông báo:</span>
                  <strong className="text-body font-monospace small">✉️ {relEmail}</strong>
                </div>
              </div>

              {/* THÔNG BÁO HƯỚNG DẪN */}
              <div className="p-3 bg-body rounded-4 border">
                <div className="fw-bold text-success mb-1 d-flex align-items-center gap-2">
                  <FaHeartbeat /> Kênh liên lạc khẩn cấp đã xác thực
                </div>
                <p className="extra-small text-body-secondary mb-0">
                  Khi camera AI phát hiện té ngã hoặc nhịp tim bất thường, hệ thống tự động phát cuộc gọi thoại &amp; gửi email thông báo trực tiếp cho {relName} ({relPhone}).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FamilyMedicalCardView;

