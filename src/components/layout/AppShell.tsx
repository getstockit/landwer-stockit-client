import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportApi } from '../../api';

const EMPLOYEE_TABS = [
  { path: '/', label: 'מלאי', icon: '📦' },
  { path: '/scan', label: 'סריקה', icon: '📷' },
  { path: '/delivery', label: 'משלוח', icon: '🚚' },
];
const MANAGER_TABS = [
  ...EMPLOYEE_TABS,
  { path: '/reports', label: 'דוחות', icon: '📊' },
];

// Full menu shown in the side drawer — every page in the app, grouped by access level.
const EMPLOYEE_MENU = [
  { path: '/', label: 'מלאי', icon: '📦' },
  { path: '/scan', label: 'סריקה', icon: '📷' },
  { path: '/delivery', label: 'קליטת תעודת משלוח', icon: '🚚' },
  { path: '/alerts', label: 'התראות מלאי', icon: '🔔' },
];
const MANAGER_MENU = [
  ...EMPLOYEE_MENU,
  { path: '/reports', label: 'דוחות', icon: '📊' },
  { path: '/products', label: 'ניהול מוצרים ומק"טים', icon: '🛠' },
  { path: '/barcodes', label: 'ברקודים — הדפסה', icon: '🏷' },
  { path: '/team', label: 'ניהול צוות', icon: '👥' },
];

const AppShell: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const tabs = user?.role === 'manager' ? MANAGER_TABS : EMPLOYEE_TABS;
  const menuItems = user?.role === 'manager' ? MANAGER_MENU : EMPLOYEE_MENU;

  const goTo = (path: string) => { setMenuOpen(false); navigate(path); };

  // Poll the low-stock count so the badge stays roughly up to date as the
  // user moves between screens, without needing a websocket for this scale.
  useEffect(() => {
    let cancelled = false;
    const fetchCount = () => {
      reportApi.lowStock().then(r => { if (!cancelled) setLowStockCount(r.data.count); }).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [location.pathname]);

  return (
    <div className="page">
      {/* Top bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E2E8F0',
        padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setMenuOpen(true)} aria-label="תפריט" style={{
            position: 'relative', width: 36, height: 36, borderRadius: 10, border: '1px solid #E2E8F0',
            background: '#F8FAFC', fontSize: '1.2rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            ☰
            {lowStockCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, left: -5, minWidth: 18, height: 18, borderRadius: 9,
                background: '#DC2626', color: '#fff', fontSize: '0.62rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                border: '1.5px solid #fff',
              }}>{lowStockCount > 99 ? '99+' : lowStockCount}</span>
            )}
          </button>
          <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#1E293B' }}>{user?.name}</div>
            <div>{user?.role === 'manager' ? '👑 מנהל' : '👤 עובד'}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            width: 34, height: 34, borderRadius: '50%', border: '1px solid #E2E8F0',
            background: '#F8FAFC', fontSize: '1rem',
          }}>🚪</button>
        </div>
      </div>

      {/* Side drawer menu */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 270, maxWidth: '82vw', height: '100%', background: '#fff',
              boxShadow: '4px 0 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
              padding: '20px 16px', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#C8102E,#9e0c24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>☕</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Stock-It</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>לנדוור · באר שבע</div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginBottom: 8, paddingRight: 4 }}>תפריט</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {menuItems.map(item => {
                const active = location.pathname === item.path;
                const isAlerts = item.path === '/alerts';
                return (
                  <button key={item.path} onClick={() => goTo(item.path)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                    borderRadius: 10, border: 'none', textAlign: 'right',
                    background: active ? 'rgba(200,16,46,0.08)' : 'transparent',
                    color: active ? '#C8102E' : '#1E293B', fontWeight: active ? 700 : 500,
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.88rem', flex: 1 }}>{item.label}</span>
                    {isAlerts && lowStockCount > 0 && (
                      <span style={{
                        minWidth: 20, height: 20, borderRadius: 10, background: '#DC2626', color: '#fff',
                        fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: '0 5px',
                      }}>{lowStockCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1 }} />

            <button onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
              borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2',
              color: '#DC2626', fontWeight: 600, textAlign: 'right', marginTop: 16,
            }}>
              <span style={{ fontSize: '1.1rem' }}>🚪</span>
              <span style={{ fontSize: '0.85rem' }}>התנתקות</span>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="page-body">{children}</div>

      {/* Bottom nav — quick access to the most-used pages only */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
        borderTop: '1px solid #E2E8F0', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}>
        {tabs.map(t => {
          const active = location.pathname === t.path;
          return (
            <button key={t.path} onClick={() => navigate(t.path)} style={{
              flex: 1, padding: '10px 0 8px', background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              color: active ? '#C8102E' : '#94A3B8',
            }}>
              <span style={{ fontSize: '1.3rem' }}>{t.icon}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: active ? 700 : 500 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppShell;
