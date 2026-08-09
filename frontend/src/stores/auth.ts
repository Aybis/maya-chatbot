import { create } from 'zustand'

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  organizations: Organization[]
  activeOrgId: string | null
  setAuth: (tokens: { access_token: string; refresh_token: string }, user: User, organizations?: Organization[]) => void
  setActiveOrg: (orgId: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  organizations: JSON.parse(localStorage.getItem('organizations') || '[]'),
  activeOrgId: localStorage.getItem('active_org_id'),
  setAuth: (tokens, user, organizations = []) => {
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('organizations', JSON.stringify(organizations))
    const activeOrgId = organizations[0]?.id || null
    if (activeOrgId) localStorage.setItem('active_org_id', activeOrgId)
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user,
      organizations,
      activeOrgId,
    })
  },
  setActiveOrg: (orgId) => {
    localStorage.setItem('active_org_id', orgId)
    set({ activeOrgId: orgId })
  },
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    set({ accessToken, refreshToken })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('organizations')
    localStorage.removeItem('active_org_id')
    set({ accessToken: null, refreshToken: null, user: null, organizations: [], activeOrgId: null })
  },
}))

/** Backwards-compat alias so ProtectedRoute keeps working. */
export const useToken = () => useAuthStore((s) => s.accessToken)