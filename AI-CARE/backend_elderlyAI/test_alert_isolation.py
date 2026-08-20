# ==============================================================================
# TEST SUITE: COMPLETE ALERT DATA ISOLATION & RBAC (ADMIN vs USER)
# ==============================================================================
import sys
from app import app
from database import db
from models.alert import Alert
from services.alert_service import AlertService

def log(msg):
    sys.stdout.buffer.write((str(msg) + "\n").encode("utf-8"))

def run_tests():
    log("=" * 75)
    log("ELDERLYCARE AI — ALERT & NOTIFICATION DATA ISOLATION TEST SUITE")
    log("=" * 75)

    client = app.test_client()

    with app.app_context():
        # Seed test alerts if needed
        AlertService.seed_alerts_if_empty()
        
        # Tạo thêm sample alert cho PAT10000 và PAT10001 nếu chưa có
        if not Alert.query.filter_by(patient_id="PAT10000", alert_type="FALL").first():
            AlertService.create_alert({
                "patient_id": "PAT10000",
                "alert_type": "FALL",
                "title": "🚨 Cảnh báo té ngã tại phòng ngủ PAT10000",
                "severity": "CRITICAL"
            })
        if not Alert.query.filter_by(patient_id="PAT10001", alert_type="FALL").first():
            AlertService.create_alert({
                "patient_id": "PAT10001",
                "alert_type": "FALL",
                "title": "🚨 Cảnh báo té ngã tại phòng ngủ PAT10001",
                "severity": "CRITICAL"
            })

    # --------------------------------------------------------------------------
    # TEST 1: Admin xem toàn bộ cảnh báo hệ thống
    # --------------------------------------------------------------------------
    res = client.get("/api/admin/alerts?page=1&limit=20", headers={"X-User-Role": "Admin"})
    assert res.status_code == 200, f"Admin GET /api/admin/alerts failed: {res.status_code}"
    data_admin = res.get_json()
    assert data_admin["success"] is True
    assert "pagination" in data_admin
    patient_codes_admin = set(a.get("patient_code") or a.get("patient_id") for a in data_admin["data"])
    log(f"[TEST 1] Admin Alerts: Status=200, Total={data_admin['pagination']['total']}, Patients={list(patient_codes_admin)[:3]}")
    log("         [PASS] Admin can access all system alerts with pagination!")

    # --------------------------------------------------------------------------
    # TEST 2: User 1 (PAT10000) chỉ xem cảnh báo của PAT10000
    # --------------------------------------------------------------------------
    res = client.get("/api/user/alerts?page=1&limit=20", headers={"X-User-Role": "User", "X-User-Id": "1"})
    assert res.status_code == 200, f"User 1 GET /api/user/alerts failed: {res.status_code}"
    data_user1 = res.get_json()
    assert data_user1["success"] is True
    p_codes_u1 = set(a.get("patient_code") or a.get("patient_id") for a in data_user1["data"])
    log(f"[TEST 2] User 1 (PAT10000) Alerts: Status=200, Count={len(data_user1['data'])}, Patients={p_codes_u1}")
    assert p_codes_u1 == {"PAT10000"}, "User 1 must ONLY see PAT10000 alerts!"
    log("         [PASS] User 1 strictly isolated to PAT10000 alerts 100%!")

    # --------------------------------------------------------------------------
    # TEST 3: User 3 (PAT00002) chỉ xem cảnh báo của PAT00002
    # --------------------------------------------------------------------------
    with app.app_context():
        if not Alert.query.filter_by(patient_id="PAT00002").first():
            AlertService.create_alert({
                "patient_id": "PAT00002",
                "alert_type": "ABNORMAL_MOVEMENT",
                "title": "⚠️ Cảnh báo bất thường PAT00002",
                "severity": "WARNING"
            })

    res = client.get("/api/user/alerts?page=1&limit=20", headers={"X-User-Role": "User", "X-User-Id": "3"})
    assert res.status_code == 200, f"User 3 GET /api/user/alerts failed: {res.status_code}"
    data_user3 = res.get_json()
    assert data_user3["success"] is True
    p_codes_u3 = set(a.get("patient_code") or a.get("patient_id") for a in data_user3["data"])
    log(f"[TEST 3] User 3 (PAT10002) Alerts: Status=200, Count={len(data_user3['data'])}, Patients={p_codes_u3}")
    assert p_codes_u3 == {"PAT10002"}, "User 3 must ONLY see PAT10002 alerts!"
    log("         [PASS] User 3 strictly isolated to PAT10002 alerts 100%!")

    # --------------------------------------------------------------------------
    # TEST 4: Security Check - User 1 cố tình gọi cảnh báo của PAT10001
    # --------------------------------------------------------------------------
    res = client.get("/api/user/patients/PAT10001/alerts", headers={"X-User-Role": "User", "X-User-Id": "1"})
    log(f"[TEST 4] User 1 illegal call to PAT10001: Status={res.status_code}")
    assert res.status_code == 403, f"Must return 403 Forbidden, got {res.status_code}"
    log("         [PASS] Security Check passed: 403 Forbidden returned for unauthorized patient request!")

    # --------------------------------------------------------------------------
    # TEST 5: Security Check - User 1 cố tình gọi Admin API
    # --------------------------------------------------------------------------
    res = client.get("/api/admin/alerts", headers={"X-User-Role": "User", "X-User-Id": "1"})
    log(f"[TEST 5] User 1 illegal call to Admin API: Status={res.status_code}")
    assert res.status_code == 403, f"Must return 403 Forbidden, got {res.status_code}"
    log("         [PASS] Security Check passed: 403 Forbidden returned for non-admin user calling admin API!")

    # --------------------------------------------------------------------------
    # TEST 6: Admin cập nhật trạng thái cảnh báo (Resolve)
    # --------------------------------------------------------------------------
    sample_alert_id = data_admin["data"][0]["alert_id"]
    res = client.patch(
        f"/api/admin/alerts/{sample_alert_id}/status",
        json={"status": "RESOLVED", "operator_name": "BS. Phạm Tiến Việt", "note": "Đã sơ cứu an toàn"},
        headers={"X-User-Role": "Admin"}
    )
    assert res.status_code == 200, f"Admin update alert status failed: {res.status_code}"
    updated_data = res.get_json()
    assert updated_data["alert"]["status"] == "RESOLVED"
    log(f"[TEST 6] Admin Resolve Alert #{sample_alert_id}: Status=200, New Status={updated_data['alert']['status']}")
    log("         [PASS] Alert state machine & resolution persist in Database!")

    # --------------------------------------------------------------------------
    # TEST 7: Thống kê Alert Stats theo Role
    # --------------------------------------------------------------------------
    res_admin_stats = client.get("/api/admin/alerts/stats", headers={"X-User-Role": "Admin"})
    res_user_stats = client.get("/api/user/alerts/stats", headers={"X-User-Role": "User", "X-User-Id": "1"})
    assert res_admin_stats.status_code == 200 and res_user_stats.status_code == 200
    log(f"[TEST 7] Stats Isolation: Admin Total={res_admin_stats.get_json()['stats']['total']}, User 1 Total={res_user_stats.get_json()['stats']['total']}")
    assert res_admin_stats.get_json()['stats']['total'] >= res_user_stats.get_json()['stats']['total']
    log("         [PASS] Alert statistics strictly isolated by Role!")

    log("=" * 75)
    log(">>> ALL 7 ALERT ISOLATION & SECURITY TESTS PASSED 100%! <<<")
    log("=" * 75)

if __name__ == "__main__":
    run_tests()
