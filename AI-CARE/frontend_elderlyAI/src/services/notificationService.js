// ==========================================================
// notificationService.js
// Service xử lý API thông báo và cảnh báo khẩn cấp
// Tương tác trực tiếp với Backend Flask API qua api.js (Axios)
// ==========================================================

import api from "./api";

/**
 * Service quản lý danh sách thông báo, cảnh báo sức khỏe và lịch nhắc nhở từ Backend.
 */
const notificationService = {
  /**
   * Lấy toàn bộ danh sách thông báo / cảnh báo.
   * Endpoint: GET /api/notifications
   * @returns {Promise<Array>} Danh sách thông báo
   */
  async getAll() {
    try {
      const response = await api.get("/notifications");
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.items || response?.items || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo:", error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách thông báo chưa đọc.
   * Endpoint: GET /api/notifications/unread
   * @returns {Promise<Array>} Danh sách thông báo chưa đọc
   */
  async getUnread() {
    try {
      const response = await api.get("/notifications/unread");
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.items || response?.items || [];
    } catch (error) {
      console.error("Lỗi khi lấy thông báo chưa đọc:", error.message);
      throw error;
    }
  },


  /**
   * Lấy số lượng thông báo chưa đọc.
   * Endpoint: GET /api/notifications/unread-count
   * @returns {Promise<number>} Số lượng chưa đọc
   */
  async countUnread() {
    try {
      const response = await api.get("/notifications/unread-count");
      return response.data?.unread_count || 0;
    } catch (error) {
      console.error("Lỗi khi đếm thông báo chưa đọc:", error.message);
      throw error;
    }
  },

  /**
   * Lấy chi tiết một thông báo theo ID.
   * Endpoint: GET /api/notifications/:id
   * @param {number|string} id ID thông báo
   * @returns {Promise<Object>} Chi tiết thông báo
   */
  async getById(id) {
    try {
      const response = await api.get(`/notifications/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Lỗi khi lấy thông báo ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy thông báo thuộc về một bệnh nhân cụ thể.
   * Endpoint: GET /api/patients/:patientId/notifications
   * @param {number|string} patientId ID bệnh nhân
   * @returns {Promise<Array>} Danh sách thông báo của bệnh nhân
   */
  async getByPatientId(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/notifications`);
      return response.data || [];
    } catch (error) {
      console.error(`Lỗi khi lấy thông báo của bệnh nhân ${patientId}:`, error.message);
      throw error;
    }
  },

  /**
   * Tạo thông báo mới.
   * Endpoint: POST /api/notifications
   * @param {Object} notificationData Dữ liệu thông báo
   * @returns {Promise<Object>} Thông báo đã tạo
   */
  async create(notificationData) {
    try {
      const response = await api.post("/notifications", notificationData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo mới thông báo:", error.message);
      throw error;
    }
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc.
   * Endpoint: PUT /api/notifications/read-all
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  async markAllAsRead() {
    try {
      const response = await api.put("/notifications/read-all");
      return response;
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error.message);
      throw error;
    }
  },

  /**
   * Đánh dấu một thông báo theo ID là đã đọc.
   * Endpoint: PUT /api/notifications/:id/read
   * @param {number|string} id ID thông báo
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  async markAsRead(id) {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi đánh dấu đã đọc thông báo ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa thông báo theo ID.
   * Endpoint: DELETE /api/notifications/:id
   * @param {number|string} id ID thông báo cần xóa
   * @returns {Promise<Object>} Kết quả xóa
   */
  async delete(id) {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi xóa thông báo ID ${id}:`, error.message);
      throw error;
    }
  },
};

export default notificationService;
