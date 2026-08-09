import { useState } from 'react'
import { Copy, Check } from '@phosphor-icons/react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export default function CodeBlock({ code, language = 'text', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink bg-ink">
      <div className="flex items-center justify-between bg-ink/90 px-4 py-2">
        <span className="font-mono text-xs text-canvas/60">{filename || language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-canvas/60 transition-colors hover:text-canvas"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  )
}