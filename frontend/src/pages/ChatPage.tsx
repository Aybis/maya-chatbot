import { useState, useRef, useEffect } from 'react'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'
import ModelPicker from '../components/ModelPicker'
import { useWebSocket } from '../hooks/useWebSocket'
import { Message } from '../types'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import Logo from '../components/Logo'

function wsHost(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/ws/chat`
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string>('')
  const [isTyping, setIsTyping] = useState(false)
  const [model, setModel] = useState<string>(
    () => localStorage.getItem('chat_model') || ''
  )
  const orgId = useAuthStore((s) => s.activeOrgId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleModelChange = (m: string) => {
    setModel(m)
    localStorage.setItem('chat_model', m)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!orgId) return
    // Create a new conversation on mount (org-scoped)
    api.createConversation({ title: 'New Chat', model: model || '' }).then((conv) => {
      setConversationId(conv.id)
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId])

  const { send } = useWebSocket({
    url: wsHost(),
    onMessage: (data) => {
      if (data.type === 'token') {
        setIsTyping(true)
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: last.content + data.content }]
          }
          return [...prev, {
            id: Date.now().toString(),
            conversation_id: conversationId,
            role: 'assistant',
            content: data.content,
            artifacts: [],
            attachments: [],
            created_at: new Date().toISOString(),
          }]
        })
      } else if (data.type === 'done') {
        setIsTyping(false)
      } else if (data.type === 'error') {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          conversation_id: conversationId,
          role: 'assistant',
          content: `Error: ${data.content}`,
          artifacts: [],
          attachments: [],
          created_at: new Date().toISOString(),
        }])
        setIsTyping(false)
      }
    },
  })

  const handleSend = (content: string, files: File[] = []) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      conversation_id: conversationId,
      role: 'user',
      content,
      artifacts: [],
      attachments: files.map((f) => ({ id: '', filename: f.name, mime_type: f.type, size: f.size })),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    send({
      conversation_id: conversationId,
      message: content,
      model: model || '',
      attachments: userMsg.attachments,
    })
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <div className="max-w-lg text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
                <Logo size={40} />
              </div>
              <h2 className="mb-3 text-3xl font-semibold tracking-tight text-ink">
                Maya
              </h2>
              <p className="text-lg text-muted">
                How can I help you today?
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
            {isTyping && (
              <div className="flex gap-4 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2">
                  <Logo size={22} glyphOnly />
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <span>Maya is thinking</span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-2" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-2" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-2" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-line bg-canvas p-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex items-center justify-between">
            <ModelPicker value={model} onChange={handleModelChange} />
            {model && (
              <span className="font-mono text-[11px] text-muted-2">{model}</span>
            )}
          </div>
          <ChatInput onSend={handleSend} />
          <p className="mt-3 text-center text-xs text-muted-2">
            Maya can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}