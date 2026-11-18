
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, JSON

from app.database import Base


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String(255), nullable=False)

    total_pages = Column(Integer, nullable=False)

    total_tests_extracted = Column(Integer, default=0)

    extracted_text = Column(Text, nullable=True)

    medical_results = Column(JSON, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
