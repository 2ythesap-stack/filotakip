import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { CircleDot } from 'lucide-react'
import { FormRow, FormGrid, ErrorBox, SubmitButton, ToggleAddButton, EmptyState, Loading, inputStyle, selectStyle, cardStyle } from '../components/FormUI'

const positionLabels = { front_left: 'Ön Sol', front_right: 'Ön Sağ', rear_left: 'Arka Sol', rear_right: 'Arka Sağ', spare: 'Yedek' }
const statusLabels = { mounted: 'Takılı', stored: 'Depoda', scrapped: 'Hurda' }

export default function TiresPage() {
  const { api } = useAuth()
  const [tires, setTires] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mountingId, setMountingId] = useState(null)
  const [mountForm, setMountForm] = useState({ vehicleId: '', position: '', mountedDate: '', mountKm: '' })
  const [form, setForm] = useState({ brand: '', model: '', size: '', season: 'all_season', treadDepth: '', purchaseDate: '', purchasePrice: '', notes: '' })

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/api/tires'), api.get('/api/vehicles', { params: { limit: 100 } })])
      .then(([r1, r2]) => {
        if (r1.data.success) setTires(r1.data.data)
        if (r2.data.success) setVehicles(r2.data.data)
      }).finally(() => setLoading(false))
  }

  useEffect(load, [api])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await api.post('/api/tires', {
        brand: form.brand,
        model: form.model || undefined,
        size: form.size,
        season: form.season,
        treadDepth: form.treadDepth ? parseFloat(form.treadDepth) : undefined,
        purchaseDate: form.purchaseDate || undefined,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
        notes: form.notes || undefined,
        status: 'stored',
      })
      if (res.data.success) {
        setShowForm(false)
        setForm({ brand: '', model: '', size: '', season: 'all_season', treadDepth: '', purchaseDate: '', purchasePrice: '', notes: '' })
        load()
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message)
    } finally {
      setSaving(false)
    }
  }

  const submitMount = async (e, tireId) => {
    e.preventDefault()
    try {
      await api.put(`/api/tires/${tireId}/mount`, {
        vehicleId: parseInt(mountForm.vehicleId),
        position: mountForm.position,
        mountedDate: mountForm.mountedDate,
        mountKm: mountForm.mountKm ? parseInt(mountForm.mountKm) : undefined,
      })
      setMountingId(null)
      setMountForm({ vehicleId: '', position: '', mountedDate: '', mountKm: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  const dismount = async (tireId) => {
    if (!confirm('Bu lastiği sökmek istediğinize emin misiniz?')) return
    try {
      await api.put(`/api/tires/${tireId}/dismount`, {
        removedDate: new Date().toISOString().split('T')[0],
        changeReason: 'Manuel sökme',
      })
      load()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🛞 Lastikler</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>{tires.length} lastik kayıtlı</p>

      <ToggleAddButton open={showForm} onClick={() => setShowForm(!showForm)} label="Yeni Lastik Ekle" />

      {showForm && (
        <div style={{ ...cardStyle, maxWidth: 700, marginBottom: 24 }}>
          <ErrorBox>{error}</ErrorBox>
          <form onSubmit={submit}>
            <FormGrid>
              <FormRow label="Marka *">
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required style={inputStyle} />
              </FormRow>
              <FormRow label="Model">
                <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} style={inputStyle} />
              </FormRow>
              <FormRow label="Ebat *">
                <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="215/65 R16" required style={inputStyle} />
              </FormRow>
              <FormRow label="Sezon">
                <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} style={selectStyle}>
                  <option value="summer">Yaz</option>
                  <option value="winter">Kış</option>
                  <option value="all_season">4 Mevsim</option>
                </select>
              </FormRow>
              <FormRow label="Diş Derinliği (mm)">
                <input value={form.treadDepth} onChange={(e) => setForm({ ...form, treadDepth: e.target.value })} type="number" step="0.1" style={inputStyle} />
              </FormRow>
              <FormRow label="Satın Alma Tarihi">
                <input value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} type="date" style={inputStyle} />
              </FormRow>
              <FormRow label="Satın Alma Fiyatı (TL)">
                <input value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} type="number" step="0.01" style={inputStyle} />
              </FormRow>
            </FormGrid>
            <SubmitButton loading={saving} />
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {tires.map((t) => (
          <div key={t.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><CircleDot size={16} color="#666" /> {t.brand} {t.model}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{t.size} · Diş: {t.treadDepth ?? '-'}mm</div>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: t.status === 'mounted' ? '#E5F9E7' : '#F0F0F0', color: t.status === 'mounted' ? '#34C759' : '#666' }}>
                {statusLabels[t.status] || t.status}
              </span>
            </div>
            {t.currentVehicle && (
              <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
                🚗 {t.currentVehicle.plate} — {positionLabels[t.currentPosition] || t.currentPosition}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {t.status !== 'mounted' ? (
                <button onClick={() => setMountingId(mountingId === t.id ? null : t.id)} style={{ padding: '8px 14px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Araca Tak
                </button>
              ) : (
                <button onClick={() => dismount(t.id)} style={{ padding: '8px 14px', background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Sök
                </button>
              )}
            </div>
            {mountingId === t.id && (
              <form onSubmit={(e) => submitMount(e, t.id)} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <FormGrid>
                  <FormRow label="Araç *">
                    <select value={mountForm.vehicleId} onChange={(e) => setMountForm({ ...mountForm, vehicleId: e.target.value })} required style={selectStyle}>
                      <option value="">Seçiniz</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                    </select>
                  </FormRow>
                  <FormRow label="Pozisyon *">
                    <select value={mountForm.position} onChange={(e) => setMountForm({ ...mountForm, position: e.target.value })} required style={selectStyle}>
                      <option value="">Seçiniz</option>
                      {Object.entries(positionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </FormRow>
                  <FormRow label="Takılma Tarihi *">
                    <input value={mountForm.mountedDate} onChange={(e) => setMountForm({ ...mountForm, mountedDate: e.target.value })} type="date" required style={inputStyle} />
                  </FormRow>
                  <FormRow label="Takılma KM">
                    <input value={mountForm.mountKm} onChange={(e) => setMountForm({ ...mountForm, mountKm: e.target.value })} type="number" style={inputStyle} />
                  </FormRow>
                </FormGrid>
                <SubmitButton loading={false}>Tak</SubmitButton>
              </form>
            )}
          </div>
        ))}
      </div>
      {tires.length === 0 && <EmptyState>Lastik bulunamadı</EmptyState>}
    </div>
  )
}
