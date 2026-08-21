// ==============================================================================
// NotificationList.jsx
// Danh Sách Cảnh Báo Cần Xử Lý Kèm Thông Tin Bệnh Nhân Đầy Đủ
// ==============================================================================

import React from "react";
import { Button } from "react-bootstrap";
import {
  FaBell,
  FaCheck,
  FaExclamationTriangle,
  FaHeartbeat,
  FaPills,
  FaTrash,
  FaUserInjured,
  FaUser,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle
} from "react-icons/fa";

const alertTypeConfig = {
  medicine: { icon: <FaPills />, color: "primary", label: "Thuốc" },
  health: { icon: <FaHeartbeat />, color: "danger", label: "Sinh hiệu" },
  fall: { icon: <FaUserInjured />, color: "danger", label: "Té ngã" },
  abnormal_movement: { icon: <FaExclamationTriangle />, color: "warning", label: "Bất thường" },
  warning: { icon: <FaExclamationTriangle />, color: "warning", label: "Cảnh báo" },
};

function NotificationList({ notifications = [], alerts = [], onMarkAsRead, onDelete }) {
  const displayList = notifications.length > 0 ? notifications : (alerts || []);

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-0">
        <div className="d-flex align-items-center justify-content-between gap-3 p-4 pb-3 flex-wrap border-bottom">
          <div>
            <h2 className="h5 fw-bold mb-1 text-body">Danh Sách Cảnh Báo Cần Theo Dõi & Xử Lý</h2>
            <p className="text-body-secondary small mb-0">Các sự cố an toàn và nhắc nhở y tế theo thời gian thực.</p>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-semibold">
            {displayList.length} sự cố
          </span>
        </div>

        {displayList.length === 0 ? (
          <div className="text-center text-body-secondary py-5">
            <FaCheckCircle className="fs-1 mb-2 d-block mx-auto text-success" />
            <h6 className="fw-bold">Tất cả cảnh báo đã được xử lý an toàn</h6>
            <p className="small mb-0">Không còn sự cố nào tồn đọng cần can thiệp khẩn cấp.</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {displayList.map((alert) => {
              const itemType = (alert.alert_type || alert.type || "warning").toLowerCase();
              const config = alertTypeConfig[itemType] || alertTypeConfig.warning;
              const alertId = alert.alert_id || alert.id || alert.notification_id;
              const isResolved = alert.status === "RESOLVED" || alert.isRead;

              return (
                <div
                  className={`list-group-item px-4 py-3 ${isResolved ? "bg-body" : "bg-body-tertiary border-warning-subtle"}`}
                  key={alertId}
                  style={{
                    borderLeft: `4px solid ${
                      alert.severity === "CRITICAL" ? "#ef4444" : alert.severity === "WARNING" ? "#f59e0b" : "#3b82f6"
                    }`
                  }}
                >
                  <div className="d-flex align-items-start gap-3 flex-wrap flex-md-nowrap">
                    <div
                      className={`bg-${config.color} bg-opacity-10 text-${config.color} rounded-4 d-inline-flex align-items-center justify-content-center flex-shrink-0 fs-4`}
                      style={{ width: "48px", height: "48px" }}
                    >
                      {config.icon}
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-1">
                        <div>
                          {/* BADGE BỆNH NHÂN */}
                          <span className="badge bg-primary text-white me-2 px-2.5 py-1 rounded-pill">
                            <FaUser className="me-1" />
                            {alert.patient_name || alert.patient_id} ({alert.patient_code || alert.patient_id})
                          </span>

                          <span className={`badge bg-${config.color} me-2 px-2 py-1 rounded-pill`}>
                            {config.label}
                          </span>

                          <h3 className="h6 fw-bold mb-1 d-inline text-body">{alert.title}</h3>
                        </div>

                        {!isResolved ? (
                          <span className="badge bg-danger text-white px-3 py-1 rounded-pill">⚡ Chưa xử lý</span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill">
                            ✅ Đã ghi nhận
                          </span>
                        )}
                      </div>

                      <p className="text-body-secondary small mb-2">{alert.content || alert.message || alert.resolution_note}</p>

                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top border-secondary border-opacity-10">
                        <div className="d-flex align-items-center gap-3 text-body-secondary small flex-wrap">
                          <span className="d-flex align-items-center gap-1">
                            <FaClock className="text-primary" /> {alert.time || alert.alert_created_at || alert.created_at || "Gần đây"}
                          </span>
                          <span className="d-flex align-items-center gap-1">
                            <FaMapMarkerAlt className="text-danger" /> {alert.location || alert.room_number || "Phòng chăm sóc"}
                          </span>
                        </div>

                        <div className="d-flex gap-2">
                          {!isResolved && onMarkAsRead && (
                            <Button variant="outline-success" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => onMarkAsRead(alertId, "RESOLVED")}>
                              <FaCheck className="me-1" /> Xác nhận xử lý
                            </Button>
                          )}
                          {isResolved && onMarkAsRead && (
                            <Button variant="outline-warning" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => onMarkAsRead(alertId, "ALERTED")}>
                              <FaExclamationTriangle className="me-1" /> Chưa hoàn thành
                            </Button>
                          )}
                          {onDelete && (
                            <Button variant="outline-danger" size="sm" className="rounded-pill px-2.5" onClick={() => onDelete(alertId)}>
                              <FaTrash />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationList;
