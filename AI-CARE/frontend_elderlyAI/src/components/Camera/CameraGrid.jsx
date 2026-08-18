import React, { useState } from "react";
import CameraCard from "./CameraCard";

function CameraGrid({ cameras = [], onSelectCamera }) {
  const [filterState, setFilterState] = useState("all");

  const filteredCameras = cameras.filter((cam) => {
    if (filterState === "warning") return cam.aiState === "warning" || cam.status === "ALERT";
    if (filterState === "normal") return cam.aiState !== "warning" && cam.status !== "ALERT";
    return true;
  });

  return (
    <div>
      {/* Grid Filter Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn btn-sm ${filterState === "all" ? "btn-primary" : "btn-dark"} rounded-2`}
            onClick={() => setFilterState("all")}
          >
            Tất cả ({cameras.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterState === "warning" ? "btn-warning text-dark" : "btn-dark"} rounded-2`}
            onClick={() => setFilterState("warning")}
          >
            Bất thường ({cameras.filter((c) => c.aiState === "warning" || c.status === "ALERT").length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterState === "normal" ? "btn-success" : "btn-dark"} rounded-2`}
            onClick={() => setFilterState("normal")}
          >
            Bình thường ({cameras.filter((c) => c.aiState !== "warning" && c.status !== "ALERT").length})
          </button>
        </div>

        <span className="extra-small-text text-muted">Hiển thị dạng Grid Matrix (3x2)</span>
      </div>

      {/* Responsive Camera Grid System */}
      <div className="row g-3">
        {filteredCameras.map((cam, idx) => (
          <div key={cam.id || idx} className="col-12 col-md-6 col-xl-4">
            <CameraCard camera={cam} onSelectCamera={onSelectCamera} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CameraGrid;
