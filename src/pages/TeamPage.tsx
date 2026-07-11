import React, { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import type { UserListItem, PendingUser } from '../types';

const TeamPage: React.FC = () => {
  const { user, registerManager } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => Promise.all([authApi.listUsers(), authApi.pendingUsers()])
    .then(([u, p]) => { setUsers(u.data); setPending(p.data); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try { await authApi.approveUser(id); await load(); }
    finally { setBusyId(null); }
  };

  const handleReject = async (id: string, uName: string) => {
    if (!window.confirm(`לדחות את הבקשה של "${uName}"?`)) return;
    setBusyId(id);
    try { await authApi.rejectUser(id); await load(); }
    finally { setBusyId(null); }
  };

  const handleAddManager = async () => {
    if (!name.trim() || pin.length !== 4) { setError('שם וקוד 4 ספרות חובה'); return; }
    setSaving(true); setError('');
    try {
      await registerManager(name, pin);
      setShowAdd(false);
      load();
    } catch (e: any) { setError(e.response?.data?.error || 'שגיאה'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id: string, uName: string) => {
    if (!window.confirm(`להשבית את המשתמש "${uName}"?`)) return;
    await authApi.deleteUser(id);
    load();
  };

  if (loading) return <AppShell title="צוות"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  return (
    <AppShell title="ניהול צוות">
      {pending.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#D97706', marginBottom: 8 }}>⏳ בקשות ממתינות לאישור ({pending.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(p => (
              <div key={p.id} className="card" style={{ padding: '12px 14px', background: '#FFFBEB', borderColor: '#FDE68A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#D97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {p.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>ביקש/ה להצטרף · {new Date(p.createdAt).toLocaleDateString('he-IL')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleReject(p.id, p.name)} disabled={busyId === p.id} style={{ flex: 1, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '8px 0', fontSize: '0.8rem', fontWeight: 700 }}>✕ דחה</button>
                  <button onClick={() => handleApprove(p.id)} disabled={busyId === p.id} style={{ flex: 2, background: '#16A34A', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 0', fontSize: '0.8rem', fontWeight: 700 }}>✓ אשר הצטרפות</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{users.length} משתמשים פעילים</div>
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={() => setShowAdd(true)}>+ הוסף מנהל</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.role === 'manager' ? '#7C3AED' : '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {u.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.name}{u.id === user?.id ? ' (אני)' : ''}</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{u.role === 'manager' ? '👑 מנהל' : '👤 עובד'}</div>
            </div>
            {u.id !== user?.id && (
              <button onClick={() => handleDeactivate(u.id, u.name)} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '5px 10px', fontSize: '0.74rem' }}>
                השבת
              </button>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 6 }}>👑 הוספת מנהל</div>
            <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: '0.78rem' }}>
              ⚠️ פעולה זו תחליף את ההתחברות הנוכחית שלך במשתמש המנהל החדש. הודע לו את הקוד שתבחר.
            </div>
            {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}
            <div className="form-group">
              <label>שם המנהל החדש</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label>קוד אישי (4 ספרות)</label>
              <input className="form-control" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,''))} style={{ direction: 'ltr', textAlign: 'center', fontSize: '1.2rem', letterSpacing: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>ביטול</button>
              <button className="btn" style={{ flex: 2, background: '#7C3AED', color: '#fff' }} onClick={handleAddManager} disabled={saving}>
                {saving ? 'שומר...' : 'צור מנהל'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default TeamPage;
