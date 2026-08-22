# ==============================================================================
# MEDICAL KNOWLEDGE SERVICE - LỚP TRI THỨC Y HỌC & RAG (MEDICAL_KNOWLEDGE_SERVICE.PY)
# ==============================================================================
# Cung cấp tri thức lão khoa, hướng dẫn sinh hiệu, dinh dưỡng, an toàn và cấp cứu.
# ==============================================================================

import re
from typing import Dict, Any, List, Optional

INITIAL_KNOWLEDGE_CHUNKS = [
    {
        "topic": "DIABETES_NUTRITION",
        "title": "Chế Độ Dinh Dưỡng & Ăn Uống Cho Người Bệnh Tiểu Đường (Đái Tháo Đường)",
        "keywords": "tiểu đường, đái tháo đường, đường huyết, ăn gì, kiêng gì, thực phẩm, dinh dưỡng",
        "content": """### 🥗 HƯỚNG DẪN DINH DƯỠNG CHO NGƯỜI BỆNH TIỂU ĐƯỜNG (ĐÁI THÁO ĐƯỜNG)

**1. Thực phẩm NÊN ƯU TIÊN:**
- **Rau xanh giàu chất xơ**: Rau cải, súp lơ xanh, mồng tơi, rau ngót (chất xơ giúp làm chậm hấp thu đường vào máu).
- **Ngũ cốc nguyên hạt & Carbs phức hợp**: Gạo lứt, yến mạch, khoai lang luộc (ăn lượng vừa phải thay thế cơm trắng).
- **Protein nạc lành mạnh**: Thịt ức gà bỏ da, cá biển (cá hồi, cá thu giàu Omega-3), đậu phụ, trứng.
- **Trái cây ít đường**: Bưởi, táo, ổi, thanh long (nên ăn cả múi/miếng, không nên ép lấy nước).

**2. Thực phẩm NÊN HẠN CHẾ:**
- **Đồ ngọt & Đường tinh luyện**: Bánh kẹo, nước ngọt có gas, chè, sữa đặc có đường.
- **Tinh bột tinh chế**: Cơm trắng quá nhiều, bánh mì trắng, xôi nếp.
- **Chất béo bão hòa**: Mỡ động vật, đồ chiên rán nhiều dầu mỡ, nội tạng.

**3. Nguyên tắc sinh hoạt & Theo dõi:**
- Chia nhỏ khẩu phần thành 4–5 bữa/ngày để tránh tăng đường huyết đột ngột sau ăn.
- Duy trì vận động nhẹ nhàng sau bữa ăn khoảng 20-30 phút.
- Đo đường huyết mao mạch định kỳ và tuân thủ đơn thuốc hạ đường huyết của bác sĩ điều trị.

⚠️ **Cảnh báo nguy hiểm**: Nếu xuất hiện vã mồ hôi hột, run rẩy tay chân, hoa mắt (hạ đường huyết) -> Hãy uống ngay 1/2 ly nước đường hoặc ngậm 1 viên kẹo và báo nhân viên y tế."""
    },
    {
        "topic": "HYPERTENSION_LIFESTYLE",
        "title": "Chế Độ Dinh Dưỡng & Sinh Hoạt Cho Người Bị Tăng Huyết Áp",
        "keywords": "tăng huyết áp, huyết áp cao, ăn mặn, ăn gì, sinh hoạt, natri, muối, dash",
        "content": """### ❤️ HƯỚNG DẪN CHĂM SÓC & DINH DƯỠNG CHO NGƯỜI TĂNG HUYẾT ÁP

**1. Nguyên tắc ăn uống (Chế độ ăn DASH):**
- **Giảm muối (Natri) tối đa**: Người cao tuổi huyết áp cao chỉ nên ăn < 5g muối/ngày (khoảng 1 thìa cà phê gạt ngang). Hạn chế mắm, đồ kho đậm vị, dưa cà muối, thực phẩm chế biến sẵn.
- **Tăng cường Kali & Magie**: Chuối chín, cam, cà chua, các loại đậu, rau lá xanh đậm giúp điều hòa trương lực mạch máu.
- **Hạn chế chất kích thích**: Tuyệt đối kiêng rượu bia, cà phê đậm đặc, thuốc lá.

**2. Chế độ sinh hoạt & Vận động:**
- Uống thuốc huyết áp đúng giờ mỗi ngày (thường vào buổi sáng sau ăn), không tự ý ngưng thuốc khi thấy huyết áp tạm thời ổn định.
- Chuyển tư thế chậm rãi: Nằm -> Ngồi thả chân 1-2 phút -> Đứng vững trước khi bước đi để phòng tránh tụt huyết áp tư thế đứng.
- Đi bộ nhẹ nhàng 30 phút mỗi ngày trong không gian thoáng mát.

⚠️ **Cảnh báo cấp cứu**: Nếu huyết áp > 180/120 mmHg kèm đau thắt ngực, khó thở dữ dội, mờ mắt hoặc chóng mặt -> Cần đưa đến cơ sở y tế cấp cứu ngay lập tức."""
    },
    {
        "topic": "DIGESTION_NUTRITION",
        "title": "Chăm Sóc & Dinh Dưỡng Khi Người Cao Tuổi Bị Đầy Bụng, Khó Tiêu",
        "keywords": "đầy bụng, khó tiêu, tiêu hóa, táo bón, ăn gì, chướng bụng, sinh hơi",
        "content": """### 🥗 HƯỚNG DẪN CHĂM SÓC KHI NGƯỜI CAO TUỔI BỊ ĐẦY BỤNG, KHÓ TIÊU

**1. Điều chỉnh chế độ ăn uống:**
- **Ưu tiên thức ăn mềm, dễ tiêu**: Cháo lỏng, súp dinh dưỡng, cá hấp, canh rau củ nấu nhừ.
- **Hạn chế thực phẩm sinh hơi**: Đồ chiên rán dầu mỡ, đồ uống có gas, bắp cải sống, sữa tươi có đường (nếu cơ thể bất dung nạp lactose).
- **Uống nước ấm**: Uống từng ngụm nhỏ nước ấm giữa các bữa ăn (khoảng 1.5 - 2 lít/ngày).

**2. Biện pháp hỗ trợ tự nhiên:**
- Nhai kỹ, ăn chậm, không nằm ngay sau khi vừa ăn no.
- Massage bụng nhẹ nhàng theo chiều kim đồng hồ quanh rốn trong 10-15 phút sau bữa ăn 30 phút.
- Uống một tách trà gừng ấm hoặc nước chanh mật ong ấm giúp ấm bụng và kích thích nhu động ruột."""
    },
    {
        "topic": "STROKE_EMERGENCY",
        "title": "Dấu Hiệu Cảnh Báo Sớm Đột Quỵ (Tai Biến Mạch Máu Não) - Quy Tắc FAST",
        "keywords": "đột quỵ, tai biến, fast, dấu hiệu, cấp cứu, méo miệng, yếu tay chân",
        "content": """### 🚨 DẤU HIỆU CẢNH BÁO SỚM ĐỘT QUỴ (QUY TẮC F.A.S.T)

**1. Nhận biết 4 dấu hiệu khẩn cấp:**
- **F (Face - Khuôn mặt)**: Mặt bị lệch, méo một bên, nụ cười không đều, nhân trung lệch.
- **A (Arms - Cánh tay)**: Yếu hoặc liệt một bên tay chân, không thể giơ đều 2 tay lên cao.
- **S (Speech - Lời nói)**: Nói ngọng, phát âm đớ, lú lẫn, không nói tròn câu hoặc không hiểu lời người khác.
- **T (Time - Thời gian)**: **THỜI GIAN VÀNG CẤP CỨU LÀ DƯỚI 3 - 4.5 GIỜ**. Gọi ngay Cấp Cứu 115!

**2. Xử trí an toàn trong khi chờ xe cứu thương:**
- Đặt người bệnh nằm nghiêng an toàn một bên để thông thoáng đường thở.
- Nới lỏng quần áo, cổ áo, không cho ăn uống hoặc dùng bất kỳ loại thuốc hạ áp nào khi chưa có bác sĩ."""
    },
    {
        "topic": "SLEEP_CARE",
        "title": "Chăm Sóc Giấc Ngủ & Khắc Phục Mất Ngủ Ở Người Cao Tuổi",
        "keywords": "mất ngủ, khó ngủ, giấc ngủ, người già mất ngủ, làm gì, cải thiện giấc ngủ",
        "content": """### 🌙 HƯỚNG DẪN CẢI THIỆN GIẤC NGỦ CHO NGƯỜI CAO TUỔI

**1. Vệ sinh giấc ngủ chuẩn khoa học:**
- Đi ngủ và thức dậy vào khung giờ cố định mỗi ngày (kể cả cuối tuần).
- Không gian phòng ngủ: Thoáng khí, nhiệt độ dễ chịu (26-28°C), yên tĩnh và ánh sáng dịu tối.
- Không uống nhiều nước hoặc trà/cà phê sau 18:00 để tránh thức giấc đi tiểu đêm.

**2. Thư giãn trước khi ngủ:**
- Ngâm chân nước ấm với chút gừng/muối hột trong 15 phút trước khi đi ngủ 30 phút.
- Nghe nhạc nhẹ không lời hoặc tập thở sâu thư giãn cơ thể."""
    },
    {
        "topic": "EXERCISE_PHYSICAL",
        "title": "Chế Độ Vận Động & Bài Tập Thể Dục An Toàn Cho Người Cao Tuổi",
        "keywords": "tập thể dục, vận động, bao lâu, bài tập, thể dục người già, đi bộ",
        "content": """### 🏃 HƯỚNG DẪN TẬP THỂ DỤC AN TOÀN CHO NGƯỜI CAO TUỔI

**1. Thời lượng & Cường độ khuyến nghị:**
- Tập luyện khoảng **30 phút mỗi ngày**, 5 ngày/tuần (tổng cộng khoảng 150 phút/tuần với cường độ vừa phải).
- Có thể chia nhỏ thành 2 lần, mỗi lần 15 phút nếu thể lực yếu.

**2. Các bài tập phù hợp nhất:**
- **Đi bộ dưỡng sinh**: Tăng cường tuần hoàn máu và độ dẻo dai cơ xương khớp.
- **Tập dưỡng sinh, Thái Cực Quyền (Tai Chi)**: Cải thiện khả năng giữ thăng bằng vượt trội, giúp giảm 50% nguy cơ té ngã.
- **Kéo giãn nhẹ nhàng**: Xoay cổ chân, khớp gối và vươn vai nhẹ nhàng buổi sáng."""
    },
    {
        "topic": "HYDRATION_GUIDE",
        "title": "Hướng Dẫn Uống Nước Đúng Cách Cho Người Cao Tuổi",
        "keywords": "uống nước, bao nhiêu nước, lượng nước, mất nước, người già uống nước",
        "content": """### 💧 HƯỚNG DẪN UỐNG NƯỚC HỢP LÝ CHO NGƯỜI CAO TUỔI

**1. Lượng nước cần thiết mỗi ngày:**
- Người cao tuổi nên uống từ **1.5 đến 2.0 lít nước/ngày** (khoảng 6–8 ly nước), tùy thuộc vào cân nặng và thời tiết.
- Không chờ đến khi cảm thấy khát mới uống vì cơ chế nhận biết cơn khát ở người già bị suy giảm theo tuổi tác.

**2. Nguyên tắc uống nước:**
- Uống từng ngụm nhỏ, rải đều trong ngày.
- Uống 1 ly nước ấm ngay sau khi thức dậy buổi sáng để thanh lọc cơ thể và kích hoạt tuần hoàn máu."""
    },
    {
        "topic": "PHARMACOLOGY_GUIDE",
        "title": "Dược Lý Lâm Sàng: Các Thuốc Lão Khoa Phổ Biến (Amlodipine, Omeprazole, Atorvastatin)",
        "keywords": "amlodipine, omeprazole, atorvastatin, thuốc, dược lý, tác dụng, liều dùng",
        "content": """### 💊 THÔNG TIN DƯỢC LÝ LÂM SÀNG CÁC THUỐC PHỔ BIẾN

**1. Amlodipine (5mg / 10mg):**
- **Nhóm thuốc**: Thuốc chẹn kênh canxi dihydropyridine.
- **Tác dụng**: Làm giãn cơ trơn mạch máu, hạ huyết áp và dự phòng đau thắt ngực.
- **Tác dụng phụ thường gặp**: Phù nhẹ mắt cá chân, đỏ bừng mặt, chóng mặt khi đổi tư thế.

**2. Atorvastatin (10mg / 20mg):**
- **Nhóm thuốc**: Statin hạ mỡ máu.
- **Tác dụng**: Giảm Cholesterol xấu (LDL) và Triglycerid, ngăn ngừa xơ vữa động mạch và đột quỵ. Uống vào buổi tối trước khi ngủ.

**3. Omeprazole (20mg):**
- **Nhóm thuốc**: Ức chế bơm proton (PPI).
- **Tác dụng**: Giảm tiết acid dạ dày, điều trị viêm loét dạ dày - tá tràng và trào ngược dạ dày (GERD). Uống trước bữa ăn sáng 30 phút."""
    }
]


class MedicalKnowledgeService:
    """
    Dịch vụ cung cấp tri thức y học lão khoa và dinh dưỡng chuẩn xác.
    """

    @classmethod
    def get_advice_by_topic(cls, topic: str) -> Optional[str]:
        for chunk in INITIAL_KNOWLEDGE_CHUNKS:
            if chunk["topic"].upper() == str(topic).upper():
                return chunk["content"]
        return None

    @classmethod
    def search_knowledge(cls, query: str) -> str:
        q_norm = (query or "").lower()
        
        # Match theo từ khóa
        best_match = None
        for chunk in INITIAL_KNOWLEDGE_CHUNKS:
            keywords = [k.strip().lower() for k in chunk.get("keywords", "").split(",")]
            for kw in keywords:
                if kw and kw in q_norm:
                    return chunk["content"]
                    
        # Fallback tổng quan
        return INITIAL_KNOWLEDGE_CHUNKS[0]["content"]
