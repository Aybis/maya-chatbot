import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type ModelInfo } from '../api/client'
import { CaretDown, Check, Cpu, Eye, Waveform, Command } from '@phosphor-icons/react'

interface Props {
  value: string                    // selected model ref: "provider/model_id" or "model_id"
  onChange: (modelRef: string) => void
}

/** Model picker grouped by provider (expandable sections). */
export default function ModelPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const ref = useRef<HTMLDivElement>(null)

  const { data: models = [] } = useQuery<ModelInfo[]>({
    queryKey: ['models'],
    queryFn: () => api.getModels(),
  })

  // Group models by provider name, preserving order.
  const groups = useMemo(() => {
    const g: Record<string, ModelInfo[]> = {}
    for (const m of models) {
      (g[m.provider] ||= []).push(m)
    }
    return g
  }, [models])

  const providers = Object.keys(groups)

  // Auto-expand the provider that owns the current selection.
  useEffect(() => {
    if (!value || providers.length === 0) return
    const [prov] = value.split('/')
    setExpanded((e) => (e[prov] !== undefined ? e : { ...e, [prov]: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, models.length])

  // Close on outside click.
  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const display = value ? value.split('/').pop() : 'Select model'

  const select = (m: ModelInfo) => {
    onChange(`${m.provider}/${m.id}`)
    setOpen(false)
  }

  const CapIcon = ({ caps }: { caps: ModelInfo['capabilities'] }) => (
    <span className="ml-auto flex items-center gap-1 text-muted-2">
      {caps.vision && <Eye size={11} />}
      {caps.audio && <Waveform size={11} />}
      {caps.multimodal && <Command size={11} />}
    </span>
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg hairline bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface"
      >
        <Cpu size={13} className="text-muted" />
        <span className="max-w-[140px] truncate font-mono">{display}</span>
        <CaretDown size={12} className="text-muted-2" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 max-h-80 w-72 overflow-y-auto rounded-xl hairline bg-canvas p-1.5 lift">
          {providers.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted">
              No models. Add a provider first.
            </div>
          )}
          {providers.map((prov) => {
            const isOpen = expanded[prov] ?? providers.length === 1
            return (
              <div key={prov} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [prov]: !isOpen }))}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-surface"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <CaretDown
                      size={11}
                      className={`text-muted-2 transition-transform ${isOpen ? '' : '-rotate-90'}`}
                    />
                    {prov}
                  </span>
                  <span className="text-[10px] text-muted-2">{groups[prov].length}</span>
                </button>
                {isOpen && (
                  <div className="mt-0.5 space-y-px">
                    {groups[prov].map((m) => {
                      const refStr = `${m.provider}/${m.id}`
                      const selected = refStr === value || m.id === value
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => select(m)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 pl-6 text-left font-mono text-xs transition-colors ${
                            selected ? 'bg-accent-soft text-accent-ink' : 'text-ink hover:bg-surface'
                          }`}
                        >
                          <span className="truncate">{m.id}</span>
                          <CapIcon caps={m.capabilities} />
                          {selected && <Check size={12} className="flex-shrink-0 text-accent" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
