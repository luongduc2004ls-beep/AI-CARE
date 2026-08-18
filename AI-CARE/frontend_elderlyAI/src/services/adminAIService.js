import axios from "axios";

const API_BASE_URL = window.location.hostname.includes("serveousercontent.com") || window.location.protocol === "https:"
  ? "https://3318293df04c7371-171-255-66-135.serveousercontent.com/api/admin/ai"
  : `http://${window.location.hostname || "localhost"}:5000/api/admin/ai`;

export const sendAdminAIMessage = async (message, conversationId, history = [], userId = 1) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/chat`,
      {
        message,
        conversationId,
        history,
        userId,
        userRole: "Admin"
      },
      {
        headers: {
          "X-User-Role": "Admin",
          "X-User-Id": String(userId)
        }
      }
    );
    return res.data;
  } catch (err) {
    console.error("Lỗi gửi tin nhắn Admin AI:", err);
    return {
      success: false,
      reply: "⚠️ Không thể kết nối tới máy chủ Admin AI. Vui lòng kiểm tra lại dịch vụ backend.",
      error: err.message
    };
  }
};

export const getAdminConversations = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/conversations`, {
      headers: { "X-User-Role": "Admin" }
    });
    return res.data;
  } catch (err) {
    return { success: false, conversations: [] };
  }
};

export const checkAdminAIStatus = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/status`, {
      headers: { "X-User-Role": "Admin" }
    });
    return res.data;
  } catch (err) {
    return { success: false, configured: false };
  }
};
