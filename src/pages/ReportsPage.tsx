import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { reportApi } from '../api';

type Tab = 'current' | 'history';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('current');
  const [current, setCurrent] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7*86400000).toISOString().slice(0,10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(true);

  const loadCurrent = () => reportApi.current().then(r => setCurrent(r.data));
  const loadHistory = () => reportApi.history({ startDate, endDate }).then(r => setHistory(r.data));

  useEffect(() => { Promise.all([loadCurrent(), loadHistory()]).finally(() => setLoading(false)); }, []);

  const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;

  if (loading) return <AppShell title="דוחות"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  return (
    <AppShell title="דוחות">
      {/* Admin quick links */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        <button onClick={() => navigate('/products')} style={{ flex: '1 0 auto', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>🛠 מוצרים ומק"טים</button>
        <button onClick={() => navigate('/locations')} style={{ flex: '1 0 auto', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>❄️ מקררים</button>
        <button onClick={() => navigate('/suppliers')} style={{ flex: '1 0 auto', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>🚚 ספקים</button>
        <button onClick={() => navigate('/barcodes')} style={{ flex: '1 0 auto', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>🏷 ברקודים</button>
        <button onClick={() => navigate('/team')} style={{ flex: '1 0 auto', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>👥 צוות</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button className={tab === 'current' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ flex: 1 }} onClick={() => setTab('current')}>📊 מצב נוכחי</button>
        <button className={tab === 'history' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ flex: 1 }} onClick={() => setTab('history')}>📅 היסטוריה</button>
      </div>

      {tab === 'current' && current && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16A34A' }}>{fmt(current.totalValue)}</div>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>שווי מלאי כולל</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: current.lowStockCount > 0 ? '#DC2626' : '#1E293B' }}>{current.lowStockCount}</div>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>מוצרים במלאי נמוך</div>
            </div>
          </div>

          {current.lowStock?.length > 0 && (
            <div className="card" style={{ marginBottom: 18, background: '#FEF2F2', borderColor: '#FCA5A5' }}>
              <div style={{ fontWeight: 700, color: '#DC2626', marginBottom: 10, fontSize: '0.88rem' }}>⚠️ דורש תשומת לב</div>
              {current.lowStock.map((p: any) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #FECACA', fontSize: '0.85rem' }}>
                  <span>{p.name}</span>
                  <span style={{ fontWeight: 700, color: '#DC2626' }}>{p.quantity} {p.unit}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: 8 }}>שווי לפי מיקום</div>
          <div className="card" style={{ padding: 0 }}>
            {Object.values(current.byLocation || {}).map((loc: any, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.86rem' }}>{loc.name}</span>
                <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#16A34A' }}>{fmt(loc.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'history' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>מתאריך</label>
              <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>עד תאריך</label>
              <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 18 }} onClick={loadHistory}>🔍 הצג תקופה</button>

          {history && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
                <div className="card" style={{ textAlign: 'center', padding: '12px 6px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16A34A' }}>{fmt(history.summary.totalIn)}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>כניסות ({history.summary.countIn})</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '12px 6px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#DC2626' }}>{fmt(history.summary.totalOut)}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>יציאות ({history.summary.countOut})</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '12px 6px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563EB' }}>{fmt(history.summary.totalDelivery)}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>משלוחים ({history.summary.countDelivery})</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: 8 }}>לפי משמרת</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
                {[['morning','🌅 בוקר'],['afternoon','☀️ צהריים'],['evening','🌙 ערב']].map(([key,label]) => {
                  const s = history.summary.byShift[key];
                  return (
                    <div key={key} className="card" style={{ textAlign: 'center', padding: '10px 4px' }}>
                      <div style={{ fontSize: '0.78rem', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{fmt(s.value)}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{s.count} פעולות</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: 8 }}>לפי עובד</div>
              <div className="card" style={{ padding: 0, marginBottom: 18 }}>
                {Object.entries(history.summary.byUser || {}).map(([name, s]: [string, any], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '0.86rem' }}>{name}</span>
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>{s.count} פעולות · {fmt(s.value)}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: 8 }}>יומן פעולות ({history.movements.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.movements.slice(0, 50).map((m: any) => (
                  <div key={m.id} className="card" style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1rem' }}>{m.type === 'in' ? '⬇️' : m.type === 'out' ? '⬆️' : '🚚'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{m.productName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{m.userName} · {m.shiftHe} · {new Date(m.createdAt).toLocaleString('he-IL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: m.type === 'out' ? '#DC2626' : '#16A34A', fontSize: '0.86rem' }}>
                      {m.type === 'out' ? '-' : '+'}{m.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </AppShell>
  );
};

export default ReportsPage;
