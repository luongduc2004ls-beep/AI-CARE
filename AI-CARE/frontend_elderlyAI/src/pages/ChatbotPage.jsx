// ==============================================================================
// TRANG TRỢ LÝ AI Y TẾ CHĂM SÓC SỨC KHỎE (CHATBOTPAGE.JSX)
// ==============================================================================
// Giao diện 3-Pane Medical AI Assistant:
// [Sidebar Hội thoại] | [Khung Chat AI + Quick Actions] | [Patient Context Panel]
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaTrashAlt,
  FaSpinner,
  FaUserInjured,
  FaShieldAlt,
  FaBrain,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory,
  FaInfoCircle
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { sendChatMessage, clearChatSession, checkChatbotStatus } from "../services/chatbotService";
import PatientContextPanel from "../components/Chatbot/PatientContextPanel";
import StructuredAIResponse from "../components/Chatbot/StructuredAIResponse";
import QuickActionChips from "../components/Chatbot/QuickActionChips";

const SAMPLE_PATIENTS = [
  { id: "PAT10000", name: "Nguyễn Văn An", age: 71, gender: "Nam", room: "Phòng ngủ 101" },
  { id: "PAT10001", name: "Trần Thị Bình", age: 68, gender: "Nữ", room: "Phòng khách trung tâm" },
  { id: "PAT10002", name: "Lê Văn Cường", age: 75, gender: "Nam", room: "Nhà vệ sinh tầng 1" },
  { id: "PAT10003", name: "Phạm Thị Dung", age: 80, gender: "Nữ", room: "Phòng ngủ 102" },
];

function ChatbotPage() {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || "Admin";

  const [selectedPatient, setSelectedPatient] = useState(SAMPLE_PATIENTS[0]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      role: "assistant",
      text: `👋 Xin chào! Tôi là Trợ lý AI Y Tế của hệ thống ElderlyCare AI.\n\nTôi đang theo dõi hồ sơ sức khỏe và dữ liệu camera của **${SAMPLE_PATIENTS[0].name} (${SAMPLE_PATIENTS[0].id})**.\n\nBạn có thể hỏi tôi về:\n- 🩺 **Tình trạng sinh hiệu**: Nhịp tim, Huyết áp, SpO₂ hiện tại.\n- 💊 **Lịch uống thuốc**: Các cữ thuốc hôm nay hoặc kiểm tra ai quên uống.\n- 🚨 **Cảnh báo an toàn**: Đánh giá nguy cơ té ngã và sự cố gần đây.\n- 📹 **Trạng thái camera**: Kiểm tra kết nối các mắt cam trong nhà.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ configured: true, model: "gemini-2.5-flash", status_message: "Đang kết nối..." });
  const [activeTool, setActiveTool] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await checkChatbotStatus();
      if (res && res.success) {
        setStatus(res);
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (customText = null) => {
    const text = (customText || inputMessage).trim();
    if (!text || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = {
      id: Date.now(),
      sender: "user",
      role: "user",
      text: text,
      content: text,
      time: timeStr,
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    if (!customText) setInputMessage("");
    setLoading(true);
    setActiveTool("Đang truy vấn cơ sở dữ liệu hệ thống...");

    try {
      const historyPayload = newMsgs.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text || m.content,
      }));

      const res = await sendChatMessage(
        text,
        `conv_${selectedPatient.id}`,
        selectedPatient.id,
        historyPayload,
        userRole,
        currentUser?.user_id || currentUser?.id || 1
      );

      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        role: "assistant",
        text: res.reply || "🤖 Đã nhận phản hồi từ hệ thống.",
        content: res.reply || "🤖 Đã nhận phản hồi từ hệ thống.",
        structured_data: res.structured_data,
        tools_called: res.tools_called,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Lỗi chat:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          role: "assistant",
          text: `⚠️ Không thể kết nối tới AI Assistant: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
      setActiveTool(null);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này?")) {
      await clearChatSession(`conv_${selectedPatient.id}`);
      setMessages([
        {
          id: Date.now(),
          sender: "ai",
          role: "assistant",
          text: `Đã làm sạch lịch sử hội thoại cho bệnh nhân **${selectedPatient.name}**. Bạn có thể bắt đầu câu hỏi mới!`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    }
  };

  return (
    <div className="container-fluid p-0" style={{ height: "calc(100vh - 75px)", backgroundColor: "var(--bg-main)" }}>
      <div className="row g-0 h-100">
        {/* ========================================================================= */}
        {/* PANE 1 (LEFT): BỆNH NHÂN ĐANG THEO DÕI & LỊCH SỬ HỘI THOẠI */}
        {/* ========================================================================= */}
        <div className="col-12 col-md-3 col-xl-2.5 d-none d-md-flex flex-column h-100 p-3 border-end" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="extra-small-text text-uppercase fw-bold text-muted">CHỌN BỆNH NHÂN</span>
            <span className="badge bg-primary bg-opacity-20 text-primary extra-small-text">{SAMPLE_PATIENTS.length} hồ sơ</span>
          </div>

          <div className="d-flex flex-column gap-2 overflow-y-auto flex-grow-1">
            {SAMPLE_PATIENTS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn text-start p-2.5 rounded-3 d-flex align-items-center gap-2.5 transition-all ${selectedPatient.id === p.id ? "btn-primary" : "btn-dark border border-secondary border-opacity-25"}`}
                onClick={() => {
                  setSelectedPatient(p);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now(),
                      sender: "ai",
                      role: "assistant",
                      text: `Đã chuyển ngữ cảnh theo dõi sang bệnh nhân **${p.name} (${p.id})** tại **${p.room}**.`,
                      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                  ]);
                }}
              >
                <div className="p-2 rounded-circle bg-dark text-white">
                  <FaUserInjured />
                </div>
                <div className="overflow-hidden lh-sm flex-grow-1">
                  <strong className="body-text d-block text-truncate text-white">{p.name}</strong>
                  <span className="extra-small-text text-muted">{p.id} · {p.room}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Engine Status Card at bottom left */}
          <div className="p-2.5 rounded-3 mt-3 bg-dark border border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2 extra-small-text text-muted">
              <FaBrain className="text-primary" />
              <span>Model: <strong className="text-white">{status.model}</strong></span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANE 2 (CENTER): KHUNG CHAT AI & THỰC THI TOOLS */}
        {/* ========================================================================= */}
        <div className="col-12 col-md-6 col-xl-6.5 d-flex flex-column h-100">
          {/* Chat Header */}
          <div className="p-3 px-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: "var(--bg-card-subtle)", borderBottom: "1px solid var(--border-color)" }}>
            <div className="d-flex align-items-center gap-2.5">
              <div className="p-2 rounded-3 bg-primary text-white fs-5">
                <FaRobot />
              </div>
              <div>
                <h2 className="section-title fs-6 mb-0 text-white">Trợ Lý AI Y Tế &amp; Giám Sát Sức Khỏe</h2>
                <span className="extra-small-text text-muted">
                  Đang phân tích trực tiếp cho: <strong className="text-primary">{selectedPatient.name}</strong> ({selectedPatient.id})
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger rounded-2 d-flex align-items-center gap-1 extra-small-text"
              onClick={handleClearHistory}
              title="Xóa lịch sử cuộc trò chuyện"
            >
              <FaTrashAlt /> Xóa hội thoại
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-grow-1 p-4 overflow-y-auto" style={{ backgroundColor: "var(--bg-main)" }}>
            {messages.map((msg) => (
              <StructuredAIResponse key={msg.id} message={msg} />
            ))}

            {loading && (
              <div className="d-flex align-items-center gap-2 p-3 rounded-4 mb-3" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)", maxWidth: "80%" }}>
                <FaSpinner className="spinner-border spinner-border-sm text-primary" />
                <span className="body-text text-muted">{activeTool || "AI đang phân tích và xử lý câu trả lời..."}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Trigger Chips */}
          <QuickActionChips onSelectAction={(prompt) => handleSendMessage(prompt)} disabled={loading} userRole={userRole} />

          {/* Chat Input Bar */}
          <div className="p-3" style={{ backgroundColor: "var(--bg-card-subtle)", borderTop: "1px solid var(--border-color)" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="d-flex gap-2 align-items-center"
            >
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary body-text py-2.5 px-3 rounded-3"
                placeholder={`Nhập câu hỏi cho trợ lý AI về ${selectedPatient.name}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="btn btn-primary px-4 py-2.5 rounded-3 d-flex align-items-center gap-2 fw-semibold"
              >
                <FaPaperPlane /> Gửi
              </button>
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANE 3 (RIGHT): PATIENT CONTEXT PANEL (LIVE TELEMETRY) */}
        {/* ========================================================================= */}
        <div className="col-12 col-md-3 col-xl-3.5 d-none d-lg-block h-100">
          <PatientContextPanel patient={selectedPatient} userRole={userRole} />
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;
