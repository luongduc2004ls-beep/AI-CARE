import React from "react";

function PatientSafetyOverview() {
  const categories = [
    { label: "Bình thường", count: 8, color: "var(--color-success)", bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)" },
    { label: "Cần theo dõi", count: 3, color: "var(--color-primary)", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)" },
    { label: "Nguy cơ cao", count: 1, color: "var(--color-warning)", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
    { label: "Khẩn cấp", count: 0, color: "var(--color-danger)", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)" },
  ];

  return (
    <div className="card h-100 p-3" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <h3 className="section-title fs-6 mb-3">Patient Safety Overview</h3>
      <div className="row g-2">
        {categories.map((cat, idx) => (
          <div key={idx} className="col-6">
            <div className="p-3 rounded-3 text-center" style={{ backgroundColor: cat.bg, border: `1px solid ${cat.border}` }}>
              <span className="extra-small-text text-muted d-block mb-1">{cat.label}</span>
              <span className="fs-3 fw-bold" style={{ color: cat.color }}>{cat.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientSafetyOverview;
