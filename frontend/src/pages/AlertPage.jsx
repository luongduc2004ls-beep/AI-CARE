// ==========================================================
// AlertPage.jsx
// Trang Trung tâm thông báo và Cảnh báo sức khỏe
// Tích hợp trực tiếp Backend Flask API qua notificationService
// ==========================================================

import { useCallback, useEffect, useState } from "react";
import { FaBell, FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import NotificationFilter from "../components/Notification/NotificationFilter";
import NotificationList from "../components/Notification/NotificationList";
import notificationService from "../services/notificationService";

/**
 * Chuẩn hóa đối tượng thông báo từ Backend API Flask
 */
const normalizeNotification = (item) => {
  if (!item) return null;
  return {
    ...item,
    id: item.notification_id || item.id,
    notification_id: item.notification_id || item.id,
    title: item.title || "Thông báo",
    content: item.message || item.content || "",
    type: item.type || "warning",
    isRead: Boolean(item.is_read !== undefined ? item.is_read : item.isRead),
    time: item.created_at || item.time || "Gần đây",
  };
};

function AlertPage() {
  // ============================
  // State
  // ============================

  const [alerts, setAlerts] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Tải danh sách thông báo từ API Backend
  // ============================

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getAll();
      const normalizedData = (data || []).map(normalizeNotification);
      setAlerts(normalizedData);
    } catch (err) {
      console.error("Lỗi khi tải thông báo từ máy chủ:", err);
      setError(err.message || "Không thể nạp danh sách cảnh báo từ cơ sở dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ============================
  // Handlers cho các thao tác
  // ============================

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          (alert.notification_id || alert.id) === id ? { ...alert, isRead: true, is_read: true } : alert,
        ),
      );
    } catch (err) {
      console.error("Lỗi khi đánh dấu thông báo đã đọc:", err);
      alert(err.message || "Không thể cập nhật trạng thái thông báo.");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa thông báo này?");
    if (!confirmDelete) return;

    try {
      await notificationService.delete(id);
      setAlerts((previousAlerts) =>
        previousAlerts.filter((alert) => (alert.notification_id || alert.id) !== id),
      );
    } catch (err) {
      console.error("Lỗi khi xóa thông báo:", err);
      alert(err.message || "Không thể xóa thông báo.");
    }
  };

  // ============================
  // Lọc dữ liệu hiển thị
  // ============================

  const filteredAlerts = alerts.filter((alert) => {
    const matchesType = selectedType === "all" || alert.type === selectedType;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "read" && alert.isRead) ||
      (selectedStatus === "unread" && !alert.isRead);

    return matchesType && matchesStatus;
  });

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  // ============================
  // Render Interface
  // ============================

  return (
    <section className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-4">
        <div className="d-flex align-items-start gap-3">
          <div className="bg-warning bg-opacity-10 text-warning rounded-3 p-3">
            <FaBell className="fs-3" />
          </div>
          <div>
            <p className="text-warning-emphasis fw-semibold mb-1">Trung tâm cảnh báo</p>
            <h1 className="h3 fw-bold mb-2">Cảnh báo sức khỏe</h1>
            <p className="text-muted mb-0">Theo dõi các cảnh báo thuốc, sức khỏe và an toàn.</p>
          </div>
        </div>

        <span className="badge text-bg-warning px-3 py-2">{unreadCount} cảnh báo chưa đọc</span>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4">
          <FaExclamationTriangle className="fs-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-warning">
          <FaSpinner className="spinner-border spinner-border-sm me-2" role="status" />
          <span>Đang nạp thông báo từ máy chủ...</span>
        </div>
      )}

      <div className="mb-4">
        <NotificationFilter
          selectedType={selectedType}
          selectedStatus={selectedStatus}
          onTypeChange={setSelectedType}
          onStatusChange={setSelectedStatus}
        />
      </div>

      <NotificationList
        alerts={filteredAlerts}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />
    </section>
  );
}

export default AlertPage;
