import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ShieldCheck } from 'lucide-react'
import { FormRow, FormGrid, ErrorBox, SubmitButton, ToggleAddButton, EmptyState, Loading, ExpiryBadge, inputStyle, selectStyle, cardStyle } from '../components/FormUI'

export default function CascoPage() {
  const { api } = useAuth()
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ vehicleId: '', companyId: '', policyNumber: '', startDate: '', endDate: '', premium: '', deductible: '', coverage: '' })

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/casco'),
      api.get('/api/vehicles', { params: { limit: 100 } }),
      api.get('/api/companies', { params: { type: 'casco_agency', limit: 100 } }),
    ]).then(([r1, r2, r3]) => {
      if (r1.data.success) setRecords(r1.data.data)
      if (r2.data.success) setVehicles(r2.data.data)
      if (r3.data.success) setCompanies(r3.data.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [api])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await api.post('/api/casco', {
        vehicleId: parseInt(form.vehicleId),
        companyId: form.companyId ? parseInt(form.companyId) : undefined,
        policyNumber: form.policyNumber,
        startDate: form.startDate,
        endDate: form.endDate,
        premium: parseFloat(form.premium),
        deductible: form.deductible ? parseFloat(form.deductible) : undefined,
        coverage: form.coverage || undefined,
      })
      if (res.data.success) {
        setShowForm(false)
        setForm({ vehicleId: '', companyId: '', policyNumber: '', startDate: '', endDate: '', premium: '', deductible: '', coverage: '' })
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
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🛡️ Kasko</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>{records.length} poliçe kayıtlı</p>

      <ToggleAddButton open={showForm} onClick={() => setShowForm(!showForm)} label="Yeni Kasko Ekle" />

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
              <FormRow label="Kasko Şirketi">
                <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} style={selectStyle}>
                  <option value="">Seçiniz</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormRow>
              <FormRow label="Poliçe Numarası *">
                <input value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} required style={inputStyle} />
              </FormRow>
              <FormRow label="Prim Tutarı (TL) *">
                <input value={form.premium} onChange={(e) => setForm({ ...form, premium: e.target.value })} type="number" step="0.01" required style={inputStyle} />
              </FormRow>
              <FormRow label="Muafiyet (TL)">
                <input value={form.deductible} onChange={(e) => setForm({ ...form, deductible: e.target.value })} type="number" step="0.01" style={inputStyle} />
              </FormRow>
              <FormRow label="Başlangıç Tarihi *">
                <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" required style={inputStyle} />
              </FormRow>
              <FormRow label="Bitiş Tarihi *">
                <input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} type="date" required style={inputStyle} />
              </FormRow>
            </FormGrid>
            <FormRow label="Teminat Kapsamı">
              <input value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} style={inputStyle} placeholder="Genişletilmiş kasko" />
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
                <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={16} color="#34C759" /> {r.vehicle?.plate}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Poliçe No: {r.policyNumber} {r.company?.name && `· ${r.company.name}`}</div>
              </div>
              <ExpiryBadge endDate={r.endDate} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#555', flexWrap: 'wrap' }}>
              <span>📅 {new Date(r.startDate).toLocaleDateString('tr-TR')} — {new Date(r.endDate).toLocaleDateString('tr-TR')}</span>
              <span>💰 ₺{Number(r.premium).toLocaleString('tr-TR')}</span>
              {r.deductible != null && <span>⚖️ Muafiyet ₺{Number(r.deductible).toLocaleString('tr-TR')}</span>}
            </div>
          </div>
        ))}
      </div>
      {records.length === 0 && <EmptyState>Kasko poliçesi bulunamadı</EmptyState>}
    </div>
  )
}
