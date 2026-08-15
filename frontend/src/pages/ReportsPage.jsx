import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download, FileText } from 'lucide-react'

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#FF2D55', '#5AC8FA']

export default function ReportsPage() {
  const { api } = useAuth()
  const [fleetData, setFleetData] = useState(null)
  const [topVehicles, setTopVehicles] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/api/reports/fleet-summary?year=${year}`),
      api.get(`/api/reports/top-expensive-vehicles?limit=10&year=${year}`),
    ]).then(([f, t]) => {
      if (f.data.success) setFleetData(f.data.data)
      if (t.data.success) setTopVehicles(t.data.data)
    }).finally(() => setLoading(false))
  }, [api, year])

  const downloadFile = async (url, filename) => {
    const res = await api.get(url, { responseType: 'blob' })
    const blobUrl = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(blobUrl)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Yükleniyor...</div>

  const categoryData = fleetData?.expenseByCategory?.map((c) => ({
    name: categoryLabels[c.category] || c.category,
    value: Number(c._sum.amount),
  })) || []

  const monthData = fleetData?.expenseByMonth?.map((m) => ({
    name: new Date(m.month).toLocaleDateString('tr-TR', { month: 'short' }),
    tutar: Number(m.total),
  })) || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>📈 Raporlar</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}>
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => downloadFile(`/api/exports/fleet-expenses/excel?year=${year}`, `filo_giderleri_${year}.xlsx`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#34C759', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={14} /> Excel
          </button>
          <button onClick={() => downloadFile(`/api/exports/upcoming-events/pdf`, 'yaklasan_olaylar.pdf')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SummaryCard label="Toplam Gider" value={`₺${(fleetData?.totalExpense || 0).toLocaleString('tr-TR')}`} color="#FF3B30" />
        <SummaryCard label="Araç Sayısı" value={fleetData?.vehicleCount || 0} color="#007AFF" />
        <SummaryCard label="Araç Başı Ort." value={`₺${Math.round(fleetData?.avgExpensePerVehicle || 0).toLocaleString('tr-TR')}`} color="#AF52DE" />
      </div>

      {/* Grafikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Aylık Gider */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📅 Aylık Gider Dağılımı</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => `₺${Number(v).toLocaleString('tr-TR')}`} />
              <Bar dataKey="tutar" fill="#007AFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Kategoriye Göre */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🥧 Gider Kategorileri</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `₺${Number(v).toLocaleString('tr-TR')}`} />
              <Legend fontSize={12} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* En Çok Masraf Çıkaran Araçlar */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🏆 En Çok Masraf Çıkaran Araçlar</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {topVehicles.map((v, i) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8f8f8', borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: COLORS[i % COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.plate}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{v.brand} {v.model}</div>
              </div>
              <div style={{ fontWeight: 800, color: '#FF3B30', fontSize: 14 }}>₺{v.totalExpense.toLocaleString('tr-TR')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const categoryLabels = {
  maintenance: 'Bakım', repair: 'Tamir', casco: 'Kasko', traffic_insurance: 'Trafik Sig.', tire: 'Lastik',
  fuel: 'Yakıt', inspection: 'Muayene', tax: 'Vergi', hgs_ogs: 'HGS/OGS', parking: 'Otopark',
  washing: 'Yıkama', parts: 'Parça', other: 'Diğer',
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}
