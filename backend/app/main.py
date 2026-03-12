from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime, timedelta
from email.message import EmailMessage
from email.utils import formataddr
import os
import smtplib
import threading
import time

load_dotenv()

from app.database import engine, Base, SessionLocal
from app.routes import habits, users
from app import models


Base.metadata.create_all(bind=engine)


def send_habit_reminder_email(to_email: str, habit_title: str, reminder_time: str):
    gmail_user = os.getenv("GMAIL_USER")
    gmail_password = os.getenv("GMAIL_APP_PASSWORD")
    from_email = os.getenv("GMAIL_FROM", gmail_user)

    if not gmail_user or not gmail_password or not from_email:
        print(
            "Reminder email skipped: missing Gmail environment variables. "
            f"GMAIL_USER={'set' if gmail_user else 'missing'}, "
            f"GMAIL_APP_PASSWORD={'set' if gmail_password else 'missing'}, "
            f"GMAIL_FROM={'set' if from_email else 'missing'}"
        )
        return

    msg = EmailMessage()
    msg["Subject"] = f"HabitFlow Reminder: {habit_title}"
    msg["From"] = formataddr(("HabitFlow", from_email))
    msg["To"] = to_email
    msg.set_content(
        f"This is your HabitFlow reminder for '{habit_title}'.\n\n"
        f"Scheduled time: {reminder_time}\n"
        f"Open HabitFlow and complete your habit for today."
    )

    html_content = f"""
    <html>
      <body style="margin:0;padding:0;background:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0f172a;">
        <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:22px;overflow:hidden;box-shadow:0 18px 40px rgba(15,23,42,0.10);">
            <div style="background:linear-gradient(135deg,#0f172a,#1e1b4b);padding:28px 28px 22px 28px;">
              <p style="margin:0 0 10px 0;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#c4b5fd;font-weight:800;">
                HabitFlow Reminder
              </p>
              <h1 style="margin:0;font-size:34px;line-height:1.15;color:#ffffff;font-weight:800;">
                Time to complete your habit
              </h1>
            </div>

            <div style="padding:28px;">
              <p style="margin:0 0 18px 0;font-size:17px;line-height:1.7;color:#334155;">
                This is your reminder to complete <strong style="color:#0f172a;">{habit_title}</strong> today and keep your consistency going.
              </p>

              <div style="display:inline-block;padding:11px 16px;border-radius:999px;background:#f3e8ff;border:1px solid #d8b4fe;color:#6d28d9;font-size:14px;font-weight:800;">
                ⏰ Scheduled time: {reminder_time}
              </div>

              <div style="margin-top:24px;padding:18px 18px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0;font-size:15px;line-height:1.75;color:#475569;">
                  Open HabitFlow, mark this habit as completed, and protect your streak.
                </p>
              </div>

              <div style="margin-top:24px;">
                <a href="https://habitflow-eosin.vercel.app" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#8b5cf6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;">
                  Open HabitFlow
                </a>
              </div>

              <p style="margin:24px 0 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
                Sent automatically by HabitFlow.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
    """

    msg.add_alternative(html_content, subtype="html")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(gmail_user, gmail_password)
        smtp.send_message(msg)
        print(f"Reminder email sent successfully to {to_email} for habit '{habit_title}' at {reminder_time}.")



def check_and_send_habit_reminders():
    while True:
        db = SessionLocal()
        try:
            now = datetime.now()
            current_time = now.strftime("%H:%M")
            previous_time = (now - timedelta(minutes=1)).strftime("%H:%M")
            today = now.date()

            due_habits = (
                db.query(models.Habit)
                .filter(models.Habit.reminder_enabled == True)
                .filter(models.Habit.reminder_time.in_([current_time, previous_time]))
                .all()
            )
            print(
                f"Reminder worker tick at {current_time} (also checking {previous_time}): "
                f"found {len(due_habits)} due habit(s)."
            )

            for habit in due_habits:
                user = db.query(models.User).filter(models.User.id == habit.user_id).first()
                if not user or not user.email:
                    continue
                print(f"Checking reminder for habit {habit.id} ({habit.title}) -> {user.email}")

                already_sent_today = (
                    habit.last_reminder_sent_at is not None
                    and habit.last_reminder_sent_at.date() == today
                )

                if already_sent_today:
                    print(f"Skipping habit {habit.id}: reminder already sent today.")
                    continue

                completed_today = any(
                    log.completed and log.date.date() == today
                    for log in habit.logs
                )

                if completed_today:
                    print(f"Skipping habit {habit.id}: already completed today.")
                    continue

                try:
                    send_habit_reminder_email(user.email, habit.title, habit.reminder_time)
                    habit.last_reminder_sent_at = now
                    db.add(habit)
                    db.commit()
                    print(f"Stored reminder send timestamp for habit {habit.id}.")
                except Exception as email_error:
                    print(f"Reminder email failed for habit {habit.id}: {email_error}")
                    db.rollback()
        except Exception as loop_error:
            print(f"Reminder loop error: {loop_error}")
            db.rollback()
        finally:
            db.close()

        time.sleep(5)


app = FastAPI(title="HabitFlow API")


@app.on_event("startup")
def start_reminder_worker():
    worker = threading.Thread(target=check_and_send_habit_reminders, daemon=True)
    worker.start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://habitflow-eosin.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(habits.router)


@app.get("/")
def root():
    return {"message": "HabitFlow API running"}