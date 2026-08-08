import React, { useState, useEffect } from "react";
import {
  FaPhoneAlt,
  FaExclamationTriangle,
  FaHeartbeat,
  FaRobot,
  FaNotesMedical,
  FaPlusCircle,
  FaCheckCircle,
  FaUserMd,
  FaShieldAlt,
  FaClock,
  FaStethoscope,
  FaFileMedical
} from "react-icons/fa";

const CARE_LOGS_STORAGE_KEY = "elderly_ai_family_care_logs";

function FamilyCaregiverPanel({ patient }) {
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  
  // Lưu trữ & Tải nhật ký chăm sóc từ LocalStorage để không bị mất dữ liệu khi F5
  const [careLogs, setCareLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(CARE_LOGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Lỗi khi đọc nhật ký từ LocalStorage:", e);
    }
    return [
      { id: 1, time: "14:00 Hôm nay", title: "Đã uống thuốc chiều", category: "Thuốc", note: "Đã uống 1 viên Huyết áp và 1 viên Bổ não đúng giờ." },
      { id: 2, time: "08:30 Sáng nay", title: "Ăn sáng & Đi dạo", category: "Sinh hoạt", note: "Cụ ăn hết 1 bát cháo yến mạch, đi dạo 15 phút ngoài sân nắng mỏng." },
      { id: 3, time: "07:00 Sáng nay", title: "Đo sinh hiệu buổi sáng", category: "Sinh hiệu", note: "Huyết áp 120/80 mmHg, Nhịp tim 74 bpm, SpO2 98% - Rất tốt." }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CARE_LOGS_STORAGE_KEY, JSON.stringify(careLogs));
    } catch (e) {
      console.warn("Lỗi khi lưu nhật ký vào LocalStorage:", e);
    }
  }, [careLogs]);

  const [newLogTitle, setNewLogTitle] = useState("");
  const [newLogNote, setNewLogNote] = useState("");
  const [newLogCategory, setNewLogCategory] = useState("Sinh hoạt");
  const [showAddLog, setShowAddLog] = useState(false);

  const handleTriggerSos = () => {
    setSosActive(true);
    setShowSosModal(true);
  };

  const handleAddCareLog = (e) => {
    e.preventDefault();
    if (!newLogTitle.trim()) return;

    const newEntry = {
      id: Date.now(),
      time: "Vừa xong",
      title: newLogTitle,
      category: newLogCategory,
      note: newLogNote || "Không có ghi chú thêm."
    };

    const updated = [newEntry, ...careLogs];
    setCareLogs(updated);
    setNewLogTitle("");
    setNewLogNote("");
    setShowAddLog(false);
  };

  const patientName = patient?.fullName || patient?.full_name || "Cụ Nguyễn Văn A";
  const patientCode = patient?.patient_id ? `PAT${patient.patient_id.toString().padStart(5, "0")}` : "PAT00001";
  const deviceId = patient?.device_id || "DEV0001";
  const bloodGroup = patient?.blood_group || patient?.bloodType || "O+";
  const allergy = patient?.allergy || "Dị ứng Penicillin & Phấn hoa";
  const caregiverName = patient?.relativeName || patient?.caregiver_name || "Nguyễn Văn B";
  const caregiverPhone = patient?.relativePhone || patient?.caregiver_phone || "0987654321";

  return (
    <div className="mb-5">
      {/* BANNER ĐẶC QUYỀN GIA ĐÌNH */}
      <div className="card border-0 shadow-lg rounded-5 overflow-hidden mb-4 text-white" style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2b48 100%)",
        borderLeft: "6px solid #ef4444"
      }}>
        <div className="card-body p-4 p-md-5">
          <div className="row g-4 align-items-center">
            {/* THÔNG TIN CHÍNH */}
            <div className="col-12 col-lg-8">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-2 bg-danger text-white rounded-pill mb-3 extra-small fw-bold text-uppercase shadow-sm">
                <span className="pulse-dot"></span> Tính Năng Độc Quyền Dành Cho Người Thân Gia Đình
              </div>

              <h2 className="fw-bold mb-2 text-white">
                Bảng Trợ Lý Chăm Sóc &amp; Báo Động KHẨN CẤP Gia Đình
              </h2>
              <p className="text-white-50 mb-4 me-lg-3">
                Không gian theo dõi riêng cho gia đình <strong className="text-info">{patientName}</strong> ({patientCode}). 
                Tích hợp AI cảnh báo tức thời, sổ tay chăm sóc hàng ngày và nút trợ giúp y tế 1-chạm.
              </p>

              {/* CHỈ SỐ NHANH BỆNH NHÂN */}
              <div className="row g-2 text-start">
                <div className="col-6 col-sm-3">
                  <div className="p-2 px-3 bg-white bg-opacity-10 rounded-4 border border-white border-opacity-20">
                    <span className="text-white fw-semibold d-block extra-small mb-1">Mã Thiết Bị AI</span>
                    <strong className="text-info font-monospace small d-block">{deviceId}</strong>
                  </div>
                </div>

                <div className="col-6 col-sm-3">
                  <div className="p-2 px-3 bg-white bg-opacity-10 rounded-4 border border-white border-opacity-20">
                    <span className="text-white fw-semibold d-block extra-small mb-1">Nhóm Máu</span>
                    <strong className="text-danger small d-block">🩸 {bloodGroup}</strong>
                  </div>
                </div>

                <div className="col-6 col-sm-3">
                  <div className="p-2 px-3 bg-white bg-opacity-10 rounded-4 border border-white border-opacity-20">
                    <span className="text-white fw-semibold d-block extra-small mb-1">Sinh Hiệu AI</span>
                    <strong className="text-success small d-block">✓ An Toàn (75 bpm)</strong>
                  </div>
                </div>

                <div className="col-6 col-sm-3">
                  <div className="p-2 px-3 bg-white bg-opacity-10 rounded-4 border border-white border-opacity-20">
                    <span className="text-white fw-semibold d-block extra-small mb-1">Dị Ứng Cần Tránh</span>
                    <strong className="text-warning small text-truncate d-block">{allergy}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* NÚT SOS NỔI BẬT KHẨN CẤP 1-CHẠM */}
            <div className="col-12 col-lg-4 text-center">
              <div className="p-4 bg-danger bg-opacity-20 border border-danger border-opacity-40 rounded-5 shadow-sm">
                <button
                  type="button"
                  className="btn btn-danger btn-lg w-100 py-3 rounded-pill fw-bold fs-5 shadow-lg d-flex align-items-center justify-content-center gap-2 btn-pulse mb-2 text-white"
                  onClick={handleTriggerSos}
                >
                  <FaExclamationTriangle className="fs-3" /> NÚT SOS 1-CHẠM 115
                </button>
                <small className="text-white fw-semibold d-block extra-small mt-2">
                  Nhấp để gửi tọa độ GPS &amp; hồ sơ y tế khẩn cấp cho Bác sĩ &amp; Cấp cứu 115
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HỆ THỐNG 2 CỘT: KHUYÊN AI & SỔ TAY CHĂM SÓC */}
      <div className="row g-4">
        {/* CỘT 1: KHUYÊN TRỢ LÝ Y TẾ AI GIA ĐÌNH */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-body-tertiary">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-primary bg-opacity-10 text-primary rounded-4 p-3">
                  <FaRobot className="fs-3" />
                </div>
                <div>
                  <h3 className="h5 fw-bold mb-1 text-body">Trợ Lý AI Đánh Giá Sức Khỏe Hôm Nay</h3>
                  <p className="text-body-secondary small mb-0">Phân tích theo thời gian thực từ cảm biến sinh hiệu AI CARE</p>
                </div>
              </div>

              <div className="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-4 mb-3">
                <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold">
                  <FaCheckCircle className="fs-5 text-success" />
                  <span>Đánh giá từ AI: {patientName} ổn định!</span>
                </div>
                <p className="small mb-2 text-body">
                  "Hôm nay nhịp tim trung bình của cụ đạt 74-76 bpm, nồng độ SpO2 duy trì 98%. Đã hoàn thành 2/2 cữ thuốc đúng giờ."
                </p>
                <div className="p-2 bg-body rounded-3 small text-body-secondary border">
                  💡 <strong>Lời khuyên riêng:</strong> Buổi tối nhiệt độ phòng nên giữ từ 26-27°C, nhắc cụ uống 100ml nước ấm trước khi đi ngủ lúc 21:30.
                </div>
              </div>

              {/* BÁC SĨ PHỤ TRÁCH GIA ĐÌNH */}
              <div className="p-3 bg-body rounded-4 border d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                  <FaUserMd className="fs-2 text-primary" />
                  <div>
                    <div className="fw-bold text-body">BS. Nguyễn Thanh Tùng</div>
                    <small className="text-body-secondary d-block">Bác sĩ chuyên khoa Tim Mạch &amp; Lão Khoa gia đình</small>
                  </div>
                </div>
                <a href="tel:0912345999" className="btn btn-outline-primary rounded-pill btn-sm fw-bold">
                  <FaPhoneAlt className="me-1" /> Gọi Bác Sĩ
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT 2: SỔ TAY NHẬT KÝ CHĂM SÓC GIA ĐÌNH */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-body-tertiary">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 text-success rounded-4 p-3">
                    <FaNotesMedical className="fs-3" />
                  </div>
                  <div>
                    <h3 className="h5 fw-bold mb-1 text-body">Sổ Tay Nhật Ký Chăm Sóc</h3>
                    <p className="text-body-secondary small mb-0">Ghi lại sinh hoạt, ăn uống &amp; cảm xúc của người thân</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-success btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                  onClick={() => setShowAddLog(!showAddLog)}
                >
                  <FaPlusCircle /> Ghi Nhật Ký
                </button>
              </div>

              {/* FORM GHI NHẬT KÝ */}
              {showAddLog && (
                <form onSubmit={handleAddCareLog} className="p-3 bg-body rounded-4 border mb-3">
                  <h6 className="fw-bold mb-2 text-success">Tạo Ghi Chú Sinh Hoạt Mới</h6>
                  <div className="row g-2">
                    <div className="col-md-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Tiêu đề nhật ký (VD: Đi dạo chiều, Ăn súp...)"
                        value={newLogTitle}
                        onChange={(e) => setNewLogTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <select
                        className="form-select form-select-sm"
                        value={newLogCategory}
                        onChange={(e) => setNewLogCategory(e.target.value)}
                      >
                        <option value="Sinh hoạt">Sinh hoạt</option>
                        <option value="Thuốc">Thuốc</option>
                        <option value="Sinh hiệu">Sinh hiệu</option>
                        <option value="Tâm trạng">Tâm trạng</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="Chi tiết ghi chú chăm sóc..."
                        value={newLogNote}
                        onChange={(e) => setNewLogNote(e.target.value)}
                      />
                    </div>
                    <div className="col-12 text-end mt-2">
                      <button type="submit" className="btn btn-success btn-sm rounded-pill px-3 fw-bold">
                        Lưu Nhật Ký
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* DANH SÁCH NHẬT KÝ HÀNG NGÀY */}
              <div className="d-grid gap-2" style={{ maxHeight: "260px", overflowY: "auto" }}>
                {careLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-body rounded-4 border">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <strong className="text-body small">{log.title}</strong>
                      <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 extra-small">
                        {log.category}
                      </span>
                    </div>
                    <p className="extra-small text-body-secondary mb-1">{log.note}</p>
                    <small className="text-body-secondary extra-small d-flex align-items-center gap-1">
                      <FaClock /> {log.time}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY NÚT SOS KHẨN CẤP */}
      {showSosModal && (
        <div className="fall-alert-overlay">
          <div className="fall-alert-modal p-4 text-center">
            <div className="siren-pulse-icon mx-auto mb-3 bg-danger text-white">
              <FaExclamationTriangle className="fs-1 animate-bounce" />
            </div>
            <h3 className="fw-bold text-danger mb-2">ĐÃ KÍCH HOẠT QUY TRÌNH BÁO ĐỘNG SOS 115</h3>
            <p className="text-muted small mb-4">
              Hệ thống đang tự động truyền hồ sơ cấp cứu của <strong className="text-danger">{patientName}</strong> đến Trung tâm 115 &amp; Người thân khẩn cấp.
            </p>

            <div className="card bg-danger bg-opacity-10 border border-danger border-opacity-25 p-3 rounded-4 mb-4 text-start small">
              <div className="fw-bold text-danger mb-2">📄 HỒ SƠ Y TẾ TRUYỀN TẢI TỨC THỜI:</div>
              <div>• Bệnh nhân: <strong>{patientName} ({patientCode})</strong></div>
              <div>• Nhóm máu: <strong className="text-danger">🩸 {bloodGroup}</strong></div>
              <div>• Chống chỉ định dị ứng: <strong className="text-danger">⚠️ {allergy}</strong></div>
              <div>• Người thân chính: <strong>{caregiverName} ({caregiverPhone})</strong></div>
              <div>• Địa chỉ GPS: <strong>Hà Nội, Việt Nam (Đang chia sẻ vị trí Realtime)</strong></div>
            </div>

            <div className="d-flex justify-content-center gap-3">
              <button
                type="button"
                className="btn btn-secondary rounded-pill px-4"
                onClick={() => setShowSosModal(false)}
              >
                Đóng / Hủy Báo Động Thử Nghiệm
              </button>
              <a
                href="tel:115"
                className="btn btn-danger rounded-pill px-4 fw-bold"
              >
                <FaPhoneAlt className="me-2" /> GỌI TRỰC TIẾP 115 NGAY
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FamilyCaregiverPanel;
