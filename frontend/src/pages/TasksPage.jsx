import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { AlertCircle, Clock, CheckCircle, PauseCircle, XCircle } from 'lucide-react'

const statusConfig = {
  pending: { label: 'Bekliyor', color: '#FF9500', icon: Clock },
  in_progress: { label: 'Devam Ediyor', color: '#007AFF', icon: Clock },
  on_hold: { label: 'Beklemede', color: '#FF9500', icon: PauseCircle },
  completed: { label: 'Tamamlandı', color: '#34C759', icon: CheckCircle },
  delayed: { label: 'Gecikti', color: '#FF3B30', icon: AlertCircle },
  cancelled: { label: 'İptal', color: '#999', icon: XCircle },
}

const priorityConfig = {
  low: { label: 'Düşük', bg: '#F0F0F0', color: '#666' },
  medium: { label: 'Orta', bg: '#FFF4E5', color: '#FF9500' },
  high: { label: 'Yüksek', bg: '#FFE5E5', color: '#FF3B30' },
  urgent: { label: 'Acil', bg: '#FFE5E5', color: '#C00' },
}

export default function TasksPage() {
  const { api } = useAuth()
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/tasks').then((res) => {
      if (res.data.success) setTasks(res.data.data)
    }).finally(() => setLoading(false))
  }, [api])

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Yükleniyor...</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>📋 İşler</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'in_progress', 'delayed', 'completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: filter === f ? '#007AFF' : '#f0f0f0', color: filter === f ? '#fff' : '#666' }}>
            {f === 'all' ? 'Tümü' : statusConfig[f]?.label || f}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map((t) => {
          const s = statusConfig[t.status] || statusConfig.pending
          const p = priorityConfig[t.priority] || priorityConfig.medium
          const Icon = s.icon
          return (
            <div key={t.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{t.title}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.bg, color: p.color }}>{p.label}</span>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.color + '15', color: s.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={12} /> {s.label}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.description}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#999' }}>
                {t.vehicle && <span>🚗 {t.vehicle.plate}</span>}
                {t.dueDate && <span>📅 {new Date(t.dueDate).toLocaleDateString('tr-TR')}</span>}
                {t.estimatedCost && <span>💰 ₺{Number(t.estimatedCost).toLocaleString('tr-TR')}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>İş bulunamadı</div>}
    </div>
  )
}
