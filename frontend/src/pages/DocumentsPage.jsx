import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ArrowLeft, FileText, Download, Upload } from 'lucide-react'
import { FormRow, ErrorBox, EmptyState, Loading, inputStyle, selectStyle, cardStyle } from '../components/FormUI'

const typeLabels = { ruhsat: 'Ruhsat', sigorta_police: 'Sigorta Poliçesi', kasko_police: 'Kasko Poliçesi', muayene: 'Muayene Belgesi', fatura: 'Fatura', other: 'Diğer' }

export default function DocumentsPage() {
  const { id } = useParams()
  const { api } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState('other')
  const [file, setFile] = useState(null)

  const load = () => {
    setLoading(true)
    api.get(`/api/documents/${id}`).then((res) => {
      if (res.data.success) setDocs(res.data.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [api, id])

  const upload = async (e) => {
    e.preventDefault()
    if (!file) return setError('Lütfen bir dosya seçin.')
    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vehicleId', id)
      formData.append('documentType', documentType)
      formData.append('title', title || file.name)
      await api.post('/api/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setTitle('')
      setFile(null)
      e.target.reset()
      load()
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setUploading(false)
    }
  }

  const download = async (docId, docTitle) => {
    const res = await api.get(`/api/documents/file/${docId}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = docTitle || 'belge'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) return <Loading />

  return (
    <div>
      <Link to={`/vehicles/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#007AFF', textDecoration: 'none', fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={18} /> Araç Kartına Dön
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>📄 Belgeler</h1>

      <div style={{ ...cardStyle, maxWidth: 600, marginBottom: 24 }}>
        <ErrorBox>{error}</ErrorBox>
        <form onSubmit={upload}>
          <FormRow label="Belge Tipi">
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} style={selectStyle}>
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </FormRow>
          <FormRow label="Başlık">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Belge başlığı (opsiyonel)" style={inputStyle} />
          </FormRow>
          <FormRow label="Dosya * (JPEG, PNG, WEBP veya PDF, max 10MB)">
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files[0])} style={inputStyle} />
          </FormRow>
          <button type="submit" disabled={uploading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 14, background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
            <Upload size={16} /> {uploading ? 'Yükleniyor...' : 'Yükle'}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {docs.map((d) => (
          <div key={d.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} color="#007AFF" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{typeLabels[d.documentType] || d.documentType} · {d.uploader?.fullName} · {new Date(d.createdAt).toLocaleDateString('tr-TR')}</div>
              </div>
            </div>
            <button onClick={() => download(d.id, d.title)} style={{ padding: 8, background: '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              <Download size={16} />
            </button>
          </div>
        ))}
      </div>
      {docs.length === 0 && <EmptyState>Bu araca ait belge bulunamadı</EmptyState>}
    </div>
  )
}
