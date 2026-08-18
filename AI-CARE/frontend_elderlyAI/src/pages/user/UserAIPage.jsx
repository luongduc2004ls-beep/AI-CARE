import React, { useState, useEffect, useRef } from "react";
import {
  FaHeart,
  FaPaperPlane,
  FaSpinner,
  FaHeartbeat,
  FaPills,
  FaVideo,
  FaShieldAlt,
  FaUserCheck,
  FaChevronRight
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { usePatient } from "../../context/PatientContext";
import { sendUserAIMessage, checkUserAIStatus } from "../../services/userAIService";
import MedicalResponseCard from "../../components/Chatbot/MedicalResponseCard";
import axios from "axios";

const API_BASE_URL = window.location.hostname.includes("serveousercontent.com") || window.location.protocol === "https:"
  ? "https://3318293df04c7371-171-255-66-135.serveousercontent.com/api"
  : `http://${window.location.hostname || "localhost"}:5000/api`;

function UserAIPage() {
  const { currentUser } = useAuth();
  const { selectedPatientId, selectedPatient, assignedPatients, setSelectedPatientId } = usePatient();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ configured: true, model: "gemini-2.5-flash", status_message: "Đang kết nối..." });
  const [patientVitals, setPatientVitals] = useState(null);
  const messagesEndRef = useRef(null);

  // Khởi tạo lại phiên chat mỗi khi chuyển đổi người thân
  useEffect(() => {
    const pName = selectedPatient?.full_name || selectedPatient?.name || "Người thân";
    const pCode = selectedPatientId || "PAT10000";

    setMessages([
      {
        id: 1,
        sender: "ai",
        text: `### 🩺 CHÀO MỪNG BẠN ĐẾN VỚI TRỢ LÝ Y TẾ AI CHĂM SÓC\n\nTôi đang đồng hành chăm sóc sức khỏe cho **${pName} (${pCode})**.\n\n### 📌 CÁC CHỦ ĐỀ HỖ TRỢ CHĂM SÓC:\n- **❤️ Sức khỏe & Sinh hiệu**: Nhịp tim, Huyết áp, SpO₂ hôm nay.\n- **🍽️ Dinh dưỡng & Tiêu hóa**: Chế độ ăn giảm đầy bụng, uống đủ nước, thực đơn cho người già.\n- **💊 Lịch uống thuốc**: Đã uống những cữ nào, còn cữ nào cần nhắc.\n- **📹 Camera phòng ngủ**: Kiểm tra kết nối và tín hiệu AI giám sát an toàn.\n- **🛡️ Cảnh báo an toàn**: Kiểm tra xem hôm nay cụ có bị té ngã hoặc gặp sự cố gì không.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    const fetchVitals = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/my/dashboard`, {
          params: { userId: currentUser?.user_id || 2, userRole: "User", patient_id: pCode }
        });
        if (res.data && res.data.success) {
          setPatientVitals(res.data.data);
        }
      } catch (e) {}
    };
    fetchVitals();
  }, [selectedPatientId, selectedPatient, currentUser]);

  useEffect(() => {
    const initStatus = async () => {
      const st = await checkUserAIStatus();
      if (st && st.success) setStatus(st);
    };
    initStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (customText = null) => {
    const text = (customText || inputMessage).trim();
    if (!text || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = { id: Date.now(), sender: "user", text, time: timeStr };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    if (!customText) setInputMessage("");
    setLoading(true);

    try {
      const historyPayload = newMsgs.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      const res = await sendUserAIMessage(
        text,
        `user_conv_${selectedPatientId}`,
        selectedPatientId,
        historyPayload,
        currentUser?.user_id || 2
      );

      const aiReply = res?.reply || "⚠️ Không nhận được phản hồi từ AI.";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "⚠️ Đã xảy ra lỗi khi kết nối tới Trợ lý Chăm sóc.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const p = patientVitals?.patient || selectedPatient;
  const health = patientVitals?.health || { heart_rate: 76, blood_pressure: "116/81", spo2: 97 };
  const meds = patientVitals?.medicines || { text: "2/3 liều đã uống" };
  const cams = patientVitals?.cameras || { total: 3, online: 2 };

  return (
    <div className="container-fluid py-3 px-3 px-md-4">
      {/* 1. Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 mb-3 p-3 bg-primary text-white border-start border-4 border-warning">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 bg-white bg-opacity-20 rounded-circle text-white fs-3">
              <FaHeart />
            </div>
            <div>
              <h2 className="h5 fw-bold mb-0">Trợ Lý Y Tế AI Chăm Sóc</h2>
              <p className="text-white-50 small mb-0">Hỏi đáp sức khỏe, chế độ dinh dưỡng và giám sát an toàn cho người thân</p>
            </div>
          </div>
          <span className="badge bg-white text-primary rounded-pill px-3 py-2 fw-semibold">
            Đang chăm sóc: {p?.full_name || "Cụ Nguyễn Văn An"} ({selectedPatientId})
          </span>
        </div>
      </div>

      {/* 2. Main Expanded 2-Column Responsive Layout (70% Chat / 30% Context) */}
      <div className="row g-3">
        {/* Left/Center: Expanded Chat Workspace (70% Width) */}
        <div className="col-12 col-xl-8 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 bg-white d-flex flex-column" style={{ height: "720px" }}>
            {/* Quick Suggestions Header */}
            <div className="p-3 border-bottom bg-light d-flex flex-wrap gap-2 align-items-center">
              <span className="extra-small-text fw-bold text-muted text-uppercase me-1">Gợi ý nhanh:</span>
              <button
                className="btn btn-outline-primary btn-sm rounded-pill px-3 extra-small-text fw-semibold"
                onClick={() => handleSendMessage("Hiện tại chỉ số sức khỏe của cụ như thế nào?")}
              >
                ❤️ Sinh hiệu hôm nay
              </button>
              <button
                className="btn btn-outline-success btn-sm rounded-pill px-3 extra-small-text fw-semibold"
                onClick={() => handleSendMessage("Người cao tuổi đang bị đầy bụng khó tiêu thì nên ăn uống thế nào?")}
              >
                🍽️ Đầy bụng nên ăn gì?
              </button>
              <button
                className="btn btn-outline-info btn-sm rounded-pill px-3 extra-small-text fw-semibold text-dark"
                onClick={() => handleSendMessage("Hôm nay cụ còn cữ thuốc nào chưa uống không?")}
              >
                💊 Lịch uống thuốc
              </button>
              <button
                className="btn btn-outline-warning btn-sm rounded-pill px-3 extra-small-text fw-semibold text-dark"
                onClick={() => handleSendMessage("Hôm nay cụ có bị té ngã hoặc gặp cảnh báo an toàn nào không?")}
              >
                🛡️ Kiểm tra ngã
              </button>
            </div>

            {/* Message Stream with MedicalResponseCard */}
            <div className="flex-grow-1 p-3 p-md-4 overflow-y-auto d-flex flex-column gap-3 bg-light bg-opacity-25">
              {messages.map((m) => (
                <MedicalResponseCard key={m.id} message={m} />
              ))}
              {loading && (
                <div className="d-flex align-items-center gap-2 text-primary small p-2 bg-white rounded-3 shadow-sm border w-fit">
                  <FaSpinner className="spinner-border spinner-border-sm" />
                  <span>Trợ lý AI đang tra cứu dữ liệu sức khỏe & cẩm nang lão khoa...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-top bg-white rounded-bottom-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="d-flex gap-2"
              >
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill px-4 shadow-none border fs-6"
                  placeholder={`Đặt câu hỏi về sức khỏe, dinh dưỡng của ${p?.full_name || "người thân"}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn btn-primary rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: "48px", height: "48px" }}
                  disabled={loading || !inputMessage.trim()}
                >
                  <FaPaperPlane size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Relative Selector & Live Vitals Context (30% Width) */}
        <div className="col-12 col-xl-4 col-lg-5">
          <div className="d-flex flex-column gap-3">
            {/* Relative Selector Card */}
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
              <h6 className="fw-bold text-uppercase small text-muted mb-3 d-flex align-items-center gap-2">
                <FaUserCheck className="text-primary" /> Người Thân Được Chăm Sóc
              </h6>
              <div className="d-flex flex-column gap-2">
                {assignedPatients && assignedPatients.length > 0 ? (
                  assignedPatients.map((pat) => {
                    const patCode = pat.patient_code || pat.patient_id || pat.id;
                    const isSelected = patCode === selectedPatientId;
                    return (
                      <button
                        key={patCode}
                        className={`btn text-start p-2 rounded-3 d-flex align-items-center justify-content-between border ${
                          isSelected ? "btn-primary shadow-sm" : "btn-light text-dark"
                        }`}
                        onClick={() => setSelectedPatientId(patCode)}
                      >
                        <div>
                          <div className="fw-bold small">{pat.full_name || pat.fullName}</div>
                          <div className={`extra-small-text ${isSelected ? "text-white-50" : "text-muted"}`}>{patCode} • {pat.age || 71} tuổi</div>
                        </div>
                        <FaChevronRight size={12} className={isSelected ? "text-white" : "text-muted"} />
                      </button>
                    );
                  })
                ) : (
                  <div className="p-2 rounded-3 bg-light text-dark small fw-bold">
                    {selectedPatient?.full_name || "Cụ Nguyễn Văn An"} (PAT10000)
                  </div>
                )}
              </div>
            </div>

            {/* Live Telemetry Health Card */}
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
              <h6 className="fw-bold text-uppercase small text-muted mb-3 d-flex align-items-center gap-2">
                <FaHeartbeat className="text-danger" /> Dữ Liệu Sức Khỏe Thực Tế
              </h6>
              <div className="d-flex flex-column gap-2">
                <div className="p-3 rounded-3 bg-light border">
                  <div className="text-muted extra-small-text text-uppercase fw-bold mb-2">Sinh Hiệu Đo Được Gần Nhất</div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span>Huyết áp:</span>
                    <span className="fw-bold text-dark">{health.blood_pressure} mmHg</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span>Nhịp tim:</span>
                    <span className="fw-bold text-danger">{health.heart_rate} BPM</span>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span>SpO₂:</span>
                    <span className="fw-bold text-primary">{health.spo2}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-3 bg-light border">
                  <div className="text-muted extra-small-text text-uppercase fw-bold mb-1">Thuốc Hôm Nay</div>
                  <div className="fw-bold text-success small mb-1">{meds.text || "2/3 liều đã uống"}</div>
                  <div className="extra-small-text text-muted">Amlodipine (Sáng), Vitamin (Chiều)</div>
                </div>

                <div className="p-3 rounded-3 bg-light border">
                  <div className="text-muted extra-small-text text-uppercase fw-bold mb-1">Camera Phòng</div>
                  <div className="fw-bold text-dark small">{cams.online}/{cams.total} Camera Online</div>
                  <span className="text-success extra-small-text">🟢 AI an toàn trực tuyến 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserAIPage;
