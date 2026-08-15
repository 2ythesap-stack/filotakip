import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Phone, MapPin, User } from 'lucide-react'

const typeMap = {
  mechanic: 'Tamirci', service: 'Servis', tire_shop: 'Lastikçi',
  insurance_agency: 'Sigorta Acentesi', casco_agency: 'Kasko Acentesi',
  tow_truck: 'Çekici', parts_supplier: 'Parça Tedarikçisi', other: 'Diğer',
}

export default function CompaniesPage() {
  const { api } = useAuth()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/companies').then((res) => {
      if (res.data.success) setCompanies(res.data.data)
    }).finally(() => setLoading(false))
  }, [api])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Yükleniyor...</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>🏢 Firmalar</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {companies.map((c) => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#007AFF' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{typeMap[c.companyType] || c.companyType}</div>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#E5F0FF', color: '#007AFF' }}>
                ₺{Number(c.totalPayment || 0).toLocaleString('tr-TR')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#555' }}>
              {c.authorizedPerson && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {c.authorizedPerson}</div>}
              {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> {c.phone}</div>}
              {c.address && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> {c.address}</div>}
            </div>
            {c.contacts?.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>Yetkililer:</div>
                {c.contacts.map((contact) => (
                  <div key={contact.id} style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                    {contact.name} {contact.role && `(${contact.role})`} {contact.phone && `— ${contact.phone}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {companies.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Firma bulunamadı</div>}
    </div>
  )
}
