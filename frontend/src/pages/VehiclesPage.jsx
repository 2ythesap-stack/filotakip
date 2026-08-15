import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { Search, Plus, ChevronRight } from 'lucide-react'

const statusMap = {
  active: { label: 'Aktif', bg: '#E5F9EE', color: '#34C759' },
  in_service: { label: 'Serviste', bg: '#FFF4E5', color: '#FF9500' },
  out_of_use: { label: 'Kullanım Dışı', bg: '#F0F0F0', color: '#999' },
  sold: { label: 'Satıldı', bg: '#F0E5FF', color: '#AF52DE' },
}

export default function VehiclesPage() {
  const { api } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/vehicles').then((res) => {
      if (res.data.success) setVehicles(res.data.data)
    }).finally(() => setLoading(false))
  }, [api])

  const filtered = vehicles.filter((v) =>
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.brand.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Yükleniyor...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>🚗 Araçlar</h1>
        <Link to="/vehicles/new" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#007AFF', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          <Plus size={18} /> Yeni Araç
        </Link>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
        <input type="text" placeholder="Plaka, marka veya model ara..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #ddd', borderRadius: 12, fontSize: 15, outline: 'none' }} />
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map((v) => {
          const s = statusMap[v.status] || statusMap.out_of_use
          return (
            <Link key={v.id} to={`/vehicles/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#007AFF' }}>{v.plate}</div>
                  <div style={{ fontSize: 14, color: '#333', marginTop: 2 }}>{v.brand} {v.model} {v.modelYear && `(${v.modelYear})`}</div>
                  <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>🛣️ {v.currentKm?.toLocaleString('tr-TR')} km</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
                  <ChevronRight size={20} color="#ccc" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Araç bulunamadı</div>}
    </div>
  )
}
