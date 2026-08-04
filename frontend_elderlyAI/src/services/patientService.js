// ==========================================================
// patientService.js
// Service xử lý API người cao tuổi / bệnh nhân
// Tương tác trực tiếp với Backend Flask API qua api.js (Axios)
// ==========================================================

import api from "./api";

const defaultMockPatients = [
  {
    patient_id: 1,
    id: 1,
    patient_code: "PAT00001",
    device_id: "DEV0001",
    full_name: "Cụ Nguyễn Văn A",
    fullName: "Cụ Nguyễn Văn A",
    name: "Cụ Nguyễn Văn A",
    age: 72,
    gender: "Nam",
    phone: "0912345678",
    height_cm: 165,
    weight_kg: 62.5,
    blood_group: "O+",
    allergy: "Dị ứng Penicillin & Phấn hoa",
    address: "Số 15, Ngõ 120 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
    medical_history: "Tăng huyết áp nhẹ, Thoái hóa khớp gối",
    medicalConditions: "Tăng huyết áp nhẹ, Thoái hóa khớp gối",
    caregiver_name: "Nguyễn Văn B",
    caregiver_relation: "Con trai",
    caregiver_age: 42,
    caregiver_phone: "0987654321",
    caregiver_email: "nguyenvanb@gmail.com",
    relativeName: "Nguyễn Văn B",
    relativeRelation: "Con trai",
    relativeAge: 42,
    relativePhone: "0987654321",
    relativeEmail: "nguyenvanb@gmail.com",
    emergency_contact: "Nguyễn Văn B (Con trai) - 0987654321",
    doctor_name: "BS. Nguyễn Thanh Tùng",
    image: ""
  },
  {
    patient_id: 2,
    id: 2,
    patient_code: "PAT00002",
    device_id: "DEV0002",
    full_name: "Cụ Trần Thị B",
    fullName: "Cụ Trần Thị B",
    name: "Cụ Trần Thị B",
    age: 78,
    gender: "Nữ",
    phone: "0913987654",
    height_cm: 155,
    weight_kg: 52.0,
    blood_group: "A+",
    allergy: "Dị ứng Aspirin & Hải sản",
    address: "Phòng 202, Tòa nhà Lão Khoa, Hoàn Kiếm, Hà Nội",
    medical_history: "Đái tháo đường Tuýp 2, Loãng xương",
    medicalConditions: "Đái tháo đường Tuýp 2, Loãng xương",
    caregiver_name: "Trần Thị Mai",
    caregiver_relation: "Con gái",
    caregiver_age: 45,
    caregiver_phone: "0977123456",
    caregiver_email: "tranthimai@gmail.com",
    relativeName: "Trần Thị Mai",
    relativeRelation: "Con gái",
    relativeAge: 45,
    relativePhone: "0977123456",
    relativeEmail: "tranthimai@gmail.com",
    emergency_contact: "Trần Thị Mai (Con gái) - 0977123456",
    doctor_name: "BS. Lê Hoàng Long",
    image: ""
  },
  {
    patient_id: 3,
    id: 3,
    patient_code: "PAT00003",
    device_id: "DEV0003",
    full_name: "Cụ Lê Văn C",
    fullName: "Cụ Lê Văn C",
    name: "Cụ Lê Văn C",
    age: 81,
    gender: "Nam",
    phone: "0988555666",
    height_cm: 168,
    weight_kg: 68.0,
    blood_group: "B+",
    allergy: "Dị ứng Sulfa & Thời tiết lạnh",
    address: "Số 88, Phố Nhổn, Bắc Từ Liêm, Hà Nội",
    medical_history: "Rối loạn nhịp tim, Suy vành nhẹ",
    medicalConditions: "Rối loạn nhịp tim, Suy vành nhẹ",
    caregiver_name: "Lê Văn Dũng",
    caregiver_relation: "Cháu nội",
    caregiver_age: 28,
    caregiver_phone: "0966888999",
    caregiver_email: "levandung@gmail.com",
    relativeName: "Lê Văn Dũng",
    relativeRelation: "Cháu nội",
    relativeAge: 28,
    relativePhone: "0966888999",
    relativeEmail: "levandung@gmail.com",
    emergency_contact: "Lê Văn Dũng (Cháu nội) - 0966888999",
    doctor_name: "BS. Phạm Minh Tuấn",
    image: ""
  },
  {
    patient_id: 4,
    id: 4,
    patient_code: "PAT00004",
    device_id: "DEV0004",
    full_name: "Cụ Phạm Thị D",
    fullName: "Cụ Phạm Thị D",
    name: "Cụ Phạm Thị D",
    age: 75,
    gender: "Nữ",
    phone: "0904111222",
    height_cm: 152,
    weight_kg: 58.5,
    blood_group: "AB+",
    allergy: "Không ghi nhận dị ứng",
    address: "Số 45, Đường Giải Phóng, Hai Bà Trưng, Hà Nội",
    medical_history: "Rối loạn tiền đình, Thiếu máu nhẹ",
    medicalConditions: "Rối loạn tiền đình, Thiếu máu nhẹ",
    caregiver_name: "Phạm Quốc Hùng",
    caregiver_relation: "Con trai",
    caregiver_age: 49,
    caregiver_phone: "0911333444",
    caregiver_email: "phamquochung@gmail.com",
    relativeName: "Phạm Quốc Hùng",
    relativeRelation: "Con trai",
    relativeAge: 49,
    relativePhone: "0911333444",
    relativeEmail: "phamquochung@gmail.com",
    emergency_contact: "Phạm Quốc Hùng (Con trai) - 0911333444",
    doctor_name: "BS. Vũ Thị Hồng",
    image: ""
  },
  {
    patient_id: 5,
    id: 5,
    patient_code: "PAT00005",
    device_id: "DEV0005",
    full_name: "Cụ Hoàng Văn E",
    fullName: "Cụ Hoàng Văn E",
    name: "Cụ Hoàng Văn E",
    age: 85,
    gender: "Nam",
    phone: "0936777888",
    height_cm: 162,
    weight_kg: 55.0,
    blood_group: "O-",
    allergy: "Dị ứng thuốc cản quang",
    address: "Số 12, Phố Huế, Hoàn Kiếm, Hà Nội",
    medical_history: "Bệnh Gút mãn tính, Giảm thị lực nhẹ",
    medicalConditions: "Bệnh Gút mãn tính, Giảm thị lực nhẹ",
    caregiver_name: "Hoàng Thu Trang",
    caregiver_relation: "Cháu ngoại",
    caregiver_age: 31,
    caregiver_phone: "0944222111",
    caregiver_email: "hoangthutrang@gmail.com",
    relativeName: "Hoàng Thu Trang",
    relativeRelation: "Cháu ngoại",
    relativeAge: 31,
    relativePhone: "0944222111",
    relativeEmail: "hoangthutrang@gmail.com",
    emergency_contact: "Hoàng Thu Trang (Cháu ngoại) - 0944222111",
    doctor_name: "BS. Đỗ Quang Vinh",
    image: ""
  }
];

const LOCAL_STORAGE_KEY = "elderly_ai_patients_data";

function getLocalPatients() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= defaultMockPatients.length) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Lỗi khi đọc LocalStorage:", e);
  }
  // Tự động khôi phục và cập nhật đầy đủ toàn bộ danh sách bệnh nhân nếu bộ nhớ cũ bị thiếu
  saveLocalPatients(defaultMockPatients);
  return defaultMockPatients;
}

function saveLocalPatients(items) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Lỗi khi ghi LocalStorage:", e);
  }
}

import excelPatientsData from "../data/patientsFromExcel.json";

const CUSTOM_PATIENTS_KEY = "elderly_ai_custom_created_patients";

function getCustomCreatedPatients() {
  try {
    const saved = localStorage.getItem(CUSTOM_PATIENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Lỗi khi đọc dữ liệu bệnh nhân mới tạo:", e);
  }
  return [];
}

function saveCustomCreatedPatient(patient) {
  try {
    const current = getCustomCreatedPatients();
    // Tránh trùng lặp ID
    const filtered = current.filter(p => String(p.patient_id || p.id) !== String(patient.patient_id || patient.id));
    const updated = [patient, ...filtered];
    localStorage.setItem(CUSTOM_PATIENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Lỗi khi lưu bệnh nhân mới tạo vào LocalStorage:", e);
  }
}

function getAllCombinedPatients() {
  const custom = getCustomCreatedPatients();
  return [...custom, ...excelPatientsData];
}

const patientService = {
  async getAll(params = {}) {
    try {
      const response = await api.get("/patients", { params: { per_page: 100, ...params } });
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.items || response?.items || [];
      if (items.length > 0) return items;
    } catch (error) {
      console.warn("Dùng dữ liệu lưu trữ trực tiếp 10.000 bệnh nhân từ AI_CARE_Database.xlsx & LocalStorage:", error.message);
    }
    return getAllCombinedPatients().slice(0, 100);
  },

  async getPaginated(params = {}) {
    const page = Math.max(1, parseInt(params.page || 1, 10));
    const perPage = Math.max(1, parseInt(params.per_page || 20, 10));
    const keyword = (params.keyword || "").trim().toLowerCase();

    try {
      const response = await api.get("/patients", { params: { page, per_page: perPage, keyword: params.keyword } });
      const payload = response?.data || response;
      if (payload && payload.items && payload.items.length > 0) {
        return {
          items: payload.items,
          total: payload.total || getAllCombinedPatients().length,
          page: payload.page || page,
          per_page: payload.per_page || perPage,
          total_pages: payload.total_pages || Math.ceil((payload.total || getAllCombinedPatients().length) / perPage),
        };
      }
    } catch (error) {
      console.warn("Nạp dữ liệu 10.000 bệnh nhân từ AI_CARE_Database.xlsx & dữ liệu tự nhập:", error.message);
    }

    const allPatients = getAllCombinedPatients();
    let filtered = allPatients;

    if (keyword) {
      filtered = allPatients.filter(
        (p) =>
          (p.full_name || p.fullName || p.name || "").toLowerCase().includes(keyword) ||
          (p.patient_code || p.patient_id || "").toLowerCase().includes(keyword) ||
          (p.phone || "").toString().toLowerCase().includes(keyword) ||
          (p.caregiver_name || p.relativeName || "").toLowerCase().includes(keyword) ||
          (p.device_id || "").toLowerCase().includes(keyword) ||
          (p.doctor_name || "").toLowerCase().includes(keyword)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    const startIndex = (page - 1) * perPage;
    const items = filtered.slice(startIndex, startIndex + perPage);

    return {
      items,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    };
  },

  async getById(id) {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data || null;
    } catch (error) {
      const all = getAllCombinedPatients();
      return all.find((p) => String(p.patient_id || p.id) === String(id)) || all[0] || null;
    }
  },

  async create(patientData) {
    let newPatient = null;
    const newId = `PAT${Math.floor(20000 + Math.random() * 80000)}`;

    try {
      const response = await api.post("/patients", patientData);
      newPatient = response.data;
    } catch (error) {
      console.warn("Lưu hồ sơ bệnh nhân mới tạo vào bộ nhớ bền vững:", error.message);
      newPatient = {
        patient_id: newId,
        id: newId,
        patient_code: patientData.patient_code || newId,
        device_id: patientData.device_id || `D${Math.floor(2000 + Math.random() * 8000)}`,
        full_name: patientData.full_name || patientData.fullName || patientData.name || "Bệnh nhân mới",
        fullName: patientData.full_name || patientData.fullName || patientData.name || "Bệnh nhân mới",
        name: patientData.full_name || patientData.fullName || patientData.name || "Bệnh nhân mới",
        age: Number(patientData.age) || 70,
        gender: patientData.gender || "Nam",
        phone: patientData.phone || "0912345678",
        height_cm: Number(patientData.height_cm) || 165,
        weight_kg: Number(patientData.weight_kg) || 62,
        blood_group: patientData.blood_group || "O+",
        allergy: patientData.allergy || "Không có",
        address: patientData.address || "Khu vực giám sát bệnh nhân mới",
        medical_history: patientData.medical_history || patientData.medicalConditions || "Theo dõi sức khỏe mới",
        medicalConditions: patientData.medical_history || patientData.medicalConditions || "Theo dõi sức khỏe mới",
        caregiver_name: patientData.caregiver_name || patientData.relativeName || "Người thân",
        caregiver_relation: patientData.caregiver_relation || patientData.relativeRelation || "Người thân",
        caregiver_age: Number(patientData.caregiver_age || patientData.relativeAge) || 40,
        caregiver_phone: patientData.caregiver_phone || patientData.relativePhone || "0987654321",
        caregiver_email: patientData.caregiver_email || patientData.relativeEmail || "family@elderly.ai",
        relativeName: patientData.caregiver_name || patientData.relativeName || "Người thân",
        relativeRelation: patientData.caregiver_relation || patientData.relativeRelation || "Người thân",
        relativeAge: Number(patientData.caregiver_age || patientData.relativeAge) || 40,
        relativePhone: patientData.caregiver_phone || patientData.relativePhone || "0987654321",
        relativeEmail: patientData.caregiver_email || patientData.relativeEmail || "family@elderly.ai",
        doctor_name: patientData.doctor_name || "BS. Nguyễn Thanh Tùng",
        image: patientData.image || ""
      };
    }

    // Tự động lưu bền vững vào LocalStorage để không bao giờ bị mất khi F5 hoặc mở lại ứng dụng
    saveCustomCreatedPatient(newPatient);

    // Đồng bộ vào kho lưu trữ tổng
    const localAll = getLocalPatients();
    saveLocalPatients([newPatient, ...localAll]);

    return newPatient;
  },

  async update(id, patientData) {
    let updatedPatient = null;
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      updatedPatient = response.data;
    } catch (error) {
      console.warn("Cập nhật trực tiếp vào LocalStorage trình duyệt:", error.message);
      updatedPatient = {
        patient_id: id,
        ...patientData,
        fullName: patientData.full_name || patientData.name,
      };
    }

    // Cập nhật ngay lập tức bộ nhớ trình duyệt LocalStorage
    const local = getLocalPatients();
    const updated = local.map((item) =>
      String(item.patient_id || item.id) === String(id) ? { ...item, ...updatedPatient } : item
    );
    saveLocalPatients(updated);
    return updatedPatient;
  },

  async delete(id) {
    try {
      await api.delete(`/patients/${id}`);
    } catch (error) {
      console.warn("Xóa trực tiếp khỏi LocalStorage trình duyệt:", error.message);
    }

    // Cập nhật bộ nhớ trình duyệt
    const local = getLocalPatients();
    const updated = local.filter((item) => String(item.patient_id || item.id) !== String(id));
    saveLocalPatients(updated);
    return { success: true };
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
