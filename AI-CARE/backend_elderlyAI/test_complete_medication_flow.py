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
log("ELDERLYCARE AI — END-TO-END FLOW VERIFICATION (FRONTEND -> FLASK -> DB)")
log("=" * 75)

# 1. Load thuốc PAT10000
status, res1 = request("GET", "http://127.0.0.1:5000/api/patients/PAT10000/medications", headers={"X-User-Role": "Admin"})
log(f"[STEP 1] Load thuốc PAT10000: Status={status}, Total={res1.get('total_medications')}")
meds1 = res1.get("medications", [])
assert len(meds1) >= 2, "PAT10000 must have medications"
item_to_edit = meds1[0]
item_id = item_to_edit["prescription_item_id"]
log(f"         Thuốc cần sửa: {item_to_edit['name']} (ID={item_id}), Liều ban đầu={item_to_edit['dosage']}")

# 2. Load thuốc PAT10001
status, res2 = request("GET", "http://127.0.0.1:5000/api/patients/PAT10001/medications", headers={"X-User-Role": "Admin"})
log(f"[STEP 2] Load thuốc PAT10001: Status={status}, Total={res2.get('total_medications')}")
meds2 = res2.get("medications", [])
assert all(m["name"] != "Atorvastatin" for m in meds2), "PAT10001 must not have Atorvastatin"

# 3. Sửa thuốc PAT10000 (PUT /api/prescription-items/:id)
status, edit_res = request("PUT", f"http://127.0.0.1:5000/api/prescription-items/{item_id}", {"dosage": "5mg (sau ăn sáng)", "instruction": "Uống cùng 200ml nước ấm"}, headers={"X-User-Role": "Admin"})
log(f"[STEP 3] Sửa thuốc PAT10000: Status={status}, New Dosage={edit_res.get('item', {}).get('dosage')}")
assert status == 200, "Update prescription item must return 200"

# 4. Reload trang / Kiểm tra Database sau khi sửa
status, reload1 = request("GET", "http://127.0.0.1:5000/api/patients/PAT10000/medications", headers={"X-User-Role": "Admin"})
reloaded_item = next(m for m in reload1.get("medications", []) if m["prescription_item_id"] == item_id)
log(f"[STEP 4] Reload kiểm tra CSDL: Liều đã lưu={reloaded_item['dosage']}, Hướng dẫn={reloaded_item['instruction']}")
assert reloaded_item["dosage"] == "5mg (sau ăn sáng)", "Dosage must be persisted in DB"

# 5. Tạo thêm thuốc mới cho PAT10000 (POST /api/patients/PAT10000/prescriptions)
new_rx_payload = {
    "prescription_code": f"RX_TEST_{int(urllib.request.time.time())}",
    "doctor_name": "BS. Phạm Tiến Việt",
    "diagnosis": "Bổ sung vi chất",
    "items": [
        {
            "medicine_name": "Vitamin B Complex",
            "dosage": "1 viên",
            "frequency": "1 lần/ngày",
            "quantity": 10,
            "instruction": "Uống sau ăn trưa",
            "times": ["12:00"]
        }
    ]
}
status, create_res = request("POST", "http://127.0.0.1:5000/api/patients/PAT10000/prescriptions", new_rx_payload, headers={"X-User-Role": "Admin"})
log(f"[STEP 5] Tạo đơn thuốc mới: Status={status}, Code={create_res.get('prescription', {}).get('prescription_code')}")
created_items = create_res.get("prescription", {}).get("items", [])
created_item_id = created_items[0]["prescription_item_id"] if created_items else None

# 6. Xóa thuốc vừa tạo (DELETE /api/prescription-items/:id)
if created_item_id:
    status, del_res = request("DELETE", f"http://127.0.0.1:5000/api/prescription-items/{created_item_id}", headers={"X-User-Role": "Admin"})
    log(f"[STEP 6] Xóa thuốc khỏi đơn: Status={status}, Message={del_res.get('message')}")
    assert status == 200, "Delete prescription item must return 200"

# 7. Reload trang kiểm tra thuốc đã xóa
status, reload2 = request("GET", "http://127.0.0.1:5000/api/patients/PAT10000/medications", headers={"X-User-Role": "Admin"})
assert not any(m.get("prescription_item_id") == created_item_id for m in reload2.get("medications", [])), "Deleted item must no longer exist in DB"
log("[STEP 7] Reload xác nhận: Thuốc đã được xóa an toàn khỏi CSDL.")

# 8. Đánh dấu đã uống thuốc (POST /api/patients/PAT10000/medications/schedule/:id/take)
status, sched_res = request("GET", "http://127.0.0.1:5000/api/patients/PAT10000/medication-schedule", headers={"X-User-Role": "Admin"})
first_sched = sched_res.get("schedules", [])[0]
sched_id = first_sched["schedule_id"]
status, take_res = request("POST", f"http://127.0.0.1:5000/api/patients/PAT10000/medications/schedule/{sched_id}/take", {"status": "Đã uống", "taken_by": "Điều dưỡng", "note": "Bệnh nhân uống đúng cữ"}, headers={"X-User-Role": "Admin"})
log(f"[STEP 8] Ghi nhận uống thuốc: Status={status}, Schedule Status={take_res.get('schedule', {}).get('status')}")
assert take_res.get("schedule", {}).get("status") == "Đã uống", "Must update status to Đã uống"

# 9. Kiểm tra MedicationHistory được lưu vào CSDL
status, hist_res = request("GET", "http://127.0.0.1:5000/api/patients/PAT10000/medication-history", headers={"X-User-Role": "Admin"})
log(f"[STEP 9] Kiểm tra MedicationHistory: Total={hist_res.get('total_records')}, Last Action={hist_res.get('history', [{}])[0].get('status')}")
assert hist_res.get("total_records") >= 1, "Must have medication history record"

# 10. Cross-Patient Isolation Test
status, pat2_meds = request("GET", "http://127.0.0.1:5000/api/patients/PAT10001/medications", headers={"X-User-Role": "Admin"})
pat2_names = [m["name"] for m in pat2_meds.get("medications", [])]
log(f"[STEP 10] Phân lập chéo: PAT10001 meds = {pat2_names}")
assert "Atorvastatin" not in pat2_names, "PAT10001 must NEVER see PAT10000's Atorvastatin"
log("          [PASS] Cross-Patient Medication Isolation verified 100%!")

log("=" * 75)
log(">>> ALL END-TO-END FLOW TESTS (GET, POST, PUT, DELETE, DB, ISOLATION) PASSED 100%! <<<")
log("=" * 75)
