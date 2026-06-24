import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const EMPLOYEE_TABS = [
  { path: '/', label: 'מלאי', icon: '📦' },
  { path: '/scan', label: 'סריקה', icon: '📷' },
  { path: '/delivery', label: 'משלוח', icon: '🚚' },
];
const MANAGER_TABS = [
  ...EMPLOYEE_TABS,
  { path: '/reports', label: 'דוחות', icon: '📊' },
];

const AppShell: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = user?.role === 'manager' ? MANAGER_TABS : EMPLOYEE_TABS;

  return (
    <div className="page">
      {/* Top bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E2E8F0',
        padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{title}</div>
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

      {/* Content */}
      <div className="page-body">{children}</div>

      {/* Bottom nav */}
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
