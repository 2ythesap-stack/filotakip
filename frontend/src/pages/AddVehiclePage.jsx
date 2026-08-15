import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function AddVehiclePage() {
  const { api } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ plate: '', brand: '', model: '', modelYear: '', vehicleType: '', fuelType: '', currentKm: '', status: 'active' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.plate || !form.brand || !form.model) {
      setError('Plaka, marka ve model zorunludur.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/api/vehicles', {
        ...form,
        plate: form.plate.toUpperCase().trim(),
        modelYear: form.modelYear ? parseInt(form.modelYear) : undefined,
        currentKm: form.currentKm ? parseInt(form.currentKm) : 0,
      })
      if (res.data.success) {
        navigate('/vehicles')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={() => navigate('/vehicles')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#007AFF', fontWeight: 600, cursor: 'pointer', marginBottom: 16, fontSize: 15 }}>
        <ArrowLeft size={18} /> Araçlara Dön
      </button>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>➕ Yeni Araç Ekle</h1>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 600 }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFE5E5', color: '#C00', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <form onSubmit={submit}>
          <FormRow label="Plaka *">
            <input value={form.plate} onChange={handleChange('plate')} placeholder="35 DC 2468" required style={inputStyle} />
          </FormRow>
          <FormRow label="Marka *">
            <input value={form.brand} onChange={handleChange('brand')} placeholder="Mercedes" required style={inputStyle} />
          </FormRow>
          <FormRow label="Model *">
            <input value={form.model} onChange={handleChange('model')} placeholder="Actros" required style={inputStyle} />
          </FormRow>
          <FormRow label="Model Yılı">
            <input value={form.modelYear} onChange={handleChange('modelYear')} placeholder="2024" type="number" style={inputStyle} />
          </FormRow>
          <FormRow label="Araç Tipi">
            <input value={form.vehicleType} onChange={handleChange('vehicleType')} placeholder="Çekici" style={inputStyle} />
          </FormRow>
          <FormRow label="Yakıt Tipi">
            <input value={form.fuelType} onChange={handleChange('fuelType')} placeholder="Dizel" style={inputStyle} />
          </FormRow>
          <FormRow label="Güncel KM">
            <input value={form.currentKm} onChange={handleChange('currentKm')} placeholder="185420" type="number" style={inputStyle} />
          </FormRow>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: 8 }}>
            {loading ? 'Kaydediliyor...' : '💾 Kaydet'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormRow({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, outline: 'none' }
