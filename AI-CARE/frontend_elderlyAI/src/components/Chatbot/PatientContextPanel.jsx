import React from "react";
import { FaUser, FaHeartbeat, FaPills, FaShieldAlt, FaExternalLinkAlt, FaVideo, FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";

function PatientContextPanel({ patient, vitals, medications, riskScore = 20, userRole = "Admin" }) {
  const isAdmin = userRole === "Admin";

  const currentPatient = patient || {
    id: "PAT10000",
    name: "Nguyễn Văn An",
    age: 71,
    gender: "Nam",
    room: "Phòng ngủ 101"
  };

  const currentVitals = vitals || {
    heartRate: 76,
    bp: "120/80",
    spo2: 98,
    temp: "36.8"
  };

  const meds = medications || [
    { name: "Amlodipine 5mg", time: "08:00", taken: true },
    { name: "Atorvastatin 10mg", time: "20:00", taken: false }
  ];

  return (
    <div className="h-100 p-3 d-flex flex-column gap-3 overflow-y-auto" style={{ backgroundColor: "var(--bg-card)", borderLeft: "1px solid var(--border-color)" }}>
      {/* Role Header Banner */}
      <div className="d-flex justify-content-between align-items-center pb-2 border-bottom border-secondary border-opacity-25">
        <span className="extra-small-text text-uppercase fw-bold text-muted">
          {isAdmin ? "SYSTEM & PATIENT SCOPE" : "MY HEALTH CONTEXT"}
        </span>
        <span className={`badge ${isAdmin ? "bg-primary" : "bg-info text-dark"} extra-small-text`}>
          {isAdmin ? "🛡️ Quản trị viên" : "👤 Người thân"}
        </span>
      </div>

      {/* Admin System Context Overview Card (Section 36) */}
      {isAdmin && (
        <div className="p-3 rounded-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
          <div className="extra-small-text text-uppercase fw-bold text-primary mb-2">SYSTEM STATUS (TOÀN VIỆN)</div>
          <div className="d-flex flex-column gap-1.5 extra-small-text text-muted">
            <div className="d-flex justify-content-between">
              <span>📹 Camera:</span>
              <strong className="text-white">12 Cameras (10 Online, 2 Offline)</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>👥 Bệnh nhân:</span>
              <strong className="text-white">12 Đang theo dõi</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>🚨 Cảnh báo:</span>
              <strong className="text-warning">1 Khẩn cấp, 2 Cần chú ý</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>⚠️ Nguy cơ ngã:</span>
              <strong className="text-danger">2 Nguy cơ cao (PAT10000, PAT10002)</strong>
            </div>
          </div>
        </div>
      )}

      {/* Patient Overview Card */}
      <div className="p-3 rounded-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
        <div className="extra-small-text text-uppercase fw-bold text-muted mb-2">
          {isAdmin ? "BỆNH NHÂN ĐANG CHỌN" : "HỒ SƠ CỦA TÔI"}
        </div>
        <div className="d-flex align-items-center gap-2 mb-2">
          <div className="p-2 rounded-circle bg-primary bg-opacity-20 text-primary">
            <FaUser />
          </div>
          <div>
            <h4 className="card-title-custom mb-0 text-white">{currentPatient.name}</h4>
            <span className="badge bg-primary font-monospace extra-small-text">{currentPatient.id}</span>
          </div>
        </div>
        <div className="secondary-text text-muted">
          {currentPatient.age} tuổi · {currentPatient.gender} · <strong>{currentPatient.room}</strong>
        </div>
      </div>

      {/* Health Vitals Card */}
      <div className="p-3 rounded-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="extra-small-text text-uppercase fw-bold text-muted">CHỈ SỐ SINH HIỆU</span>
          <FaHeartbeat className="text-danger" />
        </div>
        <div className="row g-2 text-center">
          <div className="col-6">
            <div className="p-2 rounded-2 bg-dark border border-secondary border-opacity-25">
              <span className="extra-small-text text-muted d-block">❤️ Heart Rate</span>
              <strong className="body-text text-white">{currentVitals.heartRate} BPM</strong>
            </div>
          </div>
          <div className="col-6">
            <div className="p-2 rounded-2 bg-dark border border-secondary border-opacity-25">
              <span className="extra-small-text text-muted d-block">🩸 Huyết áp</span>
              <strong className="body-text text-white">{currentVitals.bp}</strong>
            </div>
          </div>
          <div className="col-6">
            <div className="p-2 rounded-2 bg-dark border border-secondary border-opacity-25">
              <span className="extra-small-text text-muted d-block">🫁 SpO₂</span>
              <strong className="body-text text-success">{currentVitals.spo2}%</strong>
            </div>
          </div>
          <div className="col-6">
            <div className="p-2 rounded-2 bg-dark border border-secondary border-opacity-25">
              <span className="extra-small-text text-muted d-block">🌡 Thân nhiệt</span>
              <strong className="body-text text-white">{currentVitals.temp}°C</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Medication Intake */}
      <div className="p-3 rounded-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="extra-small-text text-uppercase fw-bold text-muted">LỊCH UỐNG THUỐC ({meds.length})</span>
          <FaPills className="text-warning" />
        </div>
        <div className="d-flex flex-column gap-2">
          {meds.map((m, idx) => (
            <div key={idx} className="d-flex justify-content-between align-items-center extra-small-text p-2 rounded-2 bg-dark">
              <div>
                <strong className="text-white d-block">{m.name}</strong>
                <span className="text-muted">{m.time}</span>
              </div>
              <span className={m.taken ? "badge bg-success bg-opacity-25 text-success" : "badge bg-warning bg-opacity-25 text-warning"}>
                {m.taken ? "✓ Đã uống" : "○ Chờ uống"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Fall Risk Assessment */}
      <div className="p-3 rounded-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="extra-small-text text-uppercase fw-bold text-muted">ĐÁNH GIÁ RỦI RO NGÃ</span>
          <FaShieldAlt className="text-success" />
        </div>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <span className="badge bg-success bg-opacity-20 text-success fw-bold extra-small-text">● Rủi ro thấp</span>
            <div className="extra-small-text text-muted mt-1">Điểm rủi ro: <strong>{riskScore}%</strong></div>
          </div>
          <div className="fs-3 fw-bold text-success">{riskScore}%</div>
        </div>
      </div>

      {/* Action link */}
      <div className="mt-auto">
        <Link to="/elderly" className="btn btn-outline-primary btn-sm w-100 rounded-2 d-flex align-items-center justify-content-center gap-2 fw-semibold">
          <FaExternalLinkAlt /> Xem hồ sơ bệnh án
        </Link>
      </div>
    </div>
  );
}

export default PatientContextPanel;
