from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import os
import smtplib
from email.message import EmailMessage
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app import models, schemas
from app.auth import get_db, hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

def normalize_email(email: str) -> str:
    return email.strip().lower()

def send_otp_email(recipient_email: str, otp_code: str):
    gmail_user = os.getenv("GMAIL_USER")
    gmail_app_password = os.getenv("GMAIL_APP_PASSWORD")
    gmail_from = os.getenv("GMAIL_FROM", gmail_user)

    if not gmail_user or not gmail_app_password:
        raise HTTPException(
            status_code=500,
            detail="Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.",
        )

    msg = EmailMessage()
    msg["Subject"] = "HabitFlow Verification Code"
    msg["From"] = gmail_from
    msg["To"] = recipient_email
    msg.set_content(
        f"Your HabitFlow verification code is: {otp_code}\n\n"
        "This code expires in 10 minutes."
    )

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(gmail_user, gmail_app_password)
            smtp.send_message(msg)
    except Exception as exc:
        print("Email sending failed:", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP email. Please try again.",
        )


# ---------------- SEND OTP ----------------

@router.post("/send-otp", response_model=schemas.MessageResponse)
def send_otp(request: schemas.SendOTPRequest, db: Session = Depends(get_db)):

    email = normalize_email(request.email)
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered. Please log in instead.",
        )

    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    db.query(models.EmailOTP).filter(
        models.EmailOTP.email == email,
        models.EmailOTP.is_used == False,
    ).update({"is_used": True})

    send_otp_email(email, otp_code)

    otp_entry = models.EmailOTP(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
    )

    db.add(otp_entry)
    db.commit()

    return {"message": "OTP sent to your email inbox."}

# ---------------- VERIFY OTP + REGISTER ----------------

@router.post("/verify-otp", response_model=schemas.AuthResponse)

def verify_otp(data: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    email = normalize_email(data.email)

    otp_record = (
        db.query(models.EmailOTP)
        .filter(
            models.EmailOTP.email == email,
            models.EmailOTP.is_used == False,
        )
        .order_by(models.EmailOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP not found")

    if otp_record.is_used:
        raise HTTPException(status_code=400, detail="OTP already used")

    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    if otp_record.otp_code != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    existing_user = db.query(models.User).filter(models.User.email == email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(data.password)

    new_user = models.User(
        name=data.name,
        email=email,
        password_hash=hashed_pw,
        auth_provider="email",
        email_verified=True,
    )

    db.add(new_user)

    otp_record.is_used = True

    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": new_user.name,
        "user_email": new_user.email,
    }


# ---------------- LOGIN ----------------

@router.post("/login", response_model=schemas.AuthResponse)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    email = normalize_email(user.email)
    db_user = db.query(models.User).filter(models.User.email == email).first()

    if db_user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if db_user.auth_provider == "email" and not db_user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_ok = verify_password(user.password, db_user.password_hash)

    if not password_ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(db_user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": db_user.name,
        "user_email": db_user.email,
    }



# ---------------- FORGOT PASSWORD: SEND RESET OTP ----------------

@router.post("/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = normalize_email(request.email)

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    db.query(models.EmailOTP).filter(
        models.EmailOTP.email == email,
        models.EmailOTP.is_used == False,
    ).update({"is_used": True})

    send_otp_email(email, otp_code)

    otp_entry = models.EmailOTP(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
    )

    db.add(otp_entry)
    db.commit()

    return {"message": "Password reset OTP sent to your email."}

# ------------- GUEST LOGIN ---------

@router.post("/guest-login", response_model=schemas.AuthResponse)
def guest_login(db: Session = Depends(get_db)):
    guest_email = "guest@habitflow.demo"
    guest_name = "Guest User"

    guest_user = db.query(models.User).filter(models.User.email == guest_email).first()

    if not guest_user:
        guest_user = models.User(
            name=guest_name,
            email=guest_email,
            password_hash="",
            auth_provider="guest",
            email_verified=True,
        )
        db.add(guest_user)
        db.commit()
        db.refresh(guest_user)

    token = create_access_token({"sub": str(guest_user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": guest_user.name,
        "user_email": guest_user.email,
    }

# ---------------- RESET PASSWORD USING OTP ----------------

@router.post("/reset-password", response_model=schemas.MessageResponse)
def reset_password(data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    email = normalize_email(data.email)
    otp_record = (
        db.query(models.EmailOTP)
        .filter(
            models.EmailOTP.email == email,
            models.EmailOTP.is_used == False,
        )
        .order_by(models.EmailOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP not found")

    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    if otp_record.otp_code != data.reset_token:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(data.new_password)

    otp_record.is_used = True

    db.commit()

    return {"message": "Password successfully reset"}

# ---------------- GOOGLE LOGIN ----------------


@router.post("/google-login", response_model=schemas.AuthResponse)
def google_login(data: schemas.GoogleTokenLoginRequest, db: Session = Depends(get_db)):
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")

    if not google_client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID is not configured")

    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            google_requests.Request(),
            google_client_id,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    issuer = idinfo.get("iss")
    if issuer not in ["accounts.google.com", "https://accounts.google.com"]:
        raise HTTPException(status_code=401, detail="Invalid Google issuer")

    email = normalize_email(idinfo.get("email", ""))
    name = idinfo.get("name") or "Google User"
    google_sub = idinfo.get("sub")

    if not email or not google_sub:
        raise HTTPException(status_code=401, detail="Invalid Google profile")

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        user = models.User(
            name=name,
            email=email,
            google_id=google_sub,
            auth_provider="google",
            email_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if not user.google_id:
            user.google_id = google_sub
        if not user.email_verified:
            user.email_verified = True
        if not user.auth_provider:
            user.auth_provider = "google"
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": user.name,
        "user_email": user.email,
    }