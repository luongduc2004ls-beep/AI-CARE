// ==============================================================================
// ỨNG DỤNG CHÍNH FRONTEND REACT (APP.JSX)
// ==============================================================================
// Mô tả: Component gốc điều hướng (Routing), quản lý Auth State và nhúng
//        ChatbotWidget có sẵn của bạn kết nối tới Gemini AI Backend.
// ==============================================================================

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
import ChatbotPage from "./pages/ChatbotPage"; // Trang Chatbot Gemini full màn hình
import ChatbotWidget from "./components/ChatbotWidget"; // Component ChatbotWidget có sẵn của bạn
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

  // Nếu là trang Login hoặc Register thì chỉ hiển thị giao diện Auth
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
        {/* Thanh Menu bên trái (Sidebar Navigation) */}
        <aside className="col-lg-2"><Sidebar /></aside>

        {/* Khu vực nội dung chính của ứng dụng */}
        <main className="col-lg-10 app-main-content">
          <Header />

          {/* Định tuyến các trang giao diện (App Routes) */}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard medicines={medicines} activities={activities} />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
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

      {/* Tích hợp ChatbotWidget có sẵn của bạn kết nối Backend Flask Gemini API */}
      <ChatbotWidget apiUrl="http://localhost:5000/chat" />
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
