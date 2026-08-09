import { useState } from 'react'
import { Code, FileText, Image as ImageIcon, BracketsCurly, Copy, Check } from '@phosphor-icons/react'

interface Artifact {
  type: 'code' | 'svg' | 'html' | 'json' | 'markdown'
  content: string
  language?: string
  title?: string
}

interface Props {
  artifact: Artifact
}

export default function ArtifactRenderer({ artifact }: Props) {
  const { type, content, language, title } = artifact

  if (type === 'code') {
    return (
      <div className="overflow-hidden rounded-xl border border-ink bg-ink">
        <div className="flex items-center justify-between bg-ink/90 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-canvas/70">
            <Code size={14} />
            <span className="font-mono text-xs">{title || language || 'code'}</span>
          </div>
          <CopyButton code={content} />
        </div>
        <pre className="overflow-x-auto p-4">
          <code className={`language-${language || 'text'} text-sm`}>{content}</code>
        </pre>
      </div>
    )
  }

  if (type === 'html') {
    return (
      <div className="overflow-hidden rounded-xl hairline">
        <div className="flex items-center gap-2 bg-surface px-4 py-2 text-sm text-muted">
          <FileText size={14} />
          <span>{title || 'HTML Preview'}</span>
        </div>
        <div className="bg-canvas p-4">
          <iframe
            srcDoc={content}
            className="h-64 w-full rounded-lg border-0"
            sandbox="allow-scripts"
            title="HTML Artifact"
          />
        </div>
      </div>
    )
  }

  if (type === 'svg') {
    return (
      <div className="overflow-hidden rounded-xl hairline">
        <div className="flex items-center gap-2 bg-surface px-4 py-2 text-sm text-muted">
          <ImageIcon size={14} />
          <span>{title || 'SVG'}</span>
        </div>
        <div
          className="flex items-center justify-center bg-canvas p-6"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    )
  }

  if (type === 'json') {
    return (
      <div className="overflow-hidden rounded-xl hairline">
        <div className="flex items-center gap-2 bg-surface px-4 py-2 text-sm text-muted">
          <BracketsCurly size={14} />
          <span>{title || 'JSON'}</span>
        </div>
        <pre className="overflow-x-auto bg-ink p-4 text-sm text-canvas/90">
          {JSON.stringify(JSON.parse(content), null, 2)}
        </pre>
      </div>
    )
  }

  return null
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-canvas/60 transition-colors hover:bg-canvas/10 hover:text-canvas"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}