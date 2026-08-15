import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth, API_URL } from '../hooks/useAuth'
import { ArrowLeft, Wrench, FileText, AlertCircle, FolderOpen } from 'lucide-react'

export default function VehicleCardPage() {
  const { id } = useParams()
  const { api } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/vehicles/${id}/card`).then((res) => {
      if (res.data.success) setData(res.data.data)
    }).finally(() => setLoading(false))
  }, [api, id])

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
  if (!data) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Araç bulunamadı</div>

  const f = data.financials || {}

  return (
    <div>
      <Link to="/vehicles" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#007AFF', textDecoration: 'none', fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={18} /> Araçlara Dön
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🚗 {data.plate}</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>{data.brand} {data.model} {data.modelYear && `(${data.modelYear})`}</p>

      {/* Finansal Özet */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Finansal Özet</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <StatBox label="Toplam Gider" value={`₺${(f.totalExpense || 0).toLocaleString('tr-TR')}`} color="#FF3B30" />
          <StatBox label="Bu Yıl" value={`₺${(f.yearExpense || 0).toLocaleString('tr-TR')}`} color="#FF9500" />
          <StatBox label="Bu Ay" value={`₺${(f.monthExpense || 0).toLocaleString('tr-TR')}`} color="#AF52DE" />
          <StatBox label="Bakım" value={`₺${(f.maintenanceCost || 0).toLocaleString('tr-TR')}`} color="#007AFF" />
          <StatBox label="Tamir" value={`₺${(f.repairCost || 0).toLocaleString('tr-TR')}`} color="#5856D6" />
          <StatBox label="Kasko" value={`₺${(f.cascoCost || 0).toLocaleString('tr-TR')}`} color="#34C759" />
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Link to={`/vehicles/${id}/maintenance`} style={{ padding: '10px 18px', background: '#007AFF', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wrench size={16} /> Bakım Ekle
        </Link>
        <Link to={`/vehicles/${id}/documents`} style={{ padding: '10px 18px', background: '#5856D6', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FolderOpen size={16} /> Belgeler
        </Link>
        <button onClick={() => downloadFile(`/api/exports/vehicle-card/${id}/pdf`, `${data.plate}_kart.pdf`)}
          style={{ padding: '10px 18px', background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <FileText size={16} /> PDF İndir
        </button>
        <button onClick={() => downloadFile(`/api/exports/vehicle-expenses/${id}/excel`, `${data.plate}_giderler.xlsx`)}
          style={{ padding: '10px 18px', background: '#34C759', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <FileText size={16} /> Excel İndir
        </button>
      </div>

      {/* Son Bakımlar */}
      <Section title="🔧 Son Bakımlar" count={data.maintenances?.length}>
        {data.maintenances?.slice(0, 5).map((m) => (
          <div key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{m.maintenanceType}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              {new Date(m.maintenanceDate).toLocaleDateString('tr-TR')} | {m.km.toLocaleString('tr-TR')} km | {m.service?.name || '-'} | <strong>₺{Number(m.totalAmount).toLocaleString('tr-TR')}</strong>
            </div>
          </div>
        ))}
      </Section>

      {/* Son Tamirler */}
      <Section title="🛠️ Son Tamirler" count={data.repairs?.length}>
        {data.repairs?.slice(0, 5).map((r) => (
          <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.repairType}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              {new Date(r.repairDate).toLocaleDateString('tr-TR')} | {r.service?.name || '-'} | <strong>₺{Number(r.totalAmount).toLocaleString('tr-TR')}</strong>
            </div>
          </div>
        ))}
      </Section>

      {/* Sigorta / Kasko */}
      <Section title="🛡️ Sigorta ve Kasko" count={(data.insuranceRecords?.length || 0) + (data.cascoRecords?.length || 0)}>
        {data.insuranceRecords?.slice(0, 3).map((i) => (
          <div key={`ins-${i.id}`} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Trafik Sigortası — {i.policyNumber}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Bitiş: {new Date(i.endDate).toLocaleDateString('tr-TR')} | ₺{Number(i.premium).toLocaleString('tr-TR')}</div>
          </div>
        ))}
        {data.cascoRecords?.slice(0, 3).map((c) => (
          <div key={`cas-${c.id}`} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Kasko — {c.policyNumber}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Bitiş: {new Date(c.endDate).toLocaleDateString('tr-TR')} | ₺{Number(c.premium).toLocaleString('tr-TR')}</div>
          </div>
        ))}
      </Section>

      {/* Lastikler */}
      <Section title="🛞 Lastikler" count={data.tires?.length}>
        {data.tires?.map((t) => (
          <div key={t.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.brand} {t.model}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              {t.size} | DOT: {t.dotInfo || '-'} | Diş derinliği: {t.treadDepth}mm | Pozisyon: {t.currentPosition || '-'}
            </div>
          </div>
        ))}
      </Section>

      {/* Bekleyen İşler */}
      <Section title="📋 Bekleyen İşler" count={data.tasks?.length}>
        {data.tasks?.map((t) => (
          <div key={t.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.title}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              Son tarih: {new Date(t.dueDate).toLocaleDateString('tr-TR')} | Öncelik: {t.priority}
            </div>
          </div>
        ))}
      </Section>

      {/* Hasarlar */}
      <Section title="🚨 Hasar Kayıtları" count={data.damages?.length}>
        {data.damages?.slice(0, 5).map((d) => (
          <div key={d.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{d.damageType}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              {new Date(d.damageDate).toLocaleDateString('tr-TR')} | {d.description} | Tutar: ₺{Number(d.damageAmount || 0).toLocaleString('tr-TR')}
            </div>
          </div>
        ))}
      </Section>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#f8f8f8', borderRadius: 12, padding: 14, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{title} {count !== undefined && <span style={{ color: '#999', fontSize: 14 }}>({count})</span>}</h2>
      {count === 0 ? <p style={{ color: '#999', fontSize: 14 }}>Kayıt bulunamadı</p> : children}
    </div>
  )
}
