import api from "./api";
import { getData, saveData } from "./localStorageService";

const PATIENT_STORAGE_KEY = "ai-care-patient-profile";

const defaultPatient = {
  id: 1,
  user_id: 1,
  patient_code: "PAT00001",
  fullName: "Nguyễn Văn A",
  full_name: "Nguyễn Văn A",
  gender: "Nam",
  age: 81,
  dateOfBirth: "1945-05-15",
  phone: "0901234567",
  address: "123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh",
  emergencyContact: "Trần Thị B (Con gái) - 0909876543",
  healthCondition: "Cao huyết áp nhẹ, tiểu đường tuýp 2",
  doctor_name: "BS. Huỳnh Thanh Trang",
  caregiver_name: "Phan Thị An",
};

const getPatientProfile = () => {
  const stored = getData(PATIENT_STORAGE_KEY);
  return stored && typeof stored === "object" ? stored : defaultPatient;
};

const savePatientProfile = (patientData) => {
  saveData(PATIENT_STORAGE_KEY, patientData);
  return patientData;
};

const getPatients = async (page = 1, perPage = 10, keyword = "") => {
  try {
    const query = `/patients?page=${page}&per_page=${perPage}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ""}`;
    const res = await api.get(query);
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (error) {
    console.warn("Không kết nối được backend /patients API, sử dụng dữ liệu offline.");
  }

  const profile = getPatientProfile();
  return {
    items: [profile],
    total: 1,
    page: 1,
    per_page: perPage,
    total_pages: 1,
  };
};

const getPatientStatistics = async () => {
  try {
    const res = await api.get("/patients/statistics");
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (error) {
    console.warn("Lỗi khi tải thống kê bệnh nhân từ backend.");
  }

  return {
    totalPatients: 10000,
    highRiskPatients: 1509,
    mediumRiskPatients: 4973,
    lowRiskPatients: 3518,
    fallRiskAIPredictions: 2518,
    forgetMedAIPredictions: 2461,
    totalFalls: 5092,
  };
};

const createPatient = async (patientData) => {
  try {
    const res = await api.post("/patients", patientData);
    if (res && res.success) {
      return res.data;
    }
  } catch (error) {
    console.error("Lỗi khi tạo mới bệnh nhân qua Backend:", error);
  }
  return savePatientProfile(patientData);
};

const updatePatient = async (id, patientData) => {
  try {
    const res = await api.put(`/patients/${id}`, patientData);
    if (res && res.success) {
      return res.data;
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật bệnh nhân qua Backend:", error);
  }
  return savePatientProfile(patientData);
};

export {
  createPatient,
  getPatientProfile,
  getPatients,
  getPatientStatistics,
  savePatientProfile,
  updatePatient,
};
