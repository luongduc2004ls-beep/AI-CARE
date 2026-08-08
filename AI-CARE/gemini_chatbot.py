# ==============================================================================
# HỆ THỐNG CHATBOT AI SỬ DỤNG GOOGLE GEMINI API (MÃ NGUỒN HOÀN CHỈNH - STANDALONE)
# ==============================================================================
# Tác giả: AI CARE Team
# Mô tả: File Python độc lập 100%, tích hợp trực tiếp Google Gemini API để tạo
#        Trợ lý AI tư vấn và trò chuyện. Có thể chạy trực tiếp từ Terminal/CLI.
# Hướng dẫn chạy:
#   1. Đặt API Key của bạn vào biến GEMINI_API_KEY hoặc file .env
#   2. Chạy lệnh: python gemini_chatbot.py
# ==============================================================================

import os
import sys
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

# Tải biến môi trường từ file .env nếu có
load_dotenv()


class GeminiChatbot:
    """
    Lớp xử lý kết nối và trò chuyện với Google Gemini API.
    Được thiết kế tự chứa (self-contained), tự động xử lý kết nối HTTP REST API
    để không phụ thuộc bắt buộc vào thư viện bên ngoài phức tạp.
    """

    def __init__(self, api_key: str = None, model_name: str = "gemini-1.5-flash"):
        """
        Khởi tạo Chatbot với API Key và tên Model Gemini.
        
        Tham số:
            api_key (str): Khóa API Google Gemini. Nếu None sẽ lấy từ biến môi trường GEMINI_API_KEY.
            model_name (str): Tên mô hình Gemini (mặc định: gemini-1.5-flash hoặc gemini-2.0-flash).
        """
        # Ưu tiên API Key truyền vào, nếu không có sẽ lấy từ biến môi trường
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model_name
        
        # Danh sách mô hình thay thế dự phòng nếu mô hình chính bị 404
        self.candidate_models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
        
        # Lưu trữ lịch sử cuộc trò chuyện (Chat Context)
        self.conversation_history = []
        
        # Cấu hình Prompt hệ thống mặc định (System Instruction)
        self.system_instruction = (
            "Bạn là Trợ lý AI Chăm sóc Sức khỏe thông minh, thân thiện của hệ thống AI CARE. "
            "Hãy trả lời bằng Tiếng Việt lễ phép, rõ ràng, ấm áp và chu đáo. "
            "Nếu người dùng hỏi về sức khỏe, thuốc hoặc nhắc nhở sinh hoạt, hãy đưa ra lời khuyên hữu ích "
            "và khuyến cáo khám bác sĩ khi cần thiết."
        )

    def is_configured(self) -> bool:
        """
        Kiểm tra xem API Key đã được cấu hình hay chưa.
        
        Trả về:
            bool: True nếu API Key hợp lệ (không rỗng), ngược lại False.
        """
        return bool(self.api_key and self.api_key.strip() and self.api_key not in ("YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"))

    def generate_response(self, user_message: str) -> str:
        """
        Gửi tin nhắn của người dùng tới Gemini API và nhận câu trả lời.
        Tự động thử các Model dự phòng nếu gặp lỗi 404.
        
        Tham số:
            user_message (str): Câu hỏi hoặc tin nhắn nhập từ người dùng.
            
        Trả về:
            str: Văn bản phản hồi từ Gemini AI.
        """
        # Kiểm tra nếu API Key chưa được cung cấp
        if not self.is_configured():
            return (
                "⚠️ Lỗi: Chưa cấu hình GEMINI_API_KEY!\n"
                "Vui lòng tạo khóa API miễn phí tại https://aistudio.google.com/ "
                "và thiết lập biến môi trường GEMINI_API_KEY trong file .env hoặc hệ thống."
            )

        # Thêm tin nhắn người dùng vào lịch sử trò chuyện
        self.conversation_history.append({
            "role": "user",
            "parts": [{"text": user_message}]
        })

        # Chuẩn bị dữ liệu Payload theo đúng định dạng JSON chuẩn của Google Gemini API
        payload = {
            "contents": self.conversation_history,
            "systemInstruction": {
                "parts": [{"text": self.system_instruction}]
            },
            "generationConfig": {
                "temperature": 0.7,      # Độ sáng tạo của câu trả lời (0.0 - 1.0)
                "topP": 0.95,             # Xác suất chọn từ ngữ
                "maxOutputTokens": 1024,  # Độ dài tối đa của phản hồi
            }
        }

        models_to_try = [self.model_name] + [m for m in self.candidate_models if m != self.model_name]

        for model in models_to_try:
            request_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"

            try:
                json_data = json.dumps(payload).encode("utf-8")

                req = urllib.request.Request(
                    request_url,
                    data=json_data,
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=30) as response:
                    response_body = response.read().decode("utf-8")
                    result = json.loads(response_body)

                    candidates = result.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            ai_reply = parts[0].get("text", "").strip()

                            # Lưu phản hồi của AI vào lịch sử cuộc trò chuyện
                            self.conversation_history.append({
                                "role": "model",
                                "parts": [{"text": ai_reply}]
                            })

                            # Cập nhật model name đang hoạt động tốt
                            self.model_name = model

                            return ai_reply

            except urllib.error.HTTPError as http_err:
                if http_err.code == 404:
                    continue  # Thử model tiếp theo nếu gặp 404

                error_msg = http_err.read().decode("utf-8")
                if self.conversation_history and self.conversation_history[-1]["role"] == "user":
                    self.conversation_history.pop()

                if http_err.code in (400, 403):
                    return (
                        f"⚠️ Lỗi xác thực Gemini API (Mã lỗi {http_err.code}): API Key không hợp lệ hoặc bị hạn chế.\n"
                        f"Chi tiết: {error_msg}"
                    )
                elif http_err.code == 429:
                    return "⚠️ Hạn ngạch API Gemini đã vượt quá giới hạn (Rate Limit). Vui lòng thử lại sau ít phút."
                else:
                    return f"⚠️ Lỗi kết nối HTTP Gemini API ({http_err.code}): {error_msg}"

            except urllib.error.URLError as url_err:
                if self.conversation_history and self.conversation_history[-1]["role"] == "user":
                    self.conversation_history.pop()
                return f"⚠️ Lỗi kết nối mạng: Không thể kết nối tới Google Gemini API. Chi tiết: {url_err.reason}"

            except Exception as exc:
                if self.conversation_history and self.conversation_history[-1]["role"] == "user":
                    self.conversation_history.pop()
                return f"⚠️ Đã xảy ra lỗi không xác định khi gọi Gemini API: {str(exc)}"

        if self.conversation_history and self.conversation_history[-1]["role"] == "user":
            self.conversation_history.pop()
        return "⚠️ Không tìm thấy tên mô hình Gemini phù hợp (Lỗi 404 trên tất cả các Endpoint)."

    def reset_chat(self):
        """
        Xóa lịch sử cuộc trò chuyện để bắt đầu phiên mới.
        """
        self.conversation_history.clear()
        print("🧹 Đã làm sạch lịch sử cuộc trò chuyện.")


def main():
    """
    Hàm thực thi chính khi chạy script trực tiếp từ Terminal / Command Prompt.
    Giao diện dòng lệnh tương tác trực tiếp với người dùng.
    """
    print("=" * 70)
    print(" 🤖 CHATBOT AI CARE - HỆ THỐNG TRỢ LÝ THÔNG MINH GOOGLE GEMINI")
    print("=" * 70)
    print(" Hướng dẫn:")
    print("   - Nhập câu hỏi của bạn và nhấn Enter để trò chuyện.")
    print("   - Gõ 'clear' hoặc 'reset' để xóa lịch sử trò chuyện.")
    print("   - Gõ 'exit' hoặc 'quit' để thoát chương trình.")
    print("=" * 70)

    # Khởi tạo đối tượng Chatbot
    bot = GeminiChatbot()

    # Thống kê trạng thái API Key
    if not bot.is_configured():
        print("\n⚠️ CẢNH BÁO: Chưa tìm thấy GEMINI_API_KEY hợp lệ!")
        api_input = input("👉 Nhập GEMINI API KEY của bạn trực tiếp tại đây (hoặc nhấn Enter để tiếp tục): ").strip()
        if api_input:
            bot.api_key = api_input

    print(f"\n✅ Đã sẵn sàng kết nối Gemini AI (Model: {bot.model_name})")
    print("-" * 70)

    # Vòng lặp tương tác dòng lệnh
    while True:
        try:
            user_input = input("\n👤 BẠN: ").strip()

            if user_input.lower() in ["exit", "quit", "thoat"]:
                print("👋 Cảm ơn bạn đã sử dụng Chatbot AI CARE. Tạm biệt!")
                break

            if user_input.lower() in ["clear", "reset", "xoa"]:
                bot.reset_chat()
                continue

            if not user_input:
                continue

            print("🤖 GEMINI AI đang suy nghĩ...", end="\r", flush=True)
            reply = bot.generate_response(user_input)
            
            print(" " * 40, end="\r")
            print(f"🤖 GEMINI AI: {reply}")

        except KeyboardInterrupt:
            print("\n\n👋 Đã nhận lệnh ngắt từ bàn phím. Tạm biệt!")
            sys.exit(0)


if __name__ == "__main__":
    main()
