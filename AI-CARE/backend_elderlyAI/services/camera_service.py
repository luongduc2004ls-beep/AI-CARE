"""
Camera Service & Hardware Binding Layer
Connects Camera Entities directly with Patients, Locations, and Stream Metadata.
"""
from datetime import datetime
from database import db
from models.camera import Camera
from models.user import User
from models.alert import Alert
from services.auth_permission_service import AuthPermissionService

DEFAULT_SEEDED_CAMERAS = [
    {
        "camera_code": "CAM001",
        "patient_id": "PAT10000",
        "name": "Camera Ezviz AI - Phòng Ngủ 101",
        "rtsp_url": "rtsp://192.168.1.101:554/stream1",
        "location": "Phòng Ngủ 101",
        "room": "Phòng Ngủ",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "High"
    },
    {
        "camera_code": "CAM002",
        "patient_id": "PAT10000",
        "name": "Camera Imou AI - Phòng Khách 101",
        "rtsp_url": "rtsp://192.168.1.102:554/stream1",
        "location": "Phòng Khách 101",
        "room": "Phòng Khách",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium"
    },
    {
        "camera_code": "CAM003",
        "patient_id": "PAT10000",
        "name": "Camera AI - Nhà Vệ Sinh 101",
        "rtsp_url": "rtsp://192.168.1.103:554/stream1",
        "location": "Nhà Vệ Sinh 101",
        "room": "Nhà Vệ Sinh",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "High"
    },
    {
        "camera_code": "CAM004",
        "patient_id": "PAT10001",
        "name": "Camera Tapo AI - Phòng Ngủ Phan Anh Thảo",
        "rtsp_url": "rtsp://192.168.1.104:554/stream1",
        "location": "Phòng Ngủ Trung Tâm",
        "room": "Phòng Ngủ",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium"
    },
    {
        "camera_code": "CAM005",
        "patient_id": "PAT10001",
        "name": "Camera Imou AI - Phòng Khách Phan Anh Thảo",
        "rtsp_url": "rtsp://192.168.1.105:554/stream1",
        "location": "Phòng Khách Trung Tâm",
        "room": "Phòng Khách",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium"
    },
    {
        "camera_code": "CAM006",
        "patient_id": "PAT10002",
        "name": "Camera AI - Nhà Vệ Sinh Đỗ Thanh Phong",
        "rtsp_url": "rtsp://192.168.1.106:554/stream1",
        "location": "Nhà Vệ Sinh Tầng 1",
        "room": "Nhà Vệ Sinh",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "High"
    },
    {
        "camera_code": "CAM007",
        "patient_id": "PAT10003",
        "name": "Camera Tapo AI - Hành Lang Tầng 2",
        "rtsp_url": "rtsp://192.168.1.107:554/stream1",
        "location": "Hành Lang Tầng 2",
        "room": "Hành Lang",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium"
    },
    {
        "camera_code": "CAM008",
        "patient_id": "PAT10000",
        "name": "Camera Ezviz AI - Hành Lang 101",
        "rtsp_url": "rtsp://192.168.1.108:554/stream1",
        "location": "Hành Lang 101",
        "room": "Hành Lang",
        "status": "ONLINE",
        "ai_enabled": True,
        "sensitivity": "Medium"
    }
]

def seed_cameras_if_empty():
    try:
        count = Camera.query.count()
        if count == 0:
            for item in DEFAULT_SEEDED_CAMERAS:
                c = Camera(
                    camera_code=item["camera_code"],
                    patient_id=item["patient_id"],
                    name=item["name"],
                    rtsp_url=item["rtsp_url"],
                    location=item["location"],
                    room=item.get("room", item["location"]),
                    status=item.get("status", "ONLINE"),
                    ai_enabled=item.get("ai_enabled", True),
                    sensitivity=item.get("sensitivity", "High"),
                    last_seen_at=datetime.utcnow()
                )
                db.session.add(c)
            db.session.commit()
    except Exception:
        db.session.rollback()


def get_all_cameras(user_role="Admin", user_id=None):
    """
    Lấy danh sách Camera từ CSDL với phân quyền Role & Patient Scope.
    """
    seed_cameras_if_empty()
    query = Camera.query

    if (user_role or "").upper() != "ADMIN":
        allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
        query = query.filter(Camera.patient_id.in_(allowed_ids))

    cams = query.order_by(Camera.camera_id.asc()).all()
    results = []
    for c in cams:
        d = c.to_dict()
        # Gắn thêm thông tin bệnh nhân từ bảng Users
        u = User.query.filter_by(patient_code=c.patient_id).first()
        d["patient_name"] = u.full_name if u else "Bệnh nhân cao tuổi"
        d["age"] = u.age if u else 70
        d["gender"] = u.gender if u else "Nam"
        d["caregiver_name"] = u.caregiver_name if u else "Người thân"
        d["caregiver_phone"] = u.caregiver_phone if u else "0987654321"
        results.append(d)

    return results


def add_new_camera(data):
    """
    Thêm camera mới gắn trực tiếp vào bệnh nhân.
    """
    try:
        name = data.get("name") or data.get("camera_name") or "Camera AI Mới"
        rtsp_url = data.get("rtsp_url") or "rtsp://192.168.1.100:554/stream1"
        patient_id = data.get("patient_id") or "PAT10000"
        location = data.get("location") or "Phòng Ngủ"
        room = data.get("room") or location

        count = Camera.query.count()
        camera_code = data.get("camera_code") or f"CAM{count + 1:03d}"

        c = Camera(
            camera_code=camera_code,
            patient_id=patient_id,
            name=name,
            rtsp_url=rtsp_url,
            location=location,
            room=room,
            status=data.get("status", "ONLINE"),
            ai_enabled=bool(data.get("ai_enabled", True)),
            sensitivity=data.get("sensitivity", "High"),
            last_seen_at=datetime.utcnow()
        )
        db.session.add(c)
        db.session.commit()
        return {"success": True, "data": c.to_dict(), "message": "Đã thêm camera mới thành công."}, 201
    except Exception as e:
        db.session.rollback()
        return {"success": False, "error": str(e)}, 400


def update_camera(camera_id, data):
    """
    Cập nhật thông tin camera trong CSDL.
    """
    c = db.session.get(Camera, camera_id)
    if not c:
        return None

    if "name" in data or "camera_name" in data:
        c.name = data.get("name") or data.get("camera_name")
    if "rtsp_url" in data:
        c.rtsp_url = data.get("rtsp_url")
    if "patient_id" in data:
        c.patient_id = data.get("patient_id")
    if "location" in data:
        c.location = data.get("location")
    if "room" in data:
        c.room = data.get("room")
    if "status" in data:
        c.status = data.get("status")
    if "ai_enabled" in data:
        c.ai_enabled = bool(data.get("ai_enabled"))
    if "sensitivity" in data:
        c.sensitivity = data.get("sensitivity")

    c.updated_at = datetime.utcnow()
    c.last_seen_at = datetime.utcnow()
    db.session.commit()
    return c.to_dict()


def delete_camera(camera_id):
    """
    Xóa camera khỏi CSDL.
    """
    c = db.session.get(Camera, camera_id)
    if not c:
        return False
    db.session.delete(c)
    db.session.commit()
    return True


def trigger_fall_simulation(camera_id, snapshot_url=None):
    """
    Kích hoạt phát hiện ngã mẫu từ Camera và tạo bản ghi Alert trong CSDL.
    """
    c = db.session.get(Camera, camera_id)
    p_id = c.patient_id if c else "PAT10000"
    loc = c.location if c else "Phòng Ngủ 101"

    alert = Alert(
        patient_id=p_id,
        camera_id=camera_id,
        alert_type="FALL",
        title=f"CẢNH BÁO TÉ NGÃ — {loc.upper()}",
        severity="CRITICAL",
        confidence=0.94,
        status="ALERTED",
        location=loc,
        spine_angle=78.5,
        duration_seconds=14,
        snapshot_url=snapshot_url,
        alert_created_at=datetime.utcnow()
    )
    db.session.add(alert)
    db.session.commit()
    return {"success": True, "alert": alert.to_dict()}


def get_active_alerts():
    """Hàm tương thích lấy danh sách cảnh báo từ AlertService"""
    from services.alert_service import AlertService
    return AlertService.get_alerts(user_role="Admin")


def acknowledge_alert(alert_id, status_code="ACKNOWLEDGED"):
    """Hàm tương thích xác nhận cảnh báo từ AlertService"""
    from services.alert_service import AlertService
    return AlertService.acknowledge_alert(alert_id)

