import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { locationApi, productApi, movementApi } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Location, Product } from '../types';

const TYPE_ICON: Record<string, string> = { fridge: '❄️', freezer: '🧊', warehouse: '📦' };

// Inline-editable price field — click to edit, Enter/blur to save.
function PriceField({ value, editable, onSave }: { value: number; editable: boolean; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));

  const commit = () => {
    const num = Number(val);
    if (!isNaN(num) && num >= 0) onSave(num);
    setEditing(false);
  };

  if (!editable) {
    return <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>₪{value.toFixed(2)}</span>;
  }

  if (editing) {
    return (
      <input
        autoFocus type="number" min="0" step="0.5" inputMode="decimal"
        value={val} onChange={e => setVal(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{ width: 64, padding: '2px 6px', borderRadius: 6, border: '2px solid #C8102E', fontSize: '0.74rem', textAlign: 'center' }}
      />
    );
  }

  return (
    <span
      onClick={() => { setVal(String(value)); setEditing(true); }}
      style={{ fontSize: '0.72rem', color: value > 0 ? '#64748B' : '#D97706', cursor: 'pointer', borderBottom: '1px dashed #CBD5E1' }}
      title="לחץ לעריכת מחיר"
    >
      ₪{value.toFixed(2)} ✏
    </span>
  );
}

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [busyId, setBusyId]       = useState<string | null>(null);
  const [error, setError]         = useState('');

  const load = () => Promise.all([locationApi.getAll(), productApi.getAll()])
    .then(([l, p]) => { setLocations(l.data); setProducts(p.data); });

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  if (loading) return <AppShell title="מלאי"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  const matchesSearch = (p: Product) => !search || p.name.includes(search) || (p.sku || '').includes(search);

  const filteredLocations = locations.filter(loc =>
    products.some(p => p.locationId === loc.id && matchesSearch(p))
  );

  const lowStockTotal = products.filter(p => p.quantity <= p.minQty).length;

  // Direct +1/-1 adjustment from the inventory list — goes through the same
  // logged stock-in/stock-out endpoints as barcode scanning, so every change
  // still shows up correctly in reports with the right user/time/shift.
  const adjust = async (product: Product, delta: 1 | -1) => {
    if (busyId) return; // avoid double-taps while a request is in flight
    setError('');
    setBusyId(product.id);
    try {
      if (delta === 1) {
        await movementApi.stockIn({ productId: product.id, locationId: product.locationId, quantity: 1 });
      } else {
        if (product.quantity <= 0) { setBusyId(null); return; }
        await movementApi.stockOut({ productId: product.id, locationId: product.locationId, quantity: 1 });
      }
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + delta } : p));
    } catch (e: any) {
      setError(e.response?.data?.error || 'שגיאה בעדכון כמות');
    } finally {
      setBusyId(null);
    }
  };

  const savePrice = async (product: Product, price: number) => {
    try {
      await productApi.update(product.id, { price });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, price } : p));
    } catch (e: any) {
      setError(e.response?.data?.error || 'שגיאה בעדכון מחיר');
    }
  };

  return (
    <AppShell title="מלאי לנדוור">
      {lowStockTotal > 0 && (
        <div
          onClick={() => navigate('/alerts')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
            background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 12,
            marginBottom: 14, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#DC2626' }}>{lowStockTotal} מוצרים דורשים הזמנה</div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>לחץ לצפייה בהתראות המלאי</div>
          </div>
          <span style={{ color: '#DC2626' }}>›</span>
        </div>
      )}

      <input
        className="form-control"
        placeholder="🔍 חיפוש מוצר..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>⚠️ {error}</div>}

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
                    const busy = busyId === p.id;
                    return (
                      <div key={p.id} style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F8FAFC', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{p.name}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                            {p.sku && <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'monospace' }}>מק"ט: {p.sku}</span>}
                            <PriceField value={p.price} editable={isManager} onSave={price => savePrice(p, price)} />
                          </div>
                        </div>

                        {/* Direct +/- quantity stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => adjust(p, -1)}
                            disabled={busy || p.quantity <= 0}
                            style={{
                              width: 30, height: 30, borderRadius: 8, border: '1.5px solid #FCA5A5',
                              background: '#FEF2F2', color: '#DC2626', fontSize: '1rem', fontWeight: 700,
                              opacity: (busy || p.quantity <= 0) ? 0.4 : 1,
                            }}
                          >−</button>

                          <div style={{ minWidth: 38, textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: isLow ? '#DC2626' : '#1E293B' }}>{p.quantity}</div>
                            <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{p.unit}</div>
                          </div>

                          <button
                            onClick={() => adjust(p, 1)}
                            disabled={busy}
                            style={{
                              width: 30, height: 30, borderRadius: 8, border: '1.5px solid #86EFAC',
                              background: '#F0FDF4', color: '#15803D', fontSize: '1rem', fontWeight: 700,
                              opacity: busy ? 0.4 : 1,
                            }}
                          >+</button>
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

      {isManager && (
        <button onClick={() => navigate('/products')} className="btn btn-secondary" style={{ width: '100%', marginTop: 16 }}>
          🛠 ניהול מוצרים ומק"טים
        </button>
      )}
    </AppShell>
  );
};

export default InventoryPage;
