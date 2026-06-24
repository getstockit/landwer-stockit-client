import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const DISMISS_KEY = 'ldw_ios_install_hint_dismissed';

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  // iOS Safari sets this when launched from a home-screen icon
  return ('standalone' in window.navigator) && (window.navigator as any).standalone === true;
}

const IosInstallHint: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    // Only show on the login screen — every other page has a fixed bottom
    // nav bar that this banner would otherwise overlap.
    const onLoginPage = location.pathname === '/login';
    setVisible(onLoginPage && isIos() && !isInStandaloneMode() && !dismissed);
  }, [location.pathname]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 2000,
      background: '#1a1d27', color: '#fff', padding: '14px 16px',
      paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
      direction: 'rtl',
    }}>
      <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>📲</span>
      <div style={{ flex: 1, fontSize: '0.82rem', lineHeight: 1.4 }}>
        להתקנת האפליקציה: לחץ על כפתור השיתוף{' '}
        <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1v11M8 1L4.5 4.5M8 1l3.5 3.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="1" y="8" width="14" height="11" rx="1.5" stroke="#fff" strokeWidth="1.4"/>
          </svg>
        </span>
        {' '}בסוף בדפדפן, ואז <strong>"הוסף למסך הבית"</strong>
      </div>
      <button onClick={dismiss} style={{
        background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
        width: 28, height: 28, color: '#fff', fontSize: '0.9rem', flexShrink: 0,
      }}>✕</button>
    </div>
  );
};

export default IosInstallHint;
