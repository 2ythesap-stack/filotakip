import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Send, Bot, User, Loader2 } from 'lucide-react'

export default function AIChatPage() {
  const { api } = useAuth()
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Merhaba! Filo yönetim asistanınızım. Bana sorular sorabilirsiniz:\n\n• \"35 DC 2468'in bu yılki gideri ne kadar?\"\n• \"Bu ay hangi araçların sigortası bitiyor?\"\n• \"En çok masraf çıkaran araçlar\"\n• \"Toplam filo gideri ne kadar?\"" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const question = input.trim()
    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post('/api/ai/chat', { question })
      setMessages((m) => [...m, { role: 'bot', text: res.data.data?.answer || 'Bir hata oluştu.' }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'bot', text: '❌ Bir hata oluştu: ' + (err.response?.data?.message || err.message) }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>🤖 AI Asistan</h1>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.role === 'bot' ? '#007AFF' : '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {msg.role === 'bot' ? <Bot size={16} color="#fff" /> : <User size={16} color="#fff" />}
            </div>
            <div style={{ background: msg.role === 'bot' ? '#fff' : '#E5F0FF', borderRadius: 14, padding: '12px 16px', maxWidth: '80%', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, boxShadow: msg.role === 'bot' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#999', fontSize: 14 }}>
            <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Düşünüyor...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #e5e5ea' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Sorunuzu yazın..."
          style={{ flex: 1, padding: '12px 16px', border: '1px solid #ddd', borderRadius: 12, fontSize: 15, outline: 'none' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '12px 16px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
