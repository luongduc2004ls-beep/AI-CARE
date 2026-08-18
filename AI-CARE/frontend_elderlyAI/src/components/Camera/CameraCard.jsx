import React from "react";
import { FaVideo, FaCircle, FaUser, FaExpand, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function CameraCard({ camera, onSelectCamera }) {
  const isAnomaly = camera.aiState === "warning" || camera.status === "ALERT";

  return (
    <div className="card h-100 overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: isAnomaly ? "var(--color-warning)" : "var(--border-color)" }}>
      {/* Top Card Header */}
      <div className="p-2 px-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "var(--bg-card-subtle)", borderBottom: "1px solid var(--border-color)" }}>
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold extra-small-text text-white">{camera.id || "CAM 01"}</span>
          <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 extra-small-text py-1 px-2 d-flex align-items-center gap-1">
            <FaCircle style={{ fontSize: "6px" }} /> LIVE
          </span>
          <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 extra-small-text py-1 px-2">
            AI ON
          </span>
        </div>
        <span className="extra-small-text text-muted">{camera.location || "Phòng ngủ 101"}</span>
      </div>

      {/* Video Preview Canvas / Image Container */}
      <div className="position-relative bg-black d-flex align-items-center justify-content-center" style={{ aspectRatio: "16/9", minHeight: "180px" }}>
        {camera.streamUrl || camera.snapshot ? (
          <img
            src={camera.snapshot || camera.streamUrl}
            alt={camera.name}
            className="w-100 h-100 object-fit-cover"
          />
        ) : (
          <div className="text-center p-3">
            <FaVideo className="fs-1 text-secondary mb-2" />
            <div className="extra-small-text text-muted">Bật luồng trực tuyến</div>
          </div>
        )}

        {/* Floating Quick Action Overlay */}
        <button
          type="button"
          className="btn btn-dark btn-sm rounded-circle position-absolute top-0 end-0 m-2 p-2 opacity-75 hover-opacity-100"
          title="Xem trực tiếp & Chi tiết AI"
          onClick={() => onSelectCamera(camera)}
        >
          <FaExpand />
        </button>
      </div>

      {/* Card Info Footer */}
      <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
        <div className="mb-2">
          <div className="fw-semibold text-white body-text d-flex align-items-center gap-1">
            <FaUser className="extra-small-text text-muted" />
            {camera.patientName || "Nguyễn Văn A"} · {camera.patientAge || "71"} tuổi
          </div>
          <div className="secondary-text text-muted">{camera.location || "Phòng ngủ 101"}</div>
        </div>

        <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-15">
          {/* AI State Badge */}
          {isAnomaly ? (
            <span className="badge bg-warning text-dark extra-small-text fw-semibold d-flex align-items-center gap-1 py-1 px-2">
              <FaExclamationTriangle /> ⚠ Tư thế bất thường ({camera.duration || "14s"})
            </span>
          ) : (
            <span className="badge bg-success bg-opacity-20 text-success extra-small-text fw-semibold d-flex align-items-center gap-1 py-1 px-2">
              <FaCheckCircle /> ✓ Bình thường
            </span>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-2 extra-small-text fw-semibold py-1 px-2"
            onClick={() => onSelectCamera(camera)}
          >
            Xem trực tiếp →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CameraCard;
