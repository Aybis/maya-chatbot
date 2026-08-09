import { Message } from '../types'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { User, Bot } from 'lucide-react'
import ArtifactRenderer from './ArtifactRenderer'

interface Props {
  message: Message
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-4 py-6 ${isUser ? 'bg-warm-100/50 rounded-2xl px-4' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-warm-300 text-warm-700' 
          : 'bg-amber-200 text-amber-700'
      }`}>
        {isUser ? <User size={16} /> : <span className="text-sm font-medium">M</span>}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium mb-1 ${isUser ? 'text-warm-700' : 'text-amber-700'}`}>
          {isUser ? 'You' : 'Maya'}
        </div>
        <div className="prose prose-warm max-w-none text-warm-800 leading-relaxed">
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
