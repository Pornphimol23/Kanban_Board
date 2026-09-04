from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.sql import func

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        nullable=False,
        unique=True,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )


class Board(Base):
    __tablename__ = "boards"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    owner_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )


class BoardMember(Base):
    __tablename__ = "board_members"

    board_id = Column(
        BigInteger,
        ForeignKey("boards.id"),
        primary_key=True
    )

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        primary_key=True
    )

    role = Column(
        String(20),
        nullable=False,
        default="member"
    )

    joined_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    board_id = Column(
        BigInteger,
        ForeignKey("boards.id"),
        nullable=False
    )

    inviter_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    invitee_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )


class KanbanColumn(Base):
    __tablename__ = "columns"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    board_id = Column(
        BigInteger,
        ForeignKey("boards.id"),
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    position = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    column_id = Column(
        BigInteger,
        ForeignKey("columns.id"),
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        String(2000),
        nullable=True
    )

    position = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )


class TaskAssignee(Base):
    __tablename__ = "task_assignees"

    task_id = Column(
        BigInteger,
        ForeignKey("tasks.id"),
        primary_key=True
    )

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        primary_key=True
    )

    assigned_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    task_id = Column(
        BigInteger,
        ForeignKey("tasks.id"),
        nullable=False
    )

    message = Column(
        String(255),
        nullable=False
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )