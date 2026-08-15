import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { Car, Wrench, AlertTriangle, DollarSign, TrendingUp, Calendar } from 'lucide-react'

export default function DashboardPage() {
  const { api } = useAuth()
  const [data, setData] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/summary'),
      api.get('/api/dashboard/alerts'),
    ]).then(([s, a]) => {
      if (s.data.success) setData(s.data.data)
      if (a.data.success) setAlerts(a.data.data)
    }).finally(() => setLoading(false))
  }, [api])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Yükleniyor...</div>

  const stats = [
    { label: 'Toplam Araç', value: data?.totalVehicles || 0, icon: Car, color: '#007AFF' },
    { label: 'Aktif', value: data?.activeVehicles || 0, icon: TrendingUp, color: '#34C759' },
    { label: 'Bekleyen İş', value: data?.pendingTasks || 0, icon: Wrench, color: '#FF9500' },
    { label: 'Geciken', value: data?.delayedTasks || 0, icon: AlertTriangle, color: '#FF3B30' },
    { label: 'Bu Ay Gider', value: `₺${(data?.monthTotalExpense || 0).toLocaleString('tr-TR')}`, icon: DollarSign, color: '#AF52DE' },
    { label: 'Bu Yıl Gider', value: `₺${(data?.yearTotalExpense || 0).toLocaleString('tr-TR')}`, icon: Calendar, color: '#5856D6' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>📊 Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Icon size={24} color={s.color} />
                <span style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e' }}>{s.value}</div>
            </div>
          )
        })}
      </div>

      {/* Hızlı İşlemler */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚡ Hızlı İşlemler</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/vehicles/new" style={{ padding: '10px 18px', background: '#007AFF', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>➕ Yeni Araç</Link>
          <Link to="/vehicles" style={{ padding: '10px 18px', background: '#34C759', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>🚗 Araçlar</Link>
          <Link to="/tasks" style={{ padding: '10px 18px', background: '#FF9500', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>📋 İşler</Link>
          <Link to="/reports" style={{ padding: '10px 18px', background: '#AF52DE', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>📈 Raporlar</Link>
        </div>
      </div>

      {/* Uyarılar */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚠️ Yaklaşan Uyarılar</h2>
        {alerts?.upcomingInsurance?.length === 0 && alerts?.upcomingCasco?.length === 0 && alerts?.delayedTasks?.length === 0 ? (
          <p style={{ color: '#999' }}>Yaklaşan uyarı yok 🎉</p>
        ) : (
          <div>
            {alerts?.upcomingInsurance?.map((i) => (
              <div key={`ins-${i.id}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div><strong>{i.vehicle.plate}</strong> <span style={{ color: '#666' }}>— Sigorta bitiyor</span></div>
                <span style={{ color: '#FF3B30', fontWeight: 700, fontSize: 13 }}>{new Date(i.endDate).toLocaleDateString('tr-TR')}</span>
              </div>
            ))}
            {alerts?.delayedTasks?.map((t) => (
              <div key={`task-${t.id}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div><strong>{t.vehicle?.plate}</strong> <span style={{ color: '#666' }}>— {t.title}</span></div>
                <span style={{ color: '#FF3B30', fontWeight: 700, fontSize: 13 }}>GECİKTİ</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
