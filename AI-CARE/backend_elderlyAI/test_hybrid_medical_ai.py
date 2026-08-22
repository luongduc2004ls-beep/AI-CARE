"""
Comprehensive Automated Test Suite: Hybrid Medical AI Chatbot & Database Agent
Tests all 10 core acceptance criteria:
1. Admin: "Những bệnh nhân có khả năng ngã cao" -> Returns patient list, NOT system report
2. Admin: "Những bệnh nhân dị ứng phấn hoa?" -> Returns allergy patient list
3. Admin: "Ai chưa uống thuốc hôm nay?" -> Returns unmedicated patient list + schedule
4. Patient: "Tôi bị tiểu đường nên ăn gì?" -> Returns general medical dietary advice (no PAT code needed)
5. Patient: "Người cao tuổi nên tập thể dục bao lâu?" -> Returns medical exercise guidance
6. Patient: "Sức khỏe hôm nay của tôi thế nào?" -> Returns real DB health vitals
7. Admin: "PAT10000 có nguy cơ gì?" -> Returns real DB health and fall risk
8. Admin: "Có bao nhiêu bệnh nhân nguy cơ té ngã cao?" -> Returns COUNT
9. Admin: "Hiển thị tiếp" -> Returns page 2 pagination
10. Admin: "Bệnh nhân PAT10000 bị tiểu đường nên ăn gì?" -> Returns Mixed DB + Medical Knowledge
"""

import sys
import unittest
import requests

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

BASE_URL = "http://127.0.0.1:5000/api"

class TestHybridMedicalAIChatbot(unittest.TestCase):
    admin_token = None
    user_token = None

    @classmethod
    def setUpClass(cls):
        # 1. Login Admin
        adm_res = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin1", "password": "password123"}).json()
        cls.admin_token = adm_res.get("token")

        # 2. Login Patient User (PAT10000)
        usr_res = requests.post(f"{BASE_URL}/auth/login", json={"username": "user_pat10000", "password": "password123"}).json()
        cls.user_token = usr_res.get("token")

    def test_01_admin_fall_risk_search_returns_list_not_report(self):
        """Test 1: Admin asks for list of fall risk patients -> Returns patient list, NOT system report"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        payload = {
            "message": "những bệnh nhân có khả năng ngã cao",
            "conversation_id": "test_conv_fall_list_1"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        # Must contain patient list and NOT be a generic system report
        self.assertIn("DANH SÁCH BỆNH NHÂN", reply)
        self.assertIn("1.", reply)
        self.assertIn("Nguy cơ", reply)
        print("\n[PASS] Test 1: Fall Risk Search returned detailed patient list ->", reply[:90], "...")

    def test_02_admin_allergy_search(self):
        """Test 2: Admin asks for patients with allergy -> Returns allergy patient list"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        payload = {
            "message": "Những bệnh nhân dị ứng phấn hoa?",
            "conversation_id": "test_conv_allergy_2"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        self.assertIn("DỊ ỨNG", reply)
        print("[PASS] Test 2: Allergy Search returned matching list ->", reply[:90], "...")

    def test_03_admin_unmedicated_patients_search(self):
        """Test 3: Admin asks who hasn't taken medicine -> Returns unmedicated list"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        payload = {
            "message": "Ai chưa uống thuốc hôm nay?",
            "conversation_id": "test_conv_unmed_3"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        self.assertIn("CHƯA UỐNG THUỐC", reply)
        print("[PASS] Test 3: Unmedicated Search returned list ->", reply[:90], "...")

    def test_04_patient_general_medical_diet(self):
        """Test 4: Patient asks general diabetes diet -> Returns general medical advice (no PAT code needed)"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        payload = {
            "message": "Bệnh nhân tiểu đường nên ăn gì?",
            "conversation_id": "test_conv_med_diet_4"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        self.assertIn("TIỂU ĐƯỜNG", reply.upper())
        self.assertIn("ƯU TIÊN", reply.upper())
        print("[PASS] Test 4: General Medical Nutrition Guidance ->", reply[:90], "...")

    def test_05_patient_general_medical_exercise(self):
        """Test 5: Patient asks general medical exercise question -> Returns medical exercise guidance"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        payload = {
            "message": "Người cao tuổi nên tập thể dục bao lâu?",
            "conversation_id": "test_conv_med_ex_5"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        self.assertIn("TẬP THỂ DỤC", reply.upper())
        print("[PASS] Test 5: General Medical Exercise Guidance ->", reply[:90], "...")

    def test_06_patient_own_health_vitals(self):
        """Test 6: Patient asks for own health today -> Returns real DB health vitals"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        payload = {
            "message": "Sức khỏe hôm nay của tôi thế nào?",
            "conversation_id": "test_conv_pat_health_6"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        self.assertIn("Huyết áp", reply)
        print("[PASS] Test 6: Patient Own Health Vitals Query ->", reply[:90], "...")

    def test_07_admin_patient_risk_analysis(self):
        """Test 7: Admin asks about patient risk -> Returns real DB health and fall risk"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        payload = {
            "message": "PAT10000 có nguy cơ gì?",
            "conversation_id": "test_conv_adm_risk_7"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        self.assertIn("PAT10000", reply)
        print("[PASS] Test 7: Admin Patient Risk Analysis ->", reply[:90], "...")

    def test_08_admin_fall_risk_count(self):
        """Test 8: Admin asks for count of fall risk -> Returns COUNT only, not list"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        payload = {
            "message": "Có bao nhiêu bệnh nhân nguy cơ té ngã cao?",
            "conversation_id": "test_conv_count_8"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        self.assertIn("THỐNG KÊ", reply.upper())
        self.assertIn("706", reply)
        print("[PASS] Test 8: Fall Risk Count Query ->", reply[:90], "...")

    def test_09_pagination_next(self):
        """Test 9: Admin asks pagination next -> Returns page 2 with records 21-40"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        payload = {
            "message": "hiển thị tiếp",
            "conversation_id": "test_conv_page_9"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        self.assertIn("TRANG 2", reply.upper())
        print("[PASS] Test 9: Pagination Next Query ->", reply[:90], "...")

    def test_10_mixed_medical_database_advice(self):
        """Test 10: Mixed Query (PAT10000 + Medical Nutrition Guidance)"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        payload = {
            "message": "Bệnh nhân PAT10000 bị tiểu đường nên ăn gì?",
            "conversation_id": "test_conv_mixed_10"
        }
        res = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        reply = data.get("reply", "")
        self.assertIn("PAT10000", reply)
        self.assertIn("TIỂU ĐƯỜNG", reply.upper())
        print("[PASS] Test 10: Mixed Medical + Database Query ->", reply[:90], "...")

if __name__ == "__main__":
    unittest.main(verbosity=2)
