// ======================================================
// Import thư viện
// ======================================================

import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Dashboard from "./components/Dashboard/Dashboard";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import MedicineTable from "./components/Medicine/MedicineTable";
import AlertPage from "./pages/AlertPage";
import ElderlyPage from "./pages/ElderlyPage";
import HealthPage from "./pages/HealthPage";
import SettingsPage from "./pages/SettingsPage";
import CameraPage from "./pages/CameraPage";
import { addActivity as saveActivity, getActivities } from "./services/activityService";
import { getMedicines } from "./services/medicineService";
import NotFound from "./pages/NotFound";
function App() {
  // ======================================================
  // Khai báo state
  // ======================================================

  // Service khôi phục dữ liệu đã lưu trước khi giao diện được hiển thị.
  const [medicines, setMedicines] = useState(() => getMedicines());
  const [activities, setActivities] = useState(() => getActivities());

  // ======================================================
  // Hàm xử lý sự kiện
  // ======================================================

  const addActivity = (type, medicineName) => {
    const updatedActivities = saveActivity(type, medicineName);

    setActivities(updatedActivities);
  };

  // ======================================================
  // Điều hướng trang
  // ======================================================

  const medicinePage = (
    <MedicineTable
      medicines={medicines}
      setMedicines={setMedicines}
      addActivity={addActivity}
    />
  );

  // ======================================================
  // Khai báo Router
  // ======================================================
  // Chỉ quản lý Layout và Router tại đây.
  // Header và Sidebar luôn hiển thị, chỉ phần nội dung
  // (bên trong Routes) thay đổi theo từng đường dẫn.

  return (
    <div className="container-fluid px-0">
      <div className="row g-0">
        <aside className="col-lg-2"><Sidebar /></aside>

        <main className="col-lg-10 app-main-content">
          <Header />

          <Routes>
            {/* Truy cập "/" sẽ tự động chuyển sang "/dashboard" */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Các Route chính của ứng dụng */}
            <Route path="/dashboard" element={<Dashboard medicines={medicines} activities={activities} />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/medicine" element={medicinePage} />
            <Route path="/elderly" element={<ElderlyPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/notification" element={<AlertPage />} />
            <Route path="/settings" element={<SettingsPage />} />


            {/* Sai URL: tạm thời chuyển về Dashboard.
                TODO Bước 5: thay bằng <NotFound /> sau khi tạo pages/NotFound.jsx */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
