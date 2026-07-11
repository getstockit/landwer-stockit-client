import React, { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { reportApi, alertsApi, pushApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { isPushSupported, isIosNotStandalone, enablePush, disablePush } from '../utils/push';

interface LowStockItem {
  id: string; name: string; unit: string; minQty: number;
  quantity: number; locationName: string; supplierName: string | null;
}

interface SupplierReminder {
  supplier: { id: string; name: string };
  orderDayName: string;
  products: { id: string; name: string; unit: string; minQty: number; quantity: number; locationName: string }[];
}

const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [reminders, setReminders] = useState<SupplierReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    Promise.all([
      reportApi.lowStock(),
      alertsApi.supplierReminders(),
      isManager ? pushApi.status() : Promise.resolve({ data: { subscribed: false } }),
    ]).then(([lowStockRes, remindersRes, pushRes]) => {
      setItems(lowStockRes.data.items);
      setReminders(remindersRes.data.reminders);
      setPushSubscribed(pushRes.data.subscribed);
    }).finally(() => setLoading(false));
  }, [isManager]);

  const handleTogglePush = async () => {
    setPushError(''); setPushBusy(true);
    try {
      if (pushSubscribed) { await disablePush(); setPushSubscribed(false); }
      else { await enablePush(); setPushSubscribed(true); }
    } catch (e: any) {
      setPushError(e.message || 'שגיאה בהפעלת התראות');
    } finally {
      setPushBusy(false);
    }
  };

  if (loading) return <AppShell title="התראות"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  const noAlerts = items.length === 0 && reminders.length === 0;

  return (
    <AppShell title="התראות">
      {isManager && (
        <div className="card" style={{ marginBottom: 18, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>🔔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>התראות Push</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {pushSubscribed ? 'פעיל במכשיר הזה — נשלחת תזכורת יומית בבוקר' : 'קבל תזכורת יומית למכשיר הזה על מלאי נמוך והזמנות ספקים'}
              </div>
            </div>
            <button onClick={handleTogglePush} disabled={pushBusy || (!isPushSupported() && !pushSubscribed)} style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: '0.8rem',
              background: pushSubscribed ? '#FEF2F2' : '#16A34A', color: pushSubscribed ? '#DC2626' : '#fff',
              opacity: pushBusy ? 0.6 : 1,
            }}>
              {pushBusy ? '...' : pushSubscribed ? 'כבה' : 'הפעל'}
            </button>
          </div>
          {!isPushSupported() && !pushSubscribed && (
            <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: 8 }}>
              {isIosNotStandalone()
                ? '⚠️ באייפון זה עובד רק דרך קיצור הדרך במסך הבית — הוסף/י את האפליקציה למסך הבית ופתח/י אותה משם.'
                : '⚠️ הדפדפן הזה לא תומך בהתראות Push.'}
            </div>
          )}
          {pushError && <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 8 }}>{pushError}</div>}
        </div>
      )}

      {noAlerts && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3 style={{ color: '#16A34A' }}>הכל תקין</h3>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>אין התראות מלאי או הזמנות ספקים כרגע</p>
        </div>
      )}

      {reminders.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563EB', marginBottom: 8 }}>
            🚚 תזכורות הזמנה מספקים להיום
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reminders.map(r => {
              const isOpen = expanded === r.supplier.id;
              return (
                <div key={r.supplier.id} className="card" style={{ padding: 0, overflow: 'hidden', borderColor: '#BFDBFE' }}>
                  <div onClick={() => setExpanded(isOpen ? null : r.supplier.id)}
                    style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#EFF6FF' }}>
                    <span style={{ fontSize: '1.3rem' }}>🚚</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{r.supplier.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>יום ההזמנה שלהם: {r.orderDayName} · {r.products.length} מוצרים</div>
                    </div>
                    <span style={{ color: '#93C5FD', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #F1F5F9' }}>
                      {r.products.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>לספק זה עדיין לא משויכים מוצרים (ניתן לשייך בעמוד "מוצרים")</div>}
                      {r.products.map(p => {
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

      {items.length > 0 && (
        <>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
            ⚠️ מלאי נמוך ({items.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => {
              const isOut = item.quantity === 0;
              return (
                <div key={item.id} className="card" style={{
                  padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: isOut ? '#FEF2F2' : '#FFF7ED',
                  borderColor: isOut ? '#FCA5A5' : '#FED7AA',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{item.locationName}</div>
                    <div style={{ fontSize: '0.72rem', color: item.supplierName ? '#2563EB' : '#CBD5E1', marginTop: 1 }}>
                      {item.supplierName ? `🚚 ${item.supplierName}` : 'ללא ספק משויך'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isOut ? '#DC2626' : '#D97706' }}>
                      {item.quantity} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>{item.unit}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>מינימום: {item.minQty}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
};

export default AlertsPage;
