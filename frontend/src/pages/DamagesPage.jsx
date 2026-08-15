import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { AlertTriangle } from 'lucide-react'
import { FormRow, FormGrid, ErrorBox, SubmitButton, ToggleAddButton, EmptyState, Loading, inputStyle, selectStyle, cardStyle } from '../components/FormUI'

const faultLabels = { us: 'Bizim Kusur', other: 'Karşı Taraf', shared: 'Ortak Kusur', unknown: 'Belirsiz' }

export default function DamagesPage() {
  const { api } = useAuth()
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ vehicleId: '', damageDate: '', km: '', damageType: '', description: '', damageLocation: '', faultStatus: '', expertName: '', serviceId: '', damageAmount: '', insurancePaid: '', companyPaid: '' })

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/damages'),
      api.get('/api/vehicles', { params: { limit: 100 } }),
      api.get('/api/companies', { params: { type: 'service', limit: 100 } }),
    ]).then(([r1, r2, r3]) => {
      if (r1.data.success) setRecords(r1.data.data)
      if (r2.data.success) setVehicles(r2.data.data)
      if (r3.data.success) setServices(r3.data.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [api])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await api.post('/api/damages', {
        vehicleId: parseInt(form.vehicleId),
        damageDate: form.damageDate,
        km: form.km ? parseInt(form.km) : undefined,
        damageType: form.damageType,
        description: form.description,
        damageLocation: form.damageLocation || undefined,
        faultStatus: form.faultStatus || undefined,
        expertName: form.expertName || undefined,
        serviceId: form.serviceId ? parseInt(form.serviceId) : undefined,
        damageAmount: form.damageAmount ? parseFloat(form.damageAmount) : undefined,
        insurancePaid: form.insurancePaid ? parseFloat(form.insurancePaid) : 0,
        companyPaid: form.companyPaid ? parseFloat(form.companyPaid) : 0,
      })
      if (res.data.success) {
        setShowForm(false)
        setForm({ vehicleId: '', damageDate: '', km: '', damageType: '', description: '', damageLocation: '', faultStatus: '', expertName: '', serviceId: '', damageAmount: '', insurancePaid: '', companyPaid: '' })
        load()
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🚨 Hasar Kayıtları</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>{records.length} hasar kaydı</p>

      <ToggleAddButton open={showForm} onClick={() => setShowForm(!showForm)} label="Yeni Hasar Kaydı" />

      {showForm && (
        <div style={{ ...cardStyle, maxWidth: 700, marginBottom: 24 }}>
          <ErrorBox>{error}</ErrorBox>
          <form onSubmit={submit}>
            <FormGrid>
              <FormRow label="Araç *">
                <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required style={selectStyle}>
                  <option value="">Seçiniz</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>)}
                </select>
              </FormRow>
              <FormRow label="Hasar Tarihi *">
                <input value={form.damageDate} onChange={(e) => setForm({ ...form, damageDate: e.target.value })} type="date" required style={inputStyle} />
              </FormRow>
              <FormRow label="KM">
                <input value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} type="number" style={inputStyle} />
              </FormRow>
              <FormRow label="Hasar Tipi *">
                <input value={form.damageType} onChange={(e) => setForm({ ...form, damageType: e.target.value })} placeholder="Çarpma, Çizik, vb." required style={inputStyle} />
              </FormRow>
              <FormRow label="Hasar Yeri">
                <input value={form.damageLocation} onChange={(e) => setForm({ ...form, damageLocation: e.target.value })} placeholder="Ön tampon" style={inputStyle} />
              </FormRow>
              <FormRow label="Kusur Durumu">
                <select value={form.faultStatus} onChange={(e) => setForm({ ...form, faultStatus: e.target.value })} style={selectStyle}>
                  <option value="">Seçiniz</option>
                  {Object.entries(faultLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FormRow>
              <FormRow label="Eksper">
                <input value={form.expertName} onChange={(e) => setForm({ ...form, expertName: e.target.value })} style={inputStyle} />
              </FormRow>
              <FormRow label="Onarım Servisi">
                <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} style={selectStyle}>
                  <option value="">Seçiniz</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormRow>
              <FormRow label="Hasar Tutarı (TL)">
                <input value={form.damageAmount} onChange={(e) => setForm({ ...form, damageAmount: e.target.value })} type="number" step="0.01" style={inputStyle} />
              </FormRow>
              <FormRow label="Sigortanın Ödediği (TL)">
                <input value={form.insurancePaid} onChange={(e) => setForm({ ...form, insurancePaid: e.target.value })} type="number" step="0.01" style={inputStyle} />
              </FormRow>
              <FormRow label="Firmanın Ödediği (TL)">
                <input value={form.companyPaid} onChange={(e) => setForm({ ...form, companyPaid: e.target.value })} type="number" step="0.01" style={inputStyle} />
              </FormRow>
            </FormGrid>
            <FormRow label="Açıklama *">
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required style={inputStyle} />
            </FormRow>
            <SubmitButton loading={saving} />
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {records.map((r) => (
          <div key={r.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} color="#FF3B30" /> {r.vehicle?.plate} — {r.damageType}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{r.description}</div>
              </div>
              {r.faultStatus && <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#F0F0F0', color: '#666' }}>{faultLabels[r.faultStatus] || r.faultStatus}</span>}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#555', flexWrap: 'wrap' }}>
              <span>📅 {new Date(r.damageDate).toLocaleDateString('tr-TR')}</span>
              {r.damageAmount != null && <span>💰 Toplam ₺{Number(r.damageAmount).toLocaleString('tr-TR')}</span>}
              {r.service?.name && <span>🔧 {r.service.name}</span>}
            </div>
          </div>
        ))}
      </div>
      {records.length === 0 && <EmptyState>Hasar kaydı bulunamadı</EmptyState>}
    </div>
  )
}
