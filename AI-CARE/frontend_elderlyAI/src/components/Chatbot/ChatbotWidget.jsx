// ==============================================================================
// GIAO DIỆN NÚT VÀ CỬA SỔ CHATBOT AI NỔI (CHATBOTWIDGET.JSX)
// ==============================================================================
// Mô tả: Component React hiển thị nút bấm nổi ở góc phải màn hình. Khi nhấp vào,
//        cửa sổ Chatbot Gemini AI sẽ mở ra với giao diện hiện đại, bóng bẩy,
//        hỗ trợ câu hỏi gợi ý nhanh, hiệu ứng gõ phím và xóa lịch sử trò chuyện.
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { sendChatMessage, clearChatSession } from "../../services/chatbotService";

const ChatbotWidget = () => {
  // ---------------------------------------------------------------------------
  // Khai báo các State quản lý trạng thái giao diện
  // ---------------------------------------------------------------------------
  const [isOpen, setIsOpen] = useState(false); // Trạng thái đóng/mở cửa sổ chat
  const [inputMessage, setInputMessage] = useState(""); // Tin nhắn đang nhập
  const [loading, setLoading] = useState(false); // Trạng thái chờ phản hồi từ Gemini API
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Xin chào! Tôi là **Trợ lý AI CARE**. Tôi có thể giúp gì cho sức khỏe và lịch trình uống thuốc của bạn hôm nay?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Tham chiếu tới phần tử cuối danh sách tin nhắn để tự động cuộn xuống
  const chatEndRef = useRef(null);

  // Danh sách các câu hỏi gợi ý nhanh cho người dùng
  const quickSuggestions = [
    "💊 Cách sắp xếp lịch uống thuốc hiệu quả?",
    "🥗 Thực đơn tốt cho người cao tuổi bị huyết áp?",
    "🏃 Bài tập thể dục nhẹ nhàng hàng ngày?",
    "⚠️ Nhận biết dấu hiệu đột quỵ sớm?",
  ];

  // Tự động cuộn xuống dưới cùng mỗi khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  /**
   * Xử lý gửi tin nhắn mới
   * 
   * @param {string} textToSend - Nội dung tin nhắn cần gửi (truyền vào hoặc lấy từ state inputMessage)
   */
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Tạo đối tượng tin nhắn người dùng mới
    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: text,
      time: currentTime,
    };

    // Đưa tin nhắn người dùng vào danh sách hiển thị
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputMessage("");
    setLoading(true);

    try {
      // Chuẩn bị lịch sử trò chuyện ngắn gọn gửi lên Backend
      const historyContext = updatedMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      // Gọi API kết nối Backend Flask -> Gemini API
      const result = await sendChatMessage(text, "widget_user_session", historyContext);

      const aiReplyText = result.reply || "🤖 Đã nhận phản hồi từ hệ thống.";

      // Tạo đối tượng tin nhắn phản hồi từ AI
      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: aiReplyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn Chatbot:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "⚠️ Đã xảy ra lỗi kết nối với Trợ lý AI. Vui lòng kiểm tra lại kết nối mạng hoặc API Key.",
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
  const handleClearHistory = async () => {
    if (window.confirm("Bạn có chắc chắn muốn làm sạch lịch sử cuộc trò chuyện này?")) {
      await clearChatSession("widget_user_session");
      setMessages([
        {
          id: Date.now(),
          sender: "ai",
          text: "🧹 Đã làm sạch hội thoại. Bạn muốn tôi hỗ trợ thông tin gì tiếp theo?",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  /**
   * Xử lý nhấn phím Enter để gửi tin nhắn
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 99999 }}>
      {/* ----------------------------------------------------------------------- */}
      {/* NÚT BẤM NỔI ĐÓNG/MỞ CHATBOT (FLOATING ACTION BUTTON)                      */}
      {/* ----------------------------------------------------------------------- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary rounded-circle p-0 d-flex align-items-center justify-content-center shadow-lg"
          style={{
            width: "60px",
            height: "60px",
            background: "linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)",
            border: "none",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            cursor: "pointer",
          }}
          title="Trò chuyện với Trợ lý AI CARE Gemini"
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
        >
          <span style={{ fontSize: "28px" }}>🤖</span>
          <span
            className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle"
            style={{ animation: "pulse 2s infinite" }}
          >
            <span className="visually-hidden">AI mới</span>
          </span>
        </button>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* CỬA SỔ KHUNG CHAT (CHATBOT WINDOW POPUP)                                */}
      {/* ----------------------------------------------------------------------- */}
      {isOpen && (
        <div
          className="card shadow-lg border-0 rounded-4 overflow-hidden"
          style={{
            width: "380px",
            maxHeight: "600px",
            height: "80vh",
            display: "flex",
            flexDirection: "column",
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* ----- HEADER CHATBOT ----- */}
          <div
            className="card-header text-white d-flex align-items-center justify-content-between p-3 border-0"
            style={{ background: "linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)" }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "38px", height: "38px", fontSize: "20px" }}
              >
                🤖
              </div>
              <div>
                <h6 className="mb-0 fw-bold" style={{ fontSize: "15px" }}>AI CARE Assistant</h6>
                <small className="opacity-75 d-flex align-items-center gap-1" style={{ fontSize: "11px" }}>
                  <span className="bg-success rounded-circle d-inline-block" style={{ width: "7px", height: "7px" }}></span>
                  Google Gemini Powered
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="btn btn-sm text-white-50 text-hover-white p-1 border-0"
                title="Làm sạch hội thoại"
                style={{ background: "transparent" }}
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-sm text-white p-1 border-0"
                style={{ background: "transparent", fontSize: "18px" }}
                title="Đóng cửa sổ"
              >
                ✖
              </button>
            </div>
          </div>

          {/* ----- KHU VỰC HIỂN THỊ NỘI DUNG TIN NHẮN (MESSAGE BODY) ----- */}
          <div
            className="card-body p-3 overflow-auto flex-grow-1"
            style={{ backgroundColor: "#f8f9fa", display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`d-flex flex-column ${msg.sender === "user" ? "align-items-end" : "align-items-start"}`}
              >
                <div
                  className={`p-3 rounded-4 shadow-sm text-break ${
                    msg.sender === "user"
                      ? "bg-primary text-white rounded-bottom-end-0"
                      : "bg-white text-dark border border-light rounded-bottom-start-0"
                  }`}
                  style={{ maxWidth: "85%", fontSize: "14px", lineHeight: "1.5" }}
                >
                  {msg.text}
                </div>
                <small className="text-muted mt-1 px-1" style={{ fontSize: "10px" }}>
                  {msg.time}
                </small>
              </div>
            ))}

            {/* Hiệu ứng ba chấm động khi AI đang suy nghĩ */}
            {loading && (
              <div className="d-flex align-items-center gap-2 p-3 bg-white rounded-4 border border-light shadow-sm" style={{ width: "fit-content" }}>
                <span className="spinner-grow spinner-grow-sm text-primary" role="status"></span>
                <span className="text-muted" style={{ fontSize: "13px" }}>Gemini đang suy nghĩ...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ----- NÚT GỢI Ý CÂU HỎI NHANH (QUICK SUGGESTIONS) ----- */}
          {messages.length <= 3 && !loading && (
            <div className="px-3 py-2 bg-light border-top overflow-auto d-flex gap-1" style={{ whiteSpace: "nowrap" }}>
              {quickSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item)}
                  className="btn btn-sm btn-outline-secondary rounded-pill py-1 px-2"
                  style={{ fontSize: "11px" }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {/* ----- CHÂN TRANG NHẬP TIN NHẮN (FOOTER INPUT) ----- */}
          <div className="card-footer p-2 bg-white border-top">
            <div className="input-group">
              <input
                type="text"
                className="form-control border-0 bg-light rounded-pill px-3"
                placeholder="Nhập câu hỏi cho AI CARE..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{ fontSize: "14px" }}
              />
              <button
                className="btn btn-primary rounded-circle ms-2 d-flex align-items-center justify-content-center"
                onClick={() => handleSendMessage()}
                disabled={loading || !inputMessage.trim()}
                style={{ width: "38px", height: "38px" }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
