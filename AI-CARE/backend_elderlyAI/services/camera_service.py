import os
import random
from datetime import datetime
from database import db
from models.camera import Camera
from models.fall_history import FallHistory
from models.notification import Notification
from models.user import User

# Fallback in-memory camera list if DB is offline or empty
INITIAL_CAMERAS = [
    {
        "camera_id": 1,
        "patient_id": "PAT10000",
        "patient_name": "Hồ Thanh Khánh",
        "age": 71,
        "gender": "Nam",
        "device_id": "D1000",
        "name": "Camera Ezviz AI - Phòng Ngủ 101 Cụ Hồ Thanh Khánh",
        "rtsp_url": "rtsp://192.168.1.101:554/stream1",
        "location": "Phòng Ngủ 101",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "High",
        "caregiver_name": "Phan Thị An (Con gái)",
        "caregiver_phone": "0851745822"
    },
    {
        "camera_id": 2,
        "patient_id": "PAT10001",
        "patient_name": "Phan Anh Thảo",
        "age": 74,
        "gender": "Nữ",
        "device_id": "D1001",
        "name": "Camera Imou AI - Phòng Khách Cụ Phan Anh Thảo",
        "rtsp_url": "rtsp://192.168.1.102:554/stream1",
        "location": "Phòng Khách Trung Tâm",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium",
        "caregiver_name": "Lê Thanh Chi (Vợ)",
        "caregiver_phone": "0394652227"
    },
    {
        "camera_id": 3,
        "patient_id": "PAT10002",
        "patient_name": "Đỗ Thanh Phong",
        "age": 68,
        "gender": "Nam",
        "device_id": "D1002",
        "name": "Camera AI - Nhà Vệ Sinh Cụ Đỗ Thanh Phong",
        "rtsp_url": "rtsp://192.168.1.103:554/stream1",
        "location": "Nhà Vệ Sinh Tầng 1",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "High",
        "caregiver_name": "Đặng Quốc An (Con trai)",
        "caregiver_phone": "0960768603"
    },
    {
        "camera_id": 4,
        "patient_id": "PAT10003",
        "patient_name": "Phan Ngọc Ngọc",
        "age": 73,
        "gender": "Nam",
        "device_id": "D1003",
        "name": "Camera Tapo AI - Hành Lang Cụ Phan Ngọc Ngọc",
        "rtsp_url": "rtsp://192.168.1.104:554/stream1",
        "location": "Hành Lang Tầng 2",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium",
        "caregiver_name": "Phan Minh Bình (Con trai)",
        "caregiver_phone": "0952394419"
    },
    {
        "camera_id": 5,
        "patient_id": "PAT10000",
        "patient_name": "Hồ Thanh Khánh",
        "age": 71,
        "gender": "Nam",
        "device_id": "D1004",
        "name": "Camera AI - Nhà Vệ Sinh 101 Cụ Hồ Thanh Khánh",
        "rtsp_url": "rtsp://192.168.1.105:554/stream1",
        "location": "Nhà Vệ Sinh 101",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "High",
        "caregiver_name": "Phan Thị An (Con gái)",
        "caregiver_phone": "0851745822"
    },
    {
        "camera_id": 6,
        "patient_id": "PAT10001",
        "patient_name": "Phan Anh Thảo",
        "age": 74,
        "gender": "Nữ",
        "device_id": "D1005",
        "name": "Camera Tapo AI - Phòng Ngủ Cụ Phan Anh Thảo",
        "rtsp_url": "rtsp://192.168.1.106:554/stream1",
        "location": "Phòng Ngủ 201",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium",
        "caregiver_name": "Lê Thanh Chi (Vợ)",
        "caregiver_phone": "0394652227"
    },
    {
        "camera_id": 7,
        "patient_id": "PAT10002",
        "patient_name": "Đỗ Thanh Phong",
        "age": 68,
        "gender": "Nam",
        "device_id": "D1006",
        "name": "Camera Ezviz AI - Phòng Ngủ Cụ Đỗ Thanh Phong",
        "rtsp_url": "rtsp://192.168.1.107:554/stream1",
        "location": "Phòng Ngủ 102",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium",
        "caregiver_name": "Đặng Quốc An (Con trai)",
        "caregiver_phone": "0960768603"
    },
    {
        "camera_id": 8,
        "patient_id": "PAT10003",
        "patient_name": "Phan Ngọc Ngọc",
        "age": 73,
        "gender": "Nam",
        "device_id": "D1007",
        "name": "Camera Yoosee AI - Phòng Ăn Cụ Phan Ngọc Ngọc",
        "rtsp_url": "rtsp://192.168.1.108:554/stream1",
        "location": "Phòng Bếp & Nhà Ăn",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium",
        "caregiver_name": "Phan Minh Bình (Con trai)",
        "caregiver_phone": "0952394419"
    }
]

# In-memory active alerts cache
ACTIVE_FALL_ALERTS = []


def seed_default_cameras_if_empty():
    """Khởi tạo dữ liệu camera mặc định trong DB nếu chưa có"""
    try:
        if db.session:
            # Tạo bảng nếu chưa tồn tại trong db context
            db.create_all()
            count = Camera.query.count()
            if count == 0:
                for cam_data in INITIAL_CAMERAS:
                    cam = Camera(
                        name=cam_data["name"],
                        rtsp_url=cam_data["rtsp_url"],
                        location=cam_data["location"],
                        status=cam_data["status"],
                        ai_enabled=cam_data["ai_enabled"],
                        sensitivity=cam_data["sensitivity"]
                    )
                    db.session.add(cam)
                db.session.commit()
    except Exception as e:
        if db.session:
            db.session.rollback()
        # Fallback im-memory
        pass



def get_all_cameras():
    """Lấy danh sách tất cả các camera kết nối"""
    try:
        seed_default_cameras_if_empty()
        cams = Camera.query.all()
        if cams:
            return [cam.to_dict() for cam in cams]
    except Exception:
        pass

    return INITIAL_CAMERAS


def add_new_camera(data):
    """Đăng ký camera RTSP mới"""
    name = data.get("name")
    rtsp_url = data.get("rtsp_url")
    location = data.get("location", "Khu vực chung")
    sensitivity = data.get("sensitivity", "Medium")

    if not name or not rtsp_url:
        return {"success": False, "message": "Tên camera và RTSP URL là bắt buộc"}, 400

    try:
        cam = Camera(
            name=name,
            rtsp_url=rtsp_url,
            location=location,
            status="ONLINE",
            ai_enabled=True,
            sensitivity=sensitivity
        )
        db.session.add(cam)
        db.session.commit()
        return {"success": True, "data": cam.to_dict(), "message": "Thêm camera thành công"}, 201
    except Exception as e:
        if db.session:
            db.session.rollback()
        # Fallback to in-memory
        new_id = len(INITIAL_CAMERAS) + 1
        new_cam = {
            "camera_id": new_id,
            "name": name,
            "rtsp_url": rtsp_url,
            "location": location,
            "status": "ONLINE",
            "ai_enabled": True,
            "sensitivity": sensitivity,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        INITIAL_CAMERAS.append(new_cam)
        return {"success": True, "data": new_cam, "message": "Thêm camera thành công (In-memory)"}, 201


def trigger_fall_simulation(camera_id, snapshot_url=None):
    """
    Giả lập / Thực thi phân tích AI phát hiện ngã từ Camera
    Tính toán chỉ số Pose AI:
    - Spine Angle: 78.5 degrees (> 60° -> Ngã)
    - Aspect Ratio (Height/Width): 0.42 (< 0.8 -> Nằm ngang sàn)
    - Downward Acceleration: 9.8 m/s^2 (Gia tốc rơi nhanh)
    - Post-fall Motionless Time: 4.2 seconds
    """
    # Tìm camera
    camera = None
    all_cams = get_all_cameras()
    for c in all_cams:
        if str(c["camera_id"]) == str(camera_id):
            camera = c
            break

    if not camera:
        camera = INITIAL_CAMERAS[0]

    location = camera.get("location", "Phòng Ngủ")
    camera_name = camera.get("name", "Camera AI Giám Sát")
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # Lấy thông tin bệnh nhân/người già nếu có
    patient_name = "Cụ Nguyễn Văn A (82 tuổi)"
    user_id = 1
    try:
        user = User.query.filter_by(role="Patient").first()
        if user:
            patient_name = f"{user.full_name}"
            user_id = user.user_id
    except Exception:
        pass

    # Tạo bản ghi FallHistory & Notification trong DB nếu sẵn sàng
    fall_id = random.randint(1000, 9999)
    try:
        fall_rec = FallHistory(
            user_id=user_id,
            location=location,
            severity="KHẨN CẤP",
            image="fall_snapshot_live.jpg",
            fall_time=datetime.utcnow()
        )
        db.session.add(fall_rec)

        notif = Notification(
            user_id=user_id,
            title=f"🚨 CẢNH BÁO NGUY CẤP: Phát hiện ngã tại {location}!",
            content=f"Camera [{camera_name}] phát hiện {patient_name} bị ngã xuống sàn vào lúc {now_str}. Tỷ lệ tư thế nằm ngang 0.42, góc xương sống 78.5°. Cần hỗ trợ ngay lập tức!",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.session.add(notif)
        db.session.commit()
        fall_id = fall_rec.fall_id
    except Exception as e:
        if db.session:
            db.session.rollback()
        print(f"[CameraService] DB recording fallback: {e}")

    # Cấu trúc đối tượng alert gửi về Client
    alert_event = {
        "alert_id": fall_id,
        "camera_id": camera["camera_id"],
        "camera_name": camera_name,
        "location": location,
        "patient_name": patient_name,
        "detected_at": now_str,
        "severity": "KHẨN CẤP",
        "status": "PENDING",  # PENDING, ACKNOWLEDGED, FALSE_ALARM
        "ai_analytics": {
            "model_version": "YOLOv11-Pose-STGCN v2.4",
            "confidence": 0.968,
            "spine_angle_deg": 78.5,
            "aspect_ratio": 0.42,
            "vertical_velocity_m_s": 3.85,
            "motionless_duration_sec": 4.2
        },
        "snapshot_url": snapshot_url or "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22500%22%3E%3Crect%20width%3D%22800%22%20height%3D%22500%22%20fill%3D%22%230f172a%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22250%22%20fill%3D%22%23ef4444%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%3E%F0%9F%9A%A8%20LIVE%20SNAPSHOT%20CAPTURED%20ON%20ANOMALY%3C%2Ftext%3E%3C%2Fsvg%3E"
    }

    ACTIVE_FALL_ALERTS.insert(0, alert_event)

    return {
        "success": True,
        "message": f"🚨 ĐÃ KÍCH HOẠT CẢNH BÁO NGÃ TỪ {camera_name}!",
        "alert": alert_event
    }


def get_active_alerts():
    """Lấy danh sách các cảnh báo ngã đang mở"""
    return ACTIVE_FALL_ALERTS


def acknowledge_alert(alert_id, status_code="ACKNOWLEDGED"):
    """Xác nhận xử lý cảnh báo ngã"""
    global ACTIVE_FALL_ALERTS
    for alert in ACTIVE_FALL_ALERTS:
        if str(alert["alert_id"]) == str(alert_id):
            alert["status"] = status_code
            alert["acknowledged_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            return {
                "success": True,
                "message": f"Đã cập nhật trạng thái cảnh báo thành: {status_code}",
                "alert": alert
            }

    return {"success": True, "message": "Đã ghi nhận phản hồi cảnh báo"}, 200
