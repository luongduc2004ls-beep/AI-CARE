// ==========================================================
// patientService.js
// Service xử lý API người cao tuổi / bệnh nhân
// Kết nối trực tiếp 100% với Flask Backend & Database (Source of Truth)
// ==========================================================

import api from "./api";

const patientService = {
  /**
   * Lấy toàn bộ danh sách bệnh nhân từ Database.
   * Endpoint: GET /api/patients
   */
  async getAll(params = {}) {
    try {
      const response = await api.get("/patients", { params: { per_page: 100, ...params } });
      const payload = response?.data || response;
      return payload?.items || payload?.data?.items || (Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách bệnh nhân từ Database:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách bệnh nhân phân trang và tìm kiếm theo từ khóa.
   * Endpoint: GET /api/patients?page=...&per_page=...&keyword=...
   */
  async getPaginated(params = {}) {
    const page = Math.max(1, parseInt(params.page || 1, 10));
    const perPage = Math.max(1, parseInt(params.per_page || 20, 10));
    const keyword = (params.keyword || "").trim();

    try {
      const response = await api.get("/patients", {
        params: { page, per_page: perPage, keyword: keyword || undefined }
      });
      const payload = response?.data || response;
      const dataObj = payload?.data || payload;

      return {
        items: dataObj?.items || [],
        total: dataObj?.total || 0,
        page: dataObj?.page || page,
        per_page: dataObj?.per_page || perPage,
        total_pages: dataObj?.total_pages || 1,
      };
    } catch (error) {
      console.error("Lỗi khi nạp dữ liệu bệnh nhân từ Database:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết bệnh nhân theo ID hoặc mã bệnh nhân ('PAT10000').
   * Endpoint: GET /api/patients/:id
   */
  async getById(id) {
    try {
      const response = await api.get(`/patients/${id}`);
      const payload = response?.data || response;
      return payload?.data || payload || null;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin bệnh nhân ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Thêm mới hồ sơ bệnh nhân vào Database.
   * Endpoint: POST /api/patients
   */
  async create(patientData) {
    try {
      const response = await api.post("/patients", patientData);
      const payload = response?.data || response;
      return payload?.data || payload;
    } catch (error) {
      console.error("Lỗi khi thêm mới bệnh nhân vào Database:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin hồ sơ bệnh nhân trong Database.
   * Endpoint: PUT /api/patients/:id
   */
  async update(id, patientData) {
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      const payload = response?.data || response;
      return payload?.data || payload;
    } catch (error) {
      console.error(`Lỗi khi cập nhật bệnh nhân ${id} trong Database:`, error);
      throw error;
    }
  },

  /**
   * Xóa (hoặc soft delete) bệnh nhân khỏi Database.
   * Endpoint: DELETE /api/patients/:id
   */
  async delete(id) {
    try {
      const response = await api.delete(`/patients/${id}`);
      return response?.data || response;
    } catch (error) {
      console.error(`Lỗi khi xóa bệnh nhân ${id} trong Database:`, error);
      throw error;
    }
  },

  /**
   * Tìm kiếm bệnh nhân theo từ khóa.
   * Endpoint: GET /api/patients/search?keyword=...
   */
  async search(keyword = "") {
    try {
      const response = await api.get(`/patients/search`, {
        params: { keyword, per_page: 50 },
      });
      const payload = response?.data || response;
      const dataObj = payload?.data || payload;
      return dataObj?.items || (Array.isArray(dataObj) ? dataObj : []);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm bệnh nhân:", error);
      throw error;
    }
  },

  /**
   * Lấy tổng số lượng bệnh nhân trong hệ thống.
   * Endpoint: GET /api/patients/count
   */
  async count() {
    try {
      const response = await api.get("/patients/count");
      const payload = response?.data || response;
      const dataObj = payload?.data || payload;
      return dataObj?.total_patients || 0;
    } catch (error) {
      console.error("Lỗi khi lấy tổng số bệnh nhân:", error);
      throw error;
    }
  },
};

export default patientService;
