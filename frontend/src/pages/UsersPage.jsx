import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { UserPlus, ShieldCheck } from 'lucide-react'
import { FormRow, FormGrid, ErrorBox, SubmitButton, ToggleAddButton, EmptyState, Loading, inputStyle, selectStyle, cardStyle } from '../components/FormUI'

export default function UsersPage() {
  const { api, user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'user' })

  const load = () => {
    setLoading(true)
    api.get('/api/auth/users').then((res) => {
      if (res.data.success) setUsers(res.data.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [api])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await api.post('/api/auth/register', form)
      if (res.data.success) {
        setShowForm(false)
        setForm({ fullName: '', email: '', phone: '', password: '', role: 'user' })
        load()
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message)
    } finally {
      setSaving(false)
    }
  }

  if (user?.role !== 'admin') {
    return <EmptyState>Bu sayfayı görüntüleme yetkiniz yok.</EmptyState>
  }

  if (loading) return <Loading />

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>👥 Kullanıcılar</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>{users.length} kullanıcı</p>

      <ToggleAddButton open={showForm} onClick={() => setShowForm(!showForm)} label="Yeni Kullanıcı Ekle" />

      {showForm && (
        <div style={{ ...cardStyle, maxWidth: 600, marginBottom: 24 }}>
          <ErrorBox>{error}</ErrorBox>
          <form onSubmit={submit}>
            <FormGrid>
              <FormRow label="Ad Soyad *">
                <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required style={inputStyle} />
              </FormRow>
              <FormRow label="E-posta *">
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required style={inputStyle} />
              </FormRow>
              <FormRow label="Telefon">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
              </FormRow>
              <FormRow label="Rol">
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={selectStyle}>
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Admin</option>
                </select>
              </FormRow>
            </FormGrid>
            <FormRow label="Şifre * (en az 8 karakter)">
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" minLength={8} required style={inputStyle} />
            </FormRow>
            <SubmitButton loading={saving}><UserPlus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Kullanıcı Ekle</SubmitButton>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {users.map((u) => (
          <div key={u.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{u.fullName}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{u.email} {u.phone && `· ${u.phone}`}</div>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.role === 'admin' ? '#E5F0FF' : '#F0F0F0', color: u.role === 'admin' ? '#007AFF' : '#666' }}>
              {u.role === 'admin' && <ShieldCheck size={12} />} {u.role === 'admin' ? 'Admin' : 'Kullanıcı'}
            </span>
          </div>
        ))}
      </div>
      {users.length === 0 && <EmptyState>Kullanıcı bulunamadı</EmptyState>}
    </div>
  )
}
