import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Wrench } from 'lucide-react'
import { FormRow, FormGrid, ErrorBox, SubmitButton, ToggleAddButton, EmptyState, Loading, inputStyle, selectStyle, cardStyle } from '../components/FormUI'

export default function RepairsPage() {
  const { api } = useAuth()
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ vehicleId: '', repairDate: '', km: '', repairType: '', description: '', serviceId: '', totalAmount: '' })

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/repairs'),
      api.get('/api/vehicles', { params: { limit: 100 } }),
      api.get('/api/companies', { params: { type: 'mechanic', limit: 100 } }),
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
      const res = await api.post('/api/repairs', {
        vehicleId: parseInt(form.vehicleId),
        repairDate: form.repairDate,
        km: parseInt(form.km),
        repairType: form.repairType,
        description: form.description,
        serviceId: parseInt(form.serviceId),
        totalAmount: parseFloat(form.totalAmount),
      })
      if (res.data.success) {
        setShowForm(false)
        setForm({ vehicleId: '', repairDate: '', km: '', repairType: '', description: '', serviceId: '', totalAmount: '' })
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
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🔧 Tamir Kayıtları</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>{records.length} tamir kaydı</p>

      <ToggleAddButton open={showForm} onClick={() => setShowForm(!showForm)} label="Yeni Tamir Kaydı" />

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
              <FormRow label="Tamir Tarihi *">
                <input value={form.repairDate} onChange={(e) => setForm({ ...form, repairDate: e.target.value })} type="date" required style={inputStyle} />
              </FormRow>
              <FormRow label="KM *" hint="Son KM'den küçük değer giremezsiniz">
                <input value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} type="number" required style={inputStyle} />
              </FormRow>
              <FormRow label="Tamir Tipi *">
                <input value={form.repairType} onChange={(e) => setForm({ ...form, repairType: e.target.value })} placeholder="Motor arızası" required style={inputStyle} />
              </FormRow>
              <FormRow label="Servis *">
                <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} required style={selectStyle}>
                  <option value="">Seçiniz</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormRow>
              <FormRow label="Toplam Tutar (TL) *">
                <input value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} type="number" step="0.01" required style={inputStyle} />
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
                <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Wrench size={16} color="#5856D6" /> {r.vehicle?.plate} — {r.repairType}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{r.description}</div>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#EDEBFF', color: '#5856D6' }}>₺{Number(r.totalAmount).toLocaleString('tr-TR')}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#555', flexWrap: 'wrap' }}>
              <span>📅 {new Date(r.repairDate).toLocaleDateString('tr-TR')}</span>
              <span>🛣️ {r.km?.toLocaleString('tr-TR')} km</span>
              {r.service?.name && <span>🔧 {r.service.name}</span>}
            </div>
          </div>
        ))}
      </div>
      {records.length === 0 && <EmptyState>Tamir kaydı bulunamadı</EmptyState>}
    </div>
  )
}
