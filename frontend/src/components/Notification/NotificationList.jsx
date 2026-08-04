// ============================
// Imports
// ============================

import { Button } from "react-bootstrap";
import {
  FaBell,
  FaCheck,
  FaExclamationTriangle,
  FaHeartbeat,
  FaPills,
  FaTrash,
  FaUserInjured,
} from "react-icons/fa";

// Cấu hình icon và màu sắc theo từng loại cảnh báo.
const alertTypeConfig = {
  medicine: { icon: <FaPills />, color: "primary" },
  health: { icon: <FaHeartbeat />, color: "danger" },
  fall: { icon: <FaUserInjured />, color: "danger" },
  warning: { icon: <FaExclamationTriangle />, color: "warning" },
};

function NotificationList({ alerts = [], onMarkAsRead, onDelete }) {
  // ============================
  // Render
  // ============================

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-0">
        <div className="d-flex align-items-center justify-content-between gap-3 p-4 pb-3 flex-wrap">
          <div>
            <h2 className="h5 fw-bold mb-1">Danh sách cảnh báo</h2>
            <p className="text-muted small mb-0">Các thông báo cần được theo dõi và xử lý.</p>
          </div>
          <span className="badge text-bg-light border text-secondary">{alerts.length} cảnh báo</span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center text-muted py-5">
            <FaBell className="fs-2 mb-3 d-block mx-auto" />
            Hiện chưa có cảnh báo nào.
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {alerts.map((alert) => {
              const config = alertTypeConfig[alert.type] || alertTypeConfig.warning;

              return (
                <div className={`list-group-item px-4 py-3 ${alert.isRead ? "" : "bg-light"}`} key={alert.id}>
                  <div className="d-flex align-items-start gap-3">
                    <div className={`bg-${config.color} bg-opacity-10 text-${config.color} rounded-3 d-inline-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: "44px", height: "44px" }}>
                      {config.icon}
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
                        <div>
                          <h3 className="h6 fw-bold mb-1">{alert.title}</h3>
                          <p className="text-muted mb-1">{alert.content}</p>
                          <small className="text-secondary">{alert.time}</small>
                        </div>
                        {!alert.isRead && <span className={`badge text-bg-${config.color}`}>Chưa đọc</span>}
                      </div>

                      <div className="d-flex gap-2 mt-3">
                        {!alert.isRead && (
                          <Button variant="outline-success" size="sm" onClick={() => onMarkAsRead?.(alert.id)}>
                            <FaCheck className="me-1" />Đã đọc
                          </Button>
                        )}
                        <Button variant="outline-danger" size="sm" onClick={() => onDelete?.(alert.id)}>
                          <FaTrash className="me-1" />Xóa
                        </Button>
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
