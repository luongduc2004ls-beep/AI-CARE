"""
Comprehensive Production Refactor & Security Test Suite
ElderlyCare AI System
"""

import sys
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

import json
import urllib.request
import urllib.parse
from app import app
from database import db
from models import User, Prescription, PrescriptionItem, Medicine, MedicineSchedule
from services.auth_service import AuthService
from services.rbac_service import RBACService


def log(s):
    print(s)


def api_request(method, url, data=None, token=None, headers=None):
    h = {"Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    if headers:
        h.update(headers)
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data else None,
        headers=h,
        method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw_error": body}
    except Exception as e:
        return 500, {"error": str(e)}


def run_full_suite():
    log("=" * 80)
    log("ELDERLYCARE AI — PRODUCTION REFACTOR & SECURITY ACCEPTANCE TEST SUITE")
    log("=" * 80)

    # -------------------------------------------------------------
    # SETUP USERS IN DB
    # -------------------------------------------------------------
    with app.app_context():
        # Setup Admin
        admin = User.query.filter_by(username="admin_test").first()
        if not admin:
            admin = User(
                username="admin_test",
                email="admin_test@elderlyai.vn",
                full_name="Quản Trị Viên Kiểm Thử",
                role="Admin",
                patient_code="PAT_ADMIN_TEST",
                is_active=True
            )
            admin.set_password("AdminSecure@2026")
            db.session.add(admin)
            db.session.commit()
        else:
            admin.role = "Admin"
            admin.set_password("AdminSecure@2026")
            db.session.commit()

        # Setup User Patient PAT10000
        user_pat1 = User.query.filter_by(patient_code="PAT10000").first()
        if not user_pat1:
            user_pat1 = User(
                username="user_pat10000",
                email="pat10000@elderlyai.vn",
                full_name="Bệnh Nhân Nguyễn Văn An",
                role="Patient",
                patient_code="PAT10000",
                is_active=True
            )
            user_pat1.set_password("Pat10000Pass@2026")
            db.session.add(user_pat1)
            db.session.commit()
        else:
            user_pat1.username = "user_pat10000"
            user_pat1.role = "Patient"
            user_pat1.set_password("Pat10000Pass@2026")
            db.session.commit()

        # Setup User Patient PAT10001
        user_pat2 = User.query.filter_by(patient_code="PAT10001").first()
        if not user_pat2:
            user_pat2 = User(
                username="user_pat10001",
                email="pat10001@elderlyai.vn",
                full_name="Bệnh Nhân Phan Anh Thảo",
                role="Patient",
                patient_code="PAT10001",
                is_active=True
            )
            user_pat2.set_password("Pat10001Pass@2026")
            db.session.add(user_pat2)
            db.session.commit()
        else:
            user_pat2.username = "user_pat10001"
            user_pat2.role = "Patient"
            user_pat2.set_password("Pat10001Pass@2026")
            db.session.commit()

    base_url = "http://127.0.0.1:5000/api"

    # -------------------------------------------------------------
    # TEST 1: JWT AUTHENTICATION & LOGIN
    # -------------------------------------------------------------
    log("\n[TEST 1] JWT Authentication & Token Signing")
    status, login_admin = api_request("POST", f"{base_url}/auth/login", {"username": "admin_test", "password": "AdminSecure@2026"})
    assert status == 200 and login_admin.get("token"), f"Admin login failed: {login_admin}"
    admin_token = login_admin["token"]
    log("  -> PASS: Admin login successful, valid JWT issued.")

    status, login_pat1 = api_request("POST", f"{base_url}/auth/login", {"username": "user_pat10000", "password": "Pat10000Pass@2026"})
    assert status == 200 and login_pat1.get("token"), f"Patient 1 login failed: {login_pat1}"
    pat1_token = login_pat1["token"]
    log("  -> PASS: Patient 1 (PAT10000) login successful, valid JWT issued.")

    # -------------------------------------------------------------
    # TEST 2: /auth/me ACCURACY (NO FIRST USER MOCK)
    # -------------------------------------------------------------
    log("\n[TEST 2] /auth/me DB Verification")
    status, me_pat1 = api_request("GET", f"{base_url}/auth/me", token=pat1_token)
    assert status == 200, f"/auth/me failed: {me_pat1}"
    assert me_pat1["user"]["patient_code"] == "PAT10000", "Must return PAT10000 user details"
    log(f"  -> PASS: /auth/me for PAT10000 returned: user_id={me_pat1['user']['user_id']}, patient_code={me_pat1['user']['patient_code']}")

    status, me_unauth = api_request("GET", f"{base_url}/auth/me")
    assert status == 401, f"Expected 401 for missing token, got {status}"
    log("  -> PASS: /auth/me without token correctly rejected with 401 Unauthorized.")

    # -------------------------------------------------------------
    # TEST 3: PATIENT DATA ISOLATION & ACCESS CONTROL
    # -------------------------------------------------------------
    log("\n[TEST 3] Patient Data Isolation (Strict Scope Checking)")
    # PAT10000 accesses their own medications -> 200 OK
    status, my_meds = api_request("GET", f"{base_url}/patients/PAT10000/medications", token=pat1_token)
    assert status == 200, f"PAT10000 accessing own meds failed: {my_meds}"
    log(f"  -> PASS: PAT10000 successfully retrieved own medications ({my_meds.get('total_medications')} items).")

    # PAT10000 attempts to access PAT10001 medications -> 403 FORBIDDEN
    status, cross_meds = api_request("GET", f"{base_url}/patients/PAT10001/medications", token=pat1_token)
    assert status == 403, f"Expected 403 Forbidden for cross-patient access, got {status}"
    log("  -> PASS: Cross-patient data access attempt strictly blocked with 403 Forbidden.")

    # -------------------------------------------------------------
    # TEST 4: MEDICATION SCHEDULE (FIX 500 ERROR)
    # -------------------------------------------------------------
    log("\n[TEST 4] Medication Schedule API (Fix Relationship & JSON Response)")
    status, sched_res = api_request("GET", f"{base_url}/patients/PAT10000/medications/schedule", token=admin_token)
    assert status == 200, f"Medication schedule failed: {sched_res}"
    assert "schedules" in sched_res, "Response must contain 'schedules' key"
    log(f"  -> PASS: Schedule API returned HTTP 200 JSON with {sched_res.get('total_schedules', 0)} schedules.")

    # -------------------------------------------------------------
    # TEST 5: GLOBAL JSON ERROR HANDLING
    # -------------------------------------------------------------
    log("\n[TEST 5] Global JSON Error Handling")
    status, not_found_res = api_request("GET", f"{base_url}/non-existent-endpoint-404")
    assert status == 404 and isinstance(not_found_res, dict), "Must return JSON 404"
    assert not_found_res.get("error", {}).get("code") == "NOT_FOUND", "Error code must be NOT_FOUND"
    log("  -> PASS: Non-existent routes return structured JSON error (no HTML).")

    # -------------------------------------------------------------
    # TEST 6: ADMIN AI AGENT SEPARATION & REASONING
    # -------------------------------------------------------------
    log("\n[TEST 6] Admin AI Agent vs Patient AI Agent Separation")
    status, admin_ai_res = api_request("POST", f"{base_url}/admin/ai/chat", {"message": "PAT10000 đang uống thuốc gì?"}, token=admin_token)
    assert status == 200, f"Admin AI chat failed: {admin_ai_res}"
    reply = admin_ai_res.get("reply", "")
    assert "Amlodipine" in reply and "Atorvastatin" in reply, "Admin AI must report PAT10000 medicines"
    assert "Omeprazole" not in reply, "Must not leak PAT10001 medicines into PAT10000 response"
    log("  -> PASS: Admin AI accurately queries isolated DB records for patient.")

    # Patient AI User Scope
    status, user_ai_res = api_request("POST", f"{base_url}/user/ai/chat", {"message": "Thuốc của tôi hôm nay thế nào?", "patient_code": "PAT10000"}, token=pat1_token)
    assert status == 200, f"User AI chat failed: {user_ai_res}"
    log("  -> PASS: Patient AI chat operational within isolated scope.")

    # -------------------------------------------------------------
    # TEST 7: CROSS-PATIENT DOSAGE ISOLATION
    # -------------------------------------------------------------
    log("\n[TEST 7] Cross-Patient Dosage Isolation")
    status, pat1_data = api_request("GET", f"{base_url}/patients/PAT10000/medications", token=admin_token)
    status, pat2_data = api_request("GET", f"{base_url}/patients/PAT10001/medications", token=admin_token)

    amlo1 = next(m for m in pat1_data.get("medications", []) if "amlodipine" in m.get("name", "").lower())
    amlo2 = next(m for m in pat2_data.get("medications", []) if "amlodipine" in m.get("name", "").lower())

    assert "5mg" in amlo1.get("dosage"), "PAT10000 dosage must contain 5mg"
    assert "10mg" in amlo2.get("dosage"), "PAT10001 dosage must contain 10mg"
    log(f"  -> PASS: Dosage isolated: PAT10000={amlo1.get('dosage')} | PAT10001={amlo2.get('dosage')}")

    # -------------------------------------------------------------
    # TEST 8: INTAKE TRACKING & HISTORY RECORDING
    # -------------------------------------------------------------
    log("\n[TEST 8] Record Intake & History Persistence")
    first_sched_id = sched_res.get("schedules", [{}])[0].get("schedule_id")
    if first_sched_id:
        status, take_res = api_request("POST", f"{base_url}/patients/PAT10000/medications/schedule/{first_sched_id}/take", {"status": "Đã uống", "note": "Kiểm thử tự động"}, token=admin_token)
        assert status == 200, f"Intake record failed: {take_res}"
        log("  -> PASS: Medication intake recorded and persisted.")

    log("\n" + "=" * 80)
    log(">>> ALL 8 COMPREHENSIVE REFACTOR & SECURITY TESTS PASSED (100%)! <<<")
    log("=" * 80)


if __name__ == "__main__":
    run_full_suite()
