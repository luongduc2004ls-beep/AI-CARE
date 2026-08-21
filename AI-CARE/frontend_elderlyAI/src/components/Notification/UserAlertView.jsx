// ==============================================================================
// UserAlertView.jsx
// Giao diện Nhật Ký Cảnh Báo An Toàn Dành Riêng Cho Người Thân / Gia Đình (User)
// Đảm bảo phân lập 100% dữ liệu: Chỉ hiển thị người thân được phân quyền
// ==============================================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  FaExclamationTriangle,
  FaHeartbeat,
  FaPills,
  FaUserInjured,
  FaShieldAlt,
  FaCheckCircle,
  FaSpinner,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaPhoneAlt,
  FaSearch
} from "react-icons/fa";
import alertService from "../../services/alertService";
import { useAuth } from "../../context/AuthContext";
import { usePatient } from "../../context/PatientContext";

export default function UserAlertView() {
  const { currentUser } = useAuth();
  const { selectedPatient, patientCode } = usePatient();

  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, fall_count: 0, health_count: 0, pending_count: 0, resolved_count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activePatientName = selectedPatient?.name || selectedPatient?.full_name || currentUser?.full_name || "Người thân";
  const activePatientCode = patientCode || selectedPatient?.patient_code || currentUser?.patient_code || "PAT10000";

  const loadUserAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Tải danh sách cảnh báo của người thân qua API bảo mật
      const res = await alertService.userGetMyAlerts({
        alert_type: filterType !== "all" ? filterType : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined
      });
      const dataList = Array.isArray(res) ? res : (res?.data || []);
      setAlerts(dataList);

      // 2. Tải số liệu thống kê an toàn của người thân
      const statsRes = await alertService.userGetStats();
      const statsObj = statsRes?.stats || statsRes || {};
      setStats({
        total: statsObj.total || dataList.length,
        fall_count: statsObj.fall_count || dataList.filter(a => a.alert_type === "FALL" || a.type === "fall").length,
        health_count: statsObj.health_count || dataList.filter(a => a.alert_type === "HEALTH" || a.alert_type === "MEDICATION").length,
        pending_count: statsObj.pending_count || dataList.filter(a => a.status !== "RESOLVED").length,
        resolved_count: statsObj.resolved_count || dataList.filter(a => a.status === "RESOLVED").length
      });
    } catch (err) {
      console.error("Lỗi khi tải cảnh báo người thân:", err);
      setError(err?.response?.data?.message || err.message || "Không thể tải cảnh báo người thân.");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  const handleUpdateStatus = async (alertId, newStatus) => {
    try {
      await alertService.userUpdateAlertStatus(alertId, {
        status: newStatus,
        operator_name: currentUser?.full_name || "Người thân",
        note: newStatus === "RESOLVED" ? "Đã kiểm tra an toàn và xử lý xong" : "Đã mở lại cảnh báo cần theo dõi tiếp"
      });
      await loadUserAlerts();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái cảnh báo:", err);
      alert("Không thể cập nhật trạng thái cảnh báo.");
    }
  };

  useEffect(() => {
    loadUserAlerts();
  }, [loadUserAlerts]);

  const getAlertIcon = (type) => {
    switch ((type || "").toUpperCase()) {
      case "FALL":
        return <FaUserInjured className="text-danger fs-4" />;
      case "HEALTH":
        return <FaHeartbeat className="text-warning fs-4" />;
      case "MEDICATION":
        return <FaPills className="text-info fs-4" />;
      default:
        return <FaExclamationTriangle className="text-warning fs-4" />;
    }
  };

  const getSeverityBadge = (severity) => {
    switch ((severity || "").toUpperCase()) {
      case "CRITICAL":
        return <span className="badge bg-danger px-2.5 py-1.5 rounded-pill">🚨 Khẩn cấp</span>;
      case "WARNING":
      case "HIGH":
        return <span className="badge bg-warning text-dark px-2.5 py-1.5 rounded-pill">⚠️ Cảnh báo</span>;
      default:
        return <span className="badge bg-info text-dark px-2.5 py-1.5 rounded-pill">ℹ️ Thông tin</span>;
    }
  };

  const filteredAlerts = alerts.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (item.title || "").toLowerCase().includes(q);
    const msgMatch = (item.message || item.content || item.resolution_note || "").toLowerCase().includes(q);
    const locMatch = (item.location || item.room_number || "").toLowerCase().includes(q);
    return titleMatch || msgMatch || locMatch;
  });

  return (
    <div className="user-alert-container py-3">
      {/* Header Banner Người Thân */}
      <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fff" }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-danger bg-opacity-20 text-danger rounded-4">
                <FaShieldAlt className="fs-2 text-danger" />
              </div>
              <div>
                <span className="badge bg-primary px-3 py-1 rounded-pill fw-bold mb-1">
                  🔒 Cảnh báo riêng cho: {activePatientName} ({activePatientCode})
                </span>
                <h2 className="h4 fw-bold mb-1 text-white">Trung Tâm Cảnh Báo An Toàn Gia Đình</h2>
                <p className="text-secondary small mb-0">
                  Hệ thống camera AI &amp; cảm biến tự động gửi cảnh báo thời gian thực khi có sự cố.
                </p>
              </div>
            </div>

            <div className="d-flex gap-2">
              <span className="badge bg-danger text-white d-flex align-items-center px-3 py-2 fs-6 rounded-pill">
                {stats.pending_count} chưa xử lý
              </span>
              <span className="badge bg-success text-white d-flex align-items-center px-3 py-2 fs-6 rounded-pill">
                {stats.resolved_count} đã an toàn
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 text-white" style={{ background: "rgba(30, 41, 59, 0.7)" }}>
            <span className="text-secondary small">Tổng số cảnh báo</span>
            <h3 className="fw-bold mb-0 mt-1">{stats.total}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 text-white" style={{ background: "rgba(30, 41, 59, 0.7)" }}>
            <span className="text-secondary small">Té ngã camera AI</span>
            <h3 className="fw-bold mb-0 mt-1 text-danger">{stats.fall_count}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 text-white" style={{ background: "rgba(30, 41, 59, 0.7)" }}>
            <span className="text-secondary small">Cần can thiệp</span>
            <h3 className="fw-bold mb-0 mt-1 text-warning">{stats.pending_count}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 text-white" style={{ background: "rgba(30, 41, 59, 0.7)" }}>
            <span className="text-secondary small">Đã an toàn</span>
            <h3 className="fw-bold mb-0 mt-1 text-success">{stats.resolved_count}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ background: "rgba(30, 41, 59, 0.6)" }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-dark border-0 text-secondary">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control bg-dark border-0 text-white"
                  placeholder="Tìm theo tiêu đề, địa điểm phòng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-4">
              <select
                className="form-select bg-dark border-0 text-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">🔍 Tất cả loại cảnh báo</option>
                <option value="FALL">🚨 Té ngã khẩn cấp</option>
                <option value="HEALTH">❤️ Sức khỏe & Sinh hiệu</option>
                <option value="MEDICATION">💊 Uống thuốc</option>
                <option value="ABNORMAL_MOVEMENT">⚠️ Bất thường vận động</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select bg-dark border-0 text-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">⚡ Tất cả trạng thái</option>
                <option value="ALERTED">🔴 Chưa xử lý</option>
                <option value="ACKNOWLEDGED">🟡 Đang theo dõi</option>
                <option value="RESOLVED">🟢 Đã xử lý an toàn</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger rounded-4 mb-3 d-flex align-items-center gap-2">
          <FaExclamationTriangle className="fs-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Alert List */}
      <div className="card border-0 shadow-sm rounded-4" style={{ background: "rgba(30, 41, 59, 0.6)" }}>
        <div className="card-body p-3 p-md-4">
          {loading ? (
            <div className="text-center py-5 text-secondary">
              <FaSpinner className="fa-spin fs-2 mb-2 text-primary" />
              <p className="mb-0">Đang tải cảnh báo an toàn...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <FaCheckCircle className="fs-1 text-success mb-2" />
              <h5 className="text-white fw-bold">Hiện không có cảnh báo nào phù hợp</h5>
              <p className="small mb-0">Hệ thống giám sát AI 24/7 ghi nhận tình trạng an toàn cho {activePatientName}.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredAlerts.map((item) => {
                const alertId = item.alert_id || item.id;
                const isResolved = item.status === "RESOLVED";

                return (
                  <div
                    key={alertId}
                    className="card border-0 rounded-3 p-3 text-white"
                    style={{
                      background: item.severity === "CRITICAL" ? "rgba(239, 68, 68, 0.12)" : "rgba(15, 23, 42, 0.6)",
                      borderLeft: `4px solid ${item.severity === "CRITICAL" ? "#ef4444" : "#3b82f6"}`
                    }}
                  >
                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                      <div className="d-flex align-items-start gap-3 flex-grow-1">
                        <div className="p-3 rounded-circle mt-1" style={{ background: "rgba(255, 255, 255, 0.08)" }}>
                          {getAlertIcon(item.alert_type || item.type)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-1">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              {getSeverityBadge(item.severity)}
                              <span className={`badge ${isResolved ? "bg-success-subtle text-success border border-success-subtle" : "bg-danger text-white"} px-2.5 py-1 rounded`}>
                                {isResolved ? "✅ Đã xử lý an toàn" : item.status === "ACKNOWLEDGED" ? "👁️ Đang theo dõi" : "⚡ Chưa xử lý"}
                              </span>
                            </div>

                            {/* Nút hành động đánh dấu trạng thái */}
                            <div className="d-flex align-items-center gap-2">
                              {isResolved ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 d-flex align-items-center gap-1 fw-semibold"
                                  onClick={() => handleUpdateStatus(alertId, "ALERTED")}
                                >
                                  <FaExclamationTriangle className="text-warning" /> Đánh dấu chưa hoàn thành
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success rounded-pill px-3 py-1 d-flex align-items-center gap-1 fw-bold text-white shadow-sm"
                                    onClick={() => handleUpdateStatus(alertId, "RESOLVED")}
                                  >
                                    <FaCheckCircle /> Đã xử lý an toàn
                                  </button>
                                  {item.status !== "ACKNOWLEDGED" && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-1 d-flex align-items-center gap-1"
                                      onClick={() => handleUpdateStatus(alertId, "ACKNOWLEDGED")}
                                    >
                                      Đang theo dõi
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <h5 className="fw-bold mb-1 text-white">{item.title}</h5>
                          <p className="text-secondary small mb-2">{item.message || item.content || item.resolution_note || "Hệ thống AI ghi nhận sự cố an toàn."}</p>
                          
                          {/* Thông tin Bệnh nhân rõ ràng */}
                          <div className="d-flex align-items-center justify-content-between gap-3 text-secondary small flex-wrap pt-2 border-top border-secondary border-opacity-25">
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              <span className="d-flex align-items-center gap-1 text-info fw-medium">
                                <FaUser className="text-info" /> {item.patient_name || activePatientName} ({item.patient_code || activePatientCode})
                              </span>
                              <span className="d-flex align-items-center gap-1">
                                <FaClock className="text-primary" /> {item.alert_created_at || item.created_at || item.time}
                              </span>
                              <span className="d-flex align-items-center gap-1">
                                <FaMapMarkerAlt className="text-danger" /> {item.location || item.room_number || "Phòng chăm sóc"}
                              </span>
                              {item.caregiver_name && (
                                <span className="d-flex align-items-center gap-1 text-secondary">
                                  <FaPhoneAlt className="text-success" /> Người thân: {item.caregiver_name} ({item.caregiver_phone})
                                </span>
                              )}
                            </div>
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
    </div>
  );
}
