from datetime import datetime
from database import db

class MedicalDocument(db.Model):
    __tablename__ = "medical_documents"

    document_id = db.Column(db.String(64), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    source = db.Column(db.String(255), default="Bộ Y Tế / Hướng Dẫn Lão Khoa Quốc Gia")
    category = db.Column(db.String(64), default="GERIATRIC_CARE")
    version = db.Column(db.String(32), default="1.0")
    language = db.Column(db.String(16), default="vi")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chunks = db.relationship("MedicalChunk", backref="document", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "document_id": self.document_id,
            "title": self.title,
            "source": self.source,
            "category": self.category,
            "version": self.version,
            "chunks_count": len(self.chunks) if self.chunks else 0
        }


class MedicalChunk(db.Model):
    __tablename__ = "medical_chunks"

    chunk_id = db.Column(db.String(64), primary_key=True)
    document_id = db.Column(db.String(64), db.ForeignKey("medical_documents.document_id", ondelete="CASCADE"), nullable=False)
    topic = db.Column(db.String(128), nullable=False)
    keywords = db.Column(db.String(255), nullable=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "topic": self.topic,
            "keywords": self.keywords,
            "content": self.content
        }


class MedicalSource(db.Model):
    __tablename__ = "medical_sources"

    source_id = db.Column(db.String(64), primary_key=True)
    source_name = db.Column(db.String(255), nullable=False)
    organization = db.Column(db.String(255), default="Hội Lão Khoa Việt Nam")
    reliability_level = db.Column(db.String(32), default="HIGH_AUTHORITY")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
