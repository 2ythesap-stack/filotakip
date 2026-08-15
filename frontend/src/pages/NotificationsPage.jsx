import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Bell, AlertTriangle, Info } from 'lucide-react'
import { EmptyState, Loading, cardStyle } from '../components/FormUI'

export default function NotificationsPage() {
  const { api } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/api/notifications').then((res) => {
      if (res.data.success) setItems(res.data.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [api])

  const markRead = async (id) => {
    await api.put(`/api/notifications/${id}/read`)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  if (loading) return <Loading />

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>🔔 Bildirimler</h1>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((n) => (
          <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
            style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, cursor: n.isRead ? 'default' : 'pointer', opacity: n.isRead ? 0.6 : 1, borderLeft: `4px solid ${n.notificationType === 'urgent' ? '#FF3B30' : '#FF9500'}` }}>
            {n.notificationType === 'urgent' ? <AlertTriangle size={18} color="#FF3B30" /> : <Info size={18} color="#FF9500" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>{new Date(n.createdAt).toLocaleString('tr-TR')}</div>
            </div>
            {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#007AFF', flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
      {items.length === 0 && <EmptyState><Bell size={32} style={{ marginBottom: 8, opacity: 0.3 }} /><br />Bildirim bulunamadı</EmptyState>}
    </div>
  )
}
