import React, { useRef, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { barcodeApi, movementApi } from '../api';
import type { Product, Location } from '../types';

interface ScanResult { direction: 'in' | 'out'; location: Location; products: Product[]; }

const ScanPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ name: string; qty: number; dir: 'in'|'out' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  const handleScan = async () => {
    if (!code.trim()) return;
    setLoading(true); setError(''); setSuccess(null);
    try {
      const res = await barcodeApi.lookup(code.trim());
      setResult(res.data);
      setCode('');
    } catch { setError('ברקוד לא נמצא: ' + code); setCode(''); }
    finally { setLoading(false); }
  };

  const handleSelect = (p: Product) => {
    setSelected(p); setQty(''); setError('');
    setTimeout(() => qtyRef.current?.focus(), 80);
  };

  const handleConfirm = async () => {
    if (!result || !selected || !qty || Number(qty) <= 0) return;
    setLoading(true); setError('');
    try {
      const payload = { productId: selected.id, locationId: result.location.id, quantity: Number(qty) };
      if (result.direction === 'in') await movementApi.stockIn(payload);
      else await movementApi.stockOut(payload);
      setSuccess({ name: selected.name, qty: Number(qty), dir: result.direction });
      setResult(null); setSelected(null); setQty('');
    } catch (e: any) { setError(e.response?.data?.error || 'שגיאה'); }
    finally { setLoading(false); }
  };

  const reset = () => { setResult(null); setSelected(null); setQty(''); setError(''); setSuccess(null); setTimeout(() => inputRef.current?.focus(), 100); };

  const dirColor = result?.direction === 'in' ? '#16A34A' : '#DC2626';
  const dirBg    = result?.direction === 'in' ? '#F0FDF4' : '#FEF2F2';
  const dirLabel = result?.direction === 'in' ? '▼ כניסת מלאי' : '▲ יציאת מלאי';

  return (
    <AppShell title="סריקת ברקוד">
      {success && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', marginBottom: 16, background: success.dir === 'in' ? '#F0FDF4' : '#FEF2F2', border: `1.5px solid ${success.dir === 'in' ? '#86EFAC' : '#FCA5A5'}` }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{success.name}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: success.dir === 'in' ? '#16A34A' : '#DC2626' }}>
            {success.dir === 'in' ? '+' : '-'}{success.qty}
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={reset}>סריקה נוספת</button>
        </div>
      )}

      {!result && !success && (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>📷</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>סרוק ברקוד מיקום</div>
          <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: 24 }}>ירוק = כניסה · אדום = יציאה</div>
          <input
            ref={inputRef} autoFocus className="form-control"
            placeholder="הזן/סרוק קוד..." value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            style={{ textAlign: 'center', fontSize: '1.1rem', fontFamily: 'monospace', marginBottom: 12 }}
          />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleScan} disabled={loading || !code.trim()}>
            {loading ? 'מחפש...' : 'חפש מיקום'}
          </button>
          {error && <div className="alert alert-danger" style={{ marginTop: 14 }}>{error}</div>}
        </div>
      )}

      {result && !selected && (
        <>
          <div style={{ background: dirBg, border: `1.5px solid ${dirColor}33`, borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: dirColor }}>{dirLabel}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{result.location.name}</div>
            </div>
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.82rem' }}>← חזרה</button>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: 8 }}>בחר מוצר</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.products.map(p => (
              <div key={p.id} onClick={() => handleSelect(p)} className="card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>במלאי: {p.quantity} {p.unit}</div>
                </div>
                <span style={{ color: dirColor, fontSize: '1.3rem' }}>{result.direction === 'in' ? '＋' : '－'}</span>
              </div>
            ))}
            {result.products.length === 0 && <div className="empty-state"><div className="empty-icon">📭</div><h3 style={{ color: '#64748B' }}>אין מוצרים במיקום זה</h3></div>}
          </div>
        </>
      )}

      {result && selected && (
        <div className="card" style={{ padding: '24px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selected.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{result.location.name}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.82rem' }}>← חזרה</button>
          </div>

          <div style={{ background: dirBg, borderRadius: 10, padding: '12px 14px', marginBottom: 18, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B' }}>מלאי נוכחי</span>
            <strong>{selected.quantity} {selected.unit}</strong>
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 10 }}>כמות {result.direction === 'in' ? 'שנכנסה' : 'שיצאה'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button onClick={() => setQty(q => String(Math.max(0, Number(q || 0) - 1)))} style={{ width: 48, height: 48, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 24, background: '#F8FAFC' }}>−</button>
            <input ref={qtyRef} type="number" min="0" inputMode="decimal" className="form-control" style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 800, flex: 1 }} value={qty} onChange={e => setQty(e.target.value)} />
            <button onClick={() => setQty(q => String(Number(q || 0) + 1))} style={{ width: 48, height: 48, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 24, background: '#F8FAFC' }}>+</button>
          </div>

          {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}

          <button
            className="btn" style={{ width: '100%', background: dirColor, color: '#fff', padding: 15, fontSize: '1rem' }}
            onClick={handleConfirm} disabled={loading || !qty || Number(qty) <= 0}
          >
            {loading ? 'שומר...' : `${result.direction === 'in' ? '✓ אישור כניסה' : '✓ אישור יציאה'} — ${qty || 0} ${selected.unit}`}
          </button>
        </div>
      )}
    </AppShell>
  );
};

export default ScanPage;
