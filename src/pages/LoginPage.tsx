import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import type { UserListItem } from '../types';

type Mode = 'pick' | 'pin' | 'register' | 'register-manager';

const LoginPage: React.FC = () => {
  const { loginWithUser, register, registerManager } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('pick');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [bootstrapCode, setBootstrapCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi.listUsers().then(r => setUsers(r.data)).catch(() => setUsers([]));
  }, []);

  const handlePinSubmit = async () => {
    if (pin.length !== 4 || !selectedUser) return;
    setLoading(true); setError('');
    try { await loginWithUser(selectedUser.id, pin); navigate('/'); }
    catch (e: any) { setError(e.response?.data?.error || 'קוד שגוי'); setPin(''); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim() || newPin.length !== 4) { setError('שם וקוד 4 ספרות חובה'); return; }
    setLoading(true); setError('');
    try { await register(name, newPin); navigate('/'); }
    catch (e: any) { setError(e.response?.data?.error || 'שגיאה ברישום'); }
    finally { setLoading(false); }
  };

  const handleRegisterManager = async () => {
    if (!name.trim() || newPin.length !== 4) { setError('שם וקוד 4 ספרות חובה'); return; }
    const hasManager = users.some(u => u.role === 'manager');
    if (!hasManager && !bootstrapCode.trim()) { setError('יש להזין קוד הקמה'); return; }
    setLoading(true); setError('');
    try { await registerManager(name, newPin, bootstrapCode); navigate('/'); }
    catch (e: any) { setError(e.response?.data?.error || 'שגיאה ברישום מנהל'); }
    finally { setLoading(false); }
  };

  const PinPad = ({ value }: { value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '20px 0' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: 48, height: 56, borderRadius: 12, border: '2px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', fontWeight: 700, background: '#fff',
          borderColor: value.length > i ? '#C8102E' : '#E2E8F0',
        }}>
          {value[i] ? '●' : ''}
        </div>
      ))}
    </div>
  );

  const Keypad = ({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 280, margin: '0 auto' }}>
      {[1,2,3,4,5,6,7,8,9].map(n => (
        <button key={n} onClick={() => { if (value.length < 4) { const v = value + n; onChange(v); if (v.length === 4) setTimeout(onSubmit, 150); } }}
          style={{ padding: '16px 0', fontSize: '1.3rem', fontWeight: 700, borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff' }}>
          {n}
        </button>
      ))}
      <button onClick={() => onChange('')} style={{ padding: '16px 0', fontSize: '0.85rem', fontWeight: 600, borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#94A3B8' }}>נקה</button>
      <button onClick={() => { if (value.length < 4) { const v = value + '0'; onChange(v); if (v.length === 4) setTimeout(onSubmit, 150); } }}
        style={{ padding: '16px 0', fontSize: '1.3rem', fontWeight: 700, borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff' }}>0</button>
      <button onClick={() => onChange(value.slice(0, -1))} style={{ padding: '16px 0', fontSize: '1.1rem', borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#F8FAFC' }}>⌫</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg,#1a1d27,#0f1117)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 24, padding: '32px 24px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#C8102E,#9e0c24)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 26, fontWeight: 900, color: '#fff' }}>☕</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>Stock-It</div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>לנדוור · באר שבע</div>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

        {mode === 'pick' && (
          <>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginBottom: 10 }}>בחר את עצמך</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
              {users.map(u => (
                <button key={u.id} onClick={() => { setSelectedUser(u); setPin(''); setError(''); setMode('pin'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                    textAlign: 'right', cursor: 'pointer',
                  }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.role === 'manager' ? '#7C3AED' : '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    {u.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{u.role === 'manager' ? '👑 מנהל' : '👤 עובד'}</div>
                  </div>
                </button>
              ))}
              {users.length === 0 && <div style={{ textAlign: 'center', color: '#94A3B8', padding: 20, fontSize: '0.85rem' }}>אין משתמשים עדיין — היה הראשון!</div>}
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 8 }} onClick={() => { setMode('register'); setError(''); }}>
              👤 משתמש חדש (עובד)
            </button>
            {!users.some(u => u.role === 'manager') && (
              <button className="btn" style={{ width: '100%', background: '#F5F3FF', color: '#7C3AED' }} onClick={() => { setMode('register-manager'); setError(''); }}>
                👑 הקמת משתמש מנהל ראשון
              </button>
            )}
          </>
        )}

        {mode === 'pin' && selectedUser && (
          <>
            <button onClick={() => setMode('pick')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.85rem', marginBottom: 12 }}>← חזרה</button>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedUser.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>הזן קוד אישי</div>
            </div>
            <PinPad value={pin} />
            <Keypad value={pin} onChange={setPin} onSubmit={handlePinSubmit} />
            {loading && <div style={{ textAlign: 'center', marginTop: 12, color: '#94A3B8', fontSize: '0.85rem' }}>מתחבר...</div>}
          </>
        )}

        {mode === 'register' && (
          <>
            <button onClick={() => setMode('pick')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.85rem', marginBottom: 16 }}>← חזרה</button>
            <div className="form-group">
              <label>השם שלך</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: דניאל" autoFocus />
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginTop: 16, marginBottom: 4 }}>בחר קוד אישי (4 ספרות)</div>
            <PinPad value={newPin} />
            <Keypad value={newPin} onChange={setNewPin} onSubmit={() => {}} />
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={handleRegister} disabled={loading || !name.trim() || newPin.length !== 4}>
              {loading ? 'נרשם...' : '✓ צור משתמש'}
            </button>
          </>
        )}

        {mode === 'register-manager' && (
          <>
            <button onClick={() => setMode('pick')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.85rem', marginBottom: 16 }}>← חזרה</button>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>👑 הקמת משתמש מנהל ראשון</div>
            <div className="form-group">
              <label>שם המנהל</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="שם מלא" autoFocus />
            </div>
            <div className="form-group">
              <label>קוד הקמה</label>
              <input className="form-control" value={bootstrapCode} onChange={e => setBootstrapCode(e.target.value)} placeholder="קוד שקיבלת" style={{ direction: 'ltr', textAlign: 'right' }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginTop: 16, marginBottom: 4 }}>קוד אישי (4 ספרות)</div>
            <PinPad value={newPin} />
            <Keypad value={newPin} onChange={setNewPin} onSubmit={() => {}} />
            <button className="btn" style={{ width: '100%', marginTop: 16, background: '#7C3AED', color: '#fff' }} onClick={handleRegisterManager} disabled={loading || !name.trim() || newPin.length !== 4}>
              {loading ? 'נרשם...' : '👑 צור משתמש מנהל'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
