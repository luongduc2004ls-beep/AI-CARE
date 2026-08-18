import axios from "axios";

const API_BASE_URL = window.location.hostname.includes("serveousercontent.com") || window.location.protocol === "https:"
  ? "https://3318293df04c7371-171-255-66-135.serveousercontent.com/api/my/ai"
  : `http://${window.location.hostname || "localhost"}:5000/api/my/ai`;

export const sendUserAIMessage = async (message, conversationId, patientId, history = [], userId = 2) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/chat`,
      {
        message,
        conversationId,
        patientId,
        history,
        userId,
        userRole: "User"
      },
      {
        headers: {
          "X-User-Role": "User",
          "X-User-Id": String(userId)
        }
      }
    );
    return res.data;
  } catch (err) {
    console.error("Lỗi gửi tin nhắn User AI:", err);
    return {
      success: false,
      reply: "🔒 Tôi chỉ có thể hỗ trợ thông tin về những người thân mà tài khoản của bạn được cấp quyền chăm sóc.",
      error: err.message
    };
  }
};

export const getUserConversations = async (patientId, userId = 2) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/conversations`, {
      params: { patient_id: patientId, userId },
      headers: { "X-User-Role": "User", "X-User-Id": String(userId) }
    });
    return res.data;
  } catch (err) {
    return { success: false, conversations: [] };
  }
};

export const checkUserAIStatus = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/status`, {
      headers: { "X-User-Role": "User" }
    });
    return res.data;
  } catch (err) {
    return { success: false, configured: false };
  }
};
