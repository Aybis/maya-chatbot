import { ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { api } from '../api/client'

interface Props {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setActiveOrg = useAuthStore((s) => s.setActiveOrg)
  const activeOrgId = useAuthStore((s) => s.activeOrgId)

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    // Ensure org state is fresh even with a stale token: fetch /auth/me and
    // set the active org if it's missing. Keeps the app consistent after login.
    api.getMe()
      .then((me) => {
        if (me.organizations?.length) {
          const current = me.organizations.find((o) => o.id === activeOrgId)
          if (!current) setActiveOrg(me.organizations[0].id)
        }
      })
      .catch(() => {})
  }, [accessToken, navigate, activeOrgId, setActiveOrg])

  if (!accessToken) return null

  return <>{children}</>
}