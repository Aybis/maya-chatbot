---
name: maya-chat-feature
description: Add features to Maya Chat. Use when implementing new functionality like memory, skills, analytics, auth, or artifacts.
---

# Maya Chat Feature Implementation

## Tech Stack
- **Backend**: FastAPI + aiosqlite + WebSocket
- **Frontend**: React + Vite + TypeScript + Tailwind + Zustand
- **LLM**: Multi-provider (OpenAI, Anthropic, OpenRouter, 9Router, Surplus)

## Architecture Rules
1. All routes require `user_id` from JWT — users only see their own data
2. Streaming via WebSocket at `/ws/chat`
3. Token tracking on every LLM request (cost calculated per-model)
4. Frontend state via Zustand stores (`auth.ts`, etc.)
5. Claude-style warm theme: cream backgrounds, amber accents

## Adding a New Feature

### Backend
1. Add schema in `app/models/schemas.py`
2. Create route file in `app/api/routes/`
3. Register in `app/api/routes/__init__.py`
4. Add service logic in `app/services/` if needed

### Frontend
1. Add types in `src/types/index.ts`
2. Add API calls in `src/api/client.ts`
3. Create page in `src/pages/`
4. Create components in `src/components/`
5. Register route in `src/App.tsx`
6. Add nav link in `src/components/Sidebar.tsx`

### Pattern for Protected Routes
```python
from fastapi import Depends
from app.services.auth import get_current_user

@router.get("/")
async def list_items(user_id: str = Depends(get_current_user)):
    # Only returns current user's items
    ...
```

### Pattern for API Client
```ts
// In client.ts — token added automatically
const token = localStorage.getItem('token')
fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Pattern for Page with Auth
```tsx
// Wrap route in ProtectedRoute
<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route path="/feature" element={<FeaturePage />} />
</Route>
```

## Key Files to Modify
| Task | Files |
|------|-------|
| New page | `src/pages/NewPage.tsx`, `src/App.tsx`, `Sidebar.tsx` |
| New API | `src/api/client.ts`, `backend/app/api/routes/new.py` |
| New type | `src/types/index.ts`, `backend/app/models/schemas.py` |
| New store | `src/stores/newStore.ts` |
| New service | `backend/app/services/new.py` |
