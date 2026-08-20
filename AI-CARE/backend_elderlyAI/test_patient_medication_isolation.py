import urllib.request
import urllib.parse
import json
import sys

def log(s):
    sys.stdout.buffer.write((str(s) + "\n").encode("utf-8"))

def request(method, url, data=None, headers=None):
    h = {"Content-Type": "application/json"}
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
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 500, {"error": str(e)}

log("=" * 75)
log("ELDERLYCARE AI — 10 PRODUCTION PATIENT MEDICATION ISOLATION TESTS")
log("=" * 75)

# TEST 1: PAT10000 (Nguyễn Văn An) Medications
status, res1 = request("GET", "http://127.0.0.1:5000/api/patients/PAT10000/medications", headers={"X-User-Role": "Admin"})
meds1 = [f"{m.get('name')} ({m.get('dosage')})" for m in res1.get("medications", [])]
log(f">>> TEST 1: PAT10000 (Nguyễn Văn An) Meds: {meds1}")
assert any("Amlodipine" in m and "5mg" in m for m in meds1), "PAT10000 must have Amlodipine 5mg"
assert any("Atorvastatin" in m and "10mg" in m for m in meds1), "PAT10000 must have Atorvastatin 10mg"
assert not any("Omeprazole" in m for m in meds1), "PAT10000 must NOT have Omeprazole"
log("    [PASS] PAT10000 medications strictly isolated!")

# TEST 2: PAT10001 (Phan Anh Thảo) Medications
status, res2 = request("GET", "http://127.0.0.1:5000/api/patients/PAT10001/medications", headers={"X-User-Role": "Admin"})
meds2 = [f"{m.get('name')} ({m.get('dosage')})" for m in res2.get("medications", [])]
log(f">>> TEST 2: PAT10001 (Phan Anh Thảo) Meds: {meds2}")
assert any("Amlodipine" in m and "10mg" in m for m in meds2), "PAT10001 must have Amlodipine 10mg"
assert any("Omeprazole" in m and "20mg" in m for m in meds2), "PAT10001 must have Omeprazole 20mg"
assert not any("Atorvastatin" in m for m in meds2), "PAT10001 must NOT have Atorvastatin"
log("    [PASS] PAT10001 medications strictly isolated!")

# TEST 3: Cross-Patient Dosage Isolation (Same medicine 'Amlodipine', different dosage)
amlo_pat1 = next(m for m in res1.get("medications", []) if "amlodipine" in m.get("name", "").lower())
amlo_pat2 = next(m for m in res2.get("medications", []) if "amlodipine" in m.get("name", "").lower())
log(f">>> TEST 3: Dosage Isolation: PAT10000={amlo_pat1.get('dosage')}, PAT10001={amlo_pat2.get('dosage')}")
assert "5mg" in amlo_pat1.get("dosage"), "PAT10000 dosage must contain 5mg"
assert "10mg" in amlo_pat2.get("dosage"), "PAT10001 dosage must contain 10mg"
log("    [PASS] No dosage cross-leakage between patients!")

# TEST 4: Cross-Patient Schedule Isolation (Same medicine 'Amlodipine', different intake time)
status, sched1 = request("GET", "http://127.0.0.1:5000/api/patients/PAT10000/medications/schedule", headers={"X-User-Role": "Admin"})
status, sched2 = request("GET", "http://127.0.0.1:5000/api/patients/PAT10001/medications/schedule", headers={"X-User-Role": "Admin"})
time_pat1 = [s.get("time") for s in sched1.get("schedules", []) if "amlodipine" in s.get("medicine_name", "").lower()][0]
time_pat2 = [s.get("time") for s in sched2.get("schedules", []) if "amlodipine" in s.get("medicine_name", "").lower()][0]
log(f">>> TEST 4: Schedule Isolation: PAT10000 at {time_pat1}, PAT10001 at {time_pat2}")
assert time_pat1 == "08:00", "PAT10000 must take at 08:00"
assert time_pat2 == "07:00", "PAT10001 must take at 07:00"
log("    [PASS] No schedule cross-leakage between patients!")

# TEST 5: Prescriptions API
status, rx_res = request("GET", "http://127.0.0.1:5000/api/patients/PAT10000/prescriptions", headers={"X-User-Role": "Admin"})
log(f">>> TEST 5: PAT10000 Prescriptions Count: {rx_res.get('total_prescriptions')}, Code: {rx_res.get('prescriptions', [{}])[0].get('prescription_code')}")
assert rx_res.get("total_prescriptions") >= 1, "Must have at least 1 prescription"
log("    [PASS] Prescriptions API verified!")

# TEST 6: Record Intake & MedicationHistory
first_sched_id = sched1.get("schedules", [{}])[0].get("schedule_id")
status, take_res = request("POST", f"http://127.0.0.1:5000/api/patients/PAT10000/medications/schedule/{first_sched_id}/take", {"status": "Đã uống", "taken_by": "Người thân", "note": "Đã uống đủ liều"}, headers={"X-User-Role": "Admin"})
log(f">>> TEST 6: Record Intake: Status={take_res.get('schedule', {}).get('status')}")
assert take_res.get("schedule", {}).get("status") == "Đã uống", "Must update status to Đã uống"
log("    [PASS] Intake recorded and history updated!")

# TEST 7: RBAC Security — User accessing unauthorized patient
status, err_res = request("GET", "http://127.0.0.1:5000/api/patients/PAT10001/medications", headers={"X-User-Role": "User", "X-User-Id": "1"})
log(f">>> TEST 7: RBAC Access Control: HTTP Status={status}")
assert status == 403, "Must return 403 Forbidden for unauthorized patient"
log("    [PASS] RBAC Patient Data Isolation verified!")

# TEST 8: Gemini AI — Patient Medication Query
status, ai_res = request("POST", "http://127.0.0.1:5000/api/admin/ai/chat", {"message": "PAT10000 đang uống thuốc gì?"}, headers={"X-User-Role": "Admin", "X-User-Id": "1"})
log(f">>> TEST 8: AI Patient Medication Query Reply Preview:\n{ai_res.get('reply', '')[:240]}...\n")
assert "Amlodipine" in ai_res.get("reply", "") and "Atorvastatin" in ai_res.get("reply", ""), "AI must report PAT10000's exact medicines"
assert "Omeprazole" not in ai_res.get("reply", ""), "AI must NOT report Thảo's Omeprazole for PAT10000"
log("    [PASS] Gemini AI retrieves exact isolated patient medicines!")

# TEST 9: Gemini AI — Medical Knowledge Query (Amlodipine là thuốc gì?)
status, ai_know = request("POST", "http://127.0.0.1:5000/api/admin/ai/chat", {"message": "Amlodipine là thuốc gì?"}, headers={"X-User-Role": "Admin", "X-User-Id": "1"})
log(f">>> TEST 9: AI Medical Knowledge Reply Preview:\n{ai_know.get('reply', '')[:200]}...\n")
assert "huyết áp" in ai_know.get("reply", "").lower() or "tim mạch" in ai_know.get("reply", "").lower() or "chẹn kênh canxi" in ai_know.get("reply", "").lower(), "Must return medical knowledge"
assert "BÁO CÁO ĐIỀU HÀNH HỆ THỐNG" not in ai_know.get("reply", ""), "Must NOT return system report"
log("    [PASS] Medical Knowledge cleanly isolated from Patient DB queries!")

# TEST 10: Master Medicine Catalog
status, cat_res = request("GET", "http://127.0.0.1:5000/api/medicines", headers={"X-User-Role": "Admin"})
log(f">>> TEST 10: Master Catalog Count: {len(cat_res.get('items', cat_res.get('data', [])))} items")
assert len(cat_res.get('items', cat_res.get('data', []))) > 0, "Master catalog must be available for Admin"
log("    [PASS] Master Medicine Catalog operational!")

log("=" * 75)
log(">>> ALL 10 PATIENT MEDICATION ISOLATION TESTS PASSED 100%! <<<")
log("=" * 75)
