import { FaBell, FaCalendarDay, FaCloudSun, FaMoon, FaPills, FaSun } from "react-icons/fa";

// Trả về lời chào và icon phù hợp với thời điểm hiện tại trong ngày.
function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return { text: "Chào buổi sáng", icon: <FaSun /> };
  }

  if (hour < 18) {
    return { text: "Chào buổi chiều", icon: <FaCloudSun /> };
  }

  return { text: "Chào buổi tối", icon: <FaMoon /> };
}

function WelcomeCard({ userName = "Admin", medicines = [] }) {
  const greeting = getGreeting();

  // Định dạng ngày theo tiếng Việt để thân thiện với người dùng cao tuổi.
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Dữ liệu chưa có trường ngày, nên toàn bộ thuốc hiện có được tính là lịch trong ngày.
  const totalTodayMedicines = medicines.length;
  const currentTime = new Date().toTimeString().slice(0, 5);

  // Chỉ nhắc các thuốc chưa uống và ưu tiên liều gần nhất hoặc đã quá giờ.
  const pendingMedicines = medicines
    .filter((medicine) => medicine.status !== "Đã uống")
    .sort((firstMedicine, secondMedicine) => firstMedicine.time.localeCompare(secondMedicine.time));
  const upcomingMedicine = pendingMedicines.find(
    (medicine) => medicine.time >= currentTime,
  );
  const reminderMedicine = upcomingMedicine || pendingMedicines[0];

  // Tạo nội dung nhắc uống thuốc dựa trên thuốc cần xử lý tiếp theo.
  const reminderText = reminderMedicine
    ? reminderMedicine.time < currentTime
      ? `Thuốc ${reminderMedicine.name} lúc ${reminderMedicine.time} đã quá giờ uống.`
      : `Nhắc uống ${reminderMedicine.name} vào lúc ${reminderMedicine.time}.`
    : "Bạn đã hoàn thành tất cả lịch uống thuốc hôm nay.";

  return (
    <div className="welcome-card shadow-sm p-4 mb-4">
      <div className="position-relative" style={{ zIndex: 1 }}>
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-2 d-flex align-items-center gap-2">
              {greeting.icon} {greeting.text}, {userName}!
            </h4>
            <p className="mb-0 opacity-75">Hôm nay là {today}.</p>
          </div>

          <div className="text-lg-end">
            <span className="badge bg-white text-primary px-3 py-2 rounded-pill">
              <FaCalendarDay className="me-2" />Lịch hôm nay
            </span>
          </div>
        </div>

        <div className="row g-3 mt-2">
          <div className="col-md-4">
            <div className="welcome-info-box h-100">
              <FaPills className="welcome-info-icon" />
              <div>
                <small className="d-block opacity-75">Tổng số thuốc trong ngày</small>
                <strong className="fs-4">{totalTodayMedicines} thuốc</strong>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="welcome-info-box h-100">
              <FaBell className="welcome-info-icon" />
              <div>
                <small className="d-block opacity-75">Lời nhắc uống thuốc</small>
                <strong>{reminderText}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeCard;
