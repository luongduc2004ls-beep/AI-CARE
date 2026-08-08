from datetime import datetime
from database import db
from models.notification import Notification

INITIAL_NOTIFICATIONS = [
    {
        "id": 1,
        "notification_id": 1,
        "patient_code": "PAT00001",
        "patient_name": "Cụ Nguyễn Văn A",
        "title": "🚨 CẢNH BÁO NGUY CẤP: Phát hiện ngã tại Phòng Ngủ!",
        "content": "Camera AI [Phòng Ngủ 101] phát hiện Cụ Nguyễn Văn A ngã xuống sàn. Tỷ lệ tư thế nằm 0.42, góc xương sống 78.5°. Cần kiểm tra ngay lập tức!",
        "type": "fall",
        "severity": "CRITICAL",
        "is_read": False,
        "created_at": "2026-08-04 08:30:15",
        "status": "UNREAD",
        "location": "Phòng Ngủ 101"
    },
    {
        "id": 2,
        "notification_id": 2,
        "patient_code": "PAT00001",
        "patient_name": "Cụ Nguyễn Văn A",
        "title": "💊 Cảnh báo quá giờ uống thuốc: Amlodipine 5mg",
        "content": "Cụ Nguyễn Văn A chưa xác nhận uống thuốc huyết áp theo lịch hẹn 08:00 AM.",
        "type": "medicine",
        "severity": "WARNING",
        "is_read": True,
        "created_at": "2026-08-04 08:15:00",
        "status": "READ",
        "location": "Phòng Ăn"
    },
    {
        "id": 3,
        "notification_id": 3,
        "patient_code": "PAT00001",
        "patient_name": "Cụ Nguyễn Văn A",
        "title": "❤️ Cảnh báo chỉ số sinh hiệu: Huyết áp tăng cao (155/95 mmHg)",
        "content": "Thiết bị đo tự động phát hiện huyết áp Cụ Nguyễn Văn A vượt ngưỡng an toàn. Đã thông báo cho bác sĩ gia đình.",
        "type": "health",
        "severity": "HIGH",
        "is_read": True,
        "created_at": "2026-08-03 19:45:00",
        "status": "RESOLVED",
        "location": "Phòng Khách"
    },
    {
        "id": 4,
        "notification_id": 4,
        "patient_code": "PAT00002",
        "patient_name": "Cụ Trần Thị B",
        "title": "🚨 CẢNH BÁO NGUY CẤP: Cụ Trần Thị B trượt ngã tại Hành Lang Tầng 2",
        "content": "Camera AI Tầng 2 ghi nhận Cụ Trần Thị B trượt ngã. Đã tự động báo cho điều dưỡng ca trực.",
        "type": "fall",
        "severity": "CRITICAL",
        "is_read": False,
        "created_at": "2026-08-04 07:10:00",
        "status": "UNREAD",
        "location": "Hành Lang Tầng 2"
    },
    {
        "id": 5,
        "notification_id": 5,
        "patient_code": "PAT00002",
        "patient_name": "Cụ Trần Thị B",
        "title": "💊 Nhắc nhở đơn thuốc: Cụ Trần Thị B (Insulin 10 IU)",
        "content": "Lịch tiêm Insulin buổi sáng của Cụ B cần thực hiện trước bữa ăn 15 phút.",
        "type": "medicine",
        "severity": "WARNING",
        "is_read": True,
        "created_at": "2026-08-03 11:30:00",
        "status": "READ",
        "location": "Phòng Ngủ 202"
    },
    {
        "id": 6,
        "notification_id": 6,
        "patient_code": "PAT00003",
        "patient_name": "Cụ Lê Văn C",
        "title": "💓 Cảnh báo nhịp tim bất thường: Cụ Lê Văn C (118 bpm)",
        "content": "Vòng tay sinh hiệu ghi nhận nhịp tim Cụ C tăng đột ngột lúc nghỉ ngơi.",
        "type": "health",
        "severity": "HIGH",
        "is_read": True,
        "created_at": "2026-08-02 16:45:00",
        "status": "RESOLVED",
        "location": "Phòng Sinh Hoạt 3"
    },
    {
        "id": 7,
        "notification_id": 7,
        "patient_code": "PAT00003",
        "patient_name": "Cụ Lê Văn C",
        "title": "🌡️ Cảnh báo thân nhiệt: Cụ Lê Văn C sốt 38.6°C",
        "content": "Thiết bị đo nhiệt độ ghi nhận Cụ C bị sốt chiều nay. Đã dán miếng hạ nhiệt.",
        "type": "health",
        "severity": "WARNING",
        "is_read": True,
        "created_at": "2026-08-01 14:00:00",
        "status": "RESOLVED",
        "location": "Phòng Ngủ 305"
    }
]

def seed_notifications_if_empty():
    """Khởi tạo dữ liệu mẫu thông báo trong DB nếu chưa có"""
    try:
        if db.session:
            db.create_all()
            count = Notification.query.count()
            if count == 0:
                for item in INITIAL_NOTIFICATIONS:
                    notif = Notification(
                        title=item["title"],
                        content=item["content"],
                        is_read=item["is_read"],
                        created_at=datetime.strptime(item["created_at"], "%Y-%m-%d %H:%M:%S")
                    )
                    db.session.add(notif)
                db.session.commit()
    except Exception as exc:
        if db.session:
            db.session.rollback()
        pass

def get_all_notifications():
    """Lấy toàn bộ danh sách thông báo & lịch sử cảnh báo"""
    try:
        seed_notifications_if_empty()
        items = Notification.query.order_by(Notification.created_at.desc()).all()
        if items:
            result = []
            for item in items:
                # xác định loại dựa theo title / content
                t = "warning"
                title_lower = (item.title or "").lower()
                if "ngã" in title_lower or "fall" in title_lower:
                    t = "fall"
                elif "thuốc" in title_lower or "medicine" in title_lower:
                    t = "medicine"
                elif "sinh hiệu" in title_lower or "huyết áp" in title_lower or "tim" in title_lower or "thân nhiệt" in title_lower:
                    t = "health"

                result.append({
                    "id": item.notification_id,
                    "notification_id": item.notification_id,
                    "title": item.title,
                    "content": item.content,
                    "type": t,
                    "is_read": item.is_read,
                    "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S") if item.created_at else "Gần đây",
                    "time": item.created_at.strftime("%Y-%m-%d %H:%M:%S") if item.created_at else "Gần đây"
                })
            return result
    except Exception:
        pass

    return INITIAL_NOTIFICATIONS

def get_unread_notifications():
    all_notifs = get_all_notifications()
    return [n for n in all_notifs if not n.get("is_read")]

def mark_notification_read(notif_id):
    try:
        if db.session:
            n = Notification.query.get(notif_id)
            if n:
                n.is_read = True
                db.session.commit()
                return True
    except Exception:
        if db.session:
            db.session.rollback()
    
    for item in INITIAL_NOTIFICATIONS:
        if str(item["id"]) == str(notif_id) or str(item.get("notification_id")) == str(notif_id):
            item["is_read"] = True
            item["status"] = "READ"
            return True
    return False

def mark_all_notifications_read():
    try:
        if db.session:
            Notification.query.update({Notification.is_read: True})
            db.session.commit()
            return True
    except Exception:
        if db.session:
            db.session.rollback()

    for item in INITIAL_NOTIFICATIONS:
        item["is_read"] = True
        item["status"] = "READ"
    return True

def delete_notification(notif_id):
    try:
        if db.session:
            n = Notification.query.get(notif_id)
            if n:
                db.session.delete(n)
                db.session.commit()
                return True
    except Exception:
        if db.session:
            db.session.rollback()

    global INITIAL_NOTIFICATIONS
    INITIAL_NOTIFICATIONS = [item for item in INITIAL_NOTIFICATIONS if str(item["id"]) != str(notif_id) and str(item.get("notification_id")) != str(notif_id)]
    return True

def create_notification(data):
    """Tạo mới một thông báo / cảnh báo vào cơ sở dữ liệu"""
    title = data.get("title", "🚨 Cảnh báo hệ thống")
    content = data.get("content", "")
    notif_type = data.get("type", "warning")
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    try:
        if db.session:
            n = Notification(
                title=title,
                content=content,
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.session.add(n)
            db.session.commit()
            return {
                "id": n.notification_id,
                "notification_id": n.notification_id,
                "title": title,
                "content": content,
                "type": notif_type,
                "is_read": False,
                "created_at": now_str,
                "time": now_str
            }
    except Exception as exc:
        if db.session:
            db.session.rollback()

    new_id = len(INITIAL_NOTIFICATIONS) + 100
    new_item = {
        "id": new_id,
        "notification_id": new_id,
        "title": title,
        "content": content,
        "type": notif_type,
        "severity": data.get("severity", "HIGH"),
        "is_read": False,
        "created_at": now_str,
        "time": now_str,
        "status": "UNREAD"
    }
    INITIAL_NOTIFICATIONS.insert(0, new_item)
    return new_item

