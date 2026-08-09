import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../stores/auth'

interface UseWebSocketOptions {
  url: string
  onMessage: (data: any) => void
}

export function useWebSocket({ url, onMessage }: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    const accessToken = useAuthStore.getState().accessToken
    // Append the access token as a query param so the backend can authenticate.
    const sep = url.includes('?') ? '&' : '?'
    const wsUrl = accessToken ? `${url}${sep}token=${accessToken}` : url
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => setIsConnected(true)
    ws.current.onclose = () => setIsConnected(false)
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onMessageRef.current(data)
    }

    return () => ws.current?.close()
  }, [url])

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  return { send, isConnected }
}