import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function AddMaintenancePage() {
  const { id } = useParams()
  const { api } = useAuth()
  const navigate = useNavigate()
  const [km, setKm] = useState('')
  const [maintenanceType, setMaintenanceType] = useState('')
  const [description, setDescription] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/maintenance', {
        vehicleId: parseInt(id),
        maintenanceDate: new Date().toISOString().split('T')[0],
        km: parseInt(km),
        maintenanceType,
        description,
        serviceId: parseInt(serviceId),
        totalAmount: parseFloat(totalAmount),
      })
      if (res.data.success) {
        navigate(`/vehicles/${id}`)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={() => navigate(`/vehicles/${id}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#007AFF', fontWeight: 600, cursor: 'pointer', marginBottom: 16, fontSize: 15 }}>
        <ArrowLeft size={18} /> Araç Kartına Dön
      </button>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>🔧 Bakım Kaydı</h1>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 600 }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFE5E5', color: '#C00', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <form onSubmit={submit}>
          <FormRow label="KM *">
            <input value={km} onChange={(e) => setKm(e.target.value)} placeholder="185500" type="number" required style={inputStyle} />
          </FormRow>
          <p style={{ fontSize: 12, color: '#007AFF', marginBottom: 12 }}>💡 Son KM'den küçük değer giremezsiniz</p>
          <FormRow label="Bakım Tipi *">
            <input value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)} placeholder="Periyodik Bakım" required style={inputStyle} />
          </FormRow>
          <FormRow label="Açıklama *">
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Yağ ve filtre değişimi" required style={inputStyle} />
          </FormRow>
          <FormRow label="Servis ID *">
            <input value={serviceId} onChange={(e) => setServiceId(e.target.value)} placeholder="1" type="number" required style={inputStyle} />
          </FormRow>
          <FormRow label="Toplam Tutar (TL) *">
            <input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="12500" type="number" step="0.01" required style={inputStyle} />
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
