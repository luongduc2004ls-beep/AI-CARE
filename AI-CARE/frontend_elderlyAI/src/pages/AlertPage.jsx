// ==========================================================
// AlertPage.jsx
// Trang Trung tâm thông báo & Lịch sử cảnh báo
// Phân Tách Hoàn Toàn: Admin Alert Log vs User Alert Log
// ==========================================================

import React, { useCallback, useEffect, useState } from "react";
import {
  FaBell,
  FaCheckDouble,
  FaExclamationTriangle,
  FaHeartbeat,
  FaHistory,
  FaList,
  FaPills,
  FaSpinner,
  FaUserInjured,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt
} from "react-icons/fa";
import NotificationFilter from "../components/Notification/NotificationFilter";
import NotificationHistory from "../components/Notification/NotificationHistory";
import NotificationList from "../components/Notification/NotificationList";
import UserAlertView from "../components/Notification/UserAlertView";
import alertService from "../services/alertService";
import notificationService from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

/**
 * Chuẩn hóa đối tượng thông báo từ Backend API Flask
 */
const normalizeNotification = (item) => {
  if (!item) return null;
  return {
    ...item,
    id: item.alert_id || item.notification_id || item.id,
    alert_id: item.alert_id || item.notification_id || item.id,
    title: item.title || "Thông báo an toàn",
    content: item.message || item.content || item.resolution_note || "",
    type: item.alert_type ? item.alert_type.toLowerCase() : (item.type || "warning"),
    isRead: Boolean(item.status === "RESOLVED" || item.is_read || item.isRead),
    time: item.alert_created_at || item.created_at || item.time || "Gần đây",
    location: item.location || item.room_number || "Phòng chăm sóc",
    patient_name: item.patient_name || item.name || item.patient_id || "Người cao tuổi",
    patient_code: item.patient_code || item.patient_id || "PAT10000",
    age: item.age || 70,
    gender: item.gender || "Nam",
    caregiver_name: item.caregiver_name,
    caregiver_phone: item.caregiver_phone,
    severity: item.severity || "CRITICAL",
    status: item.status || "ALERTED"
  };
};

function AlertPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  // NẾU LÀ NGƯỜI THÂN / CAREGIVER: Hiển thị giao diện phân lập an toàn 100%
  if (!isAdmin) {
    return (
      <section className="container-fluid px-3 px-md-4 py-3">
        <UserAlertView />
      </section>
    );
  }

  // ============================
  // ADMIN STATE & HANDLERS
  // ============================
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, fall_count: 0, health_count: 0, pending_count: 0, resolved_count: 0 });
  const [activeTab, setActiveTab] = useState("history"); // 'active' hoặc 'history'
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAdminAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Tải danh sách cảnh báo toàn viện (hỗ trợ toàn bộ 1000+ bệnh nhân)
      const res = await alertService.adminGetAlerts({
        limit: 1000,
        alert_type: selectedType !== "all" ? selectedType : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      const normalizedData = (data || []).map(normalizeNotification).filter(Boolean);
      setAlerts(normalizedData);

      // 2. Tải số liệu KPI toàn hệ thống
      const statsRes = await alertService.adminGetStats();
      const statsObj = statsRes?.stats || statsRes || {};
      setStats({
        total: statsObj.total || normalizedData.length,
        fall_count: statsObj.fall_count || normalizedData.filter(a => a.type === "fall").length,
        health_count: statsObj.health_count || normalizedData.filter(a => a.type === "health" || a.type === "medicine").length,
        pending_count: statsObj.pending_count || normalizedData.filter(a => !a.isRead).length,
        resolved_count: statsObj.resolved_count || normalizedData.filter(a => a.isRead).length
      });
    } catch (err) {
      console.error("Lỗi khi tải cảnh báo toàn hệ thống:", err);
      setError("Không thể kết nối đến máy chủ cơ sở dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedStatus]);

  useEffect(() => {
    loadAdminAlerts();
  }, [loadAdminAlerts]);

  const handleResolveAlert = async (id) => {
    try {
      await alertService.adminUpdateAlertStatus(id, {
        status: "RESOLVED",
        operator_name: currentUser?.full_name || "Admin",
        note: "Đã kiểm tra an toàn và xử lý xong"
      });
      await loadAdminAlerts();
    } catch (err) {
      console.error("Lỗi khi giải quyết cảnh báo:", err);
      alert("Không thể cập nhật trạng thái cảnh báo.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadAdminAlerts();
    } catch (err) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa bản ghi cảnh báo này khỏi lịch sử?");
    if (!confirmDelete) return;

    try {
      await notificationService.delete(id);
      setAlerts((prev) => prev.filter((a) => (a.alert_id || a.id) !== id));
    } catch (err) {
      console.error("Lỗi khi xóa thông báo:", err);
    }
  };

  const totalCount = stats.total || alerts.length;
  const fallCount = stats.fall_count || alerts.filter((a) => a.type === "fall").length;
  const healthMedicineCount = stats.health_count || alerts.filter((a) => a.type === "health" || a.type === "medicine").length;
  const pendingCount = stats.pending_count || alerts.filter((a) => !a.isRead).length;

  const filteredActiveAlerts = alerts.filter((alert) => {
    const matchesType = selectedType === "all" || alert.type === selectedType;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "read" && alert.isRead) ||
      (selectedStatus === "unread" && !alert.isRead);

    return matchesType && matchesStatus;
  });

  return (
    <section className="container-fluid px-3 px-md-4 py-4">
      {/* Header chính Admin */}
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-4">
            <FaBell className="fs-2" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill">
                🛡️ Tất cả cảnh báo hệ thống (Quyền Admin)
              </span>
            </div>
            <h1 className="h3 fw-bold mb-1 text-body">Trung Tâm Cảnh Báo Quản Trị Hệ Thống</h1>
            <p className="text-body-secondary mb-0">
              Theo dõi toàn bộ lịch sử cảnh báo sự cố, té ngã và sinh hiệu của tất cả người cao tuổi trong toàn viện.
            </p>
          </div>
        </div>

        <div className="d-flex gap-2">
          {pendingCount > 0 && (
            <button
              className="btn btn-outline-success rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold"
              onClick={handleMarkAllAsRead}
            >
              <FaCheckDouble />
              Đánh dấu tất cả đã xử lý
            </button>
          )}
          <span className="badge bg-warning text-dark d-flex align-items-center px-3 py-2 fs-6 rounded-pill">
            {pendingCount} chưa xử lý
          </span>
        </div>
      </div>

      {/* Thẻ thống kê KPI tổng quan Admin */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-body">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-body-secondary small fw-medium">Tổng số cảnh báo</span>
                <h3 className="fw-bold mb-0 mt-1">{totalCount}</h3>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 rounded-circle text-primary">
                <FaHistory className="fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-body">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-body-secondary small fw-medium">Sự cố Té ngã AI</span>
                <h3 className="fw-bold mb-0 mt-1 text-danger">{fallCount}</h3>
              </div>
              <div className="p-3 bg-danger bg-opacity-10 rounded-circle text-danger">
                <FaUserInjured className="fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-body">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-body-secondary small fw-medium">Chỉ số Sức khỏe & Thuốc</span>
                <h3 className="fw-bold mb-0 mt-1 text-warning">{healthMedicineCount}</h3>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 rounded-circle text-warning">
                <FaHeartbeat className="fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-body">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-body-secondary small fw-medium">Cảnh báo chưa xử lý</span>
                <h3 className="fw-bold mb-0 mt-1 text-info">{pendingCount}</h3>
              </div>
              <div className="p-3 bg-info bg-opacity-10 rounded-circle text-info">
                <FaPills className="fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="alert alert-warning border-0 rounded-4 mb-4 d-flex align-items-center gap-2">
          <FaExclamationTriangle className="text-warning fs-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Bộ chọn Tab Điều hướng Admin */}
      <div className="d-flex gap-2 mb-4 border-bottom pb-2">
        <button
          className={`btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold ${
            activeTab === "history" ? "btn-primary" : "btn-outline-secondary"
          }`}
          onClick={() => setActiveTab("history")}
        >
          <FaHistory />
          Lịch sử cảnh báo đã xuất hiện
        </button>
        <button
          className={`btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold ${
            activeTab === "active" ? "btn-primary" : "btn-outline-secondary"
          }`}
          onClick={() => setActiveTab("active")}
        >
          <FaList />
          Danh sách cần xử lý
        </button>
      </div>

      {/* Nội dung theo Tab đang chọn */}
      {loading ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-body">
          <FaSpinner className="fa-spin fs-1 text-primary mb-3 mx-auto" />
          <p className="text-body-secondary mb-0">Đang tải dữ liệu cảnh báo từ máy chủ...</p>
        </div>
      ) : activeTab === "history" ? (
        <NotificationHistory
          notifications={alerts}
          historyList={alerts}
          onMarkAsRead={handleResolveAlert}
          onDelete={handleDelete}
        />
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-body">
          <NotificationFilter
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
          <div className="mt-3">
            <NotificationList
              notifications={filteredActiveAlerts}
              onMarkAsRead={handleResolveAlert}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default AlertPage;
