import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Phone, MapPin, User } from 'lucide-react'
import { FormRow, FormGrid, ErrorBox, SubmitButton, ToggleAddButton, EmptyState, Loading, inputStyle, selectStyle, cardStyle } from '../components/FormUI'

const typeMap = {
  mechanic: 'Tamirci', service: 'Servis', tire_shop: 'Lastikçi',
  insurance_agency: 'Sigorta Acentesi', casco_agency: 'Kasko Acentesi',
  tow_truck: 'Çekici', parts_supplier: 'Parça Tedarikçisi', other: 'Diğer',
}

export default function CompaniesPage() {
  const { api } = useAuth()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', companyType: 'service', authorizedPerson: '', phone: '', email: '', address: '', workingHours: '', notes: '' })

  const load = () => {
    setLoading(true)
    api.get('/api/companies', { params: { limit: 200 } }).then((res) => {
      if (res.data.success) setCompanies(res.data.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [api])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await api.post('/api/companies', {
        name: form.name,
        companyType: form.companyType,
        authorizedPerson: form.authorizedPerson || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        workingHours: form.workingHours || undefined,
        notes: form.notes || undefined,
      })
      if (res.data.success) {
        setShowForm(false)
        setForm({ name: '', companyType: 'service', authorizedPerson: '', phone: '', email: '', address: '', workingHours: '', notes: '' })
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
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🏢 Firmalar</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>{companies.length} firma kayıtlı</p>

      <ToggleAddButton open={showForm} onClick={() => setShowForm(!showForm)} label="Yeni Firma Ekle" />

      {showForm && (
        <div style={{ ...cardStyle, maxWidth: 700, marginBottom: 24 }}>
          <ErrorBox>{error}</ErrorBox>
          <form onSubmit={submit}>
            <FormGrid>
              <FormRow label="Firma Adı *">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
              </FormRow>
              <FormRow label="Firma Tipi *">
                <select value={form.companyType} onChange={(e) => setForm({ ...form, companyType: e.target.value })} required style={selectStyle}>
                  {Object.entries(typeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FormRow>
              <FormRow label="Yetkili Kişi">
                <input value={form.authorizedPerson} onChange={(e) => setForm({ ...form, authorizedPerson: e.target.value })} style={inputStyle} />
              </FormRow>
              <FormRow label="Telefon">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
              </FormRow>
              <FormRow label="E-posta">
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" style={inputStyle} />
              </FormRow>
              <FormRow label="Çalışma Saatleri">
                <input value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} placeholder="09:00 - 18:00" style={inputStyle} />
              </FormRow>
            </FormGrid>
            <FormRow label="Adres">
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} />
            </FormRow>
            <FormRow label="Notlar">
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={inputStyle} />
            </FormRow>
            <SubmitButton loading={saving} />
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {companies.map((c) => (
          <div key={c.id} style={cardStyle}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2, marginBottom: 8 }}>{typeMap[c.companyType] || c.companyType}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#555', flexWrap: 'wrap' }}>
              {c.authorizedPerson && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={13} /> {c.authorizedPerson}</span>}
              {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={13} /> {c.phone}</span>}
              {c.address && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {c.address}</span>}
            </div>
          </div>
        ))}
      </div>
      {companies.length === 0 && <EmptyState>Firma bulunamadı</EmptyState>}
    </div>
  )
}
