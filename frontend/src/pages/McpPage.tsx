import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { McpServer } from '../types'
import { Plus, Trash, PlugsConnected, X, Wrench, ArrowsClockwise } from '@phosphor-icons/react'

export default function McpPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', url: '' })
  const [toolsFor, setToolsFor] = useState<string | null>(null)

  const { data: servers, refetch } = useQuery({
    queryKey: ['mcp-servers'],
    queryFn: () => api.getMcpServers(),
  })

  const { data: toolsData, isLoading: toolsLoading, refetch: refetchTools } = useQuery({
    queryKey: ['mcp-tools', toolsFor],
    queryFn: () => api.getMcpTools(toolsFor!),
    enabled: !!toolsFor,
  })

  const handleCreate = async () => {
    if (!form.name.trim() || !form.url.trim()) return
    await api.createMcpServer({ name: form.name.trim(), url: form.url.trim() })
    setForm({ name: '', url: '' })
    setShowForm(false)
    refetch()
  }

  const handleDelete = async (id: string) => {
    await api.deleteMcpServer(id)
    if (toolsFor === id) setToolsFor(null)
    refetch()
  }

  const handleToggle = async (id: string) => {
    await api.toggleMcpServer(id)
    refetch()
  }

  const inputCls =
    'w-full rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft'

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">MCP Servers</h1>
            <p className="text-muted">Connect external tool servers (Model Context Protocol)</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
          >
            <Plus size={16} weight="bold" /> Add Server
          </button>
        </div>

        {showForm && (
          <div className="mb-6 space-y-4 rounded-2xl hairline bg-canvas p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">New MCP Server</h2>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-muted-2 hover:bg-surface">
                <X size={16} />
              </button>
            </div>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Server name (e.g. filesystem, web-search)"
              className={inputCls}
            />
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="Server URL (e.g. http://localhost:9000)"
              className={inputCls}
            />
            <button
              onClick={handleCreate}
              className="rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
            >
              Add Server
            </button>
          </div>
        )}

        <div className="space-y-2">
          {servers?.map((s: McpServer) => (
            <div key={s.id} className="rounded-xl hairline bg-canvas">
              <div className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PlugsConnected size={15} className="flex-shrink-0 text-muted" />
                    <h3 className="font-medium text-ink">{s.name}</h3>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        s.enabled ? 'bg-[#EDF3EC] text-[#346538]' : 'bg-surface-2 text-muted'
                      }`}
                    >
                      {s.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted">{s.url}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => setToolsFor(toolsFor === s.id ? null : s.id)}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-2 transition-colors hover:bg-surface hover:text-ink"
                    title="List tools"
                  >
                    <Wrench size={15} /> Tools
                  </button>
                  <button
                    onClick={() => handleToggle(s.id)}
                    className="rounded-md px-2 py-1.5 text-xs text-muted-2 transition-colors hover:bg-surface hover:text-ink"
                  >
                    {s.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                    title="Remove server"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              {/* Tools panel */}
              {toolsFor === s.id && (
                <div className="border-t border-line p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Tools</h4>
                    <button
                      onClick={() => refetchTools()}
                      className="rounded-md p-1 text-muted-2 transition-colors hover:bg-surface hover:text-ink"
                      title="Refresh"
                    >
                      <ArrowsClockwise size={14} />
                    </button>
                  </div>
                  {toolsLoading && <p className="text-xs text-muted">Loading tools…</p>}
                  {toolsData && toolsData.tools.length === 0 && (
                    <p className="text-xs text-muted">
                      No tools discovered. The server may not expose a /tools endpoint.
                    </p>
                  )}
                  <div className="space-y-1.5">
                    {toolsData?.tools.map((t) => (
                      <div key={t.name} className="rounded-lg bg-surface p-2.5">
                        <div className="font-mono text-xs font-medium text-ink">{t.name}</div>
                        {t.description && <div className="mt-0.5 text-xs text-muted">{t.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {servers && servers.length === 0 && (
            <div className="rounded-xl hairline bg-canvas p-8 text-center text-sm text-muted">
              No MCP servers yet. Connect one to give the assistant external tools.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
