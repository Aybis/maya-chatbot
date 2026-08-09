# Maya Chat

A full-featured Claude-style AI chat application with multi-provider support, real-time streaming, and token usage tracking.

> **Maya is now a multi-tenant B2B SaaS platform.** See the docs below.

## 📚 Documentation (all in `docs/`)
| Doc | Purpose |
|-----|---------|
| [`docs/ARCHITECT.md`](docs/ARCHITECT.md) | Architecture, multi-tenancy model, design tokens |
| [`docs/AGENTS.md`](docs/AGENTS.md) | Guidance for AI coding agents working in this repo |
| [`docs/SKILLS.md`](docs/SKILLS.md) | Index of skills + design knowledge |
| [`docs/progress.md`](docs/progress.md) | **Live progress log** — read this to resume work |
| [`backend/README.md`](backend/README.md) | Backend setup, config, API reference, multi-tenancy |

**Skills** (single consolidated folder): [`skills/`](skills/) — `maya-chat-setup`, `maya-chat-feature`, `frontend-design`.

![Maya Chat](https://via.placeholder.com/800x400/f5a623/ffffff?text=Maya+Chat)

## Features

### Core Chat
- **Real-time streaming** via WebSocket
- **Multi-provider support** — OpenAI, Anthropic, OpenRouter, 9Router, Surplus Intelligence
- **Message history** with full conversation persistence
- **File upload** support for images, PDFs, and documents
- **Artifacts panel** — rendered code blocks, HTML previews, SVG, JSON

### Productivity
- **Projects** — organize conversations with custom system prompts
- **Memory** — persistent context that carries across conversations
- **Skills** — reusable prompt templates with `{{message}}` placeholder
- **Analytics dashboard** — token usage, cost breakdown, daily trends

### Token Tracking & Cost Management
- Per-request token logging with cost calculation
- Cost breakdown by provider and model
- Daily usage trends over 30 days
- 9Router integration for free provider routing and RTK compression

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python, FastAPI, SQLite, WebSocket |
| **Frontend** | React, Vite, TypeScript, Tailwind CSS |
| **State** | Zustand, React Query |
| **Styling** | Tailwind CSS with custom warm theme (Claude-inspired) |
| **LLM** | Multi-provider (OpenAI, Anthropic, OpenRouter, 9Router, Surplus) |

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
uvicorn app.main:app --reload
```

Server starts at http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App available at http://localhost:5173

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEFAULT_PROVIDER` | LLM provider (openai, anthropic, openrouter, 9router, surplus) | `openai` |
| `DEFAULT_MODEL` | Default model to use | `gpt-4o` |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `ANTHROPIC_API_KEY` | Anthropic API key | — |
| `OPENROUTER_API_KEY` | OpenRouter API key | — |
| `NINE_ROUTER_ENABLED` | Enable 9Router local proxy | `true` |
| `NINE_ROUTER_URL` | 9Router proxy URL | `http://localhost:20128` |
| `SURPLUS_INTELLIGENCE_ENABLED` | Enable Surplus Intelligence | `false` |
| `SURPLUS_INTELLIGENCE_API_KEY` | Surplus Intelligence API key | — |
| `TRACK_COSTS` | Enable token/cost tracking | `true` |
| `COST_ALERT_THRESHOLD` | Daily cost alert threshold ($) | `5.0` |

### 9Router Setup (Optional)

9Router routes requests to free providers and tracks usage.

```bash
# Run via npx
npx 9router

# Or via Docker
docker run -p 20128:20128 decolua/9router
```

Dashboard: http://localhost:20128

## API Endpoints

### REST

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/projects` | List projects |
| `POST` | `/api/v1/projects` | Create project |
| `DELETE` | `/api/v1/projects/{id}` | Delete project |
| `GET` | `/api/v1/chat/conversations` | List conversations |
| `POST` | `/api/v1/chat/conversations` | Create conversation |
| `GET` | `/api/v1/chat/conversations/{id}/messages` | Get messages |
| `DELETE` | `/api/v1/chat/conversations/{id}` | Delete conversation |
| `GET` | `/api/v1/memory` | List memories |
| `POST` | `/api/v1/memory` | Add memory |
| `DELETE` | `/api/v1/memory/{id}` | Delete memory |
| `GET` | `/api/v1/skills` | List skills |
| `POST` | `/api/v1/skills` | Create skill |
| `DELETE` | `/api/v1/skills/{id}` | Delete skill |
| `POST` | `/api/v1/files/upload` | Upload file |
| `GET` | `/api/v1/analytics/usage/today` | Today's usage |
| `GET` | `/api/v1/analytics/usage/daily` | Daily trends |
| `GET` | `/api/v1/analytics/usage/summary` | Usage summary |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `/ws/chat` | Real-time streaming chat |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite + TypeScript + Tailwind)            │
│  ┌────────────┬────────────────────────────────────────┐   │
│  │ Sidebar    │  Pages: Chat / Projects / Memory / ... │   │
│  │ Navigation │  ┌──────────────────────────────────┐  │   │
│  │ New Chat   │  │ Messages + Artifacts             │  │   │
│  │ Convos     │  └──────────────────────────────────┘  │   │
│  │            │  [Input Area]                           │   │
│  └────────────┴────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket + REST
┌─────────────────────────┴───────────────────────────────────┐
│  Backend (FastAPI + SQLite)                                 │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Chat     │ Memory   │ Skills   │ Analytics│             │
│  │ Service  │ Service  │ Service  │ Service  │             │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┘             │
│       │          │          │          │                    │
│  ┌────┴──────────┴──────────┴──────────┴────┐              │
│  │           LLM Service                     │              │
│  │  (OpenAI / Anthropic / OpenRouter /       │              │
│  │   9Router / Surplus Intelligence)         │              │
│  └───────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   projects   │────<│  conversations   │────<│   messages   │
└──────────────┘     └──────────────────┘     └──────────────┘
                            │                        │
                            │                        ▼
                            │                ┌──────────────┐
                            │                │ token_usage  │
                            │                └──────────────┘
                            ▼
                     ┌──────────────┐
                     │    files     │
                     └──────────────┘

┌──────────────┐     ┌──────────────┐
│   memories   │     │    skills    │
└──────────────┘     └──────────────┘
```

## Provider Pricing (Per Million Tokens)

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| OpenAI | GPT-4o | $2.50 | $10.00 |
| OpenAI | GPT-4o Mini | $0.15 | $0.60 |
| Anthropic | Claude Sonnet 4 | $3.00 | $15.00 |
| Anthropic | Claude Opus 4 | $15.00 | $75.00 |
| OpenRouter | Varies | $2.50* | $10.00* |
| 9Router | Free tier | $0.00 | $0.00 |
| Surplus | Spot market | $0.50* | $2.00* |

*Approximate. Actual pricing varies by model and market conditions.

## Project Structure

```
maya-chat/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── analytics.py      # Usage tracking endpoints
│   │   │   │   ├── chat.py           # Conversation CRUD
│   │   │   │   ├── files.py          # File upload
│   │   │   │   ├── memory.py         # Memory management
│   │   │   │   ├── projects.py       # Project CRUD
│   │   │   │   └── skills.py         # Skill templates
│   │   │   └── websocket/
│   │   │       └── chat.py           # WebSocket streaming
│   │   ├── core/
│   │   │   └── config.py             # Settings & env vars
│   │   ├── db/
│   │   │   └── database.py           # SQLite schema & connection
│   │   ├── models/
│   │   │   └── schemas.py            # Pydantic models
│   │   ├── services/
│   │   │   ├── llm.py                # Multi-provider LLM service
│   │   │   ├── memory.py             # Memory context builder
│   │   │   └── token_tracker.py      # Cost calculation & tracking
│   │   └── main.py                   # FastAPI app entry
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts             # REST API client
│   │   ├── components/
│   │   │   ├── ArtifactRenderer.tsx  # Code/SVG/HTML/JSON display
│   │   │   ├── ChatInput.tsx         # Message input area
│   │   │   ├── ChatMessage.tsx       # Individual message bubble
│   │   │   ├── CodeBlock.tsx         # Code with copy button
│   │   │   ├── Layout.tsx            # App shell
│   │   │   └── Sidebar.tsx           # Navigation sidebar
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts       # WebSocket hook
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.tsx     # Usage dashboard
│   │   │   ├── ChatPage.tsx          # Main chat interface
│   │   │   ├── MemoryPage.tsx        # Memory management
│   │   │   ├── ProjectsPage.tsx      # Project management
│   │   │   ├── SettingsPage.tsx      # App settings
│   │   │   └── SkillsPage.tsx        # Skill templates
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   ├── App.tsx                   # Routes
│   │   ├── index.css                 # Global styles + theme
│   │   └── main.tsx                  # React entry
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

## Development

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build

# Serve with any static server
npm run preview
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Claude](https://claude.ai) — UI/UX inspiration
- [FastAPI](https://fastapi.tiangolo.com) — Python web framework
- [React](https://react.dev) — UI library
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [OpenRouter](https://openrouter.ai) — Unified LLM API
- [9Router](https://github.com/decolua/9router) — Multi-provider routing

---

Built with ❤️ by [Aybis](https://github.com/Aybis)
