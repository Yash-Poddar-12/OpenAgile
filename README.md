# File-Map Agile Dev Suite

Reverse & Forward Engineering of an Agile Project Management System (OpenProject-inspired) with an integrated Repository Dependency Analyzer.

**Student:** Yash Poddar · **Reg No:** 23BDS0195  
**Course:** Software Engineering Lab (BCSE301P) · VIT Chennai

---

## Overview

This project has two integrated components:

1. **File-Map Repository Dependency Analyzer** — Scans any source-code repository to extract file-level import dependencies, build a visual force-directed graph, detect circular dependencies using Tarjan's SCC algorithm, and export results in DOT, PNG, and CSV formats.

2. **Agile Project Management Prototype** — A simplified OpenProject-inspired tool with project/sprint/issue management, a real-time Kanban board (Socket.io + drag-and-drop), role-based access control (5 roles), and a full export system.

## Tech Stack

| Layer     | Technology                                         |
|-----------|----------------------------------------------------|
| Frontend  | React 18 + Vite, Tailwind CSS, react-force-graph-2d, @dnd-kit, recharts |
| Backend   | Node.js 18 + Express, Socket.io, JWT, bcrypt       |
| Database  | MongoDB 6 + Mongoose                               |
| Testing   | Jest + Supertest (backend), Vitest + RTL (frontend)|

## Prerequisites

- Node.js 18+
- MongoDB 6+ (local) or a free Atlas cluster
- npm 9+
- Git

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yashpoddar-23bds0195/filemap-agile.git
cd filemap-agile
```

### 2. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configure environment

Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/filemap_agile
JWT_SECRET=filemap_super_secret_jwt_key_2026_minimum_32_chars
JWT_EXPIRY=24h
CLIENT_URL=http://localhost:5173
NODE_ENV=development
EXPORTS_DIR=./exports/filemap
```

Create `client/.env.local`:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Seed demo data

```bash
cd server && node seed.js
```

### 5. Start development servers

Terminal 1 (backend):
```bash
cd server && npm run dev
```

Terminal 2 (frontend):
```bash
cd client && npm run dev
```

### 6. Open the app

[http://localhost:5173](http://localhost:5173)

## Default Login Credentials

| Role            | Email                    | Password    |
|-----------------|--------------------------|-------------|
| Admin           | admin@filemap.dev        | Admin@123   |
| Project Manager | manager@filemap.dev      | Manager@123 |
| Developer       | dev@filemap.dev          | Dev@123     |
| RepoAnalyst     | analyst@filemap.dev      | Analyst@123 |
| Viewer          | viewer@filemap.dev       | Viewer@123  |

## Key Features

- **Login** → Role-aware redirect to appropriate dashboard.
- **Admin Dashboard** → User management table, role assignment, deactivation.
- **PM Dashboard** → Project table, sprint progress, activity feed.
- **Issue Tracker** → Filterable/sortable table, side panel, debounced search.
- **Kanban Board** → Real-time drag-and-drop, WebSocket sync, presence avatars.
- **File-Map Analyzer** → Force-directed graph, cycle detection, fan-in/out metrics.
- **Export System** → 7 artifact types, ZIP download, comparison preview.
- **Roles & Permissions** → Editable permission matrix per role.
- **Scan History** → Recharts trend chart, expandable history table.

## Running Tests

```bash
# Backend
cd server && npm test

# Frontend
cd client && npm test
```
