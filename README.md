# TaskFlow — Real-Time Task Collaboration Platform

A modern, real-time task collaboration tool inspired by **Trello (structure)** and **Notion (flexibility)**.

TaskFlow lets multiple users work together on boards at the same time, move tasks using drag-and-drop, and track activity changes live.

---

# Quick Start Guide

## Prerequisites

Before starting, make sure you have:

* Node.js 18 or higher
* PostgreSQL 14 or higher

---

## Step 1 — Clone and Install Dependencies

```bash
git clone <your-repo>
cd taskflow

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Step 2 — Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Then edit `.env`:

```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow
JWT_SECRET=change_this_in_production
FRONTEND_URL=http://localhost:3000
```

Change database credentials and JWT secret before production.

---

## Step 3 — Setup Database

```bash
createdb taskflow

cd backend
npm run db:migrate
npm run db:seed   # optional demo data
```

---

## Step 4 — Start Development Servers

### Backend

```bash
cd backend
npm run dev
```

Runs on → [http://localhost:5000](http://localhost:5000)

### Frontend

```bash
cd frontend
npm run dev
```

Runs on → [http://localhost:3000](http://localhost:3000)

---

# Demo Login

```
alice@demo.com / demo1234
bob@demo.com   / demo1234
```

---

# System Architecture Overview

## Frontend Overview

The frontend is built as a **Single Page Application (SPA)**.

```
src/
├ api/           → API calls + Axios setup
├ components/    → UI components (board, tasks, auth, shared)
├ hooks/         → Custom hooks (socket connection)
├ pages/         → Route-level pages
├ store/         → Zustand global state
└ App.jsx        → Routing + app bootstrap
```

### Why These Choices?

**Zustand**

* Minimal setup
* Easier to maintain
* No Redux boilerplate

**@hello-pangea/dnd**

* Reliable drag-and-drop
* Maintained library

**Optimistic Updates**

* Tasks move instantly in UI
* Backend confirms later

**Socket Logic Inside Store**

* Components stay clean
* Centralized event handling

---

## Backend Overview

```
src/
├ controllers/   → Business logic
├ middleware/    → Auth + error handling
├ models/        → DB connection + migrations
├ routes/        → Express route definitions
├ services/      → Background logic (activity logs)
├ socket/        → WebSocket setup
├ utils/         → Logger + helpers
├ app.js         → Express config
└ index.js       → Server + socket start
```

### Why Raw SQL (pg) Instead of ORM?

Pros:

* Faster queries
* Full control
* Easier performance tuning

Cons:

* More manual work
* Manual migrations required

---

# 🗃 Database Design (Human Explanation)

### Core Entities

**Users** → Login + identity

**Boards** → Main workspace

**Lists** → Columns inside boards

**Tasks** → Work items inside lists

**Board Members** → Who can access board

**Task Assignees** → Who is responsible for task

**Activities** → History tracking

---

### Key Indexes (Performance)

* Boards by owner
* Lists by board
* Tasks by board + list
* Activities by board + time

These ensure fast loading even with large boards.

---

# Real-Time Sync (How It Actually Works)

Each board has its own **socket room**.

When user opens board:

```
socket.join(boardId)
```

When task changes:

```
io.to(boardId).emit("task:update")
```

Only users inside that board get updates.

This keeps system fast and scalable.

---

# 📋 REST API Overview

## Authentication

| Method | Endpoint         |
| ------ | ---------------- |
| POST   | /api/auth/signup |
| POST   | /api/auth/login  |
| GET    | /api/auth/me     |

---

## Boards

| Method | Endpoint                |
| ------ | ----------------------- |
| GET    | /api/boards             |
| POST   | /api/boards             |
| GET    | /api/boards/:id         |
| PUT    | /api/boards/:id         |
| DELETE | /api/boards/:id         |
| POST   | /api/boards/:id/members |

---

## Lists

| Method | Endpoint       |
| ------ | -------------- |
| POST   | /api/lists     |
| PUT    | /api/lists/:id |
| DELETE | /api/lists/:id |

---

## Tasks

| Method | Endpoint                         |
| ------ | -------------------------------- |
| GET    | /api/tasks/board/:boardId        |
| POST   | /api/tasks                       |
| PUT    | /api/tasks/:id                   |
| DELETE | /api/tasks/:id                   |
| PUT    | /api/tasks/:id/move              |
| POST   | /api/tasks/:id/assignees         |
| DELETE | /api/tasks/:id/assignees/:userId |

---

# Design Decisions & Tradeoffs

## Assumptions

* Single workspace system
* Permissions at board level only
* No file upload system yet

---

## Tradeoffs Made

**Raw SQL** → More control, harder to maintain

**Zustand** → Faster dev, less enterprise tooling

**Optimistic UI** → Great UX, slightly complex error rollback

**Full board load** → Simpler logic, needs pagination later

---

# Scalability Plan

Future improvements:

• Redis pub/sub for multi-server socket sync
• PgBouncer for connection pooling
• Redis caching for board reads
• CDN for assets
• Read replicas for analytics

---

# Testing

```bash
cd backend
npm test

cd frontend
npm test
```

---

# Production Build

```bash
cd frontend
npm run build

cd backend
npm start
```

---

# What This Project Demonstrates

✔ Real-time collaboration
✔ Scalable architecture thinking
✔ Clean API design
✔ Database performance awareness
✔ Production-ready structure

---

# If You Are Reviewing This Project

Start from:

1. README → Architecture understanding
2. Backend → API + DB modeling
3. Frontend → State + realtime sync
4. Socket → Collaboration layer

---

# Final Note

TaskFlow is designed to be:

* Easy to understand
* Easy to extend
* Interview ready
* Production improvable

---
