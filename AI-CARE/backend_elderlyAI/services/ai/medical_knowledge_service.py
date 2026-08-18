# ==============================================================================
# MEDICAL KNOWLEDGE SERVICE - LỚP TRI THỨC Y HỌC & RAG (MEDICAL_KNOWLEDGE_SERVICE.PY)
# ==============================================================================
# Cung cấp tri thức lão khoa, hướng dẫn sinh hiệu, dinh dưỡng, an toàn và cấp cứu.
# ==============================================================================

import re
from datetime import datetime
from database import db
from models.medical_knowledge import MedicalDocument, MedicalChunk, MedicalSource

INITIAL_KNOWLEDGE_CHUNKS = [
    {
        "doc_id": "DOC_VITALS_01",
        "doc_title": "Hướng Dẫn Theo Dõi Sinh Hiệu Người Cao Tuổi",
        "topic": "Huyết áp & Tim mạch",
        "keywords": "huyết áp, nhịp tim, tim mạch, tăng huyết áp, tụt huyết áp",
        "content": (
            "Ngưỡng huyết áp mục tiêu ở người cao tuổi thường duy trì từ 120-139 / 80-89 mmHg. "
            "Nhịp tim nghỉ ngơi an toàn từ 60-90 lần/phút (BPM). "
            "CẢNH BÁO CẤP CỨU: Nếu huyết áp tâm thu > 180 mmHg hoặc tâm trương > 120 mmHg kèm đau đầu, "
            "chóng mặt, khó thở, tức ngực cần liên hệ nhân viên y tế hoặc chuyển viện cấp cứu ngay lập tức."
        )
    },
    {
        "doc_id": "DOC_VITALS_02",
        "doc_title": "Hướng Dẫn Theo Dõi Nồng Độ Oxy SpO2 & Thân Nhiệt",
        "topic": "Hô hấp & Thân nhiệt",
        "keywords": "spo2, oxy, khó thở, thân nhiệt, sốt, hạ thân nhiệt",
        "content": (
            "Chỉ số nồng độ oxy trong máu SpO2 an toàn ở người già từ 95% - 100%. "
            "Nếu SpO2 dao động 92% - 94% cần theo dõi sát và kiểm tra lại vị trí kẹp cảm biến. "
            "Nếu SpO2 dưới 92% hoặc có dấu hiệu thở dốc, tím tái môi đầu chi là tình trạng thiếu oxy cấp cần thở oxy y tế khẩn cấp. "
            "Thân nhiệt bình thường: 36.5°C - 37.2°C. Sốt khi > 37.5°C."
        )
    },
    {
        "doc_id": "DOC_NUTRITION_01",
        "doc_title": "Dinh Dưỡng & Chăm Sóc Tiêu Hóa Người Cao Tuổi",
        "topic": "Dinh dưỡng, Tiêu hóa, Đầy bụng",
        "keywords": "đầy bụng, khó tiêu, ăn uống, dinh dưỡng, uống nước, tiêu hóa, táo bón",
        "content": (
            "Khi người cao tuổi bị đầy bụng, khó tiêu nên: "
            "1. Chia nhỏ khẩu phần thành 4-5 bữa nhỏ trong ngày, thức ăn mềm, dễ tiêu hóa như cháo, súp, cá hấp. "
            "2. Hạn chế đồ chiên xào nhiều dầu mỡ, thực phẩm sinh hơi (đồ uống có gas, bắp cải sống, sữa tươi có đường nếu không dung nạp lactose). "
            "3. Uống đủ nước ấm (khoảng 1.5L - 2L/ngày, chia từng ngụm nhỏ, tránh uống nhiều sát giờ đi ngủ). "
            "4. Vận động nhẹ nhàng hoặc xoa bụng theo chiều kim đồng hồ quanh rốn sau ăn 30 phút."
        )
    },
    {
        "doc_id": "DOC_FALL_SAFETY_01",
        "doc_title": "Phòng Ngừa Té Ngã & An Toàn Trong Nhà",
        "topic": "Phòng chống té ngã, An toàn nhà ở",
        "keywords": "ngã, té, té ngã, an toàn, phòng ngủ, nhà vệ sinh, hạ huyết áp tư thế",
        "content": (
            "Phòng ngừa té ngã cho người cao tuổi: "
            "1. Nguyên tắc chuyển tư thế từ từ: Nằm -> Ngồi 1-2 phút -> Đứng vững trước khi bước đi để phòng ngừa hạ huyết áp tư thế đứng. "
            "2. Đảm bảo đủ ánh sáng hành lang và phòng vệ sinh, sử dụng thảm chống trượt và tay vịn an toàn. "
            "3. Khi phát hiện té ngã: Không vội vàng kéo người bệnh đứng dậy đột ngột. Cần kiểm tra ý thức, vùng đầu gáy và khả năng cử động tay chân trước."
        )
    },
    {
        "doc_id": "DOC_RED_FLAGS_01",
        "doc_title": "Dấu Hiệu Cảnh Báo Nguy Hiểm Cần Cấp Cứu Khẩn Cấp (Red Flags)",
        "topic": "Dấu hiệu cấp cứu, Đột quỵ, Nhồi máu cơ tim",
        "keywords": "cấp cứu, đột quỵ, nhồi máu cơ tim, méo miệng, yếu tay chân, bất tỉnh, đau ngực",
        "content": (
            "DẤU HIỆU CẤP CỨU Y TẾ KHẨN CẤP: "
            "1. Đột quỵ (Quy tắc FAST): Mặt lệch méo, tay yếu buông thõng, giọng nói đớ hoặc lú lẫn đột ngột. "
            "2. Cơn đau thắt ngực dữ dội lan ra cánh tay trái, khó thở kèm vã mồ hôi hột. "
            "3. Mất ý thức, ngất, co giật hoặc chấn thương đầu chảy máu sau khi ngã. "
            "HÀNH ĐỘNG: Gọi ngay cấp cứu 115 hoặc liên hệ trạm y tế gần nhất. Không tự ý cho uống thuốc hạ áp khẩn cấp khi chưa có chỉ định."
        )
    }
]


class MedicalKnowledgeService:
    """
    Dịch vụ quản lý và tìm kiếm tri thức y học lão khoa (Medical Knowledge RAG Layer).
    """

    @classmethod
    def seed_knowledge_if_empty(cls):
        """Khởi tạo tài liệu tri thức mẫu nếu cơ sở dữ liệu chưa có"""
        try:
            doc_count = MedicalDocument.query.count()
            if doc_count == 0:
                doc = MedicalDocument(
                    document_id="DOC_GERIATRIC_CORE_01",
                    title="Cẩm Nang Y Học Lão Khoa & Chăm Sóc Người Cao Tuổi Toàn Diện",
                    source="Viện Lão Khoa Quốc Gia & Hướng Dẫn Y Tế 2026",
                    category="GERIATRIC_CARE",
                    version="2.0"
                )
                db.session.add(doc)
                db.session.flush()

                for idx, chunk in enumerate(INITIAL_KNOWLEDGE_CHUNKS):
                    c = MedicalChunk(
                        chunk_id=f"CHK_{idx+1:03d}",
                        document_id=doc.document_id,
                        topic=chunk["topic"],
                        keywords=chunk["keywords"],
                        content=chunk["content"]
                    )
                    db.session.add(c)
                db.session.commit()
        except Exception:
            db.session.rollback()

    @classmethod
    def search_medical_knowledge(cls, query: str, top_k: int = 2) -> list:
        """
        Tìm kiếm các đoạn tri thức y khoa liên quan dựa trên từ khóa và ngữ nghĩa.
        """
        cls.seed_knowledge_if_empty()
        q_lower = query.lower()

        try:
            chunks = MedicalChunk.query.all()
            if not chunks:
                return [c["content"] for c in INITIAL_KNOWLEDGE_CHUNKS[:top_k]]

            scored = []
            for c in chunks:
                score = 0
                kw_list = (c.keywords or "").lower().split(",")
                for kw in kw_list:
                    kw_clean = kw.strip()
                    if kw_clean and kw_clean in q_lower:
                        score += 3
                if (c.topic or "").lower() in q_lower:
                    score += 2
                
                # Check match in content
                words = [w for w in re.findall(r"\w+", q_lower) if len(w) > 3]
                for w in words:
                    if w in c.content.lower():
                        score += 1

                if score > 0:
                    scored.append((score, c))

            scored.sort(key=lambda x: x[0], reverse=True)
            if scored:
                return [item[1].content for item in scored[:top_k]]
            
            # Default fallback to first 2 general chunks
            return [c.content for c in chunks[:top_k]]

        except Exception:
            return [c["content"] for c in INITIAL_KNOWLEDGE_CHUNKS[:top_k]]
