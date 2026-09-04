from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.models import User
from app.core.security import hash_password, verify_password


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "analyst"

class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register_user(user_data: RegisterRequest):

    db: Session = SessionLocal()

    try:
        # Check if email already exists
        existing_user = (
            db.query(User)
            .filter(User.email == user_data.email)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # Validate role
        allowed_roles = [
            "admin",
            "analyst",
            "field_operator"
        ]

        if user_data.role.lower() not in allowed_roles:
            raise HTTPException(
                status_code=400,
                detail="Invalid role"
            )

        # Hash password
        hashed_password = hash_password(
            user_data.password
        )

        # Create user
        new_user = User(
            name=user_data.name,
            email=user_data.email.lower(),
            password=hashed_password,
            role=user_data.role.lower()
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "success": True,
            "message": "User registered successfully",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()


@router.post("/login")
def login_user(login_data: LoginRequest):

    db: Session = SessionLocal()

    try:
        # Find user by email
        user = (
            db.query(User)
            .filter(User.email == login_data.email.lower())
            .first()
        )

        # User does not exist
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Verify password
        password_correct = verify_password(
            login_data.password,
            user.password
        )

        if not password_correct:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()