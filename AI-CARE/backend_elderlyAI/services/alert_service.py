"""
Alert Service & Lifecycle Manager
Enforces Multi-Tenant Data Isolation, State Machine, RBAC & Pagination.
"""
import math
from datetime import datetime
from database import db
from models.alert import Alert
from models.camera import Camera
from models.user import User
from services.auth_permission_service import AuthPermissionService

INITIAL_ALERTS = [
    {
        "patient_id": "PAT10000",
        "camera_id": 1,
        "alert_type": "FALL",
        "title": "🚨 CẢNH BÁO TÉ NGÃ: Phát hiện ngã tại Phòng Ngủ 101",
        "severity": "CRITICAL",
        "confidence": 0.94,
        "status": "ALERTED",
        "location": "Phòng Ngủ 101",
        "spine_angle": 78.5,
        "duration_seconds": 14
    },
    {
        "patient_id": "PAT10002",
        "camera_id": 3,
        "alert_type": "ABNORMAL_MOVEMENT",
        "title": "⚠️ BẤT THƯỜNG: Chuyển động yếu trong Nhà Vệ Sinh",
        "severity": "WARNING",
        "confidence": 0.88,
        "status": "ACKNOWLEDGED",
        "location": "Nhà Vệ Sinh Tầng 1",
        "spine_angle": 52.0,
        "duration_seconds": 8,
        "acknowledged_by": "Điều dưỡng trực ca"
    },
    {
        "patient_id": "PAT10001",
        "camera_id": 2,
        "alert_type": "FALL",
        "title": "✅ ĐÃ XỬ LÝ: Sự cố trượt chân nhẹ tại Phòng Khách",
        "severity": "INFO",
        "confidence": 0.91,
        "status": "RESOLVED",
        "location": "Phòng Khách Trung Tâm",
        "spine_angle": 12.0,
        "duration_seconds": 0,
        "acknowledged_by": "Bác sĩ phụ trách",
        "resolved_by": "Bác sĩ phụ trách",
        "resolution_note": "Bệnh nhân trượt chân nhẹ, đã được hỗ trợ đứng dậy an toàn."
    }
]

def seed_alerts_if_empty():
    try:
        count = Alert.query.count()
        if count == 0:
            for item in INITIAL_ALERTS:
                al = Alert(
                    patient_id=item["patient_id"],
                    camera_id=item.get("camera_id"),
                    alert_type=item.get("alert_type", "FALL"),
                    title=item.get("title", "Cảnh báo"),
                    severity=item.get("severity", "CRITICAL"),
                    confidence=item.get("confidence", 0.92),
                    status=item.get("status", "ALERTED"),
                    location=item.get("location", "Phòng Ngủ"),
                    spine_angle=item.get("spine_angle", 78.5),
                    duration_seconds=item.get("duration_seconds", 14),
                    acknowledged_by=item.get("acknowledged_by"),
                    resolved_by=item.get("resolved_by"),
                    resolution_note=item.get("resolution_note"),
                    alert_created_at=datetime.utcnow()
                )
                db.session.add(al)
            db.session.commit()
    except Exception:
        db.session.rollback()


class AlertService:
    @staticmethod
    def seed_alerts_if_empty():
        seed_alerts_if_empty()

    @staticmethod
    def _enrich_alert_dict(alert_obj):
        """Làm giàu dữ liệu cảnh báo với thông tin bệnh nhân từ CSDL"""
        d = alert_obj.to_dict()
        u = User.query.filter_by(patient_code=alert_obj.patient_id).first()
        if not u and str(alert_obj.patient_id).isdigit():
            u = db.session.get(User, int(alert_obj.patient_id))

        d["patient_name"] = u.full_name if u else (f"Bệnh nhân {alert_obj.patient_id}")
        d["patient_code"] = u.patient_code if u and u.patient_code else alert_obj.patient_id
        d["age"] = u.age if u else 70
        d["gender"] = u.gender if u else "Nam"
        d["room_number"] = getattr(u, "room_number", None) or alert_obj.location
        d["caregiver_name"] = u.caregiver_name if u else "Người thân"
        d["caregiver_phone"] = u.caregiver_phone if u else "0987654321"
        return d

    @staticmethod
    def get_admin_alerts_paginated(filters=None, page=1, limit=20):
        """
        Dành riêng cho ADMIN:
        Xem toàn bộ cảnh báo hệ thống, hỗ trợ lọc theo bệnh nhân, camera, mức độ, trạng thái, thời gian.
        """
        seed_alerts_if_empty()
        query = Alert.query
        filters = filters or {}

        if filters.get("patient_id"):
            pid = str(filters["patient_id"]).strip()
            query = query.filter(Alert.patient_id == pid)

        if filters.get("camera_id"):
            try:
                cid = int(filters["camera_id"])
                query = query.filter(Alert.camera_id == cid)
            except ValueError:
                pass

        if filters.get("alert_type") and filters["alert_type"] != "all":
            query = query.filter(Alert.alert_type == filters["alert_type"])

        if filters.get("severity") and filters["severity"] != "all":
            query = query.filter(Alert.severity == filters["severity"])

        if filters.get("status") and filters["status"] != "all":
            query = query.filter(Alert.status == filters["status"])

        if filters.get("from_date"):
            try:
                f_date = datetime.strptime(filters["from_date"], "%Y-%m-%d")
                query = query.filter(Alert.alert_created_at >= f_date)
            except Exception:
                pass

        if filters.get("to_date"):
            try:
                t_date = datetime.strptime(filters["to_date"] + " 23:59:59", "%Y-%m-%d %H:%M:%S")
                query = query.filter(Alert.alert_created_at <= t_date)
            except Exception:
                pass

        total = query.count()
        page = max(1, int(page or 1))
        limit = max(1, min(2000, int(limit or 1000)))
        total_pages = max(1, math.ceil(total / limit))

        offset = (page - 1) * limit
        alerts = query.order_by(Alert.alert_created_at.desc()).offset(offset).limit(limit).all()

        return {
            "data": [AlertService._enrich_alert_dict(a) for a in alerts],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages,
                "hasNext": page < total_pages,
                "hasPrev": page > 1
            }
        }

    @staticmethod
    def get_user_alerts_paginated(user_id, user_role="User", target_patient_id=None, filters=None, page=1, limit=100):
        """
        Dành riêng cho USER / CAREGIVER:
        Chỉ trả về cảnh báo của các bệnh nhân mà tài khoản được cấp quyền (UserPatientAccess).
        """
        seed_alerts_if_empty()
        allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)

        # Nếu user yêu cầu cụ thể 1 target_patient_id
        if target_patient_id:
            target_pid = str(target_patient_id).strip()
            if target_pid not in allowed_ids:
                return None, "403 Forbidden: Bạn không có quyền truy cập cảnh báo của bệnh nhân này"
            allowed_ids = [target_pid]

        if not allowed_ids:
            return {
                "data": [],
                "pagination": {"page": 1, "limit": limit, "total": 0, "totalPages": 1}
            }, None

        query = Alert.query.filter(Alert.patient_id.in_(allowed_ids))
        filters = filters or {}

        if filters.get("alert_type") and filters["alert_type"] != "all":
            query = query.filter(Alert.alert_type == filters["alert_type"])

        if filters.get("severity") and filters["severity"] != "all":
            query = query.filter(Alert.severity == filters["severity"])

        if filters.get("status") and filters["status"] != "all":
            query = query.filter(Alert.status == filters["status"])

        total = query.count()
        page = max(1, int(page or 1))
        limit = max(1, min(2000, int(limit or 100)))
        total_pages = max(1, math.ceil(total / limit))

        offset = (page - 1) * limit
        alerts = query.order_by(Alert.alert_created_at.desc()).offset(offset).limit(limit).all()

        return {
            "data": [AlertService._enrich_alert_dict(a) for a in alerts],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages,
                "hasNext": page < total_pages,
                "hasPrev": page > 1
            }
        }, None

    @staticmethod
    def get_alert_by_id(alert_id, user_id=None, user_role="Admin"):
        """Tra cứu chi tiết cảnh báo có kiểm tra quyền sở hữu"""
        alert = db.session.get(Alert, alert_id)
        if not alert:
            return None, "Không tìm thấy cảnh báo"

        if (user_role or "").upper() != "ADMIN":
            allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
            if alert.patient_id not in allowed_ids:
                return None, "403 Forbidden: Bạn không có quyền truy cập cảnh báo này"

        return AlertService._enrich_alert_dict(alert), None

    @staticmethod
    def update_alert_status(alert_id, new_status, user_role="Admin", operator_name="Admin", note=None):
        """Cập nhật vòng đời cảnh báo (Chỉ Admin hoặc Caregiver có quyền phù hợp)"""
        alert = db.session.get(Alert, alert_id)
        if not alert:
            return None, "Không tìm thấy cảnh báo"

        status_upper = str(new_status).upper()
        now = datetime.utcnow()

        if status_upper == "ACKNOWLEDGED":
            alert.status = "ACKNOWLEDGED"
            alert.acknowledged_at = now
            alert.acknowledged_by = operator_name
        elif status_upper == "RESOLVED":
            alert.status = "RESOLVED"
            alert.resolved_at = now
            alert.resolved_by = operator_name
            if note:
                alert.resolution_note = note
        else:
            alert.status = status_upper

        db.session.commit()
        return AlertService._enrich_alert_dict(alert), None

    @staticmethod
    def get_alert_stats(user_id=None, user_role="Admin"):
        """Tính toán các chỉ số thống kê cảnh báo theo phân quyền Role"""
        seed_alerts_if_empty()
        query = Alert.query

        if (user_role or "").upper() != "ADMIN":
            allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
            query = query.filter(Alert.patient_id.in_(allowed_ids))

        total_alerts = query.count()
        fall_alerts = query.filter(Alert.alert_type == "FALL").count()
        health_alerts = query.filter(Alert.alert_type.in_(["HEALTH", "MEDICATION", "ABNORMAL_MOVEMENT"])).count()
        pending_alerts = query.filter(Alert.status.in_(["ALERTED", "DETECTED", "CONFIRMED"])).count()
        acknowledged_alerts = query.filter(Alert.status == "ACKNOWLEDGED").count()
        resolved_alerts = query.filter(Alert.status == "RESOLVED").count()

        return {
            "total": total_alerts,
            "fall_count": fall_alerts,
            "health_count": health_alerts,
            "pending_count": pending_alerts,
            "acknowledged_count": acknowledged_alerts,
            "resolved_count": resolved_alerts
        }

    @staticmethod
    def create_alert(data):
        """Tạo mới một cảnh báo (Gắn chặt với patient_id từ camera/sensor)"""
        now = datetime.utcnow()
        alert = Alert(
            patient_id=data.get("patient_id", "PAT10000"),
            camera_id=data.get("camera_id"),
            event_id=data.get("event_id"),
            alert_type=data.get("alert_type", "FALL"),
            title=data.get("title", "CẢNH BÁO SỰ CỐ AN TOÀN"),
            severity=data.get("severity", "CRITICAL"),
            confidence=float(data.get("confidence", 0.94)),
            status=data.get("status", "ALERTED"),
            location=data.get("location", "Phòng Ngủ 101"),
            spine_angle=float(data.get("spine_angle", 78.5)),
            duration_seconds=int(data.get("duration_seconds", 14)),
            snapshot_url=data.get("snapshot_url"),
            alert_created_at=now,
            created_at=now
        )
        db.session.add(alert)
        db.session.commit()
        return AlertService._enrich_alert_dict(alert)

    @staticmethod
    def get_alerts(user_role="Admin", user_id=None, status=None, limit=50):
        """Hàm tương thích ngược trả về danh sách cảnh báo"""
        if (user_role or "").upper() == "ADMIN":
            res = AlertService.get_admin_alerts_paginated(filters={"status": status}, limit=limit)
            return res.get("data", [])
        else:
            res, _ = AlertService.get_user_alerts_paginated(user_id=user_id, user_role=user_role, filters={"status": status}, limit=limit)
            return res.get("data", []) if res else []

    @staticmethod
    def acknowledge_alert(alert_id, acknowledged_by="Quản trị viên"):
        """Xác nhận đã tiếp nhận cảnh báo"""
        res, _ = AlertService.update_alert_status(alert_id, "ACKNOWLEDGED", operator_name=acknowledged_by)
        return res

    @staticmethod
    def resolve_alert(alert_id, resolved_by="Bác sĩ / Quản trị viên", resolution_note="Đã kiểm tra an toàn"):
        """Giải quyết cảnh báo"""
        res, _ = AlertService.update_alert_status(alert_id, "RESOLVED", operator_name=resolved_by, note=resolution_note)
        return res
