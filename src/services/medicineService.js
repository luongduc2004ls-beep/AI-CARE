import api from "./api";
import { getData, saveData } from "./localStorageService";

// ============================
// Storage Configuration
// ============================

const MEDICINES_STORAGE_KEY = "ai-care-medicines";

const defaultMedicines = [
  { id: 1, name: "Paracetamol", dosage: "500mg", time: "08:00", status: "Đã uống" },
  { id: 2, name: "Vitamin C", dosage: "1 viên", time: "13:00", status: "Chưa uống" },
];

const getLocalStorageMedicines = () => {
  const storedMedicines = getData(MEDICINES_STORAGE_KEY);
  return Array.isArray(storedMedicines) ? storedMedicines : defaultMedicines;
};

// ============================
// Async API Functions (with localStorage fallback)
// ============================

const getMedicines = async () => {
  try {
    const res = await api.get("/medicines");
    if (res && res.success && Array.isArray(res.data)) {
      // Lưu lại bản sao mới nhất vào local storage để đồng bộ
      saveData(MEDICINES_STORAGE_KEY, res.data);
      return res.data;
    }
  } catch (error) {
    console.warn("Không kết nối được backend Flask, chuyển sang chế độ dữ liệu offline (localStorage).");
  }
  return getLocalStorageMedicines();
};

const addMedicine = async (medicine) => {
  try {
    const res = await api.post("/medicines", medicine);
    if (res && res.success) {
      return await getMedicines();
    }
  } catch (error) {
    console.error("Lỗi khi thêm thuốc qua Backend, đang lưu tạm offline:", error);
  }

  // Chế độ dự phòng offline
  const newMedicine = {
    ...medicine,
    id: medicine.id || Date.now(),
    status: medicine.status || "Chưa uống",
  };
  const updatedMedicines = [...getLocalStorageMedicines(), newMedicine];
  saveData(MEDICINES_STORAGE_KEY, updatedMedicines);
  return updatedMedicines;
};

const updateMedicine = async (updatedMedicine) => {
  try {
    const res = await api.put(`/medicines/${updatedMedicine.id}`, updatedMedicine);
    if (res && res.success) {
      return await getMedicines();
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật thuốc qua Backend, đang lưu tạm offline:", error);
  }

  // Chế độ dự phòng offline
  const updatedMedicines = getLocalStorageMedicines().map((medicine) =>
    medicine.id === updatedMedicine.id ? updatedMedicine : medicine
  );
  saveData(MEDICINES_STORAGE_KEY, updatedMedicines);
  return updatedMedicines;
};

const deleteMedicine = async (id) => {
  try {
    const res = await api.delete(`/medicines/${id}`);
    if (res && res.success) {
      return await getMedicines();
    }
  } catch (error) {
    console.error("Lỗi khi xóa thuốc qua Backend, đang cập nhật tạm offline:", error);
  }

  // Chế độ dự phòng offline
  const updatedMedicines = getLocalStorageMedicines().filter((medicine) => medicine.id !== id);
  saveData(MEDICINES_STORAGE_KEY, updatedMedicines);
  return updatedMedicines;
};

const updateMedicineStatus = async (id, status) => {
  try {
    const res = await api.patch(`/medicines/${id}/status`, { status });
    if (res && res.success) {
      return await getMedicines();
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái thuốc qua Backend, đang cập nhật tạm offline:", error);
  }

  // Chế độ dự phòng offline
  const updatedMedicines = getLocalStorageMedicines().map((medicine) =>
    medicine.id === id ? { ...medicine, status } : medicine
  );
  saveData(MEDICINES_STORAGE_KEY, updatedMedicines);
  return updatedMedicines;
};

export {
  addMedicine,
  deleteMedicine,
  getMedicines,
  updateMedicine,
  updateMedicineStatus,
};
