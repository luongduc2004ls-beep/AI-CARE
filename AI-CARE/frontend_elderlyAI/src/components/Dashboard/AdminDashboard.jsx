import React, { useCallback, useEffect, useState } from "react";
import { FaSpinner, FaExclamationTriangle, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import dashboardService from "../../services/dashboardService";
import KpiCard from "./KpiCard";
import AlertCenter from "./AlertCenter";
import PatientSafetyOverview from "./PatientSafetyOverview";
import AnalyticsChart from "./AnalyticsChart";
import ActivityTimeline from "./ActivityTimeline";

function AdminDashboard() {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState({
    total_patients: 1008,
    total_medicines: 300,
    total_health_records: 2002,
    unread_notifications: 3,
    low_stock_medicines: 0,
    expired_medicines: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getSummary();
      if (data) setSummary((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tổng quan Admin Dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="container-fluid py-4 px-4">
      {/* Admin Command Center Title */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-1">
            <FaShieldAlt />
            <span className="small text-uppercase">TRUNG TÂM ĐIỀU HÀNH HỆ THỐNG</span>
          </div>
          <h1 className="h3 fw-bold mb-0 text-dark">Bảng Quản Trị Hệ Thống</h1>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <FaExclamationTriangle className="flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {loading && (
        <div className="text-center py-2 text-primary mb-3">
          <FaSpinner className="spinner-border spinner-border-sm me-2" role="status" />
          <span className="extra-small-text">Đang cập nhật số liệu toàn viện trực tiếp từ máy chủ...</span>
        </div>
      )}

      {/* 1. Top KPI Dashboard Metrics */}
      <KpiCard summary={summary} />

      {/* 2. Safety Alert Center */}
      <AlertCenter />

      {/* 3. Analytics & Overview Grid */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <div className="d-flex flex-column gap-3">
            <AnalyticsChart />
            <PatientSafetyOverview />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
