// ==============================================================================
// CHATBOT SERVICE (CHATBOTSERVICE.JS)
// Tích hợp API Chatbot AI Hybrid: Gemini + Database Tools + Medical Knowledge
// ==============================================================================

import api from "./api";

/**
 * Gửi tin nhắn tới Gemini Hybrid AI Medical Assistant API.
 * Hỗ trợ truyền theo Object hoặc danh sách tham số linh hoạt.
 */
export const sendChatMessage = async (paramsOrMessage, conversationId = null, history = []) => {
  try {
    let payload = {};

    if (typeof paramsOrMessage === "object" && paramsOrMessage !== null) {
      payload = {
        message: paramsOrMessage.message || paramsOrMessage.text || "",
        conversationId: paramsOrMessage.conversationId || paramsOrMessage.conversation_id,
        patientCode: paramsOrMessage.patientCode || paramsOrMessage.patient_code || paramsOrMessage.patientId,
        history: paramsOrMessage.history || [],
        userRole: paramsOrMessage.userRole || paramsOrMessage.role,
        userId: paramsOrMessage.userId
      };
    } else {
      payload = {
        message: String(paramsOrMessage || ""),
        conversationId: conversationId,
        history: history
      };
    }

    const response = await api.post("/ai/chat", payload);
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn tới Chatbot API:", error);
    const errorMsg = error?.response?.data?.reply || error?.response?.data?.message || error.message || "Không thể kết nối tới máy chủ AI";
    const isForbidden = error?.response?.status === 403 || error?.response?.data?.forbidden;

    return {
      success: false,
      forbidden: isForbidden,
      reply: isForbidden ? "⛔ **Từ chối truy cập**: Tài khoản của bạn không có quyền xem thông tin của bệnh nhân khác." : `⚠️ Lỗi kết nối AI: ${errorMsg}`,
      error: errorMsg
    };
  }
};

/**
 * Xóa lịch sử cuộc trò chuyện của một phiên hội thoại cụ thể.
 */
export const clearChatSession = async (conversationId) => {
  try {
    const response = await api.post("/chatbot/clear", {
      conversationId,
      session_id: conversationId
    });
    return response;
  } catch (error) {
    console.error("Lỗi khi làm sạch phiên chat:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Lấy lịch sử tin nhắn của một cuộc hội thoại.
 */
export const getConversationMessages = async (conversationId) => {
  try {
    const response = await api.get(`/ai/conversations/${conversationId}/messages`);
    return response?.messages || [];
  } catch (error) {
    console.error("Lỗi khi tải tin nhắn hội thoại:", error);
    return [];
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
      status_message: "Không thể kết nối Backend Flask"
    };
  }
};

export default {
  sendChatMessage,
  clearChatSession,
  getConversationMessages,
  checkChatbotStatus
};
