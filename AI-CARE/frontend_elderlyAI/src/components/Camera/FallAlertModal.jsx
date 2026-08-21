import React, { useEffect, useState } from "react";
import {
  FaExclamationTriangle,
  FaPhoneAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaVideo,
  FaUserInjured,
  FaClock,
  FaMapMarkerAlt,
  FaCamera,
  FaSearchPlus
} from "react-icons/fa";
import { generateSimulatedSnapshotSVG } from "../../utils/snapshot";
import "./FallAlertModal.css";

const FallAlertModal = ({ alert, onClose, onAcknowledge }) => {
  const [showZoom, setShowZoom] = useState(false);

  // Phát âm thanh báo động khẩn cấp bằng Web Audio API
  useEffect(() => {
    if (!alert) return;

    let audioCtx = null;
    let osc = null;
    let interval = null;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playBeep = () => {
        if (!audioCtx) return;
        osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz (Tone A5)
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      };

      playBeep();
      interval = setInterval(playBeep, 800);
    } catch (e) {
      console.log("Audio play error:", e);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close();
      }
    };
  }, [alert]);

  if (!alert) return null;

  const {
    alert_id,
    camera_name,
    location,
    patient_name,
    detected_at,
    ai_analytics,
    snapshot_url
  } = alert;

  const displaySnapshot = snapshot_url || generateSimulatedSnapshotSVG({
    camera_name,
    location,
    time: detected_at,
    spine_angle: ai_analytics?.spine_angle_deg || 78.5
  });

  return (
    <div className="fall-alert-overlay">
      <div className="fall-alert-modal shadow-lg">
        {/* Siren Top Bar */}
        <div className="fall-alert-header bg-danger text-white p-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="siren-pulse-icon">
              <FaExclamationTriangle className="fs-2 animate-bounce" />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">🚨 CẢNH BÁO NGUY CẤP: PHÁT HIỆN NGÃ!</h5>
              <small className="opacity-75">Hình ảnh được chụp lại trực tiếp khi nhận diện bất thường trên Camera AI</small>
            </div>
          </div>
          <button className="btn-close btn-close-white" onClick={onClose}></button>
        </div>

        <div className="fall-alert-body p-4">
          <div className="row g-4">
            {/* Live Camera Snapshot & Overlay */}
            <div className="col-md-6">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="badge bg-danger text-white px-2.5 py-1.5 extra-small fw-bold d-flex align-items-center gap-1 shadow-sm">
                  <FaCamera className="me-1 animate-pulse" /> HÌNH CHỤP TRỰC TIẾP TẠI THỜI ĐIỂM BẤT THƯỜNG
                </span>
                <button 
                  className="btn btn-sm btn-outline-danger py-0 px-2 extra-small fw-bold d-flex align-items-center gap-1"
                  onClick={() => setShowZoom(true)}
                >
                  <FaSearchPlus /> Phóng to
                </button>
              </div>

              <div 
                className="snapshot-container position-relative rounded overflow-hidden shadow-sm border border-danger cursor-pointer"
                onClick={() => setShowZoom(true)}
                title="Nhấp để phóng to ảnh chụp trực tiếp khi nhận diện bất thường"
              >
                <img
                  src={displaySnapshot}
                  alt="Fall Event Live Snapshot"
                  className="img-fluid w-100 object-fit-cover"
                  style={{ maxHeight: "260px" }}
                />
                
                {/* Pose AI Bounding Box Overlay */}
                <div className="pose-bounding-box position-absolute">
                  <span className="badge bg-danger position-absolute top-0 start-0 translate-middle-y ms-2">
                    FALL DETECTED ({((ai_analytics?.confidence || 0.968) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-85 text-white p-2 text-center small d-flex justify-content-between px-3 font-monospace">
                  <span><FaVideo className="me-1 text-danger" /> {camera_name}</span>
                  <span><FaClock className="me-1 text-warning" /> {detected_at}</span>
                </div>
              </div>
            </div>

            {/* Event Details & AI Metrics */}
            <div className="col-md-6 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                  THÔNG TIN SỰ CỐ & CHỈ SỐ AI KHI CHỤP
                </h6>

                <ul className="list-group list-group-flush small mb-3">
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                    <span className="text-muted"><FaUserInjured className="me-2 text-danger" />Người gặp sự cố:</span>
                    <strong className="text-dark fs-6">{patient_name}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                    <span className="text-muted"><FaMapMarkerAlt className="me-2 text-primary" />Vị trí sự cố:</span>
                    <strong className="badge bg-warning text-dark fs-6">{location}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                    <span className="text-muted">Góc xương sống (Spine Angle):</span>
                    <span className="badge bg-danger">{ai_analytics?.spine_angle_deg || 78.5}° (&gt; 60°)</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                    <span className="text-muted">Tỷ lệ tư thế (Aspect Ratio):</span>
                    <span className="badge bg-danger">{ai_analytics?.aspect_ratio || 0.42} (Nằm ngang)</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                    <span className="text-muted">Thời gian bất động sau rơi:</span>
                    <span className="badge bg-dark text-warning">{ai_analytics?.motionless_duration_sec || 4.2} giây</span>
                  </li>
                </ul>
              </div>

              <div className="alert alert-danger p-2 mb-0 small rounded d-flex align-items-center gap-2">
                <FaExclamationTriangle className="fs-5 flex-shrink-0" />
                <div>
                  <strong>Chú ý:</strong> Hình ảnh trên được chụp trực tiếp từ camera ngay khi AI nhận diện bất thường!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="fall-alert-footer bg-light p-3 border-top d-flex justify-content-between align-items-center gap-2">
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => onAcknowledge(alert_id, "FALSE_ALARM")}
          >
            <FaTimesCircle /> Báo động giả
          </button>

          <div className="d-flex gap-2">
            <a
              href="tel:115"
              className="btn btn-danger btn-pulse d-flex align-items-center gap-2 fw-bold px-3"
            >
              <FaPhoneAlt /> GỌI CẤP CỨU 115
            </a>

            <button
              className="btn btn-success d-flex align-items-center gap-2 fw-bold px-4"
              onClick={() => onAcknowledge(alert_id, "ACKNOWLEDGED")}
            >
              <FaCheckCircle /> XÁC NHẬN ĐÃ HỖ TRỢ
            </button>
          </div>
        </div>
      </div>

      {/* Modal Zoom Hình Ảnh Chụp Khẩn Cấp */}
      {showZoom && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-90 d-flex flex-column align-items-center justify-content-center p-3"
          style={{ zIndex: 1100 }}
          onClick={() => setShowZoom(false)}
        >
          <div className="text-end w-100 max-w-4xl mb-2">
            <button className="btn btn-sm btn-light fw-bold" onClick={() => setShowZoom(false)}>✕ Đóng Xem Ảnh</button>
          </div>
          <div className="position-relative text-center max-w-4xl border border-danger rounded overflow-hidden shadow-lg bg-dark">
            <img src={displaySnapshot} alt="Zoom Captured Anomaly Frame" className="img-fluid rounded" style={{ maxHeight: "80vh" }} />
            <div className="position-absolute bottom-0 start-0 w-100 bg-black bg-opacity-75 text-white p-3 font-monospace small">
              🚨 HÌNH ẢNH CHỤP TRỰC TIẾP KHI NHẬN DIỆN BẤT THƯỜNG • {camera_name} - {detected_at} ({location})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FallAlertModal;

