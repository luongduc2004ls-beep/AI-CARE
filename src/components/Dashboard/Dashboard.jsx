import WelcomeCard from "./WelcomeCard";
import StatisticCard from "./StatisticCard";
import MedicationBarChart from "./MedicationBarChart";
import MedicationPieChart from "./MedicationPieChart";
import MedicationLineChart from "./MedicationLineChart";
import RecentActivities from "./RecentActivities";
import "./Dashboard.css";
import {
  FaCalendarDay,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPills,
} from "react-icons/fa";
import { getDashboardStatistics } from "../../services/dashboardService";

function Dashboard({ medicines, activities }) {
  // ============================
  // Dashboard Statistics
  // ============================

  // Dashboard receives calculated values from the service layer.
  const statisticsData = getDashboardStatistics(medicines);

  const statistics = [
    { id: 1, title: "Tổng số thuốc", value: statisticsData.totalMedicines, color: "primary", icon: <FaPills /> },
    { id: 2, title: "Đã uống", value: statisticsData.takenMedicines, color: "success", icon: <FaCheckCircle /> },
    { id: 3, title: "Chưa uống", value: statisticsData.notTakenMedicines, color: "warning", icon: <FaClock /> },
    { id: 4, title: "Lịch uống hôm nay", value: statisticsData.todaySchedules, color: "info", icon: <FaCalendarDay /> },
  ];

  const summaryItems = [
    { label: "Tổng số thuốc", value: statisticsData.totalMedicines, color: "primary", icon: <FaPills /> },
    { label: "Đã uống", value: statisticsData.takenMedicines, color: "success", icon: <FaCheckCircle /> },
    { label: "Chưa uống", value: statisticsData.notTakenMedicines, color: "warning", icon: <FaClock /> },
    { label: "Đúng giờ", value: statisticsData.onTimeMedicines, color: "success", icon: <FaCheckCircle /> },
    { label: "Quá giờ", value: statisticsData.overdueMedicines, color: "danger", icon: <FaExclamationTriangle /> },
  ];

  // ============================
  // Render
  // ============================

  return (
    <div className="container-fluid mt-4">
      <WelcomeCard userName="Admin" medicines={medicines} />

      <h6 className="dashboard-section-title">Thống kê tổng quan</h6>
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
              <h5 className="mb-1 fw-bold">Tổng quan trạng thái thuốc</h5>
              <p className="text-muted mb-0 small">Theo dõi nhanh lịch uống thuốc trong ngày hôm nay.</p>
            </div>
            <span className="badge text-bg-light border text-primary px-3 py-2">Hôm nay</span>
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
      <MedicationBarChart medicines={medicines} />

      <div className="row mt-4">
        <div className="col-lg-6 mb-4"><MedicationPieChart medicines={medicines} /></div>
        <div className="col-lg-6 mb-4"><MedicationLineChart medicines={medicines} /></div>
        <RecentActivities activities={activities} />
      </div>
    </div>
  );
}

export default Dashboard;
