import { useState, useRef } from 'react'
import { PaperPlaneRight } from '@phosphor-icons/react'

interface Props {
  onSend: (message: string, files?: File[]) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const target = e.target
    target.style.height = 'auto'
    target.style.height = Math.min(target.scrollHeight, 200) + 'px'
  }

  return (
    <div className="relative">
      <div className="rounded-2xl hairline bg-canvas focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-soft transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Maya..."
          rows={1}
          className="w-full resize-none bg-transparent px-4 py-3.5 text-ink placeholder:text-muted-2 focus:outline-none max-h-[200px]"
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2" />
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-canvas transition-transform hover:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted-2"
            aria-label="Send message"
          >
            <PaperPlaneRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}