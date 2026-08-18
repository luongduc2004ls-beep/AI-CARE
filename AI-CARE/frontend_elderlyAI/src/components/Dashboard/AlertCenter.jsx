import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaVideo, FaPhoneAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

function AlertCenter({ criticalAlert = null, onCallCaregiver = null }) {
  const hasCriticalAlert = Boolean(criticalAlert);

  // Fallback demo critical incident if none provided
  const alertData = criticalAlert || {
    id: 101,
    title: "CẢNH BÁO TÉ NGÃ",
    patientName: "Nguyễn Văn A",
    age: 71,
    location: "Phòng ngủ 101",
    timestamp: "18:32:14",
    confidence: "94%",
    phone: "0901234567"
  };

  return (
    <div className="card mb-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: "var(--bg-card-subtle)", borderBottom: "1px solid var(--border-color)" }}>
        <h2 className="section-title mb-0 d-flex align-items-center gap-2">
          {hasCriticalAlert ? (
            <span className="text-danger">🔴 CẢNH BÁO AN TOÀN</span>
          ) : (
            <span className="text-success">● CẢNH BÁO AN TOÀN</span>
          )}
        </h2>
        <span className="extra-small-text text-muted">AI Monitoring Engine v2.1</span>
      </div>

      <div className="card-body p-4">
        {!hasCriticalAlert ? (
          <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ backgroundColor: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
            <FaCheckCircle className="text-success fs-3 flex-shrink-0" />
            <div>
              <h3 className="card-title-custom mb-1 text-success">● Không có sự cố khẩn cấp</h3>
              <p className="body-text text-muted mb-0">Hệ thống AI đang trực tuyến và liên tục theo dõi 12 camera an toàn trong nhà.</p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-circle text-white bg-danger d-flex align-items-center justify-content-center">
                  <FaExclamationTriangle className="fs-4" />
                </div>
                <div>
                  <span className="badge bg-danger text-white mb-1">🔴 {alertData.title}</span>
                  <h3 className="card-title-custom fs-5 mb-0 text-white">
                    {alertData.patientName} · {alertData.age} tuổi
                  </h3>
                  <span className="secondary-text text-muted">Vị trí: <strong>{alertData.location}</strong> — Thời gian: <strong>{alertData.timestamp}</strong></span>
                </div>
              </div>

              <div className="text-end">
                <span className="extra-small-text text-muted d-block">AI Confidence</span>
                <span className="fs-4 fw-bold text-danger">{alertData.confidence}</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 pt-2 border-top border-secondary border-opacity-25">
              <Link to="/camera" className="btn btn-sm btn-primary rounded-2 px-3 fw-semibold d-flex align-items-center gap-2">
                <FaVideo /> Xem camera
              </Link>
              <a href={`tel:${alertData.phone || "0901234567"}`} className="btn btn-sm btn-outline-danger rounded-2 px-3 fw-semibold d-flex align-items-center gap-2">
                <FaPhoneAlt /> Gọi người thân
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertCenter;
