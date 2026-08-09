import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { PromptTemplate } from '../types'
import { Plus, Trash, NotePencil, X, Copy, Check } from '@phosphor-icons/react'

const CATEGORIES = ['general', 'writing', 'coding', 'analysis', 'marketing', 'support', 'other']

export default function PromptsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'general',
    content: '',
    variables: '',
    is_public: false,
  })

  const { data: prompts, refetch } = useQuery({
    queryKey: ['prompts', filterCategory],
    queryFn: () => api.getPrompts(filterCategory || undefined),
  })

  const { data: categories } = useQuery({
    queryKey: ['prompt-categories'],
    queryFn: () => api.getPromptCategories(),
  })

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'general', content: '', variables: '', is_public: false })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.content) return
    const variables = form.variables
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

    if (editingId) {
      await api.updatePrompt(editingId, {
        name: form.name,
        description: form.description,
        category: form.category,
        content: form.content,
        variables,
        is_public: form.is_public,
      })
    } else {
      await api.createPrompt({
        name: form.name,
        description: form.description,
        category: form.category,
        content: form.content,
        variables,
        is_public: form.is_public,
      })
    }
    resetForm()
    refetch()
  }

  const handleEdit = (p: PromptTemplate) => {
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      content: p.content,
      variables: p.variables.join(', '),
      is_public: p.is_public,
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await api.deletePrompt(id)
    refetch()
  }

  const handleCopy = (p: PromptTemplate) => {
    navigator.clipboard.writeText(p.content)
    setCopiedId(p.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const inputCls =
    'w-full rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft'

  const allCategories = Array.from(new Set([...CATEGORIES, ...(categories || [])])).sort()

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Prompt Library</h1>
            <p className="text-muted">Reusable prompt templates for your team</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(!showForm)
            }}
            className="flex items-center gap-2 rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
          >
            <Plus size={16} weight="bold" /> New Prompt
          </button>
        </div>

        {/* Category filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !filterCategory ? 'bg-ink text-canvas' : 'bg-surface text-muted hover:bg-surface-2'
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat === filterCategory ? '' : cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filterCategory === cat ? 'bg-ink text-canvas' : 'bg-surface text-muted hover:bg-surface-2'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div className="mb-6 space-y-4 rounded-2xl hairline bg-canvas p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">
                {editingId ? 'Edit Prompt' : 'New Prompt'}
              </h2>
              <button onClick={resetForm} className="rounded-md p-1 text-muted-2 hover:bg-surface">
                <X size={16} />
              </button>
            </div>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Prompt name"
              className={inputCls}
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className={inputCls}
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls}
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Prompt content. Use {{variable}} for placeholders..."
              rows={5}
              className={inputCls}
            />
            <input
              value={form.variables}
              onChange={(e) => setForm({ ...form, variables: e.target.value })}
              placeholder="Variables (comma-separated, e.g. topic, tone, length)"
              className={inputCls}
            />
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                className="rounded border-line"
              />
              Share with organization
            </label>
            <button
              onClick={handleSubmit}
              className="rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
            >
              {editingId ? 'Save Changes' : 'Create Prompt'}
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-2">
          {prompts?.map((p: PromptTemplate) => (
            <div key={p.id} className="rounded-xl hairline bg-canvas p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <NotePencil size={15} className="flex-shrink-0 text-muted" />
                    <h3 className="font-medium text-ink">{p.name}</h3>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                      {p.category}
                    </span>
                    {p.is_public && (
                      <span className="rounded bg-[#EDF3EC] px-1.5 py-0.5 text-[10px] font-medium text-[#346538]">
                        Shared
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="mt-1 text-sm text-muted">{p.description}</p>
                  )}
                  <p className="mt-2 line-clamp-2 rounded-lg bg-surface p-2.5 font-mono text-xs text-ink">
                    {p.content}
                  </p>
                  {p.variables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.variables.map((v) => (
                        <span
                          key={v}
                          className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] text-accent-ink"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleCopy(p)}
                    className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-surface hover:text-ink"
                    title="Copy content"
                  >
                    {copiedId === p.id ? <Check size={16} className="text-[#346538]" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => handleEdit(p)}
                    className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-surface hover:text-ink"
                    title="Edit"
                  >
                    <NotePencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                    title="Delete"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {prompts && prompts.length === 0 && (
            <div className="rounded-xl hairline bg-canvas p-8 text-center text-sm text-muted">
              No prompts yet. Create a reusable template for your team.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
