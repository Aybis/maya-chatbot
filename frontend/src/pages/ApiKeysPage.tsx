import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { ApiKey, ApiKeyCreated } from '../types'
import { Plus, Trash, Key, Copy, Check, X, Warning } from '@phosphor-icons/react'

export default function ApiKeysPage() {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: keys, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.getApiKeys(),
  })

  const handleCreate = async () => {
    if (!name.trim()) return
    const created = await api.createApiKey({ name: name.trim() })
    setNewKey(created)
    setName('')
    setShowForm(false)
    refetch()
  }

  const handleRevoke = async (id: string) => {
    await api.revokeApiKey(id)
    refetch()
  }

  const handleCopy = () => {
    if (!newKey) return
    navigator.clipboard.writeText(newKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const inputCls =
    'w-full rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft'

  const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : '—')

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">API Keys</h1>
            <p className="text-muted">Programmatic access for your customers (OpenAI-compatible)</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
          >
            <Plus size={16} weight="bold" /> New Key
          </button>
        </div>

        {/* One-time secret banner */}
        {newKey && (
          <div className="mb-6 rounded-2xl border border-[#E5D9B8] bg-[#FDF9EC] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Warning size={18} className="mt-0.5 flex-shrink-0 text-[#8A6D1A]" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[#5C4A0E]">
                    Save this key — it won't be shown again
                  </h3>
                  <p className="mt-0.5 text-xs text-[#8A6D1A]">
                    Store it somewhere secure. Maya only keeps a hash.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-canvas px-3 py-2 font-mono text-xs text-ink hairline">
                      {newKey.key}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 rounded-[6px] bg-ink px-3 py-2 text-xs font-medium text-canvas transition-transform hover:scale-[0.98]"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setNewKey(null)}
                className="rounded-md p-1 text-[#8A6D1A] transition-colors hover:bg-[#F5EDD3]"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="mb-6 space-y-4 rounded-2xl hairline bg-canvas p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">New API Key</h2>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-muted-2 hover:bg-surface">
                <X size={16} />
              </button>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Key name (e.g. production, staging, customer-acme)"
              className={inputCls}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
            >
              Create Key
            </button>
          </div>
        )}

        {/* Usage hint */}
        <div className="mb-6 rounded-xl hairline bg-canvas p-4">
          <p className="text-xs text-muted">
            Call the OpenAI-compatible endpoint with{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink">
              Authorization: Bearer &lt;key&gt;
            </code>{' '}
            at{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink">
              POST /v1/chat/completions
            </code>
          </p>
        </div>

        {/* List */}
        <div className="space-y-2">
          {keys?.map((k: ApiKey) => (
            <div
              key={k.id}
              className={`flex items-center justify-between rounded-xl hairline bg-canvas p-4 ${
                k.revoked ? 'opacity-50' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Key size={15} className="flex-shrink-0 text-muted" />
                  <h3 className="font-medium text-ink">{k.name}</h3>
                  {k.revoked && (
                    <span className="rounded bg-[#FDEBEC] px-1.5 py-0.5 text-[10px] font-medium text-[#9F2F2D]">
                      Revoked
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  {k.prefix}
                  {'•'.repeat(24)}
                </p>
                <p className="mt-1 text-xs text-muted-2">
                  Created {fmtDate(k.created_at)} · Last used {fmtDate(k.last_used_at)}
                </p>
              </div>
              {!k.revoked && (
                <button
                  onClick={() => handleRevoke(k.id)}
                  className="flex-shrink-0 rounded-md p-1.5 text-muted-2 transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                  title="Revoke key"
                >
                  <Trash size={16} />
                </button>
              )}
            </div>
          ))}
          {keys && keys.length === 0 && (
            <div className="rounded-xl hairline bg-canvas p-8 text-center text-sm text-muted">
              No API keys yet. Create one to give customers programmatic access.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
