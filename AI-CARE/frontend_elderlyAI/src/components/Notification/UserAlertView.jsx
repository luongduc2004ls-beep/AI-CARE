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
              <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ background: "rgba(59, 130, 246, 0.2)", width: "56px", height: "56px" }}>
                <FaShieldAlt className="text-primary fs-3" />
              </div>
              <div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill mb-1">
                  🛡️ Cảnh Báo An Toàn Người Thân
                </span>
                <h3 className="h4 fw-bold mb-0 text-white">
                  Nhật Ký Cảnh Báo & Giám Sát: {activePatientName} ({activePatientCode})
                </h3>
                <p className="text-secondary small mb-0 mt-1">
                  Theo dõi trực tiếp mọi cảnh báo té ngã, nhắc nhở thuốc và sinh hiệu của người thân trong gia đình.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button onClick={loadUserAlerts} className="btn btn-outline-light btn-sm rounded-pill px-3 py-2" disabled={loading}>
                {loading ? <FaSpinner className="fa-spin me-1" /> : "🔄 Làm mới dữ liệu"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Người Thân */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: "rgba(30, 41, 59, 0.7)", borderLeft: "4px solid #3b82f6" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Tổng Cảnh Báo</span>
                <h3 className="fw-bold mb-0 mt-1 text-white">{stats.total}</h3>
              </div>
              <div className="rounded-circle p-3" style={{ background: "rgba(59, 130, 246, 0.15)" }}>
                <FaShieldAlt className="text-primary fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: "rgba(30, 41, 59, 0.7)", borderLeft: "4px solid #ef4444" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Sự Cố Té Ngã AI</span>
                <h3 className="fw-bold mb-0 mt-1 text-danger">{stats.fall_count}</h3>
              </div>
              <div className="rounded-circle p-3" style={{ background: "rgba(239, 68, 68, 0.15)" }}>
                <FaUserInjured className="text-danger fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: "rgba(30, 41, 59, 0.7)", borderLeft: "4px solid #f59e0b" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Chỉ Số Sức Khỏe & Thuốc</span>
                <h3 className="fw-bold mb-0 mt-1 text-warning">{stats.health_count}</h3>
              </div>
              <div className="rounded-circle p-3" style={{ background: "rgba(245, 158, 11, 0.15)" }}>
                <FaHeartbeat className="text-warning fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: "rgba(30, 41, 59, 0.7)", borderLeft: "4px solid #10b981" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Đã Xử Lý / An Toàn</span>
                <h3 className="fw-bold mb-0 mt-1 text-success">{stats.resolved_count || 0}</h3>
              </div>
              <div className="rounded-circle p-3" style={{ background: "rgba(16, 185, 129, 0.15)" }}>
                <FaCheckCircle className="text-success fs-4" />
              </div>
            </div>
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
              {filteredAlerts.map((item) => (
                <div
                  key={item.alert_id || item.id}
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
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          {getSeverityBadge(item.severity)}
                          <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded">
                            {item.status === "RESOLVED" ? "✅ Đã xử lý an toàn" : item.status === "ACKNOWLEDGED" ? "👁️ Đang theo dõi" : "⚡ Chưa xử lý"}
                          </span>
                        </div>
                        
                        <h5 className="fw-bold mb-1 text-white">{item.title}</h5>
                        <p className="text-secondary small mb-2">{item.message || item.content || item.resolution_note || "Hệ thống AI ghi nhận sự cố an toàn."}</p>
                        
                        {/* Thông tin Bệnh nhân rõ ràng */}
                        <div className="d-flex align-items-center gap-3 text-secondary small flex-wrap pt-2 border-top border-secondary border-opacity-25">
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
