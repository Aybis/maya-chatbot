import { useState } from 'react'
import { Code, FileText, Image, Braces, Copy, Check } from 'lucide-react'

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
      <div className="rounded-xl overflow-hidden bg-warm-900 border border-warm-800">
        <div className="flex items-center justify-between px-4 py-2.5 bg-warm-800">
          <div className="flex items-center gap-2 text-sm text-warm-300">
            <Code size={14} />
            <span className="font-mono text-xs">{title || language || 'code'}</span>
          </div>
          <CopyButton code={content} />
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className={`language-${language || 'text'} text-sm`}>{content}</code>
        </pre>
      </div>
    )
  }

  if (type === 'html') {
    return (
      <div className="rounded-xl overflow-hidden border border-warm-200">
        <div className="bg-warm-100 px-4 py-2 flex items-center gap-2 text-sm text-warm-600">
          <FileText size={14} />
          <span>{title || 'HTML Preview'}</span>
        </div>
        <div className="bg-white p-4">
          <iframe
            srcDoc={content}
            className="w-full h-64 border-0 rounded-lg"
            sandbox="allow-scripts"
            title="HTML Artifact"
          />
        </div>
      </div>
    )
  }

  if (type === 'svg') {
    return (
      <div className="rounded-xl overflow-hidden border border-warm-200">
        <div className="bg-warm-100 px-4 py-2 flex items-center gap-2 text-sm text-warm-600">
          <Image size={14} />
          <span>{title || 'SVG'}</span>
        </div>
        <div
          className="bg-white p-6 flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    )
  }

  if (type === 'json') {
    return (
      <div className="rounded-xl overflow-hidden border border-warm-200">
        <div className="bg-warm-100 px-4 py-2 flex items-center gap-2 text-sm text-warm-600">
          <Braces size={14} />
          <span>{title || 'JSON'}</span>
        </div>
        <pre className="bg-warm-900 p-4 overflow-x-auto text-sm text-warm-200">
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
      className="text-xs text-warm-400 hover:text-warm-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-warm-700 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
