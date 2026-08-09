import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuthStore } from '../stores/auth'
import { Building, Lightning, ArrowRight } from '@phosphor-icons/react'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const organizations = useAuthStore((s) => s.organizations)
  const activeOrgId = useAuthStore((s) => s.activeOrgId)
  const activeOrg = organizations.find((o) => o.id === activeOrgId)

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Settings</h1>

        {/* Account */}
        <div className="mb-4 rounded-xl hairline bg-canvas p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Account</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-lg font-semibold text-ink">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-medium text-ink">{user?.username}</div>
              <div className="text-sm text-muted">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="mb-4 rounded-xl hairline bg-canvas p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Workspace</h2>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-muted">
              <Building size={20} weight="fill" />
            </span>
            <div>
              <div className="font-medium text-ink">{activeOrg?.name || 'Workspace'}</div>
              <div className="text-sm text-muted capitalize">{activeOrg?.plan || 'free'} plan</div>
            </div>
          </div>
        </div>

        {/* Providers */}
        <div className="mb-4 rounded-xl hairline bg-canvas p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-[15px] font-semibold text-ink">
                <Lightning size={16} className="text-accent" weight="fill" /> Providers & Models
              </h2>
              <p className="text-sm text-muted">
                Connect OpenAI-compatible providers (base_url + api_key). Models & capabilities are auto-discovered.
              </p>
            </div>
            <Link
              to="/app/providers"
              className="flex flex-shrink-0 items-center gap-1.5 rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
            >
              Manage <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Brand */}
        <div className="flex items-center justify-center rounded-xl hairline bg-surface py-8">
          <div className="flex items-center gap-2 text-muted">
            <Logo size={22} />
            <span className="text-sm">Maya — Agentic AI Platform</span>
          </div>
        </div>
      </div>
    </div>
  )
}