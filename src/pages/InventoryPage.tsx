import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { locationApi, productApi } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Location, Product } from '../types';

const TYPE_ICON: Record<string, string> = { fridge: '❄️', freezer: '🧊', warehouse: '📦' };

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([locationApi.getAll(), productApi.getAll()])
      .then(([l, p]) => { setLocations(l.data); setProducts(p.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell title="מלאי"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  const matchesSearch = (p: Product) => !search || p.name.includes(search) || (p.sku || '').includes(search);

  const filteredLocations = locations.filter(loc =>
    products.some(p => p.locationId === loc.id && matchesSearch(p))
  );

  return (
    <AppShell title="מלאי לנדוור">
      <input
        className="form-control"
        placeholder="🔍 חיפוש מוצר..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredLocations.map(loc => {
          const locProducts = products.filter(p => p.locationId === loc.id && matchesSearch(p));
          const lowCount = locProducts.filter(p => p.quantity <= p.minQty).length;
          const isOpen = expanded === loc.id || !!search;

          return (
            <div key={loc.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                onClick={() => setExpanded(expanded === loc.id ? null : loc.id)}
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              >
                <span style={{ fontSize: '1.3rem' }}>{TYPE_ICON[loc.type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{loc.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{locProducts.length} מוצרים{lowCount > 0 ? ` · ${lowCount} נמוכים` : ''}</div>
                </div>
                {lowCount > 0 && <span style={{ background: '#FEF3C7', color: '#D97706', borderRadius: 20, padding: '3px 9px', fontSize: '0.72rem', fontWeight: 700 }}>⚠ {lowCount}</span>}
                <span style={{ color: '#CBD5E1', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid #F1F5F9' }}>
                  {locProducts.map(p => {
                    const isLow = p.quantity <= p.minQty;
                    return (
                      <div key={p.id} style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F8FAFC' }}>
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{p.name}</div>
                          {p.sku && <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'monospace' }}>מק"ט: {p.sku}</div>}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: isLow ? '#DC2626' : '#1E293B' }}>{p.quantity}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{p.unit}</div>
                        </div>
                      </div>
                    );
                  })}
                  {locProducts.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>אין מוצרים תואמים</div>}
                </div>
              )}
            </div>
          );
        })}
        {filteredLocations.length === 0 && (
          <div className="empty-state"><div className="empty-icon">🔍</div><h3 style={{ color: '#64748B' }}>לא נמצאו מוצרים</h3></div>
        )}
      </div>

      {user?.role === 'manager' && (
        <button onClick={() => navigate('/products')} className="btn btn-secondary" style={{ width: '100%', marginTop: 16 }}>
          🛠 ניהול מוצרים ומק"טים
        </button>
      )}
    </AppShell>
  );
};

export default InventoryPage;
