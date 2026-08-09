import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { AuditLog } from '../types'
import { Scroll, ShieldWarning } from '@phosphor-icons/react'

const ACTION_COLORS: Record<string, string> = {
  'auth.login': 'bg-[#E1F3FE] text-[#1F6C9F]',
  'auth.register': 'bg-[#E1F3FE] text-[#1F6C9F]',
  'org.create': 'bg-[#FBF3DB] text-[#956400]',
  'member.invite': 'bg-[#EDF3EC] text-[#346538]',
  'member.role_change': 'bg-[#F0E8FB] text-[#5B3A8E]',
  'member.remove': 'bg-[#FDEBEC] text-[#9F2F2D]',
  'api_key.create': 'bg-[#FBF3DB] text-[#956400]',
  'api_key.revoke': 'bg-[#FDEBEC] text-[#9F2F2D]',
  'provider.add': 'bg-[#EDF3EC] text-[#346538]',
  'provider.remove': 'bg-[#FDEBEC] text-[#9F2F2D]',
}

export default function AuditLogsPage() {
  const [filterAction, setFilterAction] = useState('')

  const { data: logs, error, isLoading } = useQuery({
    queryKey: ['audit-logs', filterAction],
    queryFn: () => api.getAuditLogs(filterAction || undefined),
    retry: false,
  })

  const { data: actions } = useQuery({
    queryKey: ['audit-actions'],
    queryFn: () => api.getAuditActions(),
    retry: false,
  })

  const forbidden = (error as Error)?.message?.includes('admin') || (error as Error)?.message?.includes('403')

  const fmtTime = (s: string) => new Date(s).toLocaleString()

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Audit Logs</h1>
          <p className="text-muted">Security-relevant activity across your organization</p>
        </div>

        {forbidden ? (
          <div className="flex flex-col items-center rounded-2xl hairline bg-canvas p-12 text-center">
            <ShieldWarning size={32} className="mb-3 text-muted-2" />
            <h2 className="text-sm font-semibold text-ink">Admin access required</h2>
            <p className="mt-1 text-sm text-muted">
              Only organization owners and admins can view audit logs.
            </p>
          </div>
        ) : (
          <>
            {/* Action filter */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFilterAction('')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  !filterAction ? 'bg-ink text-canvas' : 'bg-surface text-muted hover:bg-surface-2'
                }`}
              >
                All
              </button>
              {actions?.map((a) => (
                <button
                  key={a}
                  onClick={() => setFilterAction(a === filterAction ? '' : a)}
                  className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                    filterAction === a ? 'bg-ink text-canvas' : 'bg-surface text-muted hover:bg-surface-2'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl hairline bg-canvas">
              {isLoading && (
                <div className="p-8 text-center text-sm text-muted">Loading…</div>
              )}
              {!isLoading && logs && logs.length === 0 && (
                <div className="flex flex-col items-center p-12 text-center">
                  <Scroll size={28} className="mb-3 text-muted-2" />
                  <p className="text-sm text-muted">No audit events recorded yet.</p>
                </div>
              )}
              {logs && logs.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface">
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">Time</th>
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">Action</th>
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">Resource</th>
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">Actor</th>
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: AuditLog) => (
                      <tr key={log.id} className="border-b border-line last:border-0 hover:bg-surface">
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">
                          {fmtTime(log.created_at)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
                              ACTION_COLORS[log.action] || 'bg-surface-2 text-muted'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted">
                          {log.resource_type ? (
                            <span>
                              {log.resource_type}
                              {log.resource_id && (
                                <span className="ml-1 font-mono text-muted-2">
                                  {log.resource_id.slice(0, 8)}…
                                </span>
                              )}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted">
                          {log.user_id ? `${log.user_id.slice(0, 8)}…` : 'system'}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-2.5 font-mono text-[11px] text-muted-2">
                          {Object.keys(log.metadata || {}).length > 0
                            ? JSON.stringify(log.metadata)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
