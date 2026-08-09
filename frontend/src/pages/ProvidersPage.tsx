import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Provider, type ModelCapabilities } from '../api/client'
import {
  Lightning, Plus, Trash, CheckCircle, Star, Eye, Waveform,
  Brain, FileArrowDown, Command, ArrowClockwise, Cpu,
} from '@phosphor-icons/react'

function CapabilitiesBadges({ caps }: { caps: ModelCapabilities }) {
  const items: Array<[boolean | undefined, string, any]> = [
    [caps.reasoning, 'Reasoning', Brain],
    [caps.vision, 'Vision', Eye],
    [caps.audio, 'Audio', Waveform],
    [caps.file_input, 'File', FileArrowDown],
    [caps.multimodal, 'Multimodal', Command],
  ]
  const active = items.filter(([on]) => on)
  if (active.length === 0) return <span className="text-xs text-muted-2">Text only</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map(([on, label, Icon]) => (
        <span key={label} className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
          <Icon size={11} /> {label}
        </span>
      ))}
    </div>
  )
}

export default function ProvidersPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', base_url: '', api_key: '' })
  const [error, setError] = useState('')

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.getProviders(),
  })

  const add = useMutation({
    mutationFn: () => api.addProvider(form),
    onSuccess: () => {
      setForm({ name: '', base_url: '', api_key: '' })
      setShowAdd(false)
      setError('')
      qc.invalidateQueries({ queryKey: ['providers'] })
      qc.invalidateQueries({ queryKey: ['models'] })
    },
    onError: (e: any) => setError(e.message || 'Could not add provider'),
  })

  const refresh = useMutation({
    mutationFn: (id: string) => api.refreshProviderModels(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] })
      qc.invalidateQueries({ queryKey: ['models'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteProvider(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  })

  const setDefault = useMutation({
    mutationFn: (id: string) => api.setDefaultProvider(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  })

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Providers</h1>
            <p className="mt-1 text-sm text-muted">
              Connect OpenAI-compatible providers. Models & capabilities are auto-discovered.
            </p>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-2 rounded-[6px] bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
          >
            <Plus size={16} weight="bold" /> Add provider
          </button>
        </div>

        {showAdd && (
          <div className="mb-8 rounded-2xl hairline bg-canvas p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink">New provider</h2>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Name (e.g. Shiteru, Surplus, OpenRouter)"
                className="w-full rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
              <input
                value={form.base_url}
                onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                placeholder="Base URL (e.g. https://shiteru.id/v1)"
                className="w-full rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
              <input
                type="password"
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                placeholder="API key"
                className="w-full rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
              {error && <p className="text-sm text-[#9F2F2D]">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => form.name && form.base_url && form.api_key && add.mutate()}
                  disabled={add.isPending}
                  className="rounded-[6px] bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-transform hover:scale-[0.98] disabled:opacity-50"
                >
                  {add.isPending ? 'Connecting...' : 'Connect & discover models'}
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="rounded-[6px] hairline px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl hairline bg-canvas p-8 text-center text-sm text-muted">Loading providers...</div>
        ) : providers.length === 0 ? (
          <div className="rounded-2xl hairline bg-canvas p-12 text-center">
            <Lightning size={32} className="mx-auto text-muted-2" />
            <h3 className="mt-4 text-sm font-semibold text-ink">No providers yet</h3>
            <p className="mt-1 text-sm text-muted">Add your first provider to start chatting with any model.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((p) => (
              <div key={p.id} className="rounded-2xl hairline bg-canvas p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-ink">{p.name}</h3>
                      {p.is_default && (
                        <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-ink">
                          <Star size={10} weight="fill" /> Default
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">{p.base_url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!p.is_default && (
                      <button
                        onClick={() => setDefault.mutate(p.id)}
                        className="rounded-lg hairline px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => refresh.mutate(p.id)}
                      className="flex items-center gap-1.5 rounded-lg hairline px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface"
                      title="Re-discover models"
                    >
                      <ArrowClockwise size={14} /> Refresh models
                    </button>
                    <button
                      onClick={() => remove.mutate(p.id)}
                      className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                      title="Delete provider"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>

                {p.models && p.models.length > 0 && (
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                      <Cpu size={13} /> {p.models.length} model{p.models.length !== 1 ? 's' : ''}
                    </div>
                    <div className="space-y-2">
                      {p.models.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-4 rounded-lg bg-surface px-3.5 py-2.5">
                          <span className="font-mono text-xs text-ink">{m.model_id}</span>
                          <CapabilitiesBadges caps={m.capabilities} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}