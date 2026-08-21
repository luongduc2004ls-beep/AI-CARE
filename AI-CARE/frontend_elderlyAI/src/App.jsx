// ==============================================================================
// ỨNG DỤNG CHÍNH FRONTEND REACT (APP.JSX)
// Kiến trúc Phân Tách Tuyệt Đối: Admin Web vs User Web (Family Care)
// ==============================================================================

import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";

// Admin & User Components
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import UserDashboard from "./components/User/UserDashboard";
import AdminSidebar from "./components/Layout/AdminSidebar";
import UserSidebar from "./components/Layout/UserSidebar";
import AdminHeader from "./components/Layout/AdminHeader";
import UserHeader from "./components/Layout/UserHeader";
import AdminAIPage from "./pages/admin/AdminAIPage";
import UserAIPage from "./pages/user/UserAIPage";

// Common Pages
import MedicineTable from "./components/Medicine/MedicineTable";
import AlertPage from "./pages/AlertPage";
import ElderlyPage from "./pages/ElderlyPage";
import HealthPage from "./pages/HealthPage";
import SettingsPage from "./pages/SettingsPage";
import CameraPage from "./pages/CameraPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatbotWidget from "./components/ChatbotWidget";

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PatientProvider } from "./context/PatientContext";
import { ThemeProvider } from "./context/ThemeContext";
import { addActivity as saveActivity, getActivities } from "./services/activityService";
import { getMedicines } from "./services/medicineService";
import storageSyncService from "./services/storageSyncService";

function AppContent() {
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  const [medicines, setMedicines] = useState(() => getMedicines());
  const [activities, setActivities] = useState(() => getActivities());
  const location = useLocation();

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

  // Nếu chưa đăng nhập hoặc đang ở trang Auth -> Hiển thị giao diện Đăng nhập / Đăng ký
  if (!isAuthenticated || isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className={`container-fluid px-0 ${isAdmin ? "admin-scope-theme" : "user-scope-theme"}`}>
      <div className="row g-0">
        {/* Thanh Menu bên trái (Phân tách hoàn toàn Admin vs User) */}
        <aside className="col-lg-2">
          {isAdmin ? <AdminSidebar /> : <UserSidebar />}
        </aside>

        {/* Khu vực nội dung chính của ứng dụng */}
        <main className="col-lg-10 app-main-content">
          {/* Header Phân tách hoàn toàn Admin vs User */}
          {isAdmin ? <AdminHeader /> : <UserHeader />}

          {/* Định tuyến các trang giao diện */}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard: Admin nhận AdminDashboard, User nhận UserDashboard */}
            <Route
              path="/dashboard"
              element={isAdmin ? <AdminDashboard /> : <UserDashboard />}
            />
            
            {/* AI Phân tách hoàn toàn: Admin nhận AdminAIPage, User nhận UserAIPage */}
            <Route path="/admin/ai" element={isAdmin ? <AdminAIPage /> : <Navigate to="/user/ai" replace />} />
            <Route path="/user/ai" element={!isAdmin ? <UserAIPage /> : <Navigate to="/admin/ai" replace />} />
            <Route path="/chatbot" element={isAdmin ? <AdminAIPage /> : <UserAIPage />} />
            
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/medicine" element={medicinePage} />
            <Route path="/elderly" element={<ElderlyPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/notification" element={<AlertPage />} />
            <Route path="/alert" element={<AlertPage />} />
            
            {/* Route Cấu hình chỉ Admin được truy cập */}
            <Route
              path="/settings"
              element={isAdmin ? <SettingsPage /> : <Navigate to="/dashboard" replace />}
            />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Tích hợp ChatbotWidget kết nối Backend Medical AI Agent */}
      <ChatbotWidget apiUrl="http://127.0.0.1:5000/api/chatbot/chat" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PatientProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </PatientProvider>
    </AuthProvider>
  );
}

export default App;
