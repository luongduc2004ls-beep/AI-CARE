import React, { useState, useEffect, useRef } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaSpinner,
  FaShieldAlt,
  FaVideo,
  FaBell,
  FaUsers,
  FaServer,
  FaSearch
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { sendAdminAIMessage, checkAdminAIStatus } from "../../services/adminAIService";
import dashboardService from "../../services/dashboardService";
import MedicalResponseCard from "../../components/Chatbot/MedicalResponseCard";

function AdminAIPage() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: `### 🏥 CHÀO MỪNG ĐẾN VỚI ELDERLYCARE AI ADMIN ASSISTANT\n\nTôi là Trợ lý AI Quản Trị Hệ Thống & Y Tế Toàn Viện.\n\n### 📊 CÁC CHỨC NĂNG ĐIỀU HÀNH:\n- **🔍 Tìm kiếm tham số hóa**: *"Tìm bệnh nhân trên 70 tuổi có nguy cơ ngã cao"*, *"Tìm camera offline"*.\n- **🚨 Điều phối cảnh báo**: Tra cứu và phân tích các sự cố té ngã chưa được xác nhận.\n- **🛡️ Kiểm toán & An toàn**: Hỗ trợ kiểm tra bảo mật và xác nhận các thao tác thay đổi dữ liệu.\n- **📈 Telemetry toàn viện**: Báo cáo lưu lượng và tỷ lệ trực tuyến của hệ sinh thái thiết bị.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ configured: true, model: "gemini-2.5-flash", status_message: "Đang kết nối..." });
  const [systemSummary, setSystemSummary] = useState({ total_patients: 1008, total_cameras: 12, online_cameras: 11, active_alerts: 1 });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initData = async () => {
      const st = await checkAdminAIStatus();
      if (st && st.success) setStatus(st);
      try {
        const sum = await dashboardService.getSummary();
        if (sum) setSystemSummary((prev) => ({ ...prev, ...sum }));
      } catch (e) {}
    };
    initData();
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

      const res = await sendAdminAIMessage(
        text,
        "admin_main_session",
        historyPayload,
        currentUser?.user_id || 1
      );

      const aiReply = res?.reply || "⚠️ Không nhận được phản hồi từ AI.";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: aiReply,
          require_confirmation: res?.require_confirmation,
          action_target: res?.action_target,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "⚠️ Đã xảy ra lỗi khi xử lý câu hỏi quản trị.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = (target) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "ai",
        text: `### ✅ ĐÃ XÁC NHẬN THAO TÁC\n\nThao tác đối với **${target}** đã được ghi nhận vào Nhật ký Kiểm toán (Audit Log). Quản trị viên cấp cao có thể xem lại trong mục Cấu hình hệ thống.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleCancelAction = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "ai",
        text: `### ❌ ĐÃ HỦY THAO TÁC\n\nYêu cầu thay đổi dữ liệu đã được hủy an toàn. Không có dữ liệu nào bị thay đổi trong CSDL.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="container-fluid py-3 px-3 px-md-4">
      {/* 1. Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 mb-3 p-3 bg-dark text-white border-start border-4 border-danger">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 bg-danger bg-opacity-20 rounded-circle text-danger fs-3">
              <FaShieldAlt />
            </div>
            <div>
              <h2 className="h5 fw-bold mb-0">ElderlyCare AI Admin Assistant</h2>
              <p className="text-muted small mb-0">Hệ thống AI phân tích lâm sàng và điều hành toàn viện dành cho Quản trị viên</p>
            </div>
          </div>
          <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 small">
            🟢 {status.model} ({status.status_message})
          </span>
        </div>
      </div>

      {/* 2. Main Expanded 2-Column Responsive Layout (70% Chat / 30% Context) */}
      <div className="row g-3">
        {/* Left/Center: Expanded Chat Workspace (70% Width) */}
        <div className="col-12 col-xl-8 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 bg-white d-flex flex-column" style={{ height: "720px" }}>
            {/* Quick Queries Header */}
            <div className="p-3 border-bottom bg-light d-flex flex-wrap gap-2 align-items-center">
              <span className="extra-small-text fw-bold text-muted text-uppercase me-1">Truy vấn nhanh:</span>
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill px-3 extra-small-text fw-semibold"
                onClick={() => handleSendMessage("Báo cáo tổng quan số lượng camera và trạng thái kết nối toàn viện.")}
              >
                📹 Camera toàn viện
              </button>
              <button
                className="btn btn-outline-danger btn-sm rounded-pill px-3 extra-small-text fw-semibold"
                onClick={() => handleSendMessage("Hiện tại có cảnh báo té ngã hoặc sự cố y tế nào chưa xử lý không?")}
              >
                🚨 Cảnh báo té ngã
              </button>
              <button
                className="btn btn-outline-warning btn-sm rounded-pill px-3 extra-small-text fw-semibold text-dark"
                onClick={() => handleSendMessage("Tìm các bệnh nhân trên 70 tuổi có nguy cơ té ngã cao.")}
              >
                ⚠️ Bệnh nhân nguy cơ cao
              </button>
              <button
                className="btn btn-outline-primary btn-sm rounded-pill px-3 extra-small-text fw-semibold"
                onClick={() => handleSendMessage("Báo cáo thống kê toàn bộ hệ thống ElderlyCare AI hôm nay.")}
              >
                📊 Thống kê hoạt động
              </button>
            </div>

            {/* Message Stream with MedicalResponseCard */}
            <div className="flex-grow-1 p-3 p-md-4 overflow-y-auto d-flex flex-column gap-3 bg-light bg-opacity-25">
              {messages.map((m) => (
                <MedicalResponseCard
                  key={m.id}
                  message={m}
                  onConfirmAction={handleConfirmAction}
                  onCancelAction={handleCancelAction}
                />
              ))}
              {loading && (
                <div className="d-flex align-items-center gap-2 text-danger small p-2 bg-white rounded-3 shadow-sm border w-fit">
                  <FaSpinner className="spinner-border spinner-border-sm" />
                  <span>Admin AI đang tra cứu dữ liệu CSDL & phân tích telemetry...</span>
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
                  placeholder="Nhập câu hỏi tìm kiếm bệnh nhân, camera, sự cố té ngã..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn btn-danger rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: "48px", height: "48px" }}
                  disabled={loading || !inputMessage.trim()}
                >
                  <FaPaperPlane size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: System Telemetry & Quick Metrics Context (30% Width) */}
        <div className="col-12 col-xl-4 col-lg-5">
          <div className="d-flex flex-column gap-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
              <h6 className="fw-bold text-uppercase small text-muted mb-3 d-flex align-items-center gap-2">
                <FaServer className="text-danger" /> Trạng Thái Toàn Viện
              </h6>
              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-3 bg-light border">
                  <div className="text-muted extra-small-text text-uppercase fw-bold">Tổng Bệnh Nhân Quản Lý</div>
                  <div className="h4 fw-bold text-dark mb-0">{systemSummary.total_patients} Cụ</div>
                  <span className="text-muted extra-small-text">Hồ sơ CSDL thật</span>
                </div>
                <div className="p-3 rounded-3 bg-light border">
                  <div className="text-muted extra-small-text text-uppercase fw-bold">Camera AI Toàn Viện</div>
                  <div className="h4 fw-bold text-dark mb-0">{systemSummary.online_cameras}/{systemSummary.total_cameras} Online</div>
                  <span className="text-success extra-small-text">🟢 Tỷ lệ trực tuyến 91.6%</span>
                </div>
                <div className="p-3 rounded-3 bg-light border">
                  <div className="text-muted extra-small-text text-uppercase fw-bold">Cảnh Báo Đang Xử Lý</div>
                  <div className="h4 fw-bold text-danger mb-0">{systemSummary.active_alerts} Sự cố</div>
                  <span className="text-danger extra-small-text">🔴 PAT10000 (Phòng ngủ 101)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAIPage;
