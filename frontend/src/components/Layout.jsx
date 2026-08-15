import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Car, ClipboardList, Building2, BarChart3, Bot, Camera, LogOut, Menu, X, Shield, ShieldCheck, AlertTriangle, Wrench, CircleDot, Bell, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Layout() {
  const { user, logout, api } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    const fetchUnread = () => {
      api.get('/api/notifications', { params: { isRead: false } })
        .then((res) => { if (res.data.success) setUnread(res.data.data.length) })
        .catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [user, api])

  // Giriş yapılmamışsa sayfayı boş bırakmak yerine login ekranına yönlendir.
  if (!user) return <Navigate to="/login" replace />

  const nav = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vehicles', label: 'Araçlar', icon: Car },
    { path: '/tasks', label: 'İşler', icon: ClipboardList },
    { path: '/insurance', label: 'Trafik Sigortası', icon: Shield },
    { path: '/casco', label: 'Kasko', icon: ShieldCheck },
    { path: '/repairs', label: 'Tamirler', icon: Wrench },
    { path: '/damages', label: 'Hasarlar', icon: AlertTriangle },
    { path: '/tires', label: 'Lastikler', icon: CircleDot },
    { path: '/companies', label: 'Firmalar', icon: Building2 },
    { path: '/reports', label: 'Raporlar', icon: BarChart3 },
    { path: '/ai', label: 'AI Asistan', icon: Bot },
    { path: '/ocr', label: 'Fatura OCR', icon: Camera },
    { path: '/notifications', label: 'Bildirimler', icon: Bell, badge: unread },
    ...(user.role === 'admin' ? [{ path: '/users', label: 'Kullanıcılar', icon: Users }] : []),
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Desktop */}
      <aside style={{ width: 240, background: '#1a1a2e', color: '#fff', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>🚛 Filo</h1>
          <p style={{ fontSize: 12, opacity: 0.6, margin: '4px 0 0' }}>{user.fullName}</p>
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {nav.map((item) => {
            const active = location.pathname.startsWith(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between',
                  padding: '12px 20px', textDecoration: 'none', color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent', fontWeight: 600, fontSize: 14,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Icon size={18} /> {item.label}</span>
                {!!item.badge && (
                  <span style={{ background: '#FF3B30', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '2px 7px' }}>{item.badge}</span>
                )}
              </Link>
            )
          })}
        </nav>
        <button onClick={() => { logout(); navigate('/login') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <LogOut size={18} /> Çıkış Yap
        </button>
      </aside>

      {/* Mobile Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 90 }} className="mobile-header">
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>🚛 Filo</h1>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: '#fff', position: 'relative' }}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
          {!menuOpen && !!unread && <span style={{ position: 'absolute', top: -4, right: -4, width: 9, height: 9, borderRadius: '50%', background: '#FF3B30' }} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: '#1a1a2e', zIndex: 80, padding: '16px', overflowY: 'auto' }}>
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0', color: '#fff', textDecoration: 'none', fontSize: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Icon size={20} /> {item.label}</span>
                {!!item.badge && <span style={{ background: '#FF3B30', color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 700, padding: '2px 8px' }}>{item.badge}</span>}
              </Link>
            )
          })}
          <button onClick={() => { logout(); navigate('/login') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', background: 'none', border: 'none', color: '#fff', fontSize: 16, width: '100%', textAlign: 'left' }}>
            <LogOut size={20} /> Çıkış Yap
          </button>
        </div>
      )}

      {/* Main Content */}
      <main style={{ marginLeft: 240, flex: 1, padding: '24px 32px', paddingTop: 80 }} className="main-content">
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          aside { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 72px 16px 24px !important; }
        }
        @media (min-width: 769px) {
          .mobile-header { display: none !important; }
        }
      `}</style>
    </div>
  )
}
