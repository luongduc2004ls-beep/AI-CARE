import React, { useCallback, useEffect, useState } from "react";
import {
  FaCalendarDay,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPills,
  FaSpinner,
  FaUserInjured,
  FaPhoneAlt,
  FaShieldAlt,
  FaVideo,
  FaHeartbeat,
  FaUserNurse,
  FaUserShield,
  FaHome
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import dashboardService from "../../services/dashboardService";
import MedicationBarChart from "./MedicationBarChart";
import MedicationLineChart from "./MedicationLineChart";
import MedicationPieChart from "./MedicationPieChart";
import RecentActivities from "./RecentActivities";
import StatisticCard from "./StatisticCard";
import WelcomeCard from "./WelcomeCard";
import "./Dashboard.css";

function Dashboard({ medicines }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

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

  // =========================================================================
  // GIAO DIỆN CÁ NHÂN HÓA DÀNH CHO NGƯỜI THÂN GIA ĐÌNH (PERSONAL USER PORTAL)
  // =========================================================================
  if (!isAdmin) {
    return (
      <div className="container-fluid mt-4">
        {/* Banner Chào Mừng Cá Nhân Người Thân */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 text-white bg-primary bg-gradient">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-white text-primary fw-bold px-3 py-1 rounded-pill">
                  🏠 KHÔNG GIAN GIA ĐÌNH CÁ NHÂN
                </span>
                <span className="badge bg-success text-white fw-bold px-3 py-1 rounded-pill">
                  🟢 AN TOÀN 24/7
                </span>
              </div>
              <h3 className="fw-bold mb-1">
                👋 Xin chào, {currentUser?.full_name || currentUser?.username}!
              </h3>
              <p className="mb-0 text-white-50">
                Hệ thống đang tự động theo dõi sức khỏe &amp; báo động ngã cho <strong>Cụ Nguyễn Văn A (Phòng Ngủ 101)</strong>.
              </p>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <Link to="/camera" className="btn btn-light text-primary fw-bold rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2">
                <FaVideo className="text-danger fs-5" /> Xem Camera Báo Ngã
              </Link>
              <a href="tel:0901234567" className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2">
                <FaPhoneAlt className="fs-5" /> Gọi Bác Sĩ Gia Đình
              </a>
            </div>
          </div>
        </div>

        {/* Thẻ Thống Kê Nhanh Dành Cho Gia Đình */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-primary border-4 h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                  <FaUserInjured className="fs-3" />
                </div>
                <div>
                  <small className="text-muted fw-semibold d-block">Người Thân Đang Giám Sát</small>
                  <h5 className="fw-bold mb-0 text-dark">Cụ Nguyễn Văn A</h5>
                  <small className="text-muted">82 tuổi • Phòng 101</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-success border-4 h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                  <FaPills className="fs-3" />
                </div>
                <div>
                  <small className="text-muted fw-semibold d-block">Lịch Uống Thuốc Hôm Nay</small>
                  <h5 className="fw-bold mb-0 text-success">2 / 3 Cữ Đã Uống</h5>
                  <small className="text-muted">Cữ tiếp theo: 20:00</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-info border-4 h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 bg-info bg-opacity-10 text-info rounded-circle">
                  <FaHeartbeat className="fs-3" />
                </div>
                <div>
                  <small className="text-muted fw-semibold d-block">Sinh Hiệu Mới Nhất</small>
                  <h5 className="fw-bold mb-0 text-dark">120/80 mmHg</h5>
                  <small className="text-muted">Nhịp tim: 75 bpm • 36.8°C</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-warning border-4 h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                  <FaClock className="fs-3" />
                </div>
                <div>
                  <small className="text-muted fw-semibold d-block">Cảnh Báo An Toàn</small>
                  <h5 className="fw-bold mb-0 text-success">0 Sự Cố Ngã</h5>
                  <small className="text-muted">Hệ thống an toàn 24/7</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lối Tắt Hành Động Nhanh Cho Gia Đình */}
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <FaVideo className="text-primary" /> Camera Báo Ngã &amp; Giám Sát Cử Động Người Thân
              </h5>
              <div className="bg-dark rounded-4 p-4 text-white text-center d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "220px" }}>
                <FaShieldAlt className="fs-1 text-success mb-2" />
                <h6 className="fw-bold mb-1">Hệ Thống AI Đang Theo Dõi 24/7</h6>
                <p className="text-white-50 small mb-3">Tự động phát hiện ngã &amp; đếm đệm đếm ngược bảo vệ cụ nhà bạn</p>
                <Link to="/camera" className="btn btn-success fw-bold px-4 rounded-pill">
                  Bật Luồng Camera Gia Đình
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <FaUserNurse className="text-info" /> Liên Hệ Khẩn Cấp
              </h5>
              <ul className="list-group list-group-flush small">
                <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong className="d-block text-dark">Bác Sĩ Gia Đình (Bs. Trần Văn C)</strong>
                    <small className="text-muted">Chuyên khoa Lão Khoa</small>
                  </div>
                  <a href="tel:0901234567" className="btn btn-sm btn-outline-primary rounded-pill">Gọi</a>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                  <div>
                    <strong className="d-block text-dark">Y Tách Điều Dưỡng (Lê Thị D)</strong>
                    <small className="text-muted">Túc trực ca ngày</small>
                  </div>
                  <a href="tel:0987654321" className="btn btn-sm btn-outline-primary rounded-pill">Gọi</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Nhật ký hoạt động gần đây */}
        <RecentActivities />
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN QUẢN TRỊ VIÊN HỆ THỐNG (SYSTEM ADMIN DASHBOARD)
  // =========================================================================
  return (
    <div className="container-fluid mt-4">
      <WelcomeCard userName={currentUser?.full_name || "Quản trị viên"} medicines={medicines} />

      <h6 className="dashboard-section-title">Thống kê tổng quan quản trị từ Backend API</h6>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4">
          <FaExclamationTriangle className="fs-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {loading && (
        <div className="text-center py-3 text-primary">
          <FaSpinner className="spinner-border spinner-border-sm me-2" role="status" />
          <span>Đang nạp số liệu quản trị từ máy chủ...</span>
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
              <h5 className="mb-1 fw-bold">Tổng quan hạ tầng hệ thống AI CARE</h5>
              <p className="text-muted mb-0 small">Theo dõi trực tiếp từ cơ sở dữ liệu hệ thống máy chủ.</p>
            </div>
            <span className="badge text-bg-light border text-primary px-3 py-2">Trực tuyến (System Admin)</span>
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

      <h6 className="dashboard-section-title mt-2">Biểu đồ &amp; báo cáo toàn hệ thống</h6>
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
