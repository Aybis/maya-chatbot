---
name: maya-chat-setup
description: Quick setup guide for Maya Chat development. Use when starting work on the project, setting up dev environment, or onboarding.
---

# Maya Chat Setup

## Quick Start

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python setup_db.py
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 | API: http://localhost:8000

## Environment

Copy `backend/.env.example` to `backend/.env` and configure:

```bash
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-4o
OPENAI_API_KEY=sk-...
```

## Project Structure

```
maya-chat/
├── backend/          # FastAPI + SQLite
│   ├── app/
│   │   ├── api/routes/    # REST endpoints
│   │   ├── api/websocket/ # WebSocket chat
│   │   ├── core/          # Config
│   │   ├── db/            # Database
│   │   ├── models/        # Schemas
│   │   └── services/      # LLM, auth, memory
│   └── requirements.txt
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── components/    # UI components
        ├── pages/         # Route pages
        ├── stores/        # Zustand state
        └── api/           # API client
```

## Database Schema

8 tables: `users`, `projects`, `conversations`, `messages`, `memories`, `skills`, `files`, `token_usage`

All tables link to `users.id` for multi-tenant isolation.
