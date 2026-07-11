import React, { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { alertsApi } from '../api';

const AlertsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { alertsApi.get().then(r => setData(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <AppShell title="התראות"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;
  if (!data) return <AppShell title="התראות"><div className="empty-state">שגיאה בטעינת התראות</div></AppShell>;

  const noAlerts = data.lowStock.length === 0 && data.supplierReminders.length === 0;

  return (
    <AppShell title="התראות">
      {noAlerts && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3 style={{ color: '#64748B' }}>אין התראות כרגע</h3>
        </div>
      )}

      {data.supplierReminders.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563EB', marginBottom: 8 }}>
            🚚 מחר יום הזמנה — {data.tomorrowName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.supplierReminders.map((r: any) => {
              const isOpen = expanded === r.supplier.id;
              return (
                <div key={r.supplier.id} className="card" style={{ padding: 0, overflow: 'hidden', borderColor: '#BFDBFE' }}>
                  <div onClick={() => setExpanded(isOpen ? null : r.supplier.id)}
                    style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#EFF6FF' }}>
                    <span style={{ fontSize: '1.3rem' }}>🚚</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{r.supplier.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>מחר ({r.orderDayName}) יום הזמנה · {r.products.length} מוצרים</div>
                    </div>
                    <span style={{ color: '#93C5FD', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #F1F5F9' }}>
                      {r.products.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>לספק זה עדיין לא משויכים מוצרים (ניתן לשייך בעמוד "מוצרים")</div>}
                      {r.products.map((p: any) => {
                        const isLow = p.quantity <= p.minQty;
                        return (
                          <div key={p.id} style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F8FAFC' }}>
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{p.locationName}</div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: isLow ? '#DC2626' : '#1E293B' }}>{p.quantity}</div>
                              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{p.unit} · מינ׳ {p.minQty}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.lowStock.length > 0 && (
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
            ⚠️ מלאי נמוך ({data.lowStock.length})
          </div>
          <div className="card" style={{ padding: 0 }}>
            {data.lowStock.map((p: any) => (
              <div key={p.id} style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F8FAFC' }}>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{p.locationName}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#DC2626' }}>{p.quantity}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{p.unit} · מינ׳ {p.minQty}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default AlertsPage;
