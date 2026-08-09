import type { Project, Conversation, Message, Memory, Skill, PromptTemplate, ApiKey, ApiKeyCreated, AuditLog } from '../types'
import { useAuthStore, type User, type Organization } from '../stores/auth'

const BASE_URL = '/api/v1'

function orgHeader(): Record<string, string> {
  const { activeOrgId } = useAuthStore.getState()
  return activeOrgId ? { 'X-Org-Id': activeOrgId } : {}
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      logout()
      window.location.href = '/login'
      return null
    }
    const data = await res.json()
    setTokens(data.access_token, data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

async function fetchApi<T>(path: string, options?: RequestInit, _retry = false): Promise<T> {
  const { accessToken } = useAuthStore.getState()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...orgHeader(),
      ...options?.headers,
    },
  })

  if (res.status === 401 && !_retry) {
    const newToken = await refreshAccessToken()
    if (newToken) return fetchApi<T>(path, options, true)
    useAuthStore.getState().logout()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    // Try to surface the backend's detail message (e.g. "Invalid API key...")
    let msg = `API error: ${res.status}`
    try {
      const body = await res.json()
      if (body?.detail) msg = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch { /* non-JSON body */ }
    throw new Error(msg)
  }
  return res.json()
}

export const api = {
  // ── Auth ──
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error(`Login failed: ${res.status}`)
    return res.json()
  },

  register: async (email: string, username: string, password: string, orgName?: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, org_name: orgName }),
    })
    if (!res.ok) throw new Error(`Registration failed: ${res.status}`)
    return res.json()
  },

  getMe: () => fetchApi<User & { organizations: Organization[] }>('/auth/me'),

  // ── Organizations ──
  getOrganizations: () => fetchApi<Organization[]>('/auth/organizations'),
  createOrganization: (name: string) => fetchApi<Organization>('/auth/organizations', { method: 'POST', body: JSON.stringify({ name }) }),
  getOrgMembers: (orgId: string) => fetchApi<OrgMember[]>(`/auth/organizations/${orgId}/members`),
  inviteMember: (orgId: string, email: string, role: string) =>
    fetchApi(`/auth/organizations/${orgId}/invitations`, { method: 'POST', body: JSON.stringify({ email, role }) }),
  updateMemberRole: (orgId: string, userId: string, role: string) =>
    fetchApi(`/auth/organizations/${orgId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ role }) }),
  removeMember: (orgId: string, userId: string) =>
    fetchApi(`/auth/organizations/${orgId}/members/${userId}`, { method: 'DELETE' }),

  // ── Providers ──
  getProviders: () => fetchApi<Provider[]>('/providers/'),
  addProvider: (data: { name: string; base_url: string; api_key: string }) =>
    fetchApi<Provider>('/providers/', { method: 'POST', body: JSON.stringify(data) }),
  refreshProviderModels: (providerId: string) =>
    fetchApi(`/providers/${providerId}/models/refresh`, { method: 'POST' }),
  deleteProvider: (providerId: string) =>
    fetchApi(`/providers/${providerId}`, { method: 'DELETE' }),
  setDefaultProvider: (providerId: string) =>
    fetchApi(`/providers/${providerId}/default`, { method: 'POST' }),
  getModels: () => fetchApi<ModelInfo[]>('/providers/models'),

  // ── Projects ──
  getProjects: () => fetchApi<Project[]>('/projects/'),
  createProject: (data: Partial<Project>) => fetchApi<Project>('/projects/', { method: 'POST', body: JSON.stringify(data) }),
  deleteProject: (id: string) => fetchApi(`/projects/${id}`, { method: 'DELETE' }),

  // ── Conversations ──
  getConversations: (projectId?: string) => fetchApi<Conversation[]>(`/chat/conversations/${projectId ? `?project_id=${projectId}` : ''}`),
  createConversation: (data: Partial<Conversation>) => fetchApi<Conversation>('/chat/conversations/', { method: 'POST', body: JSON.stringify(data) }),
  deleteConversation: (id: string) => fetchApi(`/chat/conversations/${id}`, { method: 'DELETE' }),

  // ── Messages ──
  getMessages: (conversationId: string) => fetchApi<Message[]>(`/chat/conversations/${conversationId}/messages`),

  // ── Memories ──
  getMemories: () => fetchApi<Memory[]>('/memory/'),
  createMemory: (data: Partial<Memory>) => fetchApi<Memory>('/memory/', { method: 'POST', body: JSON.stringify(data) }),
  deleteMemory: (id: string) => fetchApi(`/memory/${id}`, { method: 'DELETE' }),

  // ── Skills ──
  getSkills: () => fetchApi<Skill[]>('/skills/'),
  createSkill: (data: Partial<Skill>) => fetchApi<Skill>('/skills/', { method: 'POST', body: JSON.stringify(data) }),
  deleteSkill: (id: string) => fetchApi(`/skills/${id}`, { method: 'DELETE' }),

  // ── Prompts ──
  getPrompts: (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : ''
    return fetchApi<PromptTemplate[]>(`/prompts/${params}`)
  },
  getPromptCategories: () => fetchApi<string[]>('/prompts/categories'),
  createPrompt: (data: Partial<PromptTemplate>) => fetchApi<PromptTemplate>('/prompts/', { method: 'POST', body: JSON.stringify(data) }),
  updatePrompt: (id: string, data: Partial<PromptTemplate>) => fetchApi<PromptTemplate>(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePrompt: (id: string) => fetchApi(`/prompts/${id}`, { method: 'DELETE' }),

  // ── API Keys ──
  getApiKeys: () => fetchApi<ApiKey[]>('/api-keys/'),
  createApiKey: (data: { name: string; expires_at?: string | null }) =>
    fetchApi<ApiKeyCreated>('/api-keys/', { method: 'POST', body: JSON.stringify(data) }),
  revokeApiKey: (id: string) => fetchApi(`/api-keys/${id}`, { method: 'DELETE' }),

  // ── Audit Logs ──
  getAuditLogs: (action?: string, limit = 100, offset = 0) => {
    const params = new URLSearchParams()
    if (action) params.set('action', action)
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    return fetchApi<AuditLog[]>(`/audit/?${params}`)
  },
  getAuditActions: () => fetchApi<string[]>('/audit/actions'),

  // ── Admin ──
  getAdminSummary: () => fetchApi<AdminSummary>('/admin/summary'),

  // ── Files ──
  uploadFile: (file: File, conversationId?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (conversationId) formData.append('conversation_id', conversationId)
    const { accessToken, activeOrgId } = useAuthStore.getState()
    return fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(activeOrgId ? { 'X-Org-Id': activeOrgId } : {}),
      },
    })
  },

  // ── Analytics ──
  getAnalyticsToday: () => fetchApi<UsageSummary>('/analytics/usage/today'),
  getAnalyticsDaily: (days: number) => fetchApi<DailyUsage[]>(`/analytics/usage/daily?days=${days}`),
  getAnalyticsSummary: (start?: string, end?: string) => {
    const params = new URLSearchParams()
    if (start) params.set('start_date', start)
    if (end) params.set('end_date', end)
    return fetchApi<UsageSummary>(`/analytics/usage/summary?${params}`)
  },
}

export interface UsageSummary {
  total_requests: number
  total_prompt_tokens: number
  total_completion_tokens: number
  total_cost: number
  by_provider: Record<string, {
    requests: number
    prompt_tokens: number
    completion_tokens: number
    cost: number
  }>
}

export interface AdminSummary {
  organization: { id: string; name: string; slug: string; plan: string }
  counts: {
    members: number
    pending_invites: number
    api_keys: number
    providers: number
    conversations: number
    prompts: number
    audit_events: number
  }
  usage: {
    total_cost: number
    prompt_tokens: number
    completion_tokens: number
  }
}

export interface DailyUsage {
  date: string
  cost: number
  tokens: number
}

export interface OrgMember {
  membership_id: string
  user_id: string
  email: string
  username: string
  avatar_url?: string
  role: string
  joined_at: string
}

export interface Provider {
  id: string
  name: string
  base_url: string
  enabled: boolean
  is_default: boolean
  created_at: string
  models?: ProviderModel[]
}

export interface ProviderModel {
  id: string
  model_id: string
  name: string
  capabilities: ModelCapabilities
}

export interface ModelCapabilities {
  reasoning?: boolean
  vision?: boolean
  multimodal?: boolean
  audio?: boolean
  file_input?: boolean
  tool_use?: boolean
  context_window?: number | null
  max_output?: number | null
  modalities?: string[]
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  provider_id: string
  capabilities: ModelCapabilities
}