# ==============================================================================
# CONVERSATION SERVICE (CONVERSATION_SERVICE.PY)
# Quản lý phiên hội thoại, phân lập bộ nhớ theo Người Dùng & Bệnh Nhân
# ==============================================================================

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from database import db
from models.conversation import Conversation, Message
from services.rbac_service import RBACService


class ConversationService:
    """
    Quản lý lưu trữ, truy xuất và phân lập dữ liệu hội thoại giữa các người dùng.
    """

    @classmethod
    def get_or_create_conversation(
        cls,
        conversation_id: Optional[str] = None,
        user_id: Optional[int] = None,
        user_role: str = "User",
        patient_id: Optional[str] = None,
        title: Optional[str] = None
    ) -> Conversation:
        """
        Lấy hoặc tạo mới phiên hội thoại gắn chặt với user_id, role và patient_id.
        """
        role_scope = "ADMIN" if RBACService.is_admin_role(user_role) else "PATIENT"
        
        if not conversation_id or str(conversation_id).strip() in ("default_session", "widget_user_session", "undefined", "null"):
            conversation_id = f"conv_{uuid.uuid4().hex[:16]}"

        try:
            conv = db.session.get(Conversation, conversation_id)
            if not conv:
                conv_title = title or (
                    f"Phiên Quản Trị Hệ Thống" if role_scope == "ADMIN"
                    else f"Tư vấn sức khỏe ({patient_id or 'Bệnh nhân'})"
                )
                conv = Conversation(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role_scope=role_scope,
                    patient_id=patient_id,
                    title=conv_title,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(conv)
                db.session.commit()
            else:
                if user_id and not conv.user_id:
                    conv.user_id = user_id
                if patient_id and not conv.patient_id:
                    conv.patient_id = patient_id
                conv.updated_at = datetime.utcnow()
                db.session.commit()
            return conv
        except Exception:
            db.session.rollback()
            return Conversation(
                conversation_id=conversation_id,
                user_id=user_id,
                role_scope=role_scope,
                patient_id=patient_id,
                title="Hội thoại tạm thời"
            )

    @classmethod
    def save_message(
        cls,
        conversation_id: str,
        role: str,
        content: str,
        structured_data: Optional[Dict[str, Any]] = None
    ) -> Optional[Message]:
        """
        Lưu tin nhắn mới vào CSDL.
        """
        if not content:
            return None
            
        try:
            str_data = json.dumps(structured_data, ensure_ascii=False) if structured_data else None
            msg = Message(
                conversation_id=conversation_id,
                role=role,
                content=content,
                structured_data=str_data,
                created_at=datetime.utcnow()
            )
            db.session.add(msg)
            
            conv = db.session.get(Conversation, conversation_id)
            if conv:
                conv.updated_at = datetime.utcnow()
                
            db.session.commit()
            return msg
        except Exception:
            db.session.rollback()
            return None

    @classmethod
    def get_conversation_history(
        cls,
        conversation_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Lấy danh sách tin nhắn lịch sử của một cuộc trò chuyện.
        """
        try:
            msgs = (
                Message.query.filter(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.asc())
                .limit(limit)
                .all()
            )
            return [m.to_dict() for m in msgs]
        except Exception:
            return []

    @classmethod
    def list_user_conversations(
        cls,
        user_id: Optional[int],
        user_role: str = "User",
        patient_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Liệt kê các cuộc trò chuyện thuộc quyền của người dùng.
        """
        try:
            query = Conversation.query
            if not RBACService.is_admin_role(user_role):
                if user_id:
                    query = query.filter(Conversation.user_id == user_id)
                if patient_id:
                    query = query.filter(Conversation.patient_id == patient_id)
            
            convs = query.order_by(Conversation.updated_at.desc()).limit(30).all()
            return [c.to_dict() for c in convs]
        except Exception:
            return []

    @classmethod
    def clear_conversation(
        cls,
        conversation_id: str,
        user_id: Optional[int] = None,
        user_role: str = "User"
    ) -> bool:
        """
        Xóa toàn bộ tin nhắn trong một cuộc hội thoại (có kiểm tra quyền sở hữu).
        """
        try:
            conv = db.session.get(Conversation, conversation_id)
            if not conv:
                return False

            if not RBACService.is_admin_role(user_role) and user_id and conv.user_id != user_id:
                return False

            Message.query.filter(Message.conversation_id == conversation_id).delete()
            conv.updated_at = datetime.utcnow()
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
