"""
auth.py — TraceGuard Analyst Authentication Module
===================================================
Provides password hashing via bcrypt, JWT access token generation
via python-jose, and a FastAPI Bearer token verification dependency.
"""

import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hash a raw text password using bcrypt (truncates to 72 bytes for safety)."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a raw text password against a stored bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token valid for 24 hours by default."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    
    secret_key = os.environ.get("JWT_SECRET_KEY", "fallback-secret-key-change-me")
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_analyst(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """
    FastAPI dependency that extracts and validates the Bearer token from the
    Authorization header on protected routes, returning the analyst username on success
    or raising a 401 HTTPException if missing or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    secret_key = os.environ.get("JWT_SECRET_KEY", "fallback-secret-key-change-me")
    
    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain valid subject claim",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired access token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
