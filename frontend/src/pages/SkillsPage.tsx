import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Skill } from '../types'
import { Plus, Trash, MagicWand } from '@phosphor-icons/react'

export default function SkillsPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', prompt_template: '' })

  const { data: skills, refetch } = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.getSkills(),
  })

  const handleCreate = async () => {
    if (!form.name || !form.prompt_template) return
    await api.createSkill(form)
    setForm({ name: '', description: '', prompt_template: '' })
    setShowForm(false)
    refetch()
  }

  const handleDelete = async (id: string) => {
    await api.deleteSkill(id)
    refetch()
  }

  const inputCls = "w-full rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Skills</h1>
            <p className="text-muted">Custom prompt templates for recurring tasks</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
          >
            <Plus size={16} weight="bold" /> New Skill
          </button>
        </div>

        {showForm && (
          <div className="mb-6 space-y-4 rounded-2xl hairline bg-canvas p-6">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Skill name"
              className={inputCls}
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className={inputCls}
            />
            <textarea
              value={form.prompt_template}
              onChange={(e) => setForm({ ...form, prompt_template: e.target.value })}
              placeholder="Use {{message}} where the user's input should go..."
              rows={4}
              className={inputCls}
            />
            <button onClick={handleCreate} className="rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]">
              Create Skill
            </button>
          </div>
        )}

        <div className="space-y-2">
          {skills?.map((skill: Skill) => (
            <div key={skill.id} className="flex items-center justify-between rounded-xl hairline bg-canvas p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MagicWand size={15} className="text-muted" />
                  <h3 className="font-medium text-ink">{skill.name}</h3>
                </div>
                <p className="mt-0.5 text-sm text-muted">{skill.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs ${skill.is_active ? 'bg-[#EDF3EC] text-[#346538]' : 'bg-surface-2 text-muted'}`}>
                  {skill.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => handleDelete(skill.id)} className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D]">
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
          {skills && skills.length === 0 && (
            <div className="rounded-xl hairline bg-canvas p-8 text-center text-sm text-muted">
              No skills yet. Create a reusable prompt template.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}