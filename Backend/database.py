"""
database.py — TraceGuard MySQL Database Integration
===================================================
Provides SQLAlchemy engine creation, ORM model definitions for users,
flagged_flows, and feedback, alongside database initialization and helper CRUD functions.
"""

import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, func
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)


class FlaggedFlow(Base):
    __tablename__ = "flagged_flows"
    id = Column(Integer, primary_key=True, autoincrement=True)
    source_ip = Column(String(255), nullable=True)
    destination_ip = Column(String(255), nullable=True)
    prediction = Column(String(255), nullable=False)
    attack_type = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=False)
    shap_json = Column(Text, nullable=True)
    provenance_json = Column(Text, nullable=True)
    features_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    feedbacks = relationship("Feedback", back_populates="flagged_flow", cascade="all, delete-orphan")


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, autoincrement=True)
    flagged_flow_id = Column(Integer, ForeignKey("flagged_flows.id"), nullable=False)
    verdict = Column(String(50), nullable=False)  # "true_positive" or "false_positive"
    used_in_retrain = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    flagged_flow = relationship("FlaggedFlow", back_populates="feedbacks")


# Module-level engine and sessionmaker
_engine = None
_SessionLocal = None


def get_db_url() -> str:
    """Build SQLAlchemy engine connection string from environment variables."""
    db_url_override = os.environ.get("DATABASE_URL")
    if db_url_override:
        return db_url_override
    user = os.environ.get("MYSQLUSER", "")
    password = os.environ.get("MYSQLPASSWORD", "")
    host = os.environ.get("MYSQLHOST", "localhost")
    port = os.environ.get("MYSQLPORT", "3306")
    database = os.environ.get("MYSQLDATABASE", "")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"


def get_engine():
    global _engine
    if _engine is None:
        url = get_db_url()
        try:
            _engine = create_engine(url, pool_pre_ping=True)
        except Exception as e:
            # Fallback if ssl configuration is required or error occurs
            print(f"[database] Engine creation fallback attempt: {e}")
            _engine = create_engine(url, connect_args={"ssl_disabled": False}, pool_pre_ping=True)
    return _engine


def get_sessionmaker():
    global _SessionLocal
    if _SessionLocal is None:
        engine = get_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db_session() -> Optional[Session]:
    """Return a new database session, or None if database is unreachable."""
    try:
        sm = get_sessionmaker()
        return sm()
    except Exception as exc:
        print(f"[database] Failed to create session: {exc}")
        return None


def init_db() -> bool:
    """
    On application startup, create tables if they do not exist,
    and seed initial analyst user if the users table is empty.
    Wrapped in try/except so connection issues do not crash the app.
    """
    try:
        engine = get_engine()
        Base.metadata.create_all(bind=engine)
        print("[database] OK Database tables created / verified.")

        session = get_db_session()
        if session:
            try:
                user_count = session.query(func.count(User.id)).scalar()
                if user_count == 0:
                    analyst_user = os.environ.get("ANALYST_USERNAME", "analyst")
                    analyst_pass = os.environ.get("ANALYST_PASSWORD", "analyst123")
                    
                    # Avoid circular import by importing hash_password inside function
                    from .auth import hash_password
                    password_hash = hash_password(analyst_pass)
                    
                    new_user = User(username=analyst_user, password_hash=password_hash)
                    session.add(new_user)
                    session.commit()
                    print(f"[database] OK Seeded initial analyst user '{analyst_user}'.")
            except Exception as seed_err:
                session.rollback()
                print(f"[database] ERR Seeding initial analyst user failed: {seed_err}")
            finally:
                session.close()
        return True
    except Exception as exc:
        print(f"[database] WARNING: Database connection/init failed: {exc}. Server will continue running.")
        return False


def get_user_by_username(username: str) -> Optional[User]:
    session = get_db_session()
    if not session:
        return None
    try:
        return session.query(User).filter(User.username == username).first()
    except Exception as e:
        print(f"[database] Error querying user '{username}': {e}")
        return None
    finally:
        session.close()


def insert_flagged_flow(
    source_ip: Optional[str],
    destination_ip: Optional[str],
    prediction: str,
    attack_type: Optional[str],
    confidence: float,
    shap_json: str,
    provenance_json: str,
    features_json: str,
) -> Optional[int]:
    session = get_db_session()
    if not session:
        return None
    try:
        flow = FlaggedFlow(
            source_ip=source_ip,
            destination_ip=destination_ip,
            prediction=prediction,
            attack_type=attack_type,
            confidence=confidence,
            shap_json=shap_json,
            provenance_json=provenance_json,
            features_json=features_json,
            created_at=datetime.utcnow()
        )
        session.add(flow)
        session.commit()
        session.refresh(flow)
        return flow.id
    except Exception as e:
        session.rollback()
        print(f"[database] Error inserting flagged flow: {e}")
        return None
    finally:
        session.close()


def insert_feedback(flagged_flow_id: int, verdict: str) -> Optional[int]:
    session = get_db_session()
    if not session:
        return None
    try:
        fb = Feedback(
            flagged_flow_id=flagged_flow_id,
            verdict=verdict,
            used_in_retrain=False,
            created_at=datetime.utcnow()
        )
        session.add(fb)
        session.commit()
        session.refresh(fb)
        return fb.id
    except Exception as e:
        session.rollback()
        print(f"[database] Error inserting feedback: {e}")
        return None
    finally:
        session.close()


def count_unused_feedback() -> int:
    session = get_db_session()
    if not session:
        return 0
    try:
        count = session.query(func.count(Feedback.id)).filter(Feedback.used_in_retrain == False).scalar()
        return count or 0
    except Exception as e:
        print(f"[database] Error counting unused feedback: {e}")
        return 0
    finally:
        session.close()


def get_unused_feedback_with_flows(limit: int = 50) -> List[Dict[str, Any]]:
    session = get_db_session()
    if not session:
        return []
    try:
        results = (
            session.query(Feedback, FlaggedFlow)
            .join(FlaggedFlow, Feedback.flagged_flow_id == FlaggedFlow.id)
            .filter(Feedback.used_in_retrain == False)
            .limit(limit)
            .all()
        )
        output = []
        for fb, flow in results:
            output.append({
                "feedback_id": fb.id,
                "verdict": fb.verdict,
                "flagged_flow_id": flow.id,
                "features_json": flow.features_json,
                "attack_type": flow.attack_type,
                "prediction": flow.prediction,
            })
        return output
    except Exception as e:
        print(f"[database] Error getting unused feedback: {e}")
        return []
    finally:
        session.close()


def mark_feedback_used(feedback_ids: List[int]) -> bool:
    if not feedback_ids:
        return True
    session = get_db_session()
    if not session:
        return False
    try:
        session.query(Feedback).filter(Feedback.id.in_(feedback_ids)).update(
            {Feedback.used_in_retrain: True}, synchronize_session=False
        )
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        print(f"[database] Error marking feedback used: {e}")
        return False
    finally:
        session.close()


def get_all_flagged_flows_with_feedback() -> List[Dict[str, Any]]:
    session = get_db_session()
    if not session:
        return []
    try:
        flows = (
            session.query(FlaggedFlow)
            .order_by(FlaggedFlow.created_at.desc())
            .all()
        )
        output = []
        for flow in flows:
            latest_fb = (
                session.query(Feedback)
                .filter(Feedback.flagged_flow_id == flow.id)
                .order_by(Feedback.created_at.desc())
                .first()
            )
            verdict = latest_fb.verdict if latest_fb else None

            output.append({
                "id": flow.id,
                "source_ip": flow.source_ip,
                "destination_ip": flow.destination_ip,
                "prediction": flow.prediction,
                "attack_type": flow.attack_type,
                "confidence": flow.confidence,
                "shap_explanation": json.loads(flow.shap_json) if flow.shap_json else [],
                "provenance": json.loads(flow.provenance_json) if flow.provenance_json else None,
                "features": json.loads(flow.features_json) if flow.features_json else {},
                "created_at": flow.created_at.isoformat() if flow.created_at else None,
                "verdict": verdict,
            })
        return output
    except Exception as e:
        print(f"[database] Error fetching flagged flows with feedback: {e}")
        return []
    finally:
        session.close()
