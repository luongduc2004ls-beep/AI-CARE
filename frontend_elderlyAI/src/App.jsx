// ======================================================
// Import thư viện
// ======================================================

import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { addActivity as saveActivity, getActivities } from "./services/activityService";
import { getMedicines } from "./services/medicineService";
import storageSyncService from "./services/storageSyncService";

function AppContent() {
  const [medicines, setMedicines] = useState(() => getMedicines());
  const [activities, setActivities] = useState(() => getActivities());
  const location = useLocation();

  // Tự động khởi chạy tiến trình lưu trữ và đánh chỉ mục tìm kiếm ngay khi mở ứng dụng Web
  useEffect(() => {
    storageSyncService.initAutoSync();
  }, []);

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  const addActivity = (type, medicineName) => {
    const updatedActivities = saveActivity(type, medicineName);
    setActivities(updatedActivities);
  };

  const medicinePage = (
    <MedicineTable
      medicines={medicines}
      setMedicines={setMedicines}
      addActivity={addActivity}
    />
  );

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="row g-0">
        <aside className="col-lg-2"><Sidebar /></aside>

        <main className="col-lg-10 app-main-content">
          <Header />

          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard medicines={medicines} activities={activities} />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/medicine" element={medicinePage} />
            <Route path="/elderly" element={<ElderlyPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/notification" element={<AlertPage />} />
            <Route path="/alert" element={<AlertPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
