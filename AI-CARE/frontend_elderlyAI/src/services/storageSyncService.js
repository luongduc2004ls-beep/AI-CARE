import excelPatientsData from "../data/patientsFromExcel.json";

const STORAGE_KEYS = {
  PATIENTS: "elderly_ai_patients_data",
  CUSTOM_PATIENTS: "elderly_ai_custom_created_patients",
  CARE_LOGS: "elderly_ai_family_care_logs",
  MEDICINES: "elderly_ai_medicines_data",
  HEALTH_RECORDS: "elderly_ai_health_records",
  SETTINGS: "elderly_ai_user_settings",
};

// Dữ liệu mẫu khởi tạo mặc định nếu trình duyệt hoàn toàn chưa có dữ liệu
const DEFAULT_PATIENTS = [
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

class StorageSyncService {
  constructor() {
    this.isInitialized = false;
    this.searchCacheIndex = [];
  }

  /**
   * Tự động khởi tạo dữ liệu ngay khi mở ứng dụng Web.
   * Kiểm tra bộ nhớ LocalStorage và tải trước toàn bộ dữ liệu cần thiết.
   */
  initAutoSync() {
    if (this.isInitialized) return;
    try {
      // 1. Kiểm tra và tạo chỉ mục danh sách bệnh nhân tổng
      const patients = this.getPatients();
      if (!patients || patients.length === 0) {
        this.savePatients(excelPatientsData);
      }

      // 2. Tạo bộ chỉ mục tìm kiếm nhanh (Search Indexing)
      this.rebuildSearchIndex();

      // 3. Đánh dấu đã khởi tạo tự động thành công
      this.isInitialized = true;
      console.log("⚡ [Auto-Sync Engine] Đã tự động kích hoạt đồng bộ dữ liệu bền vững & tìm kiếm tức thì trên Web.");
    } catch (error) {
      console.warn("Lỗi khi tự động khởi tạo lưu trữ Web:", error);
    }
  }

  /**
   * Lấy danh sách bệnh nhân từ LocalStorage kết hợp dữ liệu Excel & Dữ liệu tự tạo
   */
  getPatients() {
    try {
      let custom = [];
      const savedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_PATIENTS);
      if (savedCustom) {
        custom = JSON.parse(savedCustom) || [];
      }
      return [...custom, ...excelPatientsData];
    } catch (e) {
      console.warn("Lỗi đọc bệnh nhân từ LocalStorage:", e);
      return excelPatientsData;
    }
  }

  /**
   * Lưu trực tiếp danh sách bệnh nhân vào LocalStorage và cập nhật Search Index
   */
  savePatients(patients) {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
      this.rebuildSearchIndex();
    } catch (e) {
      console.warn("Lỗi ghi bệnh nhân vào LocalStorage:", e);
    }
  }

  /**
   * Cập nhật tự động thông tin 1 bệnh nhân / người thân
   */
  autoUpdatePatient(patientId, updateData) {
    const patients = this.getPatients();
    const index = patients.findIndex(
      (p) => String(p.patient_id || p.id) === String(patientId)
    );

    let updatedList;
    if (index !== -1) {
      patients[index] = { ...patients[index], ...updateData };
      updatedList = [...patients];
    } else {
      updatedList = [{ patient_id: patientId, ...updateData }, ...patients];
    }

    this.savePatients(updatedList);
    return updatedList;
  }

  /**
   * Tự động tạo bộ chỉ mục tìm kiếm siêu tốc (Real-time Instant Search Index)
   * Giúp tìm kiếm từ khóa trên toàn bộ Web cực nhanh không cần load trang
   */
  rebuildSearchIndex() {
    const patients = this.getPatients();
    const careLogs = this.getCareLogs();

    this.searchCacheIndex = [
      ...patients.map((p) => ({
        type: "Hồ sơ y tế",
        id: p.patient_id || p.id,
        title: p.full_name || p.fullName || "Bệnh nhân",
        subtitle: `SĐT: ${p.phone || "Chưa có"} | Mã AI: ${p.device_id || "DEV0001"}`,
        details: `${p.caregiver_name || ""} ${p.caregiver_phone || ""} ${p.address || ""} ${p.medical_history || ""}`,
        link: "/elderly",
        raw: p,
      })),
      ...careLogs.map((l) => ({
        type: "Nhật ký chăm sóc",
        id: l.id,
        title: l.title,
        subtitle: `${l.category} - ${l.time}`,
        details: l.note || "",
        link: "/elderly",
        raw: l,
      })),
    ];
  }

  /**
   * Lấy danh sách sổ tay nhật ký
   */
  getCareLogs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARE_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Lỗi đọc Nhật ký từ LocalStorage:", e);
    }
    return [];
  }

  /**
   * Tìm kiếm tức thì trên toàn bộ hệ thống Web theo từ khóa
   */
  instantSearch(keyword = "") {
    const term = (keyword || "").trim().toLowerCase();
    if (!term) return [];

    return this.searchCacheIndex.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(term);
      const matchSub = item.subtitle.toLowerCase().includes(term);
      const matchDetails = item.details.toLowerCase().includes(term);
      return matchTitle || matchSub || matchDetails;
    });
  }
}

const storageSyncService = new StorageSyncService();
export default storageSyncService;
