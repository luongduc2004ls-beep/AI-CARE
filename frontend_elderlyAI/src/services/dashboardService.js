// ==========================================================
// dashboardService.js
// Service xử lý API báo cáo thống kê và tổng quan hệ thống (Dashboard)
// Tương tác trực tiếp với Backend Flask API qua api.js (Axios)
// ==========================================================

import api from "./api";

/**
 * Service tổng hợp số liệu báo cáo, thống kê và hoạt động gần đây cho màn hình Dashboard.
 */
const dashboardService = {
  /**
   * Lấy tổng quan số liệu thống kê cho Dashboard (Tổng số bệnh nhân, thuốc, cảnh báo...).
   * Endpoint: GET /api/dashboard/summary
   * @returns {Promise<Object>} Dữ liệu thống kê tổng quan
   */
  async getSummary() {
    try {
      const response = await api.get("/dashboard/summary");
      return (
        response.data || {
          total_patients: 0,
          total_medicines: 0,
          total_health_records: 0,
          unread_notifications: 0,
          low_stock_medicines: 0,
          expired_medicines: 0,
        }
      );
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu tổng quan Dashboard:", error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách các hoạt động mới nhất (Bệnh nhân mới, đơn thuốc mới, chỉ số mới...).
   * Endpoint: GET /api/dashboard/recent-activities
   * @returns {Promise<Object>} Danh sách các hoạt động mới nhất
   */
  async getRecentActivities() {
    try {
      const response = await api.get("/dashboard/recent-activities");
      return (
        response.data || {
          recent_patients: [],
          recent_medicines: [],
          recent_health_records: [],
          recent_notifications: [],
        }
      );
    } catch (error) {
      console.error("Lỗi khi lấy danh sách hoạt động gần đây:", error.message);
      throw error;
    }
  },
};

// ==========================================================
// Các hàm tương thích bổ trợ cho Biểu đồ Dashboard
// ==========================================================

export const getDashboardStatistics = () => ({
  totalMedicines: 0,
  takenMedicines: 0,
  notTakenMedicines: 0,
  todaySchedules: 0,
  onTimeMedicines: 0,
  overdueMedicines: 0,
});

export const getMedicationBarChartData = () => [
  { label: "Sáng", value: 3 },
  { label: "Trưa", value: 2 },
  { label: "Chiều", value: 1 },
  { label: "Tối", value: 4 },
];

export const getMedicationPieChartData = () => [
  { label: "Đã uống", value: 5 },
  { label: "Chưa uống", value: 2 },
];

export const getMedicationLineChartData = () => [
  { label: "T2", taken: 5, missed: 1 },
  { label: "T3", taken: 6, missed: 2 },
  { label: "T4", taken: 7, missed: 1 },
  { label: "T5", taken: 5, missed: 3 },
  { label: "T6", taken: 8, missed: 1 },
  { label: "T7", taken: 6, missed: 2 },
  { label: "CN", taken: 7, missed: 1 },
];

export default dashboardService;
