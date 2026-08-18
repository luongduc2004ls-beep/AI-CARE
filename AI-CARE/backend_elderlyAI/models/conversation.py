from datetime import datetime
from database import db

class Conversation(db.Model):
    __tablename__ = "conversations"

    conversation_id = db.Column(db.String(64), primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    role_scope = db.Column(db.String(16), default="USER", index=True)  # 'ADMIN' or 'USER'
    patient_id = db.Column(db.String(32), nullable=True)
    title = db.Column(db.String(255), default="Cuộc trò chuyện mới")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = db.relationship("Message", backref="conversation", cascade="all, delete-orphan", lazy=True, order_by="Message.created_at.asc()")

    def to_dict(self):
        return {
            "conversation_id": self.conversation_id,
            "user_id": self.user_id,
            "role_scope": self.role_scope or "USER",
            "patient_id": self.patient_id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": len(self.messages) if self.messages else 0
        }



class Message(db.Model):
    __tablename__ = "messages"

    message_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    conversation_id = db.Column(db.String(64), db.ForeignKey("conversations.conversation_id", ondelete="CASCADE"), nullable=False)
    role = db.Column(db.String(16), nullable=False)  # 'user', 'assistant', 'system', 'tool'
    content = db.Column(db.Text, nullable=False)
    structured_data = db.Column(db.Text, nullable=True)  # JSON string for structured medical telemetry
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "message_id": self.message_id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "structured_data": self.structured_data,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
