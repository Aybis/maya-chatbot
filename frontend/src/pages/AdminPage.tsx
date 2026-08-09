import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api, type AdminSummary } from '../api/client'
import {
  Users, Key, Lightning, ChatCircle, NotePencil, Scroll, ShieldWarning,
  ArrowRight, CurrencyDollar, UserPlus,
} from '@phosphor-icons/react'

export default function AdminPage() {
  const navigate = useNavigate()
  const { data, error, isLoading } = useQuery<AdminSummary>({
    queryKey: ['admin-summary'],
    queryFn: () => api.getAdminSummary(),
    retry: false,
  })

  const forbidden =
    (error as Error)?.message?.includes('admin') || (error as Error)?.message?.includes('403')

  if (forbidden) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center rounded-2xl hairline bg-canvas p-12 text-center">
          <ShieldWarning size={32} className="mb-3 text-muted-2" />
          <h2 className="text-sm font-semibold text-ink">Admin access required</h2>
          <p className="mt-1 text-sm text-muted">
            Only organization owners and admins can open the console.
          </p>
        </div>
      </div>
    )
  }

  const cards = data
    ? [
        { label: 'Members', value: data.counts.members, icon: Users, to: '/app/team' },
        { label: 'Pending invites', value: data.counts.pending_invites, icon: UserPlus, to: '/app/team' },
        { label: 'Active API keys', value: data.counts.api_keys, icon: Key, to: '/app/api-keys' },
        { label: 'Providers', value: data.counts.providers, icon: Lightning, to: '/app/providers' },
        { label: 'Conversations', value: data.counts.conversations, icon: ChatCircle, to: '/app' },
        { label: 'Prompt templates', value: data.counts.prompts, icon: NotePencil, to: '/app/prompts' },
      ]
    : []

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Admin Console</h1>
          <p className="text-muted">Organization overview and controls</p>
        </div>

        {isLoading && <div className="p-8 text-center text-sm text-muted">Loading…</div>}

        {data && (
          <>
            {/* Org header */}
            <div className="mb-6 flex items-center justify-between rounded-2xl hairline bg-canvas p-6">
              <div>
                <h2 className="text-lg font-semibold text-ink">{data.organization.name}</h2>
                <p className="font-mono text-xs text-muted">@{data.organization.slug}</p>
              </div>
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium capitalize text-accent-ink">
                {data.organization.plan} plan
              </span>
            </div>

            {/* Usage strip */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl hairline bg-canvas p-4">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <CurrencyDollar size={14} /> Total spend
                </div>
                <div className="mt-1 text-xl font-semibold text-ink">
                  ${data.usage.total_cost.toFixed(4)}
                </div>
              </div>
              <div className="rounded-xl hairline bg-canvas p-4">
                <div className="text-xs text-muted">Prompt tokens</div>
                <div className="mt-1 text-xl font-semibold text-ink">
                  {data.usage.prompt_tokens.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl hairline bg-canvas p-4">
                <div className="text-xs text-muted">Completion tokens</div>
                <div className="mt-1 text-xl font-semibold text-ink">
                  {data.usage.completion_tokens.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cards.map(({ label, value, icon: Icon, to }) => (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  className="group flex flex-col rounded-xl hairline bg-canvas p-4 text-left transition-colors hover:bg-surface"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={16} className="text-muted" />
                    <ArrowRight size={14} className="text-muted-2 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-ink">{value}</div>
                  <div className="text-xs text-muted">{label}</div>
                </button>
              ))}
            </div>

            {/* Audit link */}
            <button
              onClick={() => navigate('/app/audit')}
              className="flex w-full items-center justify-between rounded-xl hairline bg-canvas p-4 text-left transition-colors hover:bg-surface"
            >
              <div className="flex items-center gap-3">
                <Scroll size={16} className="text-muted" />
                <div>
                  <div className="text-sm font-medium text-ink">Audit logs</div>
                  <div className="text-xs text-muted">
                    {data.counts.audit_events} security events recorded
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-2" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
