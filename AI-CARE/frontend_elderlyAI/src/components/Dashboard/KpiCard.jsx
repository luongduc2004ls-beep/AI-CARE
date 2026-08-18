import React from "react";
import { FaVideo, FaExclamationTriangle, FaUsers, FaBrain } from "react-icons/fa";

function KpiCard({ summary = {} }) {
  const kpis = [
    {
      title: "Camera",
      value: "12 / 12",
      subtext: "Đang trực tuyến",
      icon: <FaVideo />,
      color: "var(--color-primary)",
      badgeBg: "rgba(59, 130, 246, 0.15)",
    },
    {
      title: "Cảnh báo",
      value: summary.unread_notifications || "3",
      subtext: "1 khẩn cấp",
      icon: <FaExclamationTriangle />,
      color: "var(--color-warning)",
      badgeBg: "rgba(245, 158, 11, 0.15)",
    },
    {
      title: "Bệnh nhân",
      value: summary.total_patients || "12",
      subtext: "Đang theo dõi",
      icon: <FaUsers />,
      color: "var(--color-success)",
      badgeBg: "rgba(34, 197, 94, 0.15)",
    },
    {
      title: "AI Monitoring",
      value: "98.4%",
      subtext: "System confidence",
      icon: <FaBrain />,
      color: "var(--color-primary)",
      badgeBg: "rgba(59, 130, 246, 0.15)",
    },
  ];

  return (
    <div className="row g-3 mb-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 p-3" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="secondary-text text-uppercase fw-semibold d-block mb-1">{kpi.title}</span>
                <h3 className="card-title-custom fs-2 fw-bold mb-1">{kpi.value}</h3>
                <span className="extra-small-text text-muted">{kpi.subtext}</span>
              </div>
              <div
                className="d-flex align-items-center justify-content-center rounded-3 p-2"
                style={{ backgroundColor: kpi.badgeBg, color: kpi.color, fontSize: "1.25rem" }}
              >
                {kpi.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default KpiCard;
