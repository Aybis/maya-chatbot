import { ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

interface Props {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
    }
  }, [accessToken, navigate])

  if (!accessToken) return null

  return <>{children}</>
}