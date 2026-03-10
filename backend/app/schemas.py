from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ---------------- USER AUTH ----------------

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class SendOTPRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    otp_code: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str


class GoogleTokenLoginRequest(BaseModel):
    token: str


class MessageResponse(BaseModel):
    message: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_email: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------- HABITS ----------------

class HabitBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    frequency: Optional[str] = None
    user_id: Optional[int] = None


class HabitCreate(HabitBase):
    pass


class HabitResponse(HabitBase):
    id: int
    current_streak: int = 0
    longest_streak: int = 0
    total_completions: int = 0
    completed_today: bool = False

    class Config:
        from_attributes = True