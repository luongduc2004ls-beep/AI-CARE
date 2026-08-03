// ==========================================================
// patientService.js
// Service xử lý API người cao tuổi / bệnh nhân
// Tương tác trực tiếp với Backend Flask API qua api.js (Axios)
// ==========================================================

import api from "./api";

/**
 * Service quản lý toàn bộ các thao tác CRUD và tìm kiếm hồ sơ người cao tuổi / bệnh nhân.
 */
const patientService = {
  /**
   * Lấy toàn bộ danh sách người cao tuổi / bệnh nhân.
   * Endpoint: GET /api/patients
   * @returns {Promise<Array>} Danh sách bệnh nhân
   */
  async getAll(params = {}) {
    try {
      const response = await api.get("/patients", { params: { per_page: 20, ...params } });
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.items || response?.items || [];
      return items;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bệnh nhân:", error.message);
      throw error;
    }
  },

  async getPaginated(params = {}) {
    try {
      const response = await api.get("/patients", { params: { page: 1, per_page: 20, ...params } });
      const payload = response?.data || response;
      return {
        items: payload.items || [],
        total: payload.total || 0,
        page: payload.page || 1,
        per_page: payload.per_page || 20,
        total_pages: payload.total_pages || 1,
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phân trang bệnh nhân:", error.message);
      throw error;
    }
  },


  /**
   * Lấy thông tin chi tiết một người cao tuổi theo ID.
   * Endpoint: GET /api/patients/:id
   * @param {number|string} id ID người cao tuổi
   * @returns {Promise<Object>} Thông tin chi tiết bệnh nhân
   */
  async getById(id) {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin bệnh nhân ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Tạo mới hồ sơ người cao tuổi / bệnh nhân.
   * Endpoint: POST /api/patients
   * @param {Object} patientData Dữ liệu bệnh nhân mới
   * @returns {Promise<Object>} Hồ sơ bệnh nhân đã được tạo
   */
  async create(patientData) {
    try {
      const response = await api.post("/patients", patientData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo mới hồ sơ bệnh nhân:", error.message);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin hồ sơ người cao tuổi theo ID.
   * Endpoint: PUT /api/patients/:id
   * @param {number|string} id ID bệnh nhân
   * @param {Object} patientData Dữ liệu cập nhật
   * @returns {Promise<Object>} Hồ sơ bệnh nhân sau cập nhật
   */
  async update(id, patientData) {
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật bệnh nhân ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa hồ sơ người cao tuổi theo ID.
   * Endpoint: DELETE /api/patients/:id
   * @param {number|string} id ID bệnh nhân cần xóa
   * @returns {Promise<Object>} Kết quả xóa từ API
   */
  async delete(id) {
    try {
      const response = await api.delete(`/patients/${id}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi xóa bệnh nhân ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Tìm kiếm bệnh nhân theo từ khóa (Họ tên, SĐT, v.v.).
   * Endpoint: GET /api/patients/search?keyword=...
   * @param {string} keyword Từ khóa tìm kiếm
   * @returns {Promise<Array>} Danh sách kết quả tìm kiếm
   */
  async search(keyword = "") {
    try {
      const response = await api.get(`/patients/search`, {
        params: { keyword, per_page: 100 },
      });
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.items || response?.items || [];
      return items;
    } catch (error) {
      console.error("Lỗi khi tìm kiếm bệnh nhân:", error.message);
      throw error;
    }
  },



  /**
   * Lấy tổng số lượng bệnh nhân trong hệ thống.
   * Endpoint: GET /api/patients/count
   * @returns {Promise<number>} Tổng số lượng
   */
  async count() {
    try {
      const response = await api.get("/patients/count");
      return response.data?.total_patients || 0;
    } catch (error) {
      console.error("Lỗi khi lấy tổng số bệnh nhân:", error.message);
      throw error;
    }
  },
};

export default patientService;
