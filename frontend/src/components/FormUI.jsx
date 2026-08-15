export const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, outline: 'none', background: '#fff', fontFamily: 'inherit' }
export const selectStyle = { ...inputStyle, cursor: 'pointer' }
export const cardStyle = { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }

export function FormRow({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

export function FormGrid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 16px' }}>{children}</div>
}

export function ErrorBox({ children }) {
  if (!children) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFE5E5', color: '#C00', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
      ⚠️ {children}
    </div>
  )
}

export function SubmitButton({ loading, children }) {
  return (
    <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: 8 }}>
      {loading ? 'Kaydediliyor...' : children || '💾 Kaydet'}
    </button>
  )
}

export function ToggleAddButton({ open, onClick, label }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: open ? '#f0f0f0' : '#007AFF', color: open ? '#666' : '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}>
      {open ? '✕ Vazgeç' : `+ ${label}`}
    </button>
  )
}

export function EmptyState({ children }) {
  return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>{children}</div>
}

export function Loading() {
  return <EmptyState>Yükleniyor...</EmptyState>
}

export function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export function ExpiryBadge({ endDate }) {
  const days = daysUntil(endDate)
  let bg = '#E5F9E7', color = '#34C759', label = `${days} gün kaldı`
  if (days < 0) { bg = '#F0F0F0'; color = '#999'; label = 'Süresi doldu' }
  else if (days <= 10) { bg = '#FFE5E5'; color = '#FF3B30' }
  else if (days <= 30) { bg = '#FFF4E5'; color = '#FF9500' }
  return <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>{label}</span>
}
