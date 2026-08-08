// ==============================================================================
// SERVICE GIAO TIẾP VỚI API CHATBOT GEMINI AI (CHATBOTSERVICE.JS)
// ==============================================================================
// Tác giả: AI CARE Team
// Mô tả: File cung cấp các hàm gọi API sang Flask Backend để nhận phản hồi
//        từ Google Gemini AI Chatbot và quản lý trạng thái hội thoại.
// ==============================================================================

import api from "./api";

/**
 * Gửi tin nhắn từ người dùng tới Gemini Chatbot API.
 * 
 * @param {string} message - Nội dung tin nhắn người dùng nhập.
 * @param {string} sessionId - Mã phiên hội thoại (Session ID).
 * @param {Array} history - Danh sách tin nhắn trước đó để giữ ngữ cảnh.
 * @returns {Promise<Object>} Phản hồi từ Backend { success, reply, session_id, error }
 */
export const sendChatMessage = async (message, sessionId = "default_session", history = []) => {
  try {
    const response = await api.post("/chatbot/chat", {
      message,
      session_id: sessionId,
      history,
    });
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn tới Chatbot API:", error);
    return {
      success: false,
      reply: `⚠️ Không thể kết nối tới máy chủ Chatbot: ${error.message}`,
      session_id: sessionId,
      error: error.message,
    };
  }
};

/**
 * Xóa lịch sử cuộc trò chuyện của một phiên hội thoại cụ thể.
 * 
 * @param {string} sessionId - Mã phiên hội thoại cần xóa.
 * @returns {Promise<Object>} Phản hồi kết quả xóa.
 */
export const clearChatSession = async (sessionId = "default_session") => {
  try {
    const response = await api.post("/chatbot/clear", {
      session_id: sessionId,
    });
    return response;
  } catch (error) {
    console.error("Lỗi khi làm sạch phiên chat:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Kiểm tra trạng thái cấu hình và kết nối của Gemini AI Chatbot.
 * 
 * @returns {Promise<Object>} Thông tin trạng thái { success, configured, model, status_message }
 */
export const checkChatbotStatus = async () => {
  try {
    const response = await api.get("/chatbot/status");
    return response;
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái Chatbot:", error);
    return {
      success: false,
      configured: false,
      status_message: "Không thể kết nối Backend Flask",
    };
  }
};

export default {
  sendChatMessage,
  clearChatSession,
  checkChatbotStatus,
};
