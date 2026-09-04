# Kanban Board

Kanban Board System สำหรับจัดการงานและทำงานร่วมกันภายใน Board

## 1. Project Overview

ระบบ Kanban Board สำหรับจัดการงานร่วมกันภายใน Board โดยรองรับการจัดการ Board, Column, Task และสมาชิก

### Features

- Register / Login
- Create / Rename / Delete Board
- Invite Member เข้า Board
- Create / Rename / Delete Column
- Create / Edit / Delete Task
- Move Task
- Drag and Drop Task
- Assign Member ให้ Task
- In-app Notification เมื่อสมาชิกถูก Assign Task

---

## 2. Technology Stack

### Backend

- **Python** — ภาษาหลักที่ใช้ในการพัฒนา Backend และ Business Logic ของระบบ

- **FastAPI** — Web Framework สำหรับพัฒนา RESTful API รองรับการจัดการ HTTP Request/Response และมี Swagger/OpenAPI สำหรับทดสอบและตรวจสอบ API

- **SQLAlchemy** — ORM สำหรับจัดการการเชื่อมต่อและการทำงานกับ Database ช่วยให้การจัดการข้อมูลผ่าน Python เป็นระบบและลดการเขียน SQL โดยตรง

- **PostgreSQL** — Relational Database สำหรับจัดเก็บข้อมูลของระบบ ซึ่งประกอบด้วย 8 ตารางหลัก ได้แก่ `users`, `boards`, `board_members`, `invitations`, `columns`, `tasks`, `task_assignees` และ `notifications` โดยใช้ Foreign Key เพื่อกำหนดความสัมพันธ์ระหว่างข้อมูล

- **Pydantic** — ใช้สำหรับตรวจสอบและ Validate ข้อมูลที่ส่งเข้ามายัง API เพื่อให้ข้อมูลมีรูปแบบถูกต้องก่อนเข้าสู่การประมวลผล

- **JWT (JSON Web Token)** — ใช้สำหรับ Authentication โดยสร้าง Access Token หลังจากผู้ใช้ Login สำเร็จ และใช้ Token ในการเข้าถึง Protected API

- **Argon2** — ใช้สำหรับ Hash Password ก่อนจัดเก็บลง Database เพื่อป้องกันการจัดเก็บ Password ในรูปแบบ Plain Text

- **Uvicorn** — ASGI Server ที่ใช้สำหรับรัน FastAPI Application

### Frontend

- React
- Vite
- CSS

---

## 3. System Architecture

```text
React Frontend
      |
      | REST API
      ↓
FastAPI Backend
      |
      ↓
PostgreSQL Database
```

ระบบแบ่งการทำงานหลักออกเป็น Authentication, Board, Column, Task และ Notification

---

## 4. ER Diagram

Database ประกอบด้วย 8 ตารางหลัก ได้แก่

- `users`
- `boards`
- `board_members`
- `invitations`
- `columns`
- `tasks`
- `task_assignees`
- `notifications`

[View ER Diagram](./Kanban_board_ErDiagram.pdf)

### Database Relationships

#### 1. Users → Boards

User 1 คนสามารถเป็นเจ้าของ Board ได้หลาย Board โดย `boards.owner_id` อ้างอิงไปยัง `users.id`

**Relationship: 1:N**

#### 2. Users ↔ Boards

User สามารถเป็นสมาชิกของหลาย Board และ Board สามารถมีสมาชิกหลายคน โดยใช้ตาราง `board_members` เป็นตารางกลาง

- `board_members.user_id` → `users.id`
- `board_members.board_id` → `boards.id`

**Relationship: M:N**

#### 3. Boards → Columns

Board 1 Board สามารถมีหลาย Column โดย `columns.board_id` อ้างอิงไปยัง `boards.id`

**Relationship: 1:N**

#### 4. Columns → Tasks

Column 1 Column สามารถมีหลาย Task โดย `tasks.column_id` อ้างอิงไปยัง `columns.id`

**Relationship: 1:N**

#### 5. Tasks ↔ Users

Task สามารถ Assign ให้สมาชิกได้ และ User สามารถรับผิดชอบหลาย Task โดยใช้ตาราง `task_assignees` เป็นตารางกลาง

- `task_assignees.task_id` → `tasks.id`
- `task_assignees.user_id` → `users.id`

**Relationship: M:N**

#### 6. Boards → Invitations

Board 1 Board สามารถมีหลาย Invitation โดย `invitations.board_id` อ้างอิงไปยัง `boards.id`

**Relationship: 1:N**

Invitation ยังเก็บข้อมูลผู้ส่งและผู้ได้รับคำเชิญผ่าน

- `invitations.inviter_id` → `users.id`
- `invitations.invitee_id` → `users.id`

#### 7. Users → Notifications

User 1 คนสามารถมีหลาย Notification โดย `notifications.user_id` อ้างอิงไปยัง `users.id`

**Relationship: 1:N**

#### 8. Tasks → Notifications

Task 1 Task สามารถมี Notification ที่เกี่ยวข้องได้หลายรายการ โดย `notifications.task_id` อ้างอิงไปยัง `tasks.id`

**Relationship: 1:N**

---

## 5. Request / Response Design

ระบบออกแบบ RESTful API โดยแบ่ง Endpoint ตาม Resource และกำหนด Request Schema, Response และ HTTP Status Code อย่างเป็นระบบ โดยใช้ Pydantic สำหรับตรวจสอบข้อมูล Request และ FastAPI OpenAPI/Swagger สำหรับแสดงรายละเอียดและทดสอบ API

### Authentication

| Method | Endpoint         | Request           | Response         |
| ------ | ---------------- | ----------------- | ---------------- |
| POST   | `/auth/register` | `RegisterRequest` | User information |
| POST   | `/auth/login`    | `LoginRequest`    | Access Token     |

### Board

| Method | Endpoint                     | Request               | Response           |
| ------ | ---------------------------- | --------------------- | ------------------ |
| GET    | `/boards`                    | -                     | Board list         |
| POST   | `/boards`                    | `BoardCreateRequest`  | Created Board      |
| GET    | `/boards/{board_id}`         | -                     | Board information  |
| PUT    | `/boards/{board_id}`         | `BoardUpdateRequest`  | Updated Board      |
| DELETE | `/boards/{board_id}`         | -                     | Success message    |
| POST   | `/boards/{board_id}/members` | `InviteMemberRequest` | Member information |

### Column

| Method | Endpoint                     | Request               | Response        |
| ------ | ---------------------------- | --------------------- | --------------- |
| POST   | `/boards/{board_id}/columns` | `ColumnCreateRequest` | Created Column  |
| PUT    | `/columns/{column_id}`       | `ColumnUpdateRequest` | Updated Column  |
| DELETE | `/columns/{column_id}`       | -                     | Success message |

### Task

| Method | Endpoint                     | Request             | Response                              |
| ------ | ---------------------------- | ------------------- | ------------------------------------- |
| POST   | `/columns/{column_id}/tasks` | `TaskCreateRequest` | Created Task                          |
| PUT    | `/tasks/{task_id}`           | `TaskUpdateRequest` | Updated Task                          |
| DELETE | `/tasks/{task_id}`           | -                   | Success message                       |
| PUT    | `/tasks/{task_id}/move`      | `TaskMoveRequest`   | Moved Task                            |
| POST   | `/tasks/{task_id}/assignees` | `TaskAssignRequest` | Assignment information + Notification |

### Notification

| Method | Endpoint         | Request | Response          |
| ------ | ---------------- | ------- | ----------------- |
| GET    | `/notifications` | -       | Notification list |

### HTTP Status Codes

| Status Code | Usage |
| --- | --- |
| 200 OK | Request สำเร็จ |
| 201 Created | สร้างข้อมูลสำเร็จ |
| 400 Bad Request | Request ไม่ถูกต้องหรือไม่สามารถดำเนินการได้ |
| 401 Unauthorized | Authentication ไม่สำเร็จ |
| 403 Forbidden | ไม่มีสิทธิ์เข้าถึงข้อมูล |
| 404 Not Found | ไม่พบข้อมูลที่ร้องขอ |
| 422 Unprocessable Entity | ข้อมูล Request ไม่ผ่าน Validation |
## 6. Security

ระบบมีการจัดการด้านความปลอดภัยในส่วน Authentication, Authorization และการจัดการข้อมูล ดังนี้

### Authentication

- ใช้ **JWT (JSON Web Token)** สำหรับยืนยันตัวตนของผู้ใช้งาน
- หลังจาก Login สำเร็จ ระบบจะออก Access Token สำหรับเรียก Protected API
- ตรวจสอบ JWT ก่อนเข้าถึง API ที่ต้องมี Authentication
- Token มีเวลาหมดอายุ เพื่อจำกัดระยะเวลาการใช้งาน

### Password Security

- Password ไม่ถูกจัดเก็บเป็น Plain Text
- ใช้ **Argon2** สำหรับ Hash Password ก่อนบันทึกลง Database
- ระบบตรวจสอบ Password จาก Hash เมื่อต้องการ Login

### Authorization

- ตรวจสอบสิทธิ์ของผู้ใช้งานก่อนดำเนินการกับข้อมูล
- ตรวจสอบว่า User เป็นสมาชิกของ Board ก่อนเข้าถึงข้อมูลหรือดำเนินการที่เกี่ยวข้อง
- จำกัดการ Rename และ Delete Board ให้เฉพาะ Owner
- ตรวจสอบว่า Member ที่ถูก Assign Task เป็นสมาชิกของ Board

### Input Validation

- ใช้ **Pydantic** สำหรับ Validate ข้อมูล Request
- ตรวจสอบรูปแบบและข้อมูลที่จำเป็นก่อนเข้าสู่ Business Logic
- หากข้อมูลที่ส่งมาไม่ผ่าน Validation ระบบจะส่ง HTTP 422 และหาก Request ไม่สามารถดำเนินการได้ตามกฎของระบบ ระบบจะส่ง HTTP 400

### Sensitive Information

- `SECRET_KEY` และ `DATABASE_URL` จัดเก็บไว้ใน `.env`
- ไม่ส่ง `password_hash` กลับไปยัง Client
- ไม่ควร Commit `.env` ขึ้น GitHub

---

## 7. Performance Considerations

ระบบเลือกใช้ Technology และแนวทางการออกแบบที่เหมาะสมกับ RESTful API และข้อมูลที่มีความสัมพันธ์กัน ดังนี้

### FastAPI + Uvicorn

ใช้ FastAPI สำหรับพัฒนา RESTful API และใช้ Uvicorn เป็น ASGI Server สำหรับรัน Application เพื่อรองรับการจัดการ HTTP Request/Response อย่างมีประสิทธิภาพ

### SQLAlchemy

ใช้ SQLAlchemy ORM สำหรับจัดการ Database และใช้ Connection Pool เพื่อลด Overhead จากการสร้าง Database Connection ใหม่ในแต่ละ Request

### PostgreSQL

เลือกใช้ PostgreSQL เนื่องจากระบบมีข้อมูลที่มีความสัมพันธ์กันหลายส่วน เช่น User, Board, Column, Task และ Notification

Database ประกอบด้วย 8 ตารางหลัก ได้แก่

- `users`
- `boards`
- `board_members`
- `invitations`
- `columns`
- `tasks`
- `task_assignees`
- `notifications`

โดยใช้ Foreign Key เพื่อรักษาความสัมพันธ์และความถูกต้องของข้อมูล

### Pydantic

ใช้ Pydantic สำหรับ Validate ข้อมูล Request ก่อนเข้าสู่ Business Logic ช่วยลดการประมวลผลข้อมูลที่ไม่ถูกต้องและทำให้ API มีรูปแบบข้อมูลที่ชัดเจน

### Database Design

ออกแบบ Database โดยแยกข้อมูลตาม Entity และใช้ตารางกลางสำหรับความสัมพันธ์แบบ Many-to-Many เช่น

- `board_members` สำหรับความสัมพันธ์ระหว่าง User และ Board
- `task_assignees` สำหรับความสัมพันธ์ระหว่าง User และ Task
  ช่วยให้โครงสร้างข้อมูลเป็นระบบและลดข้อมูลซ้ำซ้อน

---

## 8. API Documentation

ระบบใช้ **FastAPI Swagger UI** สำหรับแสดงรายละเอียดและทดสอบ RESTful API
สามารถเปิด Swagger UI ได้ที่:http://127.0.0.1:8000/docs

Swagger UI แสดงรายละเอียดของ API ได้แก่

- HTTP Method
- Endpoint
- Path Parameter
- Request Body
- Request Schema
- Response
- HTTP Status Code
- Authentication สำหรับ Protected API

### API Categories

- **Authentication**
  - Register
  - Login

- **Board**
  - Get Boards
  - Create Board
  - Rename Board
  - Get Board
  - Delete Board
  - Invite Member

- **Column**
  - Create Column
  - Rename Column
  - Delete Column

- **Task**
  - Create Task
  - Update Task
  - Delete Task
  - Move Task
  - Assign Task

- **Notification**
  - Get Notifications

Protected API ใช้ JWT Bearer Token ผ่าน Authorization Header
Authorization: Bearer <access_token>

---

## 9. Project Structure

```text
Kanban_Board/
│
├── backend/
│   ├── __init__.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── schemas.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── Kanban_board_ErDiagram.pdf
└── README.md
```

### Backend

| File          | Description                                           |
| ------------- | ----------------------------------------------------- |
| `main.py`     | FastAPI Application, API Endpoints และ Business Logic |
| `database.py` | Database Connection และ SQLAlchemy Session            |
| `models.py`   | SQLAlchemy Database Models                            |
| `schemas.py`  | Pydantic Request / Response Schemas                   |
| `auth.py`     | Password Hashing และ JWT Authentication               |
| `__init__.py` | กำหนดให้ `backend` เป็น Python Package                |

### Frontend

| File             | Description                           |
| ---------------- | ------------------------------------- |
| `App.jsx`        | React Application และหน้าการทำงานหลัก |
| `App.css`        | Styling ของ Application               |
| `main.jsx`       | Entry Point ของ React Application     |
| `index.css`      | Global CSS                            |
| `package.json`   | Frontend Dependencies และ Scripts     |
| `vite.config.js` | Vite Configuration                    |

## 10. How to Run

### Prerequisites

- Python 3.14+
- Node.js
- PostgreSQL

### 1. Configure Environment Variables

สร้างไฟล์ `.env` ที่ Root ของ Project และกำหนดค่าที่จำเป็นสำหรับ Backend

```env
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
```

### 2. Run Backend

เปิด Terminal ที่ Root ของ Project:
uvicorn backend.main:app --reload
Backend จะทำงานที่:http://127.0.0.1:8000
สามารถตรวจสอบ API และทดสอบผ่าน Swagger UI ได้ที่:http://127.0.0.1:8000/docs

### 3. Run Frontend

เปิด Terminal ใหม่ที่ Root ของ Project:
cd frontend
npm install
npm run dev
จากนั้นเปิด URL ที่แสดงใน Terminal เพื่อเข้าใช้งานระบบ
