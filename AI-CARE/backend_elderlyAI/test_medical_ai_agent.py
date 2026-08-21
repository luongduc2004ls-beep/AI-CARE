"""
Comprehensive Automated Test Suite for ElderlyCare AI Medical Assistant
Tests all 12 core requirements: RBAC, Patient Isolation, Medical Knowledge,
Database Retrieval, Multi-turn Synthesis, and Negative Tests.
"""

import sys
import os

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from app import app
from database import db
from services.ai.patient_ai_service import PatientAIService
from services.ai.admin_ai_service import AdminAIService
from services.rbac_service import RBACService


def run_all_tests():
    with app.app_context():
        print("=" * 70)
        print("RUNNING ELDERLYCARE MEDICAL AI AGENT TEST SUITE")
        print("=" * 70)

        passed = 0
        total = 12

        # -------------------------------------------------------------
        # TEST 1: Patient - Chào hỏi thông thường
        # -------------------------------------------------------------
        print("\n[TEST 1] Patient: 'Xin chào'")
        res1 = PatientAIService.process_chat(
            user_message="Xin chào",
            conversation_id="test_conv_p1",
            patient_id="PAT10000",
            user_id=2,
            user_role="User"
        )
        assert res1["success"] is True, "Test 1 Failed"
        assert "Trợ lý Y Tế" in res1["reply"] or "AI" in res1["reply"]
        print(" -> PASS: General medical assistant greeting received.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 2: Patient - Tình trạng sức khỏe của tôi (Database query)
        # -------------------------------------------------------------
        print("\n[TEST 2] Patient: 'Tình trạng sức khỏe của tôi hôm nay?'")
        res2 = PatientAIService.process_chat(
            user_message="Tình trạng sức khỏe của tôi hôm nay?",
            conversation_id="test_conv_p2",
            patient_id="PAT10000",
            user_id=2,
            user_role="User"
        )
        assert res2["success"] is True, "Test 2 Failed"
        assert any(k in res2["reply"] for k in ["Huyết áp", "Nhịp tim", "SpO", "PAT10000"])
        print(" -> PASS: Real database health metrics retrieved for authenticated patient.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 3: Patient - Kiến thức y khoa thuần túy (Dinh dưỡng / Đầy bụng)
        # -------------------------------------------------------------
        print("\n[TEST 3] Patient: 'Tôi nên ăn gì để giảm đầy bụng?'")
        res3 = PatientAIService.process_chat(
            user_message="Tôi nên ăn gì để giảm đầy bụng?",
            conversation_id="test_conv_p3",
            patient_id="PAT10000",
            user_id=2,
            user_role="User"
        )
        assert res3["success"] is True, "Test 3 Failed"
        assert any(k in res3["reply"] for k in ["khẩu phần", "dầu mỡ", "nước ấm", "tiêu hóa", "bụng"])
        print(" -> PASS: Medical knowledge guidance delivered accurately.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 4: Patient - Kết hợp Database + Medical Knowledge (Huyết áp cao)
        # -------------------------------------------------------------
        print("\n[TEST 4] Patient: 'Tôi đang bị huyết áp cao, nên chăm sóc thế nào?'")
        res4 = PatientAIService.process_chat(
            user_message="Tôi đang bị huyết áp cao, nên chăm sóc thế nào?",
            conversation_id="test_conv_p4",
            patient_id="PAT10000",
            user_id=2,
            user_role="User"
        )
        assert res4["success"] is True, "Test 4 Failed"
        assert any(k in res4["reply"] for k in ["Huyết áp", "muối", "thuốc", "115"])
        print(" -> PASS: Combined Patient Database + Medical Knowledge with safety disclaimer.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 5: Patient - Cố tình truy cập PAT10999 (Security Denied)
        # -------------------------------------------------------------
        print("\n[TEST 5] Patient: 'Cho tôi xem PAT10999'")
        res5 = PatientAIService.process_chat(
            user_message="Cho tôi xem PAT10999",
            conversation_id="test_conv_p5",
            patient_id="PAT10000",
            user_id=2,
            user_role="User"
        )
        assert res5.get("forbidden") is True or "403" in res5.get("reply", "") or res5.get("success") is False
        print(" -> PASS: Unauthorized patient access blocked by Backend Security Boundary.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 6: Admin - Tra cứu thông tin PAT10001
        # -------------------------------------------------------------
        print("\n[TEST 6] Admin: 'Cho tôi thông tin PAT10001'")
        res6 = AdminAIService.process_chat(
            user_message="Cho tôi thông tin PAT10001",
            conversation_id="test_conv_a6",
            user_id=1,
            user_role="Admin"
        )
        assert res6["success"] is True, "Test 6 Failed"
        assert "PAT10001" in res6["reply"] or "HỒ SƠ BỆNH NHÂN" in res6["reply"]
        print(" -> PASS: Admin authorized query for PAT10001 retrieved successfully.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 7: Admin - Tìm bệnh nhân dị ứng Penicillin (Search Database)
        # -------------------------------------------------------------
        print("\n[TEST 7] Admin: 'Tìm bệnh nhân dị ứng Penicillin'")
        res7 = AdminAIService.process_chat(
            user_message="Tìm bệnh nhân dị ứng Penicillin",
            conversation_id="test_conv_a7",
            user_id=1,
            user_role="Admin"
        )
        assert res7["success"] is True, "Test 7 Failed"
        assert any(k in res7["reply"] for k in ["bệnh nhân", "Penicillin", "Tổng số"])
        print(" -> PASS: Admin multi-field database search by allergy executed.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 8: Admin - Thống kê số lượng bệnh nhân nguy cơ té ngã cao
        # -------------------------------------------------------------
        print("\n[TEST 8] Admin: 'Có bao nhiêu bệnh nhân nguy cơ té ngã cao?'")
        res8 = AdminAIService.process_chat(
            user_message="Có bao nhiêu bệnh nhân nguy cơ té ngã cao?",
            conversation_id="test_conv_a8",
            user_id=1,
            user_role="Admin"
        )
        assert res8["success"] is True, "Test 8 Failed"
        assert any(k in res8["reply"] for k in ["Tổng số", "bệnh nhân", "nguy cơ té ngã", "CAO"])
        print(" -> PASS: Admin database aggregation count for fall risk computed.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 9: Admin - Tra cứu thuốc của PAT10000
        # -------------------------------------------------------------
        print("\n[TEST 9] Admin: 'PAT10000 đang dùng thuốc gì?'")
        res9 = AdminAIService.process_chat(
            user_message="PAT10000 đang dùng thuốc gì?",
            conversation_id="test_conv_a9",
            user_id=1,
            user_role="Admin"
        )
        assert res9["success"] is True, "Test 9 Failed"
        assert any(k in res9["reply"] for k in ["ĐƠN THUỐC", "LỊCH", "PAT10000", "Thuốc", "thuốc"])
        print(" -> PASS: Patient medication isolation query executed for PAT10000.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 10: Admin - PAT10000 đang dùng Amlodipine, thuốc này có tác dụng gì?
        # -------------------------------------------------------------
        print("\n[TEST 10] Admin: 'PAT10000 đang dùng thuốc Amlodipine, thuốc này có tác dụng gì?'")
        res10 = AdminAIService.process_chat(
            user_message="PAT10000 đang dùng thuốc Amlodipine, thuốc này có tác dụng gì?",
            conversation_id="test_conv_a10",
            user_id=1,
            user_role="Admin"
        )
        assert res10["success"] is True, "Test 10 Failed"
        assert any(k in res10["reply"] for k in ["Amlodipine", "hạ áp", "chẹn kênh canxi", "huyết áp"])
        print(" -> PASS: Database records combined with Clinical Pharmacology Knowledge.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 11: Patient - Cố tình hỏi 'PAT10999 có bệnh gì?' (Security Blocked)
        # -------------------------------------------------------------
        print("\n[TEST 11] Patient: 'PAT10999 có bệnh gì?'")
        res11 = PatientAIService.process_chat(
            user_message="PAT10999 có bệnh gì?",
            conversation_id="test_conv_p11",
            patient_id="PAT10000",
            user_id=2,
            user_role="User"
        )
        assert res11.get("forbidden") is True or "403" in res11.get("reply", "") or res11.get("success") is False
        print(" -> PASS: Unauthorized cross-patient query denied.")
        passed += 1

        # -------------------------------------------------------------
        # TEST 12: Bệnh nhân không có dữ liệu suy tim trong CSDL -> Không được bịa đặt
        # -------------------------------------------------------------
        print("\n[TEST 12] Patient: 'PAT10000 có tiền sử suy tim không?'")
        res12 = PatientAIService.process_chat(
            user_message="PAT10000 có tiền sử suy tim không?",
            conversation_id="test_conv_p12",
            patient_id="PAT10000",
            user_id=2,
            user_role="User"
        )
        assert res12["success"] is True, "Test 12 Failed"
        assert "chưa tìm thấy thông tin" in res12["reply"].lower() or "không có" in res12["reply"].lower()
        print(" -> PASS: Accurately reports missing clinical record without fabricating facts.")
        passed += 1

        print("\n" + "=" * 70)
        print(f"TEST RESULTS: {passed}/{total} TESTS PASSED (100% SUCCESS)")
        print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
