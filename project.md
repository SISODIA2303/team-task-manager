# 🗂️ Team Task Manager

> A full-stack collaborative project & task management web application — inspired by tools like Trello and Asana — with role-based access, real-time updates, and a clean analytics dashboard.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Deployment (Railway)](#deployment-railway)
- [Environment Variables](#environment-variables)
- [Demo](#demo)

---

## Overview

Team Task Manager is a real-world collaborative application where users can create projects, invite team members, assign tasks, and track progress — all with role-based access control separating Admins from Members.

**Assignment Requirements Met:**
- ✅ JWT Authentication (Signup / Login)
- ✅ Project Management with Admin/Member roles
- ✅ Task CRUD with priority, due date, and status tracking
- ✅ Dashboard with task analytics
- ✅ Role-Based Access Control (RBAC)
- ✅ RESTful APIs with proper validation & error handling
- ✅ Deployed live on Railway

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React + TypeScript (Vite) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL |
| **Auth** | JWT (python-jose) + bcrypt |
| **ORM** | SQLAlchemy + Alembic (migrations) |
| **Real-time** | WebSockets (FastAPI) |
| **Deployment** | Railway |
| **Containerization** | Docker + Docker Compose |

---

## Features

### ✅ Core (Assignment Requirements)

#### 🔐 Authentication
- Signup with Name, Email, Password (bcrypt hashed)
- Login with JWT access token (15min) + refresh token (7 days)
- Protected routes on both frontend and backend
- Logout with token invalidation

#### 📁 Project Management
- Create projects (creator auto-assigned as Admin)
- Admin can add/remove members by email
- Members can view only their assigned projects
- Project detail page with member list

#### ✅ Task Management
- Create tasks with: Title, Description, Due Date, Priority (Low / Medium / High / Critical)
- Assign tasks to any project member
- Update task status: `To Do → In Progress → Done`
- Delete tasks (Admin only)

#### 📊 Dashboard
- Total task count
- Task breakdown by status (To Do / In Progress / Done)
- Tasks per team member
- Overdue task alerts (highlighted in red)

#### 🔒 Role-Based Access
| Action | Admin | Member |
|--------|-------|--------|
| Create/delete tasks | ✅ | ❌ |
| Assign tasks to others | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Update own task status | ✅ | ✅ |
| View project dashboard | ✅ | ✅ |

---

### 🚀 Additional Features (Beyond Assignment)

#### 🔔 Notifications
- In-app notification bell when a task is assigned to you
- Notification when your task's due date is approaching (within 24h)

#### 💬 Task Comments
- Users can comment on tasks
- Comment thread per task with timestamps and author names

#### 🏷️ Task Labels / Tags
- Custom color-coded labels per project (e.g., `bug`, `feature`, `urgent`)
- Filter tasks by label on the board view

#### 📎 File Attachments
- Attach files to tasks (stored via Railway Volume or S3-compatible storage)
- View/download attached files from task detail modal

#### 🔍 Search & Filter
- Global search across tasks and projects
- Filter tasks by: Status, Priority, Assignee, Due Date range, Label

#### 📅 Kanban Board View
- Drag-and-drop task cards across status columns (To Do → In Progress → Done)
- Visual priority indicators on each card

#### 📈 Activity Log / Audit Trail
- Per-task activity log: who changed what and when
- Project-level activity feed for Admins

#### 👤 User Profile
- Update display name and avatar
- View all tasks assigned to you across all projects in one page ("My Tasks" view)

#### 🌗 Dark Mode
- Toggle between light and dark themes (persisted in localStorage)

---

## Database Schema

```
Users
  id (PK), name, email, password_hash, avatar_url, created_at

Projects
  id (PK), name, description, created_by (FK → Users), created_at

ProjectMembers
  id (PK), project_id (FK), user_id (FK), role (admin/member), joined_at

Tasks
  id (PK), project_id (FK), title, description, status, priority,
  due_date, assigned_to (FK → Users), created_by (FK → Users), created_at, updated_at

Comments
  id (PK), task_id (FK), user_id (FK), content, created_at

Labels
  id (PK), project_id (FK), name, color

TaskLabels
  task_id (FK), label_id (FK)

Attachments
  id (PK), task_id (FK), file_url, file_name, uploaded_by (FK), uploaded_at

Notifications
  id (PK), user_id (FK), message, is_read, created_at

ActivityLogs
  id (PK), task_id (FK), user_id (FK), action, metadata (JSON), created_at
```

---

## API Endpoints

### Auth
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
```

### Projects
```
GET    /api/projects              → List user's projects
POST   /api/projects              → Create project
GET    /api/projects/{id}         → Get project detail
PUT    /api/projects/{id}         → Update project (Admin)
DELETE /api/projects/{id}         → Delete project (Admin)
POST   /api/projects/{id}/members → Add member (Admin)
DELETE /api/projects/{id}/members/{user_id} → Remove member (Admin)
```

### Tasks
```
GET    /api/projects/{id}/tasks          → List tasks
POST   /api/projects/{id}/tasks          → Create task (Admin)
GET    /api/tasks/{task_id}              → Task detail
PUT    /api/tasks/{task_id}              → Update task
DELETE /api/tasks/{task_id}              → Delete task (Admin)
PATCH  /api/tasks/{task_id}/status       → Update status
```

### Comments, Labels, Attachments
```
GET/POST   /api/tasks/{id}/comments
GET/POST   /api/projects/{id}/labels
POST/DELETE /api/tasks/{id}/labels
POST       /api/tasks/{id}/attachments
```

### Dashboard & Search
```
GET /api/projects/{id}/dashboard   → Analytics
GET /api/me/tasks                  → My tasks across all projects
GET /api/search?q=...              → Global search
GET /api/notifications             → User notifications
```

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API route handlers
│   │   ├── services/        # Business logic
│   │   └── dependencies.py  # Auth guards, DB session
│   ├── alembic/             # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/             # Axios API client
│   │   ├── context/         # Auth + Theme context
│   │   └── types/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md  ← (this file)
```

---

## Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional but recommended)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/team-task-manager.git
cd team-task-manager
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in values (see [Environment Variables](#environment-variables)).

```bash
# Run DB migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:8000`.

### 4. Run with Docker Compose (recommended)

```bash
cp .env.example .env   # fill in values
docker compose up --build
```

All three services (frontend, backend, PostgreSQL) start together.

---

## Deployment (Railway)

1. Push your code to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**.
3. Add a **PostgreSQL** plugin from the Railway dashboard.
4. Set all environment variables in the Railway service settings (see below).
5. Railway auto-detects the `Dockerfile` and builds both services.
6. Set `VITE_API_URL` in the frontend service to your deployed backend URL.

> ✅ Both frontend and backend are deployed as separate Railway services connected via environment variables.

---

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=your-jwt-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:8000
```

> ⚠️ Never commit `.env` files to GitHub. Add them to `.gitignore`.

---

## Demo

- 🌐 **Live URL:** `https://team-task-manager.up.railway.app`
- 📁 **GitHub:** `https://github.com/<your-username>/team-task-manager`
- 🎥 **Demo Video:** [Watch on Loom](#) *(2–5 min walkthrough)*

---

## Author

**Siddharth Sisodia**  
B.Tech Computer Science | Amity University Noida  
GitHub · LinkedIn
