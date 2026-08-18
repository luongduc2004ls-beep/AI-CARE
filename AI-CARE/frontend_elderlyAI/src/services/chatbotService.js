import api from "./api";

/**
 * Gửi tin nhắn tới Gemini Chatbot / AI Assistant API.
 */
export const sendChatMessage = async (message, conversationId = "default_session", patientId = "PAT10000", history = [], userRole = "Admin", userId = null) => {
  try {
    const response = await api.post("/ai/chat", {
      message,
      conversationId,
      patientId,
      history,
      userRole,
      userId,
    });
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn tới Chatbot API:", error);
    return {
      success: false,
      reply: `⚠️ Không thể kết nối tới máy chủ AI: ${error.message}`,
      conversationId,
      error: error.message,
    };
  }
};

/**
 * Xóa lịch sử cuộc trò chuyện của một phiên hội thoại cụ thể.
 */
export const clearChatSession = async (conversationId = "default_session") => {
  try {
    const response = await api.post("/chatbot/clear", {
      conversationId,
      session_id: conversationId,
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
