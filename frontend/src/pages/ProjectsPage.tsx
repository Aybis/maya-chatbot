import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Project } from '../types'
import { Plus, Trash, Folder } from '@phosphor-icons/react'

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '' })

  const { data: projects, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  })

  const handleCreate = async () => {
    if (!form.name) return
    await api.createProject(form)
    setForm({ name: '', description: '', system_prompt: '' })
    setShowForm(false)
    refetch()
  }

  const handleDelete = async (id: string) => {
    await api.deleteProject(id)
    refetch()
  }

  const inputCls = "w-full rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Projects</h1>
            <p className="text-muted">Organize conversations with custom prompts</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
          >
            <Plus size={16} weight="bold" /> New Project
          </button>
        </div>

        {showForm && (
          <div className="mb-6 space-y-4 rounded-2xl hairline bg-canvas p-6">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Project name"
              className={inputCls}
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              rows={2}
              className={inputCls}
            />
            <textarea
              value={form.system_prompt}
              onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              placeholder="System prompt..."
              rows={4}
              className={inputCls}
            />
            <button onClick={handleCreate} className="rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]">
              Create Project
            </button>
          </div>
        )}

        <div className="space-y-2">
          {projects?.map((project: Project) => (
            <div key={project.id} className="flex items-center justify-between rounded-xl hairline bg-canvas p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <Folder size={18} weight="fill" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-medium text-ink">{project.name}</h3>
                  <p className="truncate text-sm text-muted">{project.description || 'No description'}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(project.id)} className="ml-3 rounded-md p-1.5 text-muted-2 transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D]">
                <Trash size={16} />
              </button>
            </div>
          ))}
          {projects && projects.length === 0 && (
            <div className="rounded-xl hairline bg-canvas p-8 text-center text-sm text-muted">
              No projects yet. Create one to organize your conversations.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}