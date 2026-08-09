import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ChatCircle, Folder, Brain, MagicWand, ChartBar, GearSix, Plus, SignOut,
  CaretDown, Check, Users, Lightning, Building, NotePencil,
} from '@phosphor-icons/react'
import { useAuthStore } from '../stores/auth'
import Logo from './Logo'

const navItems = [
  { to: '/app', icon: ChatCircle, label: 'Chat' },
  { to: '/app/projects', icon: Folder, label: 'Projects' },
  { to: '/app/prompts', icon: NotePencil, label: 'Prompts' },
  { to: '/app/memory', icon: Brain, label: 'Memory' },
  { to: '/app/skills', icon: MagicWand, label: 'Skills' },
  { to: '/app/analytics', icon: ChartBar, label: 'Analytics' },
  { to: '/app/team', icon: Users, label: 'Team' },
  { to: '/app/providers', icon: Lightning, label: 'Providers' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const organizations = useAuthStore((s) => s.organizations)
  const activeOrgId = useAuthStore((s) => s.activeOrgId)
  const setActiveOrg = useAuthStore((s) => s.setActiveOrg)
  const [orgOpen, setOrgOpen] = useState(false)

  const activeOrg = organizations.find((o) => o.id === activeOrgId)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex w-64 flex-col border-r border-line bg-canvas h-full">
      {/* Brand + org switcher */}
      <div className="border-b border-line p-3">
        <div className="relative">
          <button
            onClick={() => setOrgOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Logo size={28} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {activeOrg?.name || 'Workspace'}
                </span>
                <span className="block truncate text-xs text-muted">{user?.username || 'Account'}</span>
              </span>
            </span>
            <CaretDown size={14} className="flex-shrink-0 text-muted-2" />
          </button>

          {orgOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl hairline bg-canvas p-1 lift">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => { setActiveOrg(org.id); setOrgOpen(false); window.location.reload() }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-surface"
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === activeOrgId && <Check size={14} className="text-accent" />}
                </button>
              ))}
              <button
                onClick={() => { setOrgOpen(false); navigate('/app/settings') }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface"
              >
                <Plus size={14} /> New workspace
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New chat */}
      <div className="p-3">
        <button
          onClick={() => navigate('/app')}
          className="flex w-full items-center gap-2 rounded-[6px] bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
        >
          <Plus size={16} weight="bold" />
          New chat
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-accent-soft font-medium text-accent-ink'
                  : 'text-muted hover:bg-surface hover:text-ink'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-line p-3">
        <div className="flex items-center justify-between rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{user?.username || 'User'}</div>
              <div className="truncate text-xs text-muted">{user?.email || ''}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
            title="Sign out"
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}