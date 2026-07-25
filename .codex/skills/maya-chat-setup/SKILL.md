---
name: maya-chat-setup
description: Setup and run Maya Chat development environment. Use when starting work on the project, setting up dev environment, or onboarding new developers.
---

# Maya Chat Setup

## Quick Start

```bash
# Terminal 1: Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python setup_db.py
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 | API: http://localhost:8000

## Environment Config

```bash
cp backend/.env.example backend/.env
# Edit DEFAULT_PROVIDER, API keys, etc.
```

## Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, SQLite, WebSocket |
| Frontend | React, Vite, TypeScript, Tailwind |
| State | Zustand, React Query |
| Auth | JWT (PBKDF2 hashed passwords) |
| LLM | Multi-provider (OpenAI, Anthropic, OpenRouter, 9Router, Surplus) |

## Database

8 tables, all linked to `users.id`:
`users`, `projects`, `conversations`, `messages`, `memories`, `skills`, `files`, `token_usage`
