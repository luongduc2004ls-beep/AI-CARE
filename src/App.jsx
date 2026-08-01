import { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";

// Import Pages
import DashboardPage from "./pages/DashboardPage";
import MedicinePage from "./pages/MedicinePage";
import AlertPage from "./pages/AlertPage";
import PatientPage from "./pages/PatientPage";
import ReminderPage from "./pages/ReminderPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";

import { getActivities, addActivity as saveActivity } from "./services/activityService";
import { getMedicines } from "./services/medicineService";

function App() {
  // ============================
  // State
  // ============================
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Mặc định là true để tiện dùng, có thể login/logout nếu cần
  const [activeTab, setActiveTab] = useState("dashboard");
  const [medicines, setMedicines] = useState([]);
  const [activities, setActivities] = useState(() => getActivities());

  // Load medicines from backend/localStorage on mount
  useEffect(() => {
    const fetchMedicines = async () => {
      const data = await getMedicines();
      setMedicines(data);
    };
    fetchMedicines();
  }, []);

  // ============================
  // Activity Handlers
  // ============================
  const addActivity = (type, medicineName) => {
    const updatedActivities = saveActivity(type, medicineName);
    setActivities(updatedActivities);
  };

  // ============================
  // Page Renderer
  // ============================
  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage medicines={medicines} activities={activities} />;
      case "medicines":
        return (
          <MedicinePage
            medicines={medicines}
            setMedicines={setMedicines}
            addActivity={addActivity}
          />
        );
      case "alerts":
        return <AlertPage />;
      case "patients":
        return <PatientPage />;
      case "health":
        return <ReminderPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage medicines={medicines} activities={activities} />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="container-fluid px-0">
      <div className="row g-0">
        <aside className="col-lg-2">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </aside>

        <main className="col-lg-10 app-main-content">
          <Header />
          <div className="p-3 p-md-4">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
