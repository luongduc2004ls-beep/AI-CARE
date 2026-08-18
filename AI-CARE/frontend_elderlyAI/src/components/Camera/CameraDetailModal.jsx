import React from "react";
import { FaTimes, FaVideo, FaCircle, FaPhoneAlt, FaUser, FaExpand, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

function CameraDetailModal({ camera, onClose }) {
  if (!camera) return null;

  const isAnomaly = camera.aiState === "warning" || camera.status === "ALERT";

  const recentEvents = camera.events || [
    { time: "18:32", type: isAnomaly ? "Posture anomaly" : "Normal" },
    { time: "18:12", type: "Normal" },
    { time: "17:55", type: "Normal" },
  ];

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.75)", zIndex: 1080 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          {/* Header */}
          <div className="modal-header py-3 px-4" style={{ backgroundColor: "var(--bg-card-subtle)", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <h3 className="modal-title section-title mb-0 d-flex align-items-center gap-2">
                <FaVideo className="text-primary" /> {camera.name || camera.id || "Camera 01"}
              </h3>
              <span className="extra-small-text text-muted">{camera.location || "Phòng ngủ 101"}</span>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            <div className="row g-4">
              {/* Left Column: Large Live Stream Preview */}
              <div className="col-12 col-lg-8">
                <div className="position-relative bg-black rounded-3 overflow-hidden d-flex align-items-center justify-content-center" style={{ aspectRatio: "16/9" }}>
                  {camera.streamUrl || camera.snapshot ? (
                    <img src={camera.snapshot || camera.streamUrl} alt={camera.name} className="w-100 h-100 object-fit-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <FaVideo className="fs-1 text-secondary mb-2" />
                      <div className="body-text text-muted">Luồng trực tiếp camera AI</div>
                    </div>
                  )}

                  {/* Top Live Badges */}
                  <div className="position-absolute top-0 start-0 m-3 d-flex gap-2">
                    <span className="badge bg-danger text-white py-1 px-3 d-flex align-items-center gap-1">
                      <FaCircle style={{ fontSize: "6px" }} /> LIVE
                    </span>
                    <span className="badge bg-primary text-white py-1 px-3">
                      AI ACTIVE
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="d-flex align-items-center gap-2 mt-3">
                  <button type="button" className="btn btn-sm btn-primary rounded-2 px-3 fw-semibold d-flex align-items-center gap-2">
                    <FaExpand /> Xem toàn màn hình
                  </button>
                  <a href={`tel:${camera.caregiverPhone || "0901234567"}`} className="btn btn-sm btn-outline-danger rounded-2 px-3 fw-semibold d-flex align-items-center gap-2">
                    <FaPhoneAlt /> Gọi người thân
                  </a>
                </div>
              </div>

              {/* Right Column: Information & Secondary AI Metrics */}
              <div className="col-12 col-lg-4">
                {/* Patient Information */}
                <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
                  <h4 className="card-title-custom fs-6 mb-2 d-flex align-items-center gap-2">
                    <FaUser className="text-primary" /> Thông tin bệnh nhân
                  </h4>
                  <div className="body-text fw-bold text-white mb-1">{camera.patientName || "Nguyễn Văn A"}</div>
                  <div className="secondary-text text-muted mb-1">Tuổi: <strong>{camera.patientAge || 71} tuổi</strong></div>
                  <div className="secondary-text text-muted">Vị trí: <strong>{camera.location || "Phòng ngủ 101"}</strong></div>
                </div>

                {/* Current Status */}
                <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
                  <h4 className="card-title-custom fs-6 mb-2">Trạng thái hiện tại</h4>
                  {isAnomaly ? (
                    <span className="badge bg-warning text-dark body-text fw-semibold py-2 px-3 d-flex align-items-center gap-2">
                      <FaExclamationTriangle /> ⚠ Posture Anomaly Detected
                    </span>
                  ) : (
                    <span className="badge bg-success bg-opacity-20 text-success body-text fw-semibold py-2 px-3 d-flex align-items-center gap-2">
                      <FaCheckCircle /> ✓ Normal
                    </span>
                  )}
                </div>

                {/* Secondary Technical AI Telemetry */}
                <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
                  <h4 className="card-title-custom fs-6 mb-2 text-muted">AI Analysis (Telemetry)</h4>
                  <div className="extra-small-text font-monospace d-flex flex-column gap-1 text-muted">
                    <div>Body Angle: <strong className="text-white">{camera.bodyAngle || "78.5°"}</strong></div>
                    <div>Duration: <strong className="text-white">{camera.duration || "14s"}</strong></div>
                    <div>Confidence: <strong className="text-white">{camera.confidence || "91.3%"}</strong></div>
                    <div>Model: <strong className="text-white">FallDetection-v2.1</strong></div>
                  </div>
                </div>

                {/* Recent Events */}
                <div className="p-3 rounded-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
                  <h4 className="card-title-custom fs-6 mb-2">Sự cố gần đây</h4>
                  <div className="d-flex flex-column gap-2">
                    {recentEvents.map((evt, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center extra-small-text">
                        <span className="text-muted font-monospace">{evt.time}</span>
                        <span className={evt.type !== "Normal" ? "text-warning fw-bold" : "text-success"}>{evt.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraDetailModal;
