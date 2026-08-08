// ==============================================================================
// TRANG TRÒ CHUYỆN VỚI TRỢ LÝ AI GOOGLE GEMINI (CHATBOTPAGE.JSX)
// ==============================================================================
// Mô tả: Trang quản lý và trò chuyện với Trợ lý AI Chăm sóc Sức khỏe full màn hình
//        Hỗ trợ hiển thị Markdown, danh sách chủ đề tư vấn, cài đặt API Key
//        và quản lý lịch sử trò chuyện chi tiết.
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { sendChatMessage, clearChatSession, checkChatbotStatus } from "../services/chatbotService";

const ChatbotPage = () => {
  // ---------------------------------------------------------------------------
  // Khai báo State quản lý dữ liệu trang
  // ---------------------------------------------------------------------------
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "👋 Xin chào! Tôi là Trợ lý AI Chăm sóc Sức khỏe & Lịch trình Uống thuốc thông minh của hệ thống AI CARE.\n\nBạn có thể hỏi tôi về:\n- 💊 Thông tin và công dụng của các loại thuốc y tế.\n- 🥗 Lịch trình dinh dưỡng và tập luyện cho người cao tuổi.\n- ⏰ Mẹo nhắc nhở uống thuốc đúng giờ.\n- 🩺 Cách theo dõi các chỉ số sức khỏe (Huyết áp, Tim mạch, Đường huyết).",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ configured: true, model: "gemini-2.5-flash", status_message: "Đang kết nối..." });

  const messagesEndRef = useRef(null);

  // Khởi tạo và kiểm tra trạng thái API Gemini Backend
  useEffect(() => {
    const fetchStatus = async () => {
      const res = await checkChatbotStatus();
      if (res && res.success) {
        setStatus(res);
      }
    };
    fetchStatus();
  }, []);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /**
   * Xử lý gửi tin nhắn tới Gemini API
   */
  const handleSend = async (textCustom = null) => {
    const text = (textCustom || inputMessage).trim();
    if (!text || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: text,
      time: timeStr,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!textCustom) setInputMessage("");
    setLoading(true);

    try {
      // Định dạng lịch sử cuộc trò chuyện
      const historyPayload = newMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      const res = await sendChatMessage(text, "full_page_session", historyPayload);

      const aiMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: res.reply || "🤖 Đã phản hồi từ máy chủ Gemini.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "⚠️ Lỗi kết nối tới Trợ lý AI: " + err.message,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xóa lịch sử cuộc trò chuyện
   */
  const handleReset = async () => {
    if (window.confirm("Bạn có chắc chắn muốn làm sạch toàn bộ cuộc trò chuyện?")) {
      await clearChatSession("full_page_session");
      setMessages([
        {
          id: Date.now(),
          sender: "ai",
          text: "🧹 Đã xóa toàn bộ hội thoại. Hãy bắt đầu một chủ đề mới!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: "#f4f6f9", minHeight: "calc(100vh - 70px)" }}>
      {/* ----------------------------------------------------------------------- */}
      {/* TIÊU ĐỀ TRANG VÀ THÔNG TIN CẤU HÌNH                                    */}
      {/* ----------------------------------------------------------------------- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">🤖 Trợ Lý AI Care Gemini</h3>
          <p className="text-muted mb-0">Hệ thống hỏi đáp y tế & tư vấn sức khỏe người cao tuổi bằng AI thông minh</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className={`badge p-2 ${status.configured ? "bg-success" : "bg-warning text-dark"}`}>
            {status.configured ? `✅ AI Ready (${status.model})` : "⚠️ Chưa cấu hình API Key"}
          </span>
          <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={handleReset}>
            🗑️ Xóa Lịch Sử Chat
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* KHUNG NỘI DUNG CUỘC TRÒ CHUYỆN                                          */}
      {/* ----------------------------------------------------------------------- */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ height: "680px", display: "flex", flexDirection: "column" }}>
        {/* THANH THÔNG BÁO HƯỚNG DẪN */}
        <div className="bg-primary text-white p-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: "28px" }}>🩺</span>
            <div>
              <h6 className="mb-0 fw-bold">AI Care Medical Assistant</h6>
              <small className="opacity-75">Hỗ trợ 24/7 - Được tối ưu bởi Google Gemini AI &amp; Trợ Lý Y Tế AI CARE</small>
            </div>
          </div>
        </div>

        {/* CỬA SỔ HIỂN THỊ TIN NHẮN */}
        <div className="card-body p-4 overflow-auto flex-grow-1" style={{ backgroundColor: "#fafbfc" }}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`d-flex mb-4 ${m.sender === "user" ? "justify-content-end" : "justify-content-start"}`}
            >
              <div className="d-flex gap-3" style={{ maxWidth: "75%" }}>
                {m.sender === "ai" && (
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                    🤖
                  </div>
                )}
                <div>
                  <div
                    className={`p-3 rounded-4 shadow-sm ${
                      m.sender === "user" ? "bg-primary text-white rounded-top-end-0" : "bg-white border text-dark rounded-top-start-0"
                    }`}
                    style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", fontSize: "15px" }}
                  >
                    {m.text}
                  </div>
                  <div className={`small text-muted mt-1 ${m.sender === "user" ? "text-end" : "text-start"}`} style={{ fontSize: "11px" }}>
                    {m.time}
                  </div>
                </div>
                {m.sender === "user" && (
                  <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                    👤
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                🤖
              </div>
              <div className="bg-white border p-3 rounded-4 shadow-sm text-muted">
                <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                Trợ lý Gemini đang phân tích dữ liệu và trả lời...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* CHÂN TRANG NHẬP CÂU HỎI */}
        <div className="card-footer p-3 bg-white border-top">
          {/* NÚT GỢI Ý TRA CỨU NHANH */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <span className="small text-muted fw-bold d-flex align-items-center me-1">🔍 Gợi ý tra cứu:</span>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-pill px-3"
              onClick={() => handleSend("Tìm thông tin bệnh nhân PAT10001")}
            >
              📋 Bệnh nhân PAT10001
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-pill px-3"
              onClick={() => handleSend("Ai là người nhà của bệnh nhân PAT10001?")}
            >
              👨‍👩‍👧 Người nhà PAT10001
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-pill px-3"
              onClick={() => handleSend("Bác sĩ phụ trách bệnh nhân PAT10001 là ai?")}
            >
              👨‍⚕️ Bác sĩ điều trị
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-pill px-3"
              onClick={() => handleSend("Hướng dẫn sử dụng thuốc Amlodipine 5mg")}
            >
              💊 Thuốc Amlodipine
            </button>
          </div>

          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-lg border-1 bg-light rounded-pill-start px-4"
              placeholder="Nhập câu hỏi hoặc yêu cầu tư vấn y tế cho AI Care Gemini..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
            />
            <button
              className="btn btn-primary px-4 fw-bold rounded-pill-end d-flex align-items-center gap-2"
              onClick={() => handleSend()}
              disabled={loading || !inputMessage.trim()}
            >
              <span>Gửi Tin Nhắn</span>
              <span>➤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
