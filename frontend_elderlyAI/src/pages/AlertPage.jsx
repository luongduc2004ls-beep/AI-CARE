// ==========================================================
// AlertPage.jsx
// Trang Trung tâm thông báo & Lịch sử cảnh báo đã xuất hiện
// Tích hợp trực tiếp Backend Flask API qua notificationService
// ==========================================================

import { useCallback, useEffect, useState } from "react";
import {
  FaBell,
  FaCheckDouble,
  FaExclamationTriangle,
  FaHeartbeat,
  FaHistory,
  FaList,
  FaPills,
  FaSpinner,
  FaUserInjured
} from "react-icons/fa";
import NotificationFilter from "../components/Notification/NotificationFilter";
import NotificationHistory from "../components/Notification/NotificationHistory";
import NotificationList from "../components/Notification/NotificationList";
import notificationService from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

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
    location: item.location || "Phòng Ngủ 101"
  };
};

function AlertPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  // ============================
  // State
  // ============================
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("history"); // 'active' hoặc 'history' (mặc định mở Lịch sử cảnh báo)
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
      setError("Không thể kết nối đến máy chủ. Đang hiển thị nhật ký cảnh báo từ bộ nhớ tạm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Phân luồng dữ liệu riêng biệt cho Admin vs Người Thân Cá Nhân
  const scopedAlerts = alerts.filter((alert) => {
    // Nếu là Quản trị viên (Admin) -> Xem toàn bộ cảnh báo hệ thống
    if (isAdmin) return true;

    // Nếu là Người Thân Gia Đình -> CHỈ xem cảnh báo của riêng Cụ Nguyễn Văn A (PAT00001)
    const patientCode = alert.patient_code || "";
    const titleLower = (alert.title || "").toLowerCase();
    const contentLower = (alert.content || "").toLowerCase();
    const locLower = (alert.location || "").toLowerCase();

    // 1. Kiểm tra mã định danh bệnh nhân nếu có
    if (patientCode && patientCode !== "PAT00001") {
      return false;
    }

    // 2. Loại bỏ thông báo thuộc về bệnh nhân khác (Cụ B, Cụ C)
    if (
      titleLower.includes("trần thị b") || contentLower.includes("trần thị b") ||
      titleLower.includes("lê văn c") || contentLower.includes("lê văn c") ||
      patientCode === "PAT00002" || patientCode === "PAT00003"
    ) {
      return false;
    }

    // 3. Chỉ giữ lại cảnh báo thuộc về người thân cá nhân
    return (
      titleLower.includes("nguyễn văn a") ||
      contentLower.includes("nguyễn văn a") ||
      locLower.includes("phòng ngủ 101") ||
      locLower.includes("phòng ăn") ||
      locLower.includes("phòng khách") ||
      patientCode === "PAT00001" ||
      !patientCode
    );
  });

  // ============================
  // Handlers cho các thao tác
  // ============================
  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          (alert.notification_id || alert.id) === id ? { ...alert, isRead: true, is_read: true } : alert
        )
      );
    } catch (err) {
      console.error("Lỗi khi đánh dấu thông báo đã đọc:", err);
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          (alert.notification_id || alert.id) === id ? { ...alert, isRead: true, is_read: true } : alert
        )
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) => ({ ...alert, isRead: true, is_read: true }))
      );
    } catch (err) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", err);
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) => ({ ...alert, isRead: true, is_read: true }))
      );
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa bản ghi cảnh báo này khỏi lịch sử?");
    if (!confirmDelete) return;

    try {
      await notificationService.delete(id);
      setAlerts((previousAlerts) =>
        previousAlerts.filter((alert) => (alert.notification_id || alert.id) !== id)
      );
    } catch (err) {
      console.error("Lỗi khi xóa thông báo:", err);
      setAlerts((previousAlerts) =>
        previousAlerts.filter((alert) => (alert.notification_id || alert.id) !== id)
      );
    }
  };

  // ============================
  // Thống kê số lượng theo phân luồng dữ liệu
  // ============================
  const totalCount = scopedAlerts.length;
  const unreadCount = scopedAlerts.filter((alert) => !alert.isRead).length;
  const fallCount = scopedAlerts.filter((alert) => alert.type === "fall").length;
  const healthMedicineCount = scopedAlerts.filter((alert) => alert.type === "health" || alert.type === "medicine").length;

  // Lọc dữ liệu hiển thị cho Tab Cảnh báo hiện tại
  const filteredActiveAlerts = scopedAlerts.filter((alert) => {
    const matchesType = selectedType === "all" || alert.type === selectedType;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "read" && alert.isRead) ||
      (selectedStatus === "unread" && !alert.isRead);

    return matchesType && matchesStatus;
  });

  return (
    <section className="container-fluid px-3 px-md-4 py-4">
      {/* Header chính */}
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-4">
            <FaBell className="fs-2" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className={`badge ${isAdmin ? "bg-warning text-dark" : "bg-primary text-white"} fw-bold px-3 py-1 rounded-pill`}>
                {isAdmin ? "🛡️ Tất cả cảnh báo hệ thống (Quyền Admin)" : "🔒 Cảnh báo cá nhân gia đình: Cụ Nguyễn Văn A (PAT00001)"}
              </span>
            </div>
            <h1 className="h3 fw-bold mb-1 text-body">{isAdmin ? "Trung Tâm Cảnh Báo Quản Trị Hệ Thống" : "Nhật Ký & Cảnh Báo Cá Nhân Người Thân"}</h1>
            <p className="text-body-secondary mb-0">
              {isAdmin
                ? "Theo dõi toàn bộ lịch sử cảnh báo sự cố, té ngã và sinh hiệu của tất cả người cao tuổi."
                : "Nhật ký cảnh báo sự cố té ngã, theo dõi sinh hiệu & lịch uống thuốc dành riêng cho người thân gia đình."}
            </p>
          </div>
        </div>

        <div className="d-flex gap-2">
          {unreadCount > 0 && (
            <button
              className="btn btn-outline-success rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold"
              onClick={handleMarkAllAsRead}
            >
              <FaCheckDouble /> Đánh dấu tất cả đã đọc
            </button>
          )}
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill d-flex align-items-center fs-6 fw-bold">
            {unreadCount} chưa đọc
          </span>
        </div>
      </div>

      {/* Thẻ thống kê tổng quan */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                <FaHistory className="fs-4" />
              </div>
              <div>
                <span className="text-muted small fw-semibold">Tổng số cảnh báo</span>
                <h3 className="h4 fw-bold mb-0 text-dark">{totalCount}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-3">
                <FaUserInjured className="fs-4" />
              </div>
              <div>
                <span className="text-muted small fw-semibold">Sự cố Té ngã AI</span>
                <h3 className="h4 fw-bold mb-0 text-danger">{fallCount}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div className="p-3 bg-warning bg-opacity-10 text-warning-emphasis rounded-3">
                <FaHeartbeat className="fs-4" />
              </div>
              <div>
                <span className="text-muted small fw-semibold">Chỉ số Sức khỏe & Thuốc</span>
                <h3 className="h4 fw-bold mb-0 text-dark">{healthMedicineCount}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-3">
                <FaPills className="fs-4" />
              </div>
              <div>
                <span className="text-muted small fw-semibold">Cảnh báo chưa xử lý</span>
                <h3 className="h4 fw-bold mb-0 text-primary">{unreadCount}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning d-flex align-items-center gap-2 rounded-3 mb-4">
          <FaExclamationTriangle className="fs-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-warning">
          <FaSpinner className="spinner-border spinner-border-sm me-2" role="status" />
          <span>Đang đồng bộ dữ liệu cảnh báo từ máy chủ...</span>
        </div>
      )}

      {/* Tabs Chuyển đổi giao diện */}
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2 flex-wrap gap-2">
        <ul className="nav nav-pills bg-light p-1 rounded-pill">
          <li className="nav-item">
            <button
              className={`nav-item btn btn-sm rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 ${
                activeTab === "history" ? "btn-primary shadow-sm" : "text-secondary"
              }`}
              onClick={() => setActiveTab("history")}
            >
              <FaHistory /> Lịch sử cảnh báo đã xuất hiện
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-item btn btn-sm rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 ${
                activeTab === "active" ? "btn-primary shadow-sm" : "text-secondary"
              }`}
              onClick={() => setActiveTab("active")}
            >
              <FaList /> Danh sách cần xử lý
            </button>
          </li>
        </ul>
      </div>

      {/* Nội dung Tab */}
      {activeTab === "history" ? (
        <NotificationHistory
          historyList={scopedAlerts}
          onMarkAsRead={handleMarkAsRead}
          onDelete={handleDelete}
        />
      ) : (
        <div>
          <div className="mb-4">
            <NotificationFilter
              selectedType={selectedType}
              selectedStatus={selectedStatus}
              onTypeChange={setSelectedType}
              onStatusChange={setSelectedStatus}
            />
          </div>

          <NotificationList
            alerts={filteredActiveAlerts}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        </div>
      )}
    </section>
  );
}

export default AlertPage;
