// ==========================================================
// medicineService.js
// Service xử lý API quản lý thuốc / lịch uống thuốc
// Tương tác trực tiếp với Backend Flask API qua api.js (Axios)
// ==========================================================

import api from "./api";

/**
 * Service quản lý đầy đủ các thao tác CRUD và truy vấn danh sách thuốc từ Backend.
 */
const medicineService = {
  /**
   * Lấy toàn bộ danh sách thuốc.
   * Endpoint: GET /api/medicines
   * @returns {Promise<Array>} Danh sách thuốc
   */
  async getAll() {
    try {
      const response = await api.get("/medicines", { params: { per_page: 100 } });
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.items || response?.items || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thuốc:", error.message);
      throw error;
    }
  },

  /**
   * Lấy chi tiết thông tin thuốc theo ID.
   * Endpoint: GET /api/medicines/:id
   * @param {number|string} id ID thuốc
   * @returns {Promise<Object>} Chi tiết thuốc
   */
  async getById(id) {
    try {
      const response = await api.get(`/medicines/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin thuốc ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Thêm mới thuốc vào cơ sở dữ liệu.
   * Endpoint: POST /api/medicines
   * @param {Object} medicineData Dữ liệu thuốc mới
   * @returns {Promise<Object>} Thông tin thuốc đã được tạo
   */
  async create(medicineData) {
    try {
      const response = await api.post("/medicines", medicineData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi thêm mới thuốc:", error.message);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin thuốc theo ID.
   * Endpoint: PUT /api/medicines/:id
   * @param {number|string} id ID thuốc cần cập nhật
   * @param {Object} medicineData Dữ liệu cập nhật
   * @returns {Promise<Object>} Thông tin thuốc sau khi cập nhật
   */
  async update(id, medicineData) {
    try {
      const response = await api.put(`/medicines/${id}`, medicineData);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật thuốc ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa thuốc theo ID khỏi cơ sở dữ liệu.
   * Endpoint: DELETE /api/medicines/:id
   * @param {number|string} id ID thuốc cần xóa
   * @returns {Promise<Object>} Kết quả phản hồi từ API
   */
  async delete(id) {
    try {
      const response = await api.delete(`/medicines/${id}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi xóa thuốc ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Tìm kiếm thuốc theo từ khóa tên hoặc liều lượng.
   * Endpoint: GET /api/medicines/search?keyword=...
   * @param {string} keyword Từ khóa tìm kiếm
   * @returns {Promise<Array>} Danh sách kết quả tìm kiếm
   */
  async search(keyword = "") {
    try {
      const response = await api.get("/medicines/search", {
        params: { keyword, per_page: 100 },
      });
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.items || response?.items || [];
    } catch (error) {
      console.error("Lỗi khi tìm kiếm thuốc:", error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách các thuốc sắp hết (số lượng dưới ngưỡng).
   * Endpoint: GET /api/medicines/low-stock
   * @returns {Promise<Array>} Danh sách thuốc sắp hết
   */
  async getLowStock() {
    try {
      const response = await api.get("/medicines/low-stock");
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.items || response?.items || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thuốc sắp hết:", error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách các thuốc đã hết hạn sử dụng.
   * Endpoint: GET /api/medicines/expired
   * @returns {Promise<Array>} Danh sách thuốc hết hạn
   */
  async getExpired() {
    try {
      const response = await api.get("/medicines/expired");
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.items || response?.items || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thuốc hết hạn:", error.message);
      throw error;
    }
  },
};

export const getMedicines = () => [];

export default medicineService;
