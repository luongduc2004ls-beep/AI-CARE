// ==========================================================
// healthService.js
// Service xử lý API quản lý bản ghi và chỉ số sức khỏe người cao tuổi
// Tương tác trực tiếp với Backend Flask API qua api.js (Axios)
// ==========================================================

import api from "./api";

/**
 * Service quản lý các chỉ số sinh hiệu (Nhịp tim, Huyết áp, Đường huyết, Thân nhiệt, SpO2)
 * và kết nối với Backend Flask API & MySQL.
 */
const healthService = {
  /**
   * Lấy toàn bộ bản ghi chỉ số sức khỏe trong hệ thống.
   * Endpoint: GET /api/health-records
   * @returns {Promise<Array>} Danh sách bản ghi sức khỏe
   */
  async getAll() {
    try {
      const response = await api.get("/health-records");
      return response.data || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bản ghi sức khỏe:", error.message);
      throw error;
    }
  },

  /**
   * Lấy chi tiết bản ghi chỉ số sức khỏe theo ID bản ghi.
   * Endpoint: GET /api/health-records/:id
   * @param {number|string} recordId ID bản ghi
   * @returns {Promise<Object>} Chi tiết bản ghi
   */
  async getById(recordId) {
    try {
      const response = await api.get(`/health-records/${recordId}`);
      return response.data || null;
    } catch (error) {
      console.error(`Lỗi khi lấy bản ghi sức khỏe ID ${recordId}:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy tất cả lịch sử bản ghi chỉ số sức khỏe của một bệnh nhân / người cao tuổi.
   * Endpoint: GET /api/patients/:patientId/health-records
   * @param {number|string} patientId ID bệnh nhân
   * @returns {Promise<Array>} Danh sách bản ghi của bệnh nhân
   */
  async getByPatientId(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/health-records`);
      return response.data || [];
    } catch (error) {
      console.error(`Lỗi khi lấy lịch sử sức khỏe của bệnh nhân ID ${patientId}:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy bản ghi chỉ số sức khỏe mới nhất của một bệnh nhân.
   * Endpoint: GET /api/patients/:patientId/health-records/latest
   * @param {number|string} patientId ID bệnh nhân
   * @returns {Promise<Object>} Bản ghi mới nhất
   */
  async getLatestByPatientId(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/health-records/latest`);
      return response.data || null;
    } catch (error) {
      console.error(`Lỗi khi lấy bản ghi mới nhất của bệnh nhân ID ${patientId}:`, error.message);
      throw error;
    }
  },

  /**
   * Tạo mới bản ghi đo chỉ số sức khỏe.
   * Endpoint: POST /api/health-records
   * @param {Object} healthData Dữ liệu chỉ số sức khỏe
   * @returns {Promise<Object>} Bản ghi đã lưu vào MySQL
   */
  async create(healthData) {
    try {
      const response = await api.post("/health-records", healthData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi ghi nhận chỉ số sức khỏe mới:", error.message);
      throw error;
    }
  },

  /**
   * Cập nhật bản ghi chỉ số sức khỏe theo ID.
   * Endpoint: PUT /api/health-records/:id
   * @param {number|string} recordId ID bản ghi cần cập nhật
   * @param {Object} healthData Dữ liệu cập nhật mới
   * @returns {Promise<Object>} Bản ghi sau khi cập nhật
   */
  async update(recordId, healthData) {
    try {
      const response = await api.put(`/health-records/${recordId}`, healthData);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật bản ghi sức khỏe ID ${recordId}:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa bản ghi chỉ số sức khỏe theo ID.
   * Endpoint: DELETE /api/health-records/:id
   * @param {number|string} recordId ID bản ghi cần xóa
   * @returns {Promise<Object>} Phản hồi từ Backend
   */
  async delete(recordId) {
    try {
      const response = await api.delete(`/health-records/${recordId}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi xóa bản ghi sức khỏe ID ${recordId}:`, error.message);
      throw error;
    }
  },
};

export default healthService;
