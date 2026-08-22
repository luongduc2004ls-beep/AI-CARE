// ==============================================================================
// GIAO DIỆN CHATBOT HYBRID AI MEDICAL ASSISTANT (CHATBOTWIDGET.JSX)
// ==============================================================================
// Tích hợp:
// 1. Phân quyền RBAC (Admin Scope vs Patient Scope)
// 2. Tách biệt bộ nhớ hội thoại theo Người dùng & Bệnh nhân
// 3. Render Markdown y khoa chuẩn xác (bảng biểu, danh sách, in đậm)
// 4. Quick Suggestions linh hoạt theo Vai Trò (Y khoa & CSDL)
// 5. Nguồn dữ liệu minh bạch (Database / Medical Knowledge / Mixed)
// ==============================================================================

import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaRobot, FaPaperPlane, FaTrashAlt, FaTimes, FaComments, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { usePatient } from "../context/PatientContext";
import { sendChatMessage, clearChatSession, getConversationMessages } from "../services/chatbotService";
import "./ChatbotWidget.css";

export default function ChatbotWidget() {
  const { currentUser, isAuthenticated } = useAuth();
  const { selectedPatient, patientCode } = usePatient();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  
  const isAdmin = currentUser?.role === "Admin";
  const activePatientCode = patientCode || selectedPatient?.patient_code || currentUser?.patient_code || "PAT10000";
  const activePatientName = selectedPatient?.name || selectedPatient?.full_name || currentUser?.full_name || "Người bệnh";

  // Tạo conversationId động gắn với user_id và role/patient
  const conversationId = useMemo(() => {
    const uid = currentUser?.user_id || "guest";
    const scope = isAdmin ? "admin_system" : (activePatientCode || "pat_scope");
    return `conv_${uid}_${scope}`;
  }, [currentUser?.user_id, isAdmin, activePatientCode]);

  const chatBodyRef = useRef(null);

  // Danh sách gợi ý câu hỏi nhanh linh hoạt theo vai trò
  const quickSuggestions = useMemo(() => {
    if (isAdmin) {
      return [
        "👥 Những bệnh nhân có khả năng ngã cao",
        "🌸 Những bệnh nhân dị ứng phấn hoa",
        "💊 Ai chưa uống thuốc hôm nay?",
        "⚠️ Có bao nhiêu bệnh nhân nguy cơ té ngã cao?",
        "📹 Camera nào đang offline?",
        "📊 Báo cáo hệ thống toàn viện"
      ];
    }
    return [
      "❤️ Sức khỏe hôm nay của tôi thế nào?",
      "💊 Thuốc hôm nay của tôi",
      "🥗 Bệnh nhân tiểu đường nên ăn gì?",
      "🏃 Người cao tuổi nên tập thể dục bao lâu?",
      "⚠️ Dấu hiệu cảnh báo sớm đột quỵ là gì?"
    ];
  }, [isAdmin]);

  // Khởi tạo tin nhắn chào mừng hoặc tải lịch sử khi đổi phiên hội thoại
  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      if (!conversationId) return;
      try {
        const history = await getConversationMessages(conversationId);
        if (isMounted && history && history.length > 0) {
          const formatted = history.map((m) => ({
            id: m.message_id || Date.now() + Math.random(),
            sender: m.role === "user" ? "user" : "bot",
            text: m.content,
            time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
            metadata: m.structured_data ? JSON.parse(m.structured_data) : null
          }));
          setMessages(formatted);
          return;
        }
      } catch (err) {
        console.warn("Không thể tải lịch sử chat cũ, tạo lời chào mới:", err);
      }

      // Lời chào mặc định theo Role
      const welcomeText = isAdmin
        ? `Xin chào **${currentUser?.full_name || "Quản trị viên"}**! Tôi là **Trợ lý Y Tế & Quản Trị Hệ Thống ElderlyCare AI**.\n\nTôi có thể hỗ trợ bạn:\n- 👥 **Tra cứu CSDL**: Danh sách bệnh nhân nguy cơ ngã cao, dị ứng, cữ thuốc chưa uống\n- 🩺 **Y khoa Lâm sàng**: Chế độ dinh dưỡng, xử trí cấp cứu đột quỵ, dược lý thuốc\n- 📊 **Quản trị hệ thống**: Báo cáo telemetry camera, thống kê toàn viện.`
        : `Xin chào! Tôi là **Trợ lý Y Tế AI ElderlyCare** đồng hành cùng **${activePatientName}** (${activePatientCode}).\n\nBạn có thể hỏi tôi về:\n- 💊 Lịch uống thuốc và đơn thuốc hôm nay\n- ❤️ Chỉ số huyết áp, nhịp tim và SpO₂\n- 🥗 Chế độ ăn uống dinh dưỡng phù hợp\n- 🏃 Bài tập vận động thể dục an toàn.`;

      if (isMounted) {
        setMessages([
          {
            id: "welcome_msg",
            sender: "bot",
            text: welcomeText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            metadata: { data_source: "system_greeting" }
          }
        ]);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [conversationId, isAdmin, activePatientCode, activePatientName, currentUser?.full_name]);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    if (chatBodyRef.current && isOpen) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isOpen, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Thêm tin nhắn của User vào danh sách UI
    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: text,
      time: currentTime
    };

    const updatedList = [...messages, userMsg];
    setMessages(updatedList);
    if (!textToSend) setInputMessage("");
    setLoading(true);

    try {
      // 2. Chuẩn bị context lịch sử gửi lên Backend
      const historyContext = updatedList.slice(-8).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text
      }));

      // 3. Gửi tới Backend API
      const res = await sendChatMessage({
        message: text,
        conversationId: conversationId,
        patientCode: activePatientCode,
        history: historyContext,
        userRole: currentUser?.role || "User",
        userId: currentUser?.user_id
      });

      const replyText = res?.reply || res?.message?.content || "🤖 Đã nhận phản hồi từ hệ thống.";
      const meta = res?.metadata;

      // 4. Thêm tin nhắn phản hồi của Bot
      const botMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        metadata: meta,
        isForbidden: res?.forbidden
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "⚠️ Đã xảy ra lỗi kết nối với máy chủ AI. Vui lòng thử lại sau.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("Bạn có chắc chắn muốn làm mới toàn bộ cuộc trò chuyện này?")) {
      try {
        await clearChatSession(conversationId);
        setMessages([
          {
            id: Date.now(),
            sender: "bot",
            text: "🧹 Đã làm mới phiên trò chuyện. Tôi có thể hỗ trợ gì tiếp theo cho bạn?",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } catch (err) {
        console.error("Lỗi xóa chat:", err);
      }
    }
  };

  const renderSourceBadge = (meta) => {
    if (!meta || !meta.data_source || meta.data_source === "system_greeting") return null;
    const src = meta.data_source;
    let label = "ℹ️ Kiến thức Y Khoa";
    let cls = "bg-info-subtle text-info border";

    if (src === "database") {
      label = "🗄️ CSDL Bệnh Viện";
      cls = "bg-primary-subtle text-primary border";
    } else if (src.includes("database") && src.includes("medical")) {
      label = "🩺 CSDL + Y Khoa Lâm Sàng";
      cls = "bg-success-subtle text-success border";
    } else if (src === "system_data") {
      label = "📊 Quản Trị Hệ Thống";
      cls = "bg-warning-subtle text-warning border";
    } else if (src === "access_control_denied") {
      label = "🔒 Phân Quyền Bảo Vệ";
      cls = "bg-danger-subtle text-danger border";
    }

    return <span className={`ai-care-source-badge ${cls}`}>{label}</span>;
  };

  return (
    <div className="ai-care-widget-container">
      {/* Nút Chat tròn nổi góc dưới */}
      <button
        className="ai-care-widget-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Mở Trợ Lý Y Tế AI"
        title="Trợ Lý Y Tế AI ElderlyCare"
      >
        {isOpen ? <FaTimes size={24} /> : <FaComments size={26} />}
      </button>

      {/* Cửa sổ Chatbot */}
      <div className={`ai-care-widget-window ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="ai-care-header">
          <div className="ai-care-header-title">
            <span className="ai-care-status-dot"></span>
            <div>
              <div className="fw-bold d-flex align-items-center gap-1.5">
                <FaRobot /> ElderlyCare AI Medical
              </div>
              <small style={{ fontSize: "11px", opacity: 0.85, fontWeight: "normal" }}>
                {isAdmin ? "🛡️ Quản trị toàn viện" : `🔒 Hồ sơ: ${activePatientCode}`}
              </small>
            </div>
          </div>
          <div className="ai-care-header-actions">
            <button
              className="ai-care-icon-btn"
              onClick={handleClearChat}
              title="Làm mới cuộc trò chuyện"
            >
              <FaTrashAlt />
            </button>
            <button
              className="ai-care-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng Chatbot"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Thân Chat & Danh sách Tin nhắn */}
        <div className="ai-care-body" ref={chatBodyRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-care-msg ${msg.sender}`}>
              <div className="ai-care-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
              </div>
              <div className="ai-care-msg-meta">
                <span>{msg.time}</span>
                {msg.sender === "bot" && renderSourceBadge(msg.metadata)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-care-msg bot loading">
              <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
              <span>Gemini AI đang phân tích dữ liệu lâm sàng...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestions Pills */}
        <div className="ai-care-suggestions">
          {quickSuggestions.map((sug, idx) => (
            <button
              key={idx}
              className="ai-care-suggestion-pill"
              onClick={() => handleSendMessage(sug)}
              disabled={loading}
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Footer & Khung nhập tin nhắn */}
        <form
          className="ai-care-footer"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            type="text"
            className="ai-care-input"
            placeholder={isAdmin ? "Hỏi về bệnh nhân, thuốc, cảnh báo, camera..." : "Hỏi về thuốc, sinh hiệu, dinh dưỡng..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="ai-care-send-btn"
            disabled={!inputMessage.trim() || loading}
            aria-label="Gửi tin nhắn"
          >
            <FaPaperPlane size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
