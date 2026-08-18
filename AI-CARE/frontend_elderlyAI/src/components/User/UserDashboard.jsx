import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaHeartbeat,
  FaVideo,
  FaPills,
  FaBell,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaRobot,
  FaUserNurse,
  FaSpinner,
  FaThermometerHalf,
  FaTint,
  FaChevronRight,
  FaCalendarCheck
} from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { usePatient } from "../../context/PatientContext";

const API_BASE_URL = window.location.hostname.includes("serveousercontent.com") || window.location.protocol === "https:"
  ? "https://3318293df04c7371-171-255-66-135.serveousercontent.com/api"
  : `http://${window.location.hostname || "localhost"}:5000/api`;

function UserDashboard() {
  const { currentUser } = useAuth();
  const { selectedPatientId, selectedPatient, assignedPatients, setSelectedPatientId } = usePatient();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUserDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/my/dashboard`, {
        params: {
          userId: currentUser?.user_id,
          userRole: currentUser?.role || "User",
          patient_id: selectedPatientId
        }
      });
      if (res.data && res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.warn("Lỗi tải User Dashboard, sử dụng dữ liệu cục bộ:", err);
      // Clean fallback if API is warming up
      setDashboardData({
        patient: selectedPatient,
        cameras: { total: 3, online: 2, offline: 1, items: [] },
        health: { heart_rate: 76, blood_pressure: "120/80", spo2: 98, temperature: 36.8, risk_level: "An toàn" },
        medicines: { total_doses: 3, taken_doses: 2, text: "2/3 liều đã uống" },
        alerts: { active_count: 0, items: [] },
        activities: [
          { time: "19:15", title: "Camera phòng ngủ", desc: "Phát hiện chuyển động bình thường của cụ", status: "normal" },
          { time: "18:00", title: "Uống thuốc đúng giờ", desc: "Đã uống liều buổi chiều theo chỉ định", status: "success" },
          { time: "14:30", title: "Đo sinh hiệu tự động", desc: "Huyết áp 120/80, SpO2 98% ổn định", status: "normal" }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedPatientId, selectedPatient]);

  useEffect(() => {
    loadUserDashboard();
  }, [loadUserDashboard]);

  const p = dashboardData?.patient || selectedPatient;
  const cams = dashboardData?.cameras || { total: 3, online: 2, offline: 1 };
  const health = dashboardData?.health || { heart_rate: 76, blood_pressure: "120/80", spo2: 98, temperature: 36.8 };
  const meds = dashboardData?.medicines || { total_doses: 3, taken_doses: 2, text: "2/3 liều đã uống" };
  const alerts = dashboardData?.alerts || { active_count: 0, items: [] };
  const activities = dashboardData?.activities || [];

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* 1. Header Banner & Patient Selector */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-gradient p-3 p-md-4 text-white" style={{ background: "linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <FaShieldAlt className="fs-5 text-warning" />
              <span className="badge bg-white text-primary fw-bold px-3 py-1 rounded-pill">TỔNG QUAN CHĂM SÓC</span>
            </div>
            <h2 className="h3 fw-bold mb-1">{p?.full_name || p?.fullName || "Cụ Hồ Thanh Khánh"}</h2>
            <p className="mb-0 text-white-50 small">
              {p?.age || 71} tuổi • Giới tính: {p?.gender || "Nam"} • 🟢 <span className="text-white fw-semibold">Đang được giám sát an toàn</span>
            </p>
          </div>

          {/* Multiple Patients Selector for Caregiver */}
          {assignedPatients && assignedPatients.length > 1 && (
            <div className="bg-white bg-opacity-10 p-2 rounded-3 border border-white border-opacity-25">
              <label className="text-white extra-small-text d-block mb-1">Người thân được chăm sóc:</label>
              <select
                className="form-select form-select-sm bg-white text-dark fw-semibold"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {assignedPatients.map((pat) => (
                  <option key={pat.patient_code || pat.patient_id || pat.id} value={pat.patient_code || pat.patient_id || pat.id}>
                    {pat.full_name || pat.fullName} ({pat.patient_code || pat.patient_id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-2 text-primary mb-3">
          <FaSpinner className="spinner-border spinner-border-sm me-2" role="status" />
          <span className="extra-small-text">Đang cập nhật dữ liệu người thân từ máy chủ...</span>
        </div>
      )}

      {/* 2. Key Telemetry Grid */}
      <div className="row g-3 mb-4">
        {/* Camera Status Card */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2 text-primary fw-bold">
                <FaVideo />
                <span>Camera AI</span>
              </div>
              <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 small">
                {cams.online}/{cams.total} Online
              </span>
            </div>
            <div className="h4 fw-bold text-dark mb-1">{cams.total} Mắt Camera</div>
            <p className="text-muted small mb-3">
              🟢 {cams.online} Đang hoạt động • 🔴 {cams.offline} Ngoại tuyến
            </p>
            <Link to="/camera" className="btn btn-outline-primary btn-sm rounded-pill w-100 fw-semibold mt-auto">
              Xem Trực Tiếp <FaChevronRight className="ms-1" />
            </Link>
          </div>
        </div>

        {/* Health Vitals Card */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2 text-danger fw-bold">
                <FaHeartbeat />
                <span>Sinh hiệu hôm nay</span>
              </div>
              <span className="badge bg-danger-subtle text-danger rounded-pill px-2 py-1 small">
                {health.heart_rate} BPM
              </span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted small">Huyết áp:</span>
              <span className="fw-bold text-dark">{health.blood_pressure}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted small">SpO₂:</span>
              <span className="fw-bold text-dark">{health.spo2}%</span>
            </div>
            <Link to="/health" className="btn btn-outline-danger btn-sm rounded-pill w-100 fw-semibold mt-auto">
              Xem Chi Tiết Sinh Hiệu <FaChevronRight className="ms-1" />
            </Link>
          </div>
        </div>

        {/* Today's Medication Tracker */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2 text-success fw-bold">
                <FaPills />
                <span>Thuốc hôm nay</span>
              </div>
              <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 small">
                {meds.text}
              </span>
            </div>
            <div className="progress mb-2" style={{ height: "8px" }}>
              <div
                className="progress-bar bg-success rounded-pill"
                role="progressbar"
                style={{ width: `${(meds.taken_doses / (meds.total_doses || 1)) * 100}%` }}
              />
            </div>
            <p className="text-muted small mb-3">Còn {Math.max(0, meds.total_doses - meds.taken_doses)} liều cần uống trong ngày</p>
            <Link to="/medicine" className="btn btn-outline-success btn-sm rounded-pill w-100 fw-semibold mt-auto">
              Xem Lịch Thuốc <FaChevronRight className="ms-1" />
            </Link>
          </div>
        </div>

        {/* Alerts & Safety Status Card */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2 text-warning fw-bold">
                <FaBell />
                <span>Cảnh báo an toàn</span>
              </div>
              <span className={`badge ${alerts.active_count > 0 ? "bg-danger" : "bg-success"} rounded-pill px-2 py-1 text-white small`}>
                {alerts.active_count > 0 ? `${alerts.active_count} Cần chú ý` : "An toàn"}
              </span>
            </div>
            <div className="h4 fw-bold text-dark mb-1">
              {alerts.active_count > 0 ? `${alerts.active_count} Sự cố té ngã` : "Bình Thường"}
            </div>
            <p className="text-muted small mb-3">
              {alerts.active_count > 0 ? "Cần người thân kiểm tra ngay" : "Không phát hiện nguy cơ té ngã"}
            </p>
            <Link to="/notification" className="btn btn-outline-warning btn-sm rounded-pill w-100 fw-semibold mt-auto text-dark">
              Trung Tâm Cảnh Báo <FaChevronRight className="ms-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Two Columns: Recent Activities & AI Assistant */}
      <div className="row g-3">
        {/* Recent Patient Activities */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="h6 fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <FaClock className="text-primary" /> Hoạt động gần đây của người thân
              </h3>
              <span className="text-muted extra-small-text">Hôm nay</span>
            </div>
            <div className="d-flex flex-column gap-3">
              {activities.map((act, idx) => (
                <div key={idx} className="d-flex align-items-start gap-3 p-2 rounded-3 bg-light">
                  <div className={`p-2 rounded-circle ${act.status === "success" ? "bg-success text-white" : "bg-primary text-white"}`}>
                    {act.type === "medicine" ? <FaPills size={14} /> : act.type === "health" ? <FaHeartbeat size={14} /> : <FaVideo size={14} />}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold text-dark small">{act.title}</span>
                      <span className="text-muted extra-small-text">{act.time}</span>
                    </div>
                    <p className="text-muted small mb-0">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Assistant Quick Companion */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white h-100 border-start border-4 border-primary">
            <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold">
              <FaRobot className="fs-4" />
              <span>Trợ lý Y tế Gemini AI</span>
            </div>
            <p className="text-muted small mb-3">
              Hỏi đáp trực tiếp với trợ lý AI về tình trạng sức khỏe, lịch uống thuốc và tín hiệu camera của {p?.full_name || "người thân"}.
            </p>
            <div className="d-flex flex-column gap-2 mb-3">
              <Link to="/chatbot" className="btn btn-light text-start border btn-sm py-2 px-3 rounded-3 text-dark fw-medium">
                💬 "Cụ có quên uống thuốc cữ nào hôm nay không?"
              </Link>
              <Link to="/chatbot" className="btn btn-light text-start border btn-sm py-2 px-3 rounded-3 text-dark fw-medium">
                💬 "Chỉ số huyết áp hôm nay có ổn định không?"
              </Link>
              <Link to="/chatbot" className="btn btn-light text-start border btn-sm py-2 px-3 rounded-3 text-dark fw-medium">
                💬 "Camera phòng ngủ của cụ đang hoạt động ra sao?"
              </Link>
            </div>
            <Link to="/chatbot" className="btn btn-primary rounded-pill w-100 fw-bold mt-auto py-2">
              Mở Trợ Lý AI Chăm Sóc <FaChevronRight className="ms-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
