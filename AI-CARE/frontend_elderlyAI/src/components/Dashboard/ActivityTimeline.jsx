import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaHeartbeat, FaVideo, FaCapsules } from "react-icons/fa";

function ActivityTimeline() {
  const activities = [
    {
      time: "18:32",
      type: "warning",
      icon: <FaExclamationTriangle className="text-warning" />,
      title: "AI phát hiện bất thường",
      desc: "Nguyễn Văn A · Phòng ngủ 101",
    },
    {
      time: "18:27",
      type: "success",
      icon: <FaCapsules className="text-success" />,
      title: "Đã uống thuốc",
      desc: "Trần Thị B · Amlodipine 5mg",
    },
    {
      time: "18:15",
      type: "danger",
      icon: <FaHeartbeat className="text-danger" />,
      title: "Nhịp tim bất thường",
      desc: "Lê Văn C · 112 BPM",
    },
    {
      time: "18:02",
      type: "info",
      icon: <FaVideo className="text-primary" />,
      title: "Camera 08 kết nối",
      desc: "Phòng khách trung tâm",
    },
  ];

  return (
    <div className="card h-100 p-3" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <h3 className="section-title fs-6 mb-3">HOẠT ĐỘNG GẦN ĐÂY</h3>
      <div className="d-flex flex-column gap-3">
        {activities.map((act, idx) => (
          <div key={idx} className="d-flex align-items-start gap-3 pb-2 border-bottom border-secondary border-opacity-10 last-border-0">
            <span className="font-monospace extra-small-text text-muted pt-1" style={{ minWidth: "45px" }}>{act.time}</span>
            <div className="pt-1">{act.icon}</div>
            <div className="lh-sm">
              <div className="body-text fw-semibold text-white">{act.title}</div>
              <div className="secondary-text text-muted">{act.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityTimeline;
