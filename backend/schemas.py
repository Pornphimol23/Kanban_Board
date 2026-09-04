from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

class BoardCreateRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )

class BoardUpdateRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )

class InviteMemberRequest(BaseModel):
    email: EmailStr

class ColumnCreateRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )

class ColumnUpdateRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )

class TaskCreateRequest(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200
    )

    description: str | None = Field(
        default=None,
        max_length=2000
    )

class TaskUpdateRequest(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200
    )

    description: str | None = Field(
        default=None,
        max_length=2000
    )

class TaskMoveRequest(BaseModel):
    target_column_id: int = Field(
        gt=0
    )

    position: int = Field(
        gt=0
    )

class TaskAssignRequest(BaseModel):
    user_id: int = Field(
        gt=0
    )

