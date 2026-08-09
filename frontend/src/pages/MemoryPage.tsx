import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Memory } from '../types'
import { Plus, Trash } from '@phosphor-icons/react'

export default function MemoryPage() {
  const [newMemory, setNewMemory] = useState('')
  const [category, setCategory] = useState('general')

  const { data: memories, refetch } = useQuery({
    queryKey: ['memories'],
    queryFn: () => api.getMemories(),
  })

  const handleAdd = async () => {
    if (!newMemory.trim()) return
    await api.createMemory({ content: newMemory, category })
    setNewMemory('')
    refetch()
  }

  const handleDelete = async (id: string) => {
    await api.deleteMemory(id)
    refetch()
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">Memory</h1>
        <p className="mb-6 text-muted">Maya will remember these details across conversations.</p>

        <div className="mb-8 flex gap-2">
          <input
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="Remember that I..."
            className="flex-1 rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-accent"
          >
            <option value="general">General</option>
            <option value="preferences">Preferences</option>
            <option value="personal">Personal</option>
            <option value="work">Work</option>
          </select>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98]"
          >
            <Plus size={16} weight="bold" /> Add
          </button>
        </div>

        <div className="space-y-2">
          {memories?.map((mem: Memory) => (
            <div key={mem.id} className="flex items-center justify-between rounded-xl hairline bg-canvas p-4">
              <div className="min-w-0">
                <span className="mr-2 rounded bg-surface-2 px-2 py-0.5 text-xs text-ink-2">{mem.category}</span>
                <span className="text-ink">{mem.content}</span>
              </div>
              <button onClick={() => handleDelete(mem.id)} className="ml-3 rounded-md p-1.5 text-muted-2 transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D]">
                <Trash size={16} />
              </button>
            </div>
          ))}
          {memories && memories.length === 0 && (
            <div className="rounded-xl hairline bg-canvas p-8 text-center text-sm text-muted">
              No memories yet. Save something Maya should remember.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}