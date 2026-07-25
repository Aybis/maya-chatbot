---
name: maya-chat-feature
description: Implement new features in Maya Chat. Use when adding functionality like memory, skills, analytics, auth, artifacts, or any new page/API.
---

# Maya Chat Feature Implementation

## Stack
- **Backend**: FastAPI + aiosqlite + WebSocket
- **Frontend**: React + Vite + TypeScript + Tailwind + Zustand
- **LLM**: Multi-provider (OpenAI, Anthropic, OpenRouter, 9Router, Surplus)

## Rules
1. All routes require JWT — users only see their own data
2. Streaming via WebSocket at `/ws/chat`
3. Token tracking on every LLM request
4. Frontend state via Zustand stores
5. Claude-style warm theme: cream backgrounds, amber accents

## Adding a Feature

### Backend
1. Schema in `app/models/schemas.py`
2. Route file in `app/api/routes/`
3. Register in `app/api/routes/__init__.py`
4. Service logic in `app/services/` if needed

### Frontend
1. Types in `src/types/index.ts`
2. API calls in `src/api/client.ts`
3. Page in `src/pages/`
4. Components in `src/components/`
5. Route in `src/App.tsx`
6. Nav link in `src/components/Sidebar.tsx`

### Protected Route Pattern
```python
from fastapi import Depends
from app.services.auth import get_current_user

@router.get("/")
async def list_items(user_id: str = Depends(get_current_user)):
    # Only returns current user's items
    ...
```

### API Client Pattern
```ts
// Token added automatically from localStorage
const token = localStorage.getItem('token')
fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Page Route Pattern
```tsx
// Wrap in ProtectedRoute
<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route path="/feature" element={<FeaturePage />} />
</Route>
```

## Key Files
| Task | Files |
|------|-------|
| New page | `src/pages/NewPage.tsx`, `src/App.tsx`, `Sidebar.tsx` |
| New API | `src/api/client.ts`, `backend/app/api/routes/new.py` |
| New type | `src/types/index.ts`, `backend/app/models/schemas.py` |
| New store | `src/stores/newStore.ts` |
| New service | `backend/app/services/new.py` |
