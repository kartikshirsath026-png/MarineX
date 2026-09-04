from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
)

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst")
    created_at = Column(DateTime, default=datetime.utcnow)


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_name = Column(String(200), nullable=False)
    image_path = Column(String(500), nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)

    scan_timestamp = Column(DateTime, nullable=True)
    status = Column(String(50), default="uploaded")

    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)

    scan_id = Column(
        Integer,
        ForeignKey("scans.id"),
        nullable=False
    )

    object_class = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)

    x_min = Column(Float, nullable=True)
    y_min = Column(Float, nullable=True)
    x_max = Column(Float, nullable=True)
    y_max = Column(Float, nullable=True)

    priority = Column(String(50), default="medium")

    created_at = Column(DateTime, default=datetime.utcnow)


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)

    detection_id = Column(
        Integer,
        ForeignKey("detections.id"),
        nullable=False
    )

    status = Column(String(50), nullable=False)
    remarks = Column(Text, nullable=True)

    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)