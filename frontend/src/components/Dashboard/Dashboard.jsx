// ==========================================================
// Dashboard.jsx
// Màn hình tổng quan hệ thống AI CARE
// Tải dữ liệu báo cáo thống kê trực tiếp từ Flask Backend API qua dashboardService
// ==========================================================

import { useCallback, useEffect, useState } from "react";
import {
  FaCalendarDay,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPills,
  FaSpinner,
  FaUserInjured,
} from "react-icons/fa";
import dashboardService from "../../services/dashboardService";
import MedicationBarChart from "./MedicationBarChart";
import MedicationLineChart from "./MedicationLineChart";
import MedicationPieChart from "./MedicationPieChart";
import RecentActivities from "./RecentActivities";
import StatisticCard from "./StatisticCard";
import WelcomeCard from "./WelcomeCard";
import "./Dashboard.css";

function Dashboard({ medicines }) {
  // ============================
  // State
  // ============================

  const [summary, setSummary] = useState({
    total_patients: 0,
    total_medicines: 0,
    total_health_records: 0,
    unread_notifications: 0,
    low_stock_medicines: 0,
    expired_medicines: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Tải dữ liệu số liệu tổng quan từ Backend API
  // ============================

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tổng quan Dashboard:", err);
      setError(err.message || "Không thể nạp dữ liệu thống kê từ Backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // ============================
  // Đóng gói số liệu thống kê
  // ============================

  const statistics = [
    {
      id: 1,
      title: "Tổng người cao tuổi",
      value: summary.total_patients || 0,
      color: "primary",
      icon: <FaUserInjured />,
    },
    {
      id: 2,
      title: "Tổng số loại thuốc",
      value: summary.total_medicines || 0,
      color: "success",
      icon: <FaPills />,
    },
    {
      id: 3,
      title: "Cảnh báo chưa đọc",
      value: summary.unread_notifications || 0,
      color: "warning",
      icon: <FaClock />,
    },
    {
      id: 4,
      title: "Bản ghi sức khỏe",
      value: summary.total_health_records || 0,
      color: "info",
      icon: <FaCalendarDay />,
    },
  ];

  const summaryItems = [
    {
      label: "Bệnh nhân",
      value: summary.total_patients || 0,
      color: "primary",
      icon: <FaUserInjured />,
    },
    {
      label: "Tổng số thuốc",
      value: summary.total_medicines || 0,
      color: "success",
      icon: <FaPills />,
    },
    {
      label: "Chỉ số sức khỏe",
      value: summary.total_health_records || 0,
      color: "info",
      icon: <FaCheckCircle />,
    },
    {
      label: "Thuốc sắp hết",
      value: summary.low_stock_medicines || 0,
      color: "warning",
      icon: <FaClock />,
    },
    {
      label: "Thuốc hết hạn",
      value: summary.expired_medicines || 0,
      color: "danger",
      icon: <FaExclamationTriangle />,
    },
  ];

  // ============================
  // Render Interface
  // ============================

  return (
    <div className="container-fluid mt-4">
      <WelcomeCard userName="Quản trị viên" medicines={medicines} />

      <h6 className="dashboard-section-title">Thống kê tổng quan từ Backend API</h6>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4">
          <FaExclamationTriangle className="fs-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {loading && (
        <div className="text-center py-3 text-primary">
          <FaSpinner className="spinner-border spinner-border-sm me-2" role="status" />
          <span>Đang nạp số liệu từ máy chủ MySQL...</span>
        </div>
      )}

      <div className="row">
        {statistics.map((item) => (
          <div className="col-lg-3 col-md-6 mb-4" key={item.id}>
            <StatisticCard title={item.title} value={item.value} color={item.color} icon={item.icon} />
          </div>
        ))}
      </div>

      <div className="card dashboard-summary-card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <h5 className="mb-1 fw-bold">Tổng quan hệ thống AI CARE</h5>
              <p className="text-muted mb-0 small">Theo dõi trực tiếp từ hệ thống cơ sở dữ liệu MySQL.</p>
            </div>
            <span className="badge text-bg-light border text-primary px-3 py-2">Trực tuyến</span>
          </div>
          <div className="row g-3">
            {summaryItems.map((item) => (
              <div className="col-6 col-md col-lg" key={item.label}>
                <div className={`summary-item summary-item-${item.color} h-100`}>
                  <div className={`summary-icon text-${item.color}`}>{item.icon}</div>
                  <div>
                    <p className="summary-label mb-1">{item.label}</p>
                    <h4 className={`fw-bold text-${item.color} mb-0`}>{item.value}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h6 className="dashboard-section-title mt-2">Biểu đồ & hoạt động</h6>
      <MedicationBarChart />

      <div className="row mt-4">
        <div className="col-lg-6 mb-4"><MedicationPieChart /></div>
        <div className="col-lg-6 mb-4"><MedicationLineChart /></div>
        <RecentActivities />
      </div>
    </div>
  );
}

export default Dashboard;
