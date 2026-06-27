import React, { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { reportApi } from '../api';

interface LowStockItem {
  id: string; name: string; unit: string; minQty: number;
  quantity: number; locationName: string;
}

const AlertsPage: React.FC = () => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.lowStock().then(r => setItems(r.data.items)).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell title="התראות מלאי"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  return (
    <AppShell title="התראות מלאי">
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3 style={{ color: '#16A34A' }}>הכל תקין</h3>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>אין מוצרים מתחת לסף המינימום כרגע</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: 16 }}>
            <strong style={{ color: '#DC2626' }}>{items.length}</strong> מוצרים מתחת לסף המינימום שהוגדר — ממוינים מהחסר ביותר
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
