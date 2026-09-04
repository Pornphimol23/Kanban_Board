import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# โหลดค่าจากไฟล์ .env
load_dotenv()


# อ่าน DATABASE_URL จาก .env
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env")


# สร้างการเชื่อมต่อ PostgreSQL
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)


# สร้าง Database Session
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# Base สำหรับ SQLAlchemy Models
Base = declarative_base()


# Dependency สำหรับใช้ Database ใน API
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()