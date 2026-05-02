# Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking progress with role-based access control.

## Features

- JWT Authentication (Signup/Login)
- Role-based access: Admin and Member
- Project creation and team management
- Task creation, assignment, priority, and due dates
- Task status tracking: TODO, IN_PROGRESS, DONE
- Dashboard with stats and overdue task tracking

## Tech Stack

- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL (Supabase)
- Frontend: React, Vite, Tailwind CSS
- Auth: JWT with bcrypt

## Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL database (Supabase recommended)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
DATABASE_URL="your-postgresql-connection-url"
JWT_SECRET="your-secret-key"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

```bash
npx prisma db push
npm run dev
```

### Frontend

```bash
cd backend/frontend/frontend
npm install
npm run dev
```

Open http://localhost:5173

## API Endpoints

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me

### Projects
- GET /api/projects
- POST /api/projects
- GET /api/projects/:id
- PUT /api/projects/:id (Admin)
- DELETE /api/projects/:id (Admin)
- POST /api/projects/:id/members (Admin)
- DELETE /api/projects/:id/members/:userId (Admin)

### Tasks
- GET /api/tasks?projectId=xxx
- POST /api/tasks (Admin)
- PUT /api/tasks/:id
- DELETE /api/tasks/:id (Admin)

### Dashboard
- GET /api/dashboard

## Role-Based Access

| Action | Admin | Member |
|--------|-------|--------|
| Create project | Yes | No |
| Add/remove members | Yes | No |
| Create/delete tasks | Yes | No |
| Update task status | Yes | Yes |
| View project | Yes | Yes |

## Deployment

Deployed on Railway. Backend serves the built React frontend as static files.
