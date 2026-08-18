import datetime
import time
from apscheduler.schedulers.background import BackgroundScheduler

# ==========================================
# 1. CÔNG VIỆC 16: XỬ LÝ DỮ LIỆU LỊCH SỬ (LOG HISTORY)
# ==========================================
class LogHistoryManager:
    def __init__(self):
        self.logs = []

    def record_log(self, reminder_id: str, status: str):
        """
        Ghi nhận và lưu trữ trạng thái tương tác ("Đã uống" / "Chưa uống")
        """
        log_entry = {
            "log_id": len(self.logs) + 1,
            "reminder_id": reminder_id,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": status
        }
        self.logs.append(log_entry)
        print(f"[LOG HISTORY] Ghi nhận thành công: {log_entry}")

    def get_all_logs(self):
        return self.logs


# ==========================================
# 2. CÔNG VIỆC 15: PHÁT TRIỂN PUSH NOTIFICATION
# ==========================================
class NotificationService:
    @staticmethod
    def send_push_notification(medicine_name: str, device_token: str = "DEFAULT_TOKEN"):
        """
        Gửi thông báo / cảnh báo nhắc nhở theo thời gian thực
        (Trong thực tế sẽ tích hợp Firebase Cloud Messaging / OneSignal)
        """
        title = "⏰ Đã đến giờ uống thuốc!"
        body = f"Lịch uống thuốc: {medicine_name}. Vui lòng xác nhận sau khi uống."
        
        print(f"[PUSH NOTIFICATION] -> [Device: {device_token}]")
        print(f"                     Tiêu đề: {title}")
        print(f"                     Nội dung: {body}")


# ==========================================
# 3. CÔNG VIỆC 14: XÂY DỰNG LÕI SCHEDULER
# ==========================================
class ReminderScheduler:
    def __init__(self, log_manager: LogHistoryManager, notification_service: NotificationService):
        self.scheduler = BackgroundScheduler()
        self.log_manager = log_manager
        self.notification_service = notification_service

    def _trigger_job(self, reminder_id: str, medicine_name: str):
        """
        Hàm được kích hoạt tự động theo định thời
        """
        print(f"\n--- [CRON JOB TRIGGERED] Reminder ID: {reminder_id} ---")
        
        # Step 1: Đẩy thông báo theo thời gian thực
        self.notification_service.send_push_notification(medicine_name)
        
        # Step 2: Giả lập ghi nhận phản hồi người dùng (Đã uống / Chưa uống)
        # Thực tế trạng thái này được gửi từ App Mobile lên server khi người dùng bấm nút
        user_status = "Đã uống"
        self.log_manager.record_log(reminder_id, user_status)

    def add_reminder(self, reminder_id: str, medicine_name: str, interval_seconds: int):
        """
        Lên lịch kiểm tra và kích hoạt nhắc nhở
        """
        self.scheduler.add_job(
            func=self._trigger_job,
            trigger='interval',
            seconds=interval_seconds,
            args=[reminder_id, medicine_name],
            id=reminder_id,
            replace_existing=True
        )
        print(f"[SCHEDULER] Đã thiết lập lịch nhắc '{medicine_name}' chạy mỗi {interval_seconds} giây.")

    def start(self):
        self.scheduler.start()

    def stop(self):
        self.scheduler.shutdown()


# ==========================================
# CHƯƠNG TRÌNH CHẠY THỬ (MAIN)
# ==========================================
if __name__ == "__main__":
    print("=== KHỞI ĐỘNG MODULE NHẮC THUỐC (REMINDER MODULE) ===\n")

    # Khởi tạo các dịch vụ
    log_manager = LogHistoryManager()
    notifier = NotificationService()
    reminder_system = ReminderScheduler(log_manager, notifier)

    # 1. Thêm lịch nhắc thuốc mẫu (Chạy mỗi 5 giây để test nhanh)
    reminder_system.add_reminder(
        reminder_id="REM_001", 
        medicine_name="Paracetamol 500mg", 
        interval_seconds=5
    )

    # 2. Khởi động bộ định thời
    reminder_system.start()

    # Cho chương trình chạy trong 12 giây để quan sát kết quả
    try:
        time.sleep(12)
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        reminder_system.stop()

    # 3. In toàn bộ Lịch sử ghi nhận (Log History)
    print("\n=== BÁO CÁO DỮ LIỆU LỊCH SỬ (LOG HISTORY) ===")
    for log in log_manager.get_all_logs():
        print(log)