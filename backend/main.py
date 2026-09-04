from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.database import get_db
from backend.models import (
    Board,
    BoardMember,
    Invitation,
    KanbanColumn,
    Notification,
    Task,
    TaskAssignee,
    User,
)
from backend.schemas import (
    BoardCreateRequest,
    BoardUpdateRequest,
    ColumnCreateRequest,
    ColumnUpdateRequest,
    InviteMemberRequest,
    LoginRequest,
    RegisterRequest,
    TaskAssignRequest,
    TaskCreateRequest,
    TaskMoveRequest,
    TaskUpdateRequest,
)

app = FastAPI(
    title="Kanban Board API",
    description="Backend API for Kanban Board",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.get("/")
def root():
    return {
        "message": "Kanban Board API is running"
    }


@app.get("/health/db")
def database_health():
    from sqlalchemy import text

    from backend.database import engine

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "database": "connected"
    }


@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    # ตรวจว่า Email นี้มีอยู่แล้วไหม
    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash Password
    password_hash = hash_password(data.password)

    # สร้าง User
    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=password_hash
    )

    # บันทึกลง Database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # ไม่ส่ง password หรือ password_hash กลับไป
    return {
        "message": "Registration successful",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    }

@app.post("/auth/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user or not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/boards")
def get_boards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    boards = (
        db.query(Board)
        .join(
            BoardMember,
            Board.id == BoardMember.board_id
        )
        .filter(
            BoardMember.user_id == current_user.id
        )
        .order_by(Board.updated_at.desc())
        .all()
    )

    return {
        "boards": [
            {
                "id": board.id,
                "name": board.name,
                "owner_id": board.owner_id
            }
            for board in boards
        ]
    }

@app.post("/boards", status_code=status.HTTP_201_CREATED)
def create_board(
    data: BoardCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_board = Board(
        name=data.name,
        owner_id=current_user.id
    )

    db.add(new_board)
    db.flush()

    board_member = BoardMember(
        board_id=new_board.id,
        user_id=current_user.id,
        role="owner"
    )

    db.add(board_member)
    db.commit()
    db.refresh(new_board)

    return {
        "message": "Board created successfully",
        "board": {
            "id": new_board.id,
            "name": new_board.name,
            "owner_id": new_board.owner_id
        }
    }

@app.put("/boards/{board_id}")
def rename_board(
    board_id: int,
    data: BoardUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    board = (
        db.query(Board)
        .filter(Board.id == board_id)
        .first()
    )

    if board is None:
        raise HTTPException(
            status_code=404,
            detail="Board not found"
        )

    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the owner of this board"
        )

    board.name = data.name

    db.commit()
    db.refresh(board)

    return {
        "message": "Board renamed successfully",
        "board": {
            "id": board.id,
            "name": board.name,
            "owner_id": board.owner_id
        }
    }

@app.post("/boards/{board_id}/members", status_code=status.HTTP_201_CREATED)
def invite_member(
    board_id: int,
    data: InviteMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ตรวจสอบว่า Board มีอยู่จริง
    board = (
        db.query(Board)
        .filter(Board.id == board_id)
        .first()
    )

    if board is None:
        raise HTTPException(
            status_code=404,
            detail="Board not found"
        )

    # เฉพาะ Owner เท่านั้นที่เชิญสมาชิกได้
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the board owner can invite members"
        )

    # หา User ที่ต้องการเชิญจาก Email
    invitee = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if invitee is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ไม่ให้ Owner เชิญตัวเอง
    if invitee.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You are already the owner of this board"
        )

    # ตรวจสอบว่าเป็นสมาชิกอยู่แล้วหรือไม่
    existing_member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == board_id,
            BoardMember.user_id == invitee.id
        )
        .first()
    )

    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this board"
        )

    # เพิ่มสมาชิกเข้า Board
    new_member = BoardMember(
        board_id=board_id,
        user_id=invitee.id,
        role="member"
    )

    db.add(new_member)

    # บันทึก Invitation
    invitation = Invitation(
        board_id=board_id,
        inviter_id=current_user.id,
        invitee_id=invitee.id,
        status="accepted"
    )

    db.add(invitation)

    db.commit()

    return {
        "message": "Member invited successfully",
        "member": {
            "user_id": invitee.id,
            "name": invitee.name,
            "email": invitee.email,
            "role": "member"
        }
    }

# Get Board with Columns and Tasks
@app.get("/boards/{board_id}")
def get_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ตรวจสอบว่า Board มีอยู่จริง
    board = (
        db.query(Board)
        .filter(Board.id == board_id)
        .first()
    )

    if board is None:
        raise HTTPException(
            status_code=404,
            detail="Board not found"
        )

    # ตรวจสอบว่า User เป็นสมาชิกของ Board
    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == board_id,
            BoardMember.user_id == current_user.id
        )
        .first()
    )

    if member is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this board"
        )

    # ดึง Columns ของ Board
    columns = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.board_id == board_id)
        .order_by(KanbanColumn.position.asc())
        .all()
    )

    result_columns = []

    for column in columns:

        # ดึง Tasks ของแต่ละ Column
        tasks = (
            db.query(Task)
            .filter(Task.column_id == column.id)
            .order_by(Task.position.asc())
            .all()
        )

        result_columns.append({
            "id": column.id,
            "name": column.name,
            "position": column.position,
            "tasks": [
                {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "position": task.position
                }
                for task in tasks
            ]
        })

    return {
        "board": {
            "id": board.id,
            "name": board.name,
            "owner_id": board.owner_id
        },
        "columns": result_columns
    }

@app.post(
    "/boards/{board_id}/columns",
    status_code=status.HTTP_201_CREATED
)
def create_column(
    board_id: int,
    data: ColumnCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ตรวจสอบว่า Board มีอยู่จริง
    board = (
        db.query(Board)
        .filter(Board.id == board_id)
        .first()
    )

    if board is None:
        raise HTTPException(
            status_code=404,
            detail="Board not found"
        )

    # ตรวจสอบว่า User เป็นสมาชิกของ Board
    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == board_id,
            BoardMember.user_id == current_user.id
        )
        .first()
    )

    if member is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this board"
        )

    # หา position ถัดไป
    last_column = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.board_id == board_id)
        .order_by(KanbanColumn.position.desc())
        .first()
    )

    next_position = (
        last_column.position + 1
        if last_column
        else 1
    )

    new_column = KanbanColumn(
        board_id=board_id,
        name=data.name,
        position=next_position
    )

    db.add(new_column)
    db.commit()
    db.refresh(new_column)

    return {
        "message": "Column created successfully",
        "column": {
            "id": new_column.id,
            "board_id": new_column.board_id,
            "name": new_column.name,
            "position": new_column.position
        }
    }

@app.delete("/boards/{board_id}")
def delete_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    board = (
        db.query(Board)
        .filter(Board.id == board_id)
        .first()
    )

    if board is None:
        raise HTTPException(
            status_code=404,
            detail="Board not found"
        )

    # เฉพาะ Owner เท่านั้นที่ลบ Board ได้
    if board.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the owner of this board"
        )

    # หา Columns ทั้งหมดของ Board
    columns = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.board_id == board_id)
        .all()
    )

    column_ids = [column.id for column in columns]

    # ลบ Tasks ที่อยู่ใน Columns
    if column_ids:

        tasks = (
            db.query(Task)
            .filter(Task.column_id.in_(column_ids))
            .all()
        )

        task_ids = [task.id for task in tasks]

        if task_ids:

            # ลบผู้รับผิดชอบ Task
            db.query(TaskAssignee).filter(
                TaskAssignee.task_id.in_(task_ids)
            ).delete(
                synchronize_session=False
            )

            # ลบ Notification
            db.query(Notification).filter(
                Notification.task_id.in_(task_ids)
            ).delete(
                synchronize_session=False
            )

            # ลบ Tasks
            db.query(Task).filter(
                Task.id.in_(task_ids)
            ).delete(
                synchronize_session=False
            )

        # ลบ Columns
        db.query(KanbanColumn).filter(
            KanbanColumn.board_id == board_id
        ).delete(
            synchronize_session=False
        )

    # ลบ Invitations
    db.query(Invitation).filter(
        Invitation.board_id == board_id
    ).delete(
        synchronize_session=False
    )

    # ลบสมาชิกใน Board
    db.query(BoardMember).filter(
        BoardMember.board_id == board_id
    ).delete(
        synchronize_session=False
    )

    # ลบ Board
    db.delete(board)

    db.commit()

    return {
        "message": "Board deleted successfully"
    }

@app.put("/columns/{column_id}")
def rename_column(
    column_id: int,
    data: ColumnUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    column = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.id == column_id)
        .first()
    )

    if column is None:
        raise HTTPException(
            status_code=404,
            detail="Column not found"
        )

    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == column.board_id,
            BoardMember.user_id == current_user.id
        )
        .first()
    )

    if member is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this board"
        )

    column.name = data.name

    db.commit()
    db.refresh(column)

    return {
        "message": "Column renamed successfully",
        "column": {
            "id": column.id,
            "board_id": column.board_id,
            "name": column.name,
            "position": column.position
        }
    }

@app.delete("/columns/{column_id}")
def delete_column(
    column_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    column = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.id == column_id)
        .first()
    )

    if column is None:
        raise HTTPException(
            status_code=404,
            detail="Column not found"
        )

    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == column.board_id,
            BoardMember.user_id == current_user.id
        )
        .first()
    )

    if member is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this board"
        )

    db.delete(column)
    db.commit()

    return {
        "message": "Column deleted successfully"
    }

@app.post(
    "/columns/{column_id}/tasks",
    status_code=status.HTTP_201_CREATED
)
def create_task(
    column_id: int,
    data: TaskCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ตรวจสอบ Column
    column = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.id == column_id)
        .first()
    )

    if column is None:
        raise HTTPException(
            status_code=404,
            detail="Column not found"
        )

    # ตรวจสอบว่า User เป็นสมาชิกของ Board
    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == column.board_id,
            BoardMember.user_id == current_user.id
        )
        .first()
    )

    if member is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this board"
        )

    # หา position ถัดไป
    last_task = (
        db.query(Task)
        .filter(Task.column_id == column_id)
        .order_by(Task.position.desc())
        .first()
    )

    next_position = (
        last_task.position + 1
        if last_task
        else 1
    )

    new_task = Task(
        column_id=column_id,
        title=data.title,
        description=data.description,
        position=next_position
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return {
        "message": "Task created successfully",
        "task": {
            "id": new_task.id,
            "column_id": new_task.column_id,
            "title": new_task.title,
            "description": new_task.description,
            "position": new_task.position
        }
    }
@app.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    data: TaskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    column = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.id == task.column_id)
        .first()
    )

    if column is None:
        raise HTTPException(
            status_code=404,
            detail="Column not found"
        )

    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == column.board_id,
            BoardMember.user_id == current_user.id
        )
        .first()
    )

    if member is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this board"
        )

    task.title = data.title
    task.description = data.description

    db.commit()
    db.refresh(task)

    return {
        "message": "Task updated successfully",
        "task": {
            "id": task.id,
            "column_id": task.column_id,
            "title": task.title,
            "description": task.description,
            "position": task.position
        }
    }

@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    column = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.id == task.column_id)
        .first()
    )

    if column is None:
        raise HTTPException(
            status_code=404,
            detail="Column not found"
        )

    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == column.board_id,
            BoardMember.user_id == current_user.id
        )
        .first()
    )

    if member is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this board"
        )

    db.query(TaskAssignee).filter(
        TaskAssignee.task_id == task_id
    ).delete(synchronize_session=False)

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }

@app.put("/tasks/{task_id}/move")
def move_task(
    task_id: int,
    data: TaskMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # หา Task
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # หา Column เดิม
    source_column = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.id == task.column_id)
        .first()
    )

    if source_column is None:
        raise HTTPException(
            status_code=404,
            detail="Source column not found"
        )

    #  หา Column ใหม่
    target_column = (
        db.query(KanbanColumn)
        .filter(
            KanbanColumn.id == data.target_column_id
        )
        .first()
    )

    if target_column is None:
        raise HTTPException(
            status_code=404,
            detail="Target column not found"
        )

    # ต้องอยู่ Board เดียวกัน
    if source_column.board_id != target_column.board_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot move task to another board"
        )

    # ตรวจสอบว่า User เป็นสมาชิก
    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == source_column.board_id,
            BoardMember.user_id == current_user.id
        )
        .first()
    )

    if member is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this board"
        )

    old_position = task.position
    new_position = data.position

    # จำกัด position ไม่ให้เกินจำนวน Task
    target_task_count = (
        db.query(Task)
        .filter(
            Task.column_id == target_column.id,
            Task.id != task.id
        )
        .count()
    )

    max_position = target_task_count + 1

    if new_position > max_position:
        new_position = max_position

    # ย้ายภายใน Column เดิม
    if source_column.id == target_column.id:

        if new_position < old_position:

            db.query(Task).filter(
                Task.column_id == source_column.id,
                Task.id != task.id,
                Task.position >= new_position,
                Task.position < old_position
            ).update(
                {
                    Task.position: Task.position + 1
                },
                synchronize_session=False
            )

        elif new_position > old_position:

            db.query(Task).filter(
                Task.column_id == source_column.id,
                Task.id != task.id,
                Task.position > old_position,
                Task.position <= new_position
            ).update(
                {
                    Task.position: Task.position - 1
                },
                synchronize_session=False
            )

    # ย้ายข้าม Column
    else:

        # ขยับ Task ใน Column เดิมขึ้นมา
        db.query(Task).filter(
            Task.column_id == source_column.id,
            Task.id != task.id,
            Task.position > old_position
        ).update(
            {
                Task.position: Task.position - 1
            },
            synchronize_session=False
        )

        # เปิดตำแหน่งใน Column ใหม่
        db.query(Task).filter(
            Task.column_id == target_column.id,
            Task.position >= new_position
        ).update(
            {
                Task.position: Task.position + 1
            },
            synchronize_session=False
        )

    # เปลี่ยน Column + Position
    task.column_id = target_column.id
    task.position = new_position

    db.commit()
    db.refresh(task)

    return {
        "message": "Task moved successfully",
        "task": {
            "id": task.id,
            "column_id": task.column_id,
            "title": task.title,
            "description": task.description,
            "position": task.position
        }
    }

@app.post("/tasks/{task_id}/assignees", status_code=status.HTTP_201_CREATED)
def assign_task(
    task_id: int,
    data: TaskAssignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # หา Task
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # หา Column
    column = (
        db.query(KanbanColumn)
        .filter(KanbanColumn.id == task.column_id)
        .first()
    )

    if column is None:
        raise HTTPException(
            status_code=404,
            detail="Column not found"
        )

    # ตรวจว่า Current User เป็นสมาชิกของ Board
    current_member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == column.board_id,
            BoardMember.user_id == current_user.id
        )
        .first()
    )

    if current_member is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this board"
        )

    # 4. หา User ที่ต้องการ Assign
    assignee = (
        db.query(User)
        .filter(User.id == data.user_id)
        .first()
    )

    if assignee is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ตรวจว่า Assignee เป็นสมาชิกของ Board
    assignee_member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == column.board_id,
            BoardMember.user_id == assignee.id
        )
        .first()
    )

    if assignee_member is None:
        raise HTTPException(
            status_code=400,
            detail="User is not a member of this board"
        )

    
    # ตรวจว่า Assign อยู่แล้วหรือไม่
    existing_assignee = (
        db.query(TaskAssignee)
        .filter(
            TaskAssignee.task_id == task_id,
            TaskAssignee.user_id == assignee.id
        )
        .first()
    )

    if existing_assignee:
        raise HTTPException(
            status_code=400,
            detail="User is already assigned to this task"
        )

    #  Assign User ให้ Task
    new_assignee = TaskAssignee(
        task_id=task_id,
        user_id=assignee.id
    )

    db.add(new_assignee)

    # สร้าง Notification
    notification = Notification(
        user_id=assignee.id,
        task_id=task.id,
        message=f"You have been assigned to task: {task.title}",
        is_read=False
    )

    db.add(notification)

    #  Commit พร้อมกัน
    db.commit()

    return {
        "message": "Member assigned successfully",
        "assignment": {
            "task_id": task.id,
            "user_id": assignee.id,
            "name": assignee.name,
            "email": assignee.email
        },
        "notification": {
            "message": notification.message
        }
    }

@app.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return {
        "notifications": [
            {
                "id": notification.id,
                "task_id": notification.task_id,
                "message": notification.message,
                "is_read": notification.is_read,
                "created_at": notification.created_at
            }
            for notification in notifications
        ]
    }