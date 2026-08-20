// ==========================================================
// medicineService.js
// Service xử lý API quản lý kho dược và đơn thuốc phân lập theo bệnh nhân
// Tương tác trực tiếp với Backend Flask API qua api.js (Axios)
// ==========================================================

import api from "./api";

/**
 * Service quản lý đầy đủ các thao tác Master Medicine Catalog và Patient-Specific Prescriptions.
 */
const medicineService = {
  // ========================================================
  // 1. PATIENT-SPECIFIC ISOLATED MEDICATION METHODS
  // ========================================================

  /**
   * Lấy toàn bộ đơn thuốc của một bệnh nhân cụ thể.
   * Endpoint: GET /api/patients/:patientId/prescriptions
   */
  async getPatientPrescriptions(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/prescriptions`);
      return response?.data || response;
    } catch (error) {
      console.error(`Lỗi khi lấy đơn thuốc của bệnh nhân ${patientId}:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách các loại thuốc thực tế đang được kê đơn cho một bệnh nhân.
   * Endpoint: GET /api/patients/:patientId/medications
   */
  async getPatientMedications(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/medications`);
      return response?.medications || response?.data?.medications || response?.data || [];
    } catch (error) {
      console.error(`Lỗi khi lấy danh sách thuốc của bệnh nhân ${patientId}:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy lịch uống thuốc theo ngày của một bệnh nhân cụ thể.
   * Endpoint: GET /api/patients/:patientId/medications/schedule?date=YYYY-MM-DD
   */
  async getPatientSchedule(patientId, date = "") {
    try {
      const response = await api.get(`/patients/${patientId}/medications/schedule`, {
        params: date ? { date } : {},
      });
      return response?.schedules || response?.data?.schedules || response?.data || [];
    } catch (error) {
      console.error(`Lỗi khi lấy lịch uống thuốc của bệnh nhân ${patientId}:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy lịch sử uống thuốc của một bệnh nhân.
   * Endpoint: GET /api/patients/:patientId/medication-history
   */
  async getPatientHistory(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/medication-history`);
      return response?.history || response?.data?.history || [];
    } catch (error) {
      console.error(`Lỗi khi lấy lịch sử uống thuốc của bệnh nhân ${patientId}:`, error.message);
      throw error;
    }
  },

  /**
   * Tạo mới đơn thuốc cho bệnh nhân (Atomic Transaction).
   * Endpoint: POST /api/patients/:patientId/prescriptions
   */
  async createPatientPrescription(patientId, prescriptionData) {
    try {
      const response = await api.post(`/patients/${patientId}/prescriptions`, prescriptionData);
      return response?.data || response;
    } catch (error) {
      console.error(`Lỗi khi tạo đơn thuốc cho bệnh nhân ${patientId}:`, error.message);
      throw error;
    }
  },

  /**
   * Ghi nhận bệnh nhân đã uống thuốc theo cữ thuốc hoặc mã chi tiết đơn thuốc (PrescriptionItem).
   */
  async takeMedicine(patientId, scheduleId, payload = { status: "Đã uống", taken_by: "Bệnh nhân" }) {
    try {
      const response = await api.post(`/patients/${patientId}/medications/schedule/${scheduleId}/take`, payload);
      return response?.data || response;
    } catch (error) {
      console.error(`Lỗi khi ghi nhận uống thuốc lịch ${scheduleId}:`, error.message);
      throw error;
    }
  },

  /**
   * Ghi nhận uống thuốc hoặc đổi trạng thái cữ thuốc trực tiếp theo PrescriptionItem.
   * Endpoint: POST /api/prescription-items/:itemId/take
   */
  async takeMedicineByItem(itemId, status = "Đã uống", taken_by = "Người chăm sóc", note = null) {
    try {
      const response = await api.post(`/prescription-items/${itemId}/take`, { status, taken_by, note });
      return response?.data || response;
    } catch (error) {
      console.error(`Lỗi khi ghi nhận uống thuốc theo đơn ${itemId}:`, error.message);
      throw error;
    }
  },

  /**
   * Cập nhật chi tiết thuốc trong đơn (PrescriptionItem).
   * Endpoint: PUT /api/prescription-items/:itemId
   */
  async updatePrescriptionItem(itemId, data) {
    try {
      const response = await api.put(`/prescription-items/${itemId}`, data);
      return response?.data || response;
    } catch (error) {
      console.error(`Lỗi khi cập nhật thuốc trong đơn ${itemId}:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa một loại thuốc khỏi đơn (PrescriptionItem).
   * Endpoint: DELETE /api/prescription-items/:itemId
   */
  async deletePrescriptionItem(itemId) {
    try {
      const response = await api.delete(`/prescription-items/${itemId}`);
      return response?.data || response;
    } catch (error) {
      console.error(`Lỗi khi xóa thuốc khỏi đơn ${itemId}:`, error.message);
      throw error;
    }
  },

  /**
   * Cập nhật lịch uống thuốc (Schedule).
   * Endpoint: PUT /api/medication-schedules/:scheduleId
   */
  async updateSchedule(scheduleId, data) {
    try {
      const response = await api.put(`/medication-schedules/${scheduleId}`, data);
      return response?.data || response;
    } catch (error) {
      console.error(`Lỗi khi cập nhật lịch uống ${scheduleId}:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa cữ uống thuốc (Schedule).
   * Endpoint: DELETE /api/medication-schedules/:scheduleId
   */
  async deleteSchedule(scheduleId) {
    try {
      const response = await api.delete(`/medication-schedules/${scheduleId}`);
      return response?.data || response;
    } catch (error) {
      console.error(`Lỗi khi xóa lịch uống ${scheduleId}:`, error.message);
      throw error;
    }
  },

  // ========================================================
  // 2. MASTER MEDICINE CATALOG & COMPATIBILITY METHODS
  // ========================================================

  /**
   * Lấy toàn bộ danh sách thuốc trong kho dược (Master Catalog).
   * Endpoint: GET /api/medicines
   */
  async getAll() {
    try {
      const response = await api.get("/medicines", { params: { per_page: 100 } });
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.items || response?.data?.items || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách kho dược:", error.message);
      throw error;
    }
  },

  /**
   * Lấy chi tiết thông tin thuốc theo ID.
   * Endpoint: GET /api/medicines/:id
   */
  async getById(id) {
    try {
      const response = await api.get(`/medicines/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin thuốc ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Thêm mới thuốc vào kho dược master.
   * Endpoint: POST /api/medicines
   */
  async create(medicineData) {
    try {
      const response = await api.post("/medicines", medicineData);
      return response.data || response;
    } catch (error) {
      console.error("Lỗi khi thêm mới thuốc kho dược:", error.message);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin thuốc trong kho dược.
   * Endpoint: PUT /api/medicines/:id
   */
  async update(id, medicineData) {
    try {
      const response = await api.put(`/medicines/${id}`, medicineData);
      return response.data || response;
    } catch (error) {
      console.error(`Lỗi khi cập nhật thuốc ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái thuốc (Đã uống / Chưa uống).
   * Endpoint: PATCH /api/medicines/:id/status
   */
  async updateStatus(id, status) {
    try {
      const response = await api.patch(`/medicines/${id}/status`, { status });
      return response.data || response;
    } catch (error) {
      console.error(`Lỗi khi cập nhật trạng thái thuốc ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa thuốc theo ID khỏi cơ sở dữ liệu.
   * Endpoint: DELETE /api/medicines/:id
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
   * Tìm kiếm thuốc theo từ khóa trong kho dược.
   * Endpoint: GET /api/medicines/search?keyword=...
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
        : response?.items || response?.data?.items || [];
    } catch (error) {
      console.error("Lỗi khi tìm kiếm kho dược:", error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách các thuốc sắp hết.
   * Endpoint: GET /api/medicines/low-stock
   */
  async getLowStock() {
    try {
      const response = await api.get("/medicines/low-stock");
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.items || response?.data?.items || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thuốc sắp hết:", error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách các thuốc đã hết hạn sử dụng.
   * Endpoint: GET /api/medicines/expired
   */
  async getExpired() {
    try {
      const response = await api.get("/medicines/expired");
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.items || response?.data?.items || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thuốc hết hạn:", error.message);
      throw error;
    }
  },
};

export const getMedicines = () => [];

export default medicineService;
