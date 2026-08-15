import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Camera, Upload, Check, AlertCircle, Loader2, FileText, Save } from 'lucide-react'

export default function OCRPage() {
  const { api } = useAuth()
  const [preview, setPreview] = useState(null)
  const [ocrResult, setOcrResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vehicleId, setVehicleId] = useState('')
  const [category, setCategory] = useState('maintenance')
  const fileInputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('invoice', file)
      const res = await api.post('/api/ocr/scan-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setOcrResult(res.data.data)
    } catch (err) {
      alert('OCR Hatası: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const saveExpense = async () => {
    if (!vehicleId || !ocrResult?.totalAmount) {
      alert('Araç ID ve tutar gerekli.')
      return
    }
    setSaving(true)
    try {
      const res = await api.post('/api/ocr/confirm-expense', {
        vehicleId: parseInt(vehicleId),
        expenseDate: ocrResult.invoiceDate || new Date().toISOString().split('T')[0],
        amount: ocrResult.totalAmount,
        category,
        description: `OCR Fatura: ${ocrResult.invoiceNumber || '-'} | ${ocrResult.companyName || '-'}`,
        ocrData: ocrResult,
      })
      if (res.data.success) {
        alert('✅ Gider kaydedildi!')
        setPreview(null)
        setOcrResult(null)
        setVehicleId('')
      }
    } catch (err) {
      alert('Kayıt Hatası: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>📸 AI Fatura Okuma</h1>

      {!preview && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '30px 40px', background: '#f0f0f0', border: '2px dashed #007AFF', borderRadius: 16, cursor: 'pointer' }}>
              <Upload size={40} color="#007AFF" />
              <span style={{ fontWeight: 600, color: '#007AFF' }}>Fatura Yükle</span>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])} />
          <p style={{ color: '#999', fontSize: 13, marginTop: 16 }}>JPG, PNG, WEBP desteklenir. Max 10MB.</p>
        </div>
      )}

      {preview && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Sol: Görüntü */}
          <div>
            <img src={preview} alt="Fatura" style={{ width: '100%', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <button onClick={() => { setPreview(null); setOcrResult(null); }}
              style={{ marginTop: 12, padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
              🗑️ Temizle
            </button>
          </div>

          {/* Sağ: OCR Sonucu */}
          <div>
            {loading && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <Loader2 size={40} color="#007AFF" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#666' }}>Fatura okunuyor... AI analiz ediyor...</p>
              </div>
            )}

            {ocrResult && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={20} color="#34C759" /> AI Sonucu
                </h3>

                <div style={{ display: 'grid', gap: 12 }}>
                  <OCRField label="Firma" value={ocrResult.companyName} confidence={ocrResult.confidence?.companyName} />
                  <OCRField label="Fatura No" value={ocrResult.invoiceNumber} confidence={ocrResult.confidence?.invoiceNumber} />
                  <OCRField label="Tarih" value={ocrResult.invoiceDate} confidence={ocrResult.confidence?.invoiceDate} />
                  <OCRField label="Toplam Tutar" value={ocrResult.totalAmount ? `₺${ocrResult.totalAmount.toLocaleString('tr-TR')}` : null} confidence={ocrResult.confidence?.totalAmount} />
                  <OCRField label="KDV" value={ocrResult.taxAmount ? `₺${ocrResult.taxAmount.toLocaleString('tr-TR')} (%${ocrResult.taxRate || '?'})` : null} confidence={ocrResult.confidence?.taxAmount} />
                  <OCRField label="Ara Toplam" value={ocrResult.subTotal ? `₺${ocrResult.subTotal.toLocaleString('tr-TR')}` : null} confidence={ocrResult.confidence?.subTotal} />
                </div>

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>💾 Gider Olarak Kaydet</h4>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Araç ID *</label>
                      <input value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} placeholder="1" type="number"
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Kategori</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginTop: 4 }}>
                        <option value="maintenance">Bakım</option>
                        <option value="repair">Tamir</option>
                        <option value="fuel">Yakıt</option>
                        <option value="tire">Lastik</option>
                        <option value="parts">Parça</option>
                        <option value="other">Diğer</option>
                      </select>
                    </div>
                    <button onClick={saveExpense} disabled={saving}
                      style={{ width: '100%', padding: 12, background: '#34C759', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Save size={16} /> {saving ? 'Kaydediliyor...' : 'Gider Olarak Kaydet'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OCRField({ label, value, confidence }) {
  if (!value) return null
  const colors = { high: '#34C759', medium: '#FF9500', low: '#FF3B30' }
  const color = colors[confidence] || '#999'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8f8f8', borderRadius: 10 }}>
      <span style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{value}</span>
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: color + '20', color, fontWeight: 700 }}>{confidence?.toUpperCase()}</span>
      </div>
    </div>
  )
}
