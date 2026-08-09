import { Message } from '../types'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { User, Sparkle } from '@phosphor-icons/react'
import ArtifactRenderer from './ArtifactRenderer'
import Logo from './Logo'

interface Props {
  message: Message
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-4 py-6 ${isUser ? '' : ''}`}>
      {/* Avatar */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-2">
        {isUser ? <User size={16} weight="fill" className="text-ink" /> : <Logo size={22} glyphOnly />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-sm font-medium text-ink">
          {isUser ? 'You' : 'Maya'}
        </div>
        <div className="max-w-none leading-relaxed text-ink-2 prose prose-sm">
          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {message.content}
          </Markdown>
        </div>

        {/* Artifacts */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="mt-4 space-y-3">
            {message.artifacts.map((artifact, i) => (
              <ArtifactRenderer key={i} artifact={artifact} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}