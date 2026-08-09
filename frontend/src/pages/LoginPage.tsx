import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { api } from '../api/client'
import Logo from '../components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.login(email, password)
      setAuth(
        { access_token: data.access_token, refresh_token: data.refresh_token },
        data.user,
        data.organizations,
      )
      navigate('/app')
    } catch (err) {
      setError('Invalid credentials or backend unreachable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Logo size={34} />
            <span className="text-lg font-semibold tracking-tight text-ink">Maya</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
          <p className="text-muted mt-2 text-sm">Sign in to your workspace</p>
        </div>

        <div className="rounded-2xl hairline bg-canvas p-7 lift">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-surface hairline rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-surface hairline rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-[#FDEBEC] text-[#9F2F2D] text-sm px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[6px] bg-ink py-2.5 text-sm font-medium text-canvas transition-transform hover:scale-[0.98] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-ink font-medium hover:opacity-80">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}