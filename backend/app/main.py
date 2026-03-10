from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.database import engine, Base
from app.routes import habits, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HabitFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(habits.router)


@app.get("/")
def root():
    return {"message": "HabitFlow API running"}