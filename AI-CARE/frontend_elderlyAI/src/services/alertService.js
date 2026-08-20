// ==============================================================================
// alertService.js
// Service xử lý API Cảnh Báo Phân Tách: Admin vs User (Data Isolation & RBAC)
// ==============================================================================

import api from "./api";

const alertService = {
  // ============================================================================
  // 1. ADMIN API (Quyền Quản Trị Hệ Thống Toàn Viện)
  // ============================================================================

  /**
   * Lấy danh sách toàn bộ cảnh báo hệ thống (có phân trang & bộ lọc).
   * Endpoint: GET /api/admin/alerts
   */
  async adminGetAlerts(params = {}) {
    try {
      const response = await api.get("/admin/alerts", { params });
      return response;
    } catch (error) {
      console.error("Lỗi khi tải cảnh báo toàn hệ thống (Admin):", error.message);
      throw error;
    }
  },

  /**
   * Xem chi tiết một cảnh báo theo ID.
   * Endpoint: GET /api/admin/alerts/:id
   */
  async adminGetAlertDetail(alertId) {
    try {
      const response = await api.get(`/admin/alerts/${alertId}`);
      return response?.alert || response;
    } catch (error) {
      console.error(`Lỗi khi tải chi tiết cảnh báo ${alertId}:`, error.message);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái xử lý cảnh báo (Acknowledge / Resolve).
   * Endpoint: PATCH /api/admin/alerts/:id/status
   */
  async adminUpdateAlertStatus(alertId, payload = { status: "RESOLVED" }) {
    try {
      const response = await api.patch(`/admin/alerts/${alertId}/status`, payload);
      return response;
    } catch (error) {
      console.error(`Lỗi khi cập nhật trạng thái cảnh báo ${alertId}:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy số liệu thống kê sự cố toàn viện.
   * Endpoint: GET /api/admin/alerts/stats
   */
  async adminGetStats() {
    try {
      const response = await api.get("/admin/alerts/stats");
      return response?.stats || response;
    } catch (error) {
      console.error("Lỗi khi tải thống kê cảnh báo Admin:", error.message);
      throw error;
    }
  },

  /**
   * Xem cảnh báo của một bệnh nhân cụ thể (Admin view).
   * Endpoint: GET /api/admin/patients/:patientId/alerts
   */
  async adminGetPatientAlerts(patientId, params = {}) {
    try {
      const response = await api.get(`/admin/patients/${patientId}/alerts`, { params });
      return response;
    } catch (error) {
      console.error(`Lỗi khi tải cảnh báo của bệnh nhân ${patientId}:`, error.message);
      throw error;
    }
  },

  // ============================================================================
  // 2. USER / CAREGIVER API (Chỉ Bệnh Nhân Được Cấp Quyền)
  // ============================================================================

  /**
   * Lấy danh sách cảnh báo an toàn của các bệnh nhân mà tài khoản được phân quyền.
   * Endpoint: GET /api/user/alerts
   */
  async userGetMyAlerts(params = {}) {
    try {
      const response = await api.get("/user/alerts", { params });
      return response;
    } catch (error) {
      console.error("Lỗi khi tải cảnh báo an toàn người thân (User):", error.message);
      throw error;
    }
  },

  /**
   * Xem chi tiết cảnh báo của người thân (có kiểm tra quyền).
   * Endpoint: GET /api/user/alerts/:id
   */
  async userGetAlertDetail(alertId) {
    try {
      const response = await api.get(`/user/alerts/${alertId}`);
      return response?.alert || response;
    } catch (error) {
      console.error(`Lỗi khi xem chi tiết cảnh báo người thân ${alertId}:`, error.message);
      throw error;
    }
  },

  /**
   * Xem cảnh báo của đúng người thân đang chọn (Backend kiểm tra 403 nếu trái phép).
   * Endpoint: GET /api/user/patients/:patientId/alerts
   */
  async userGetPatientAlerts(patientId, params = {}) {
    try {
      const response = await api.get(`/user/patients/${patientId}/alerts`, { params });
      return response;
    } catch (error) {
      console.error(`Lỗi khi tải cảnh báo của người thân ${patientId}:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy thống kê sự cố dành riêng cho người thân.
   * Endpoint: GET /api/user/alerts/stats
   */
  async userGetStats() {
    try {
      const response = await api.get("/user/alerts/stats");
      return response?.stats || response;
    } catch (error) {
      console.error("Lỗi khi tải thống kê cảnh báo User:", error.message);
      throw error;
    }
  }
};

export default alertService;
