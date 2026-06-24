import React, { useRef, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { deliveryApi, productApi } from '../api';
import type { DeliveryLineItem, Product } from '../types';

type Step = 'upload' | 'review' | 'done';

const DeliveryPage: React.FC = () => {
  const [step, setStep] = useState<Step>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supplier, setSupplier] = useState('');
  const [matched, setMatched] = useState<DeliveryLineItem[]>([]);
  const [unmatched, setUnmatched] = useState<DeliveryLineItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [done, setDone] = useState<{ count: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleAnalyze = async () => {
    if (!imageFile) { setError('נא לצרף תמונה'); return; }
    setLoading(true); setError('');
    try {
      const base64: string = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res((e.target?.result as string).split(',')[1]);
        r.readAsDataURL(imageFile);
      });
      const [analyzeRes, productsRes] = await Promise.all([
        deliveryApi.analyze({ imageBase64: base64, mimeType: imageFile.type }),
        productApi.getAll(),
      ]);
      setSupplier(analyzeRes.data.supplier || '');
      setMatched(analyzeRes.data.matched || []);
      setUnmatched(analyzeRes.data.unmatched || []);
      setAllProducts(productsRes.data);
      setStep('review');
    } catch (e: any) { setError(e.response?.data?.error || 'שגיאה בניתוח'); }
    finally { setLoading(false); }
  };

  const updateQty = (idx: number, list: 'matched'|'unmatched', val: number) => {
    if (list === 'matched') setMatched(p => p.map((it, i) => i === idx ? { ...it, quantity: val } : it));
    else setUnmatched(p => p.map((it, i) => i === idx ? { ...it, quantity: val } : it));
  };

  const removeItem = (idx: number, list: 'matched'|'unmatched') => {
    if (list === 'matched') setMatched(p => p.filter((_, i) => i !== idx));
    else setUnmatched(p => p.filter((_, i) => i !== idx));
  };

  const linkProduct = (idx: number, productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const item = unmatched[idx];
    setUnmatched(p => p.filter((_, i) => i !== idx));
    setMatched(p => [...p, { ...item, productId, matched: true, unit: product.unit }]);
  };

  const handleConfirm = async () => {
    setLoading(true); setError('');
    try {
      const res = await deliveryApi.confirm({ supplier, items: matched });
      setDone({ count: res.data.items.length });
      setStep('done');
    } catch (e: any) { setError(e.response?.data?.error || 'שגיאה בשמירה'); }
    finally { setLoading(false); }
  };

  const resetAll = () => {
    setStep('upload'); setImageFile(null); setPreview(''); setSupplier('');
    setMatched([]); setUnmatched([]); setDone(null); setError('');
  };

  return (
    <AppShell title="קליטת תעודת משלוח">
      {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>⚠️ {error}</div>}

      {step === 'upload' && (
        <div className="card" style={{ padding: '24px 18px' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed #CBD5E1', borderRadius: 14, padding: preview ? 8 : 36, textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', marginBottom: 16 }}
          >
            {preview ? (
              <img src={preview} alt="תצוגה מקדימה" style={{ maxHeight: 220, borderRadius: 10, width: '100%', objectFit: 'contain' }} />
            ) : (
              <>
                <div style={{ fontSize: 44, marginBottom: 10 }}>📷</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>צלם או בחר תעודת משלוח</div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 4 }}>AI יזהה את כל המוצרים אוטומטית</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImage} />

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAnalyze} disabled={!imageFile || loading}>
            {loading ? '⏳ מנתח עם AI...' : '✨ נתח תעודה'}
          </button>
        </div>
      )}

      {step === 'review' && (
        <>
          {supplier && <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14 }}>ספק: {supplier}</div>}

          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16A34A', marginBottom: 8 }}>✓ זוהו אוטומטית ({matched.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {matched.map((item, i) => (
              <div key={i} className="card" style={{ padding: '10px 12px', background: '#F0FDF4', borderColor: '#86EFAC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.productName}</div>
                    {item.sku && <div style={{ fontSize: '0.68rem', color: '#16A34A', fontFamily: 'monospace' }}>מק"ט: {item.sku}</div>}
                  </div>
                  <input type="number" min="0" value={item.quantity} onChange={e => updateQty(i, 'matched', Number(e.target.value))}
                    style={{ width: 56, padding: '5px 6px', borderRadius: 6, border: '1px solid #86EFAC', textAlign: 'center', fontWeight: 700 }} />
                  <span style={{ fontSize: '0.74rem', color: '#64748B', minWidth: 36 }}>{item.unit}</span>
                  <button onClick={() => removeItem(i, 'matched')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1rem' }}>✕</button>
                </div>
              </div>
            ))}
            {matched.length === 0 && <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: 12 }}>אין פריטים מזוהים</div>}
          </div>

          {unmatched.length > 0 && (
            <>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D97706', marginBottom: 8 }}>⚠️ לא זוהו ({unmatched.length}) — קשר ידנית</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {unmatched.map((item, i) => (
                  <div key={i} className="card" style={{ padding: '10px 12px', background: '#FEF3C7', borderColor: '#FDE68A' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 6 }}>{item.productName} — {item.quantity} {item.unit}</div>
                    <select className="form-control" style={{ fontSize: '0.82rem', padding: '7px 10px' }} defaultValue="" onChange={e => e.target.value && linkProduct(i, e.target.value)}>
                      <option value="">בחר מוצר קיים...</option>
                      {allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetAll}>ביטול</button>
            <button className="btn btn-success" style={{ flex: 2 }} onClick={handleConfirm} disabled={loading || matched.length === 0}>
              {loading ? 'שומר...' : `✓ הוסף למלאי (${matched.length})`}
            </button>
          </div>
        </>
      )}

      {step === 'done' && done && (
        <div className="card" style={{ textAlign: 'center', padding: '44px 20px' }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#16A34A', marginBottom: 6 }}>תעודה נקלטה בהצלחה</div>
          <div style={{ color: '#64748B', marginBottom: 20 }}>{done.count} מוצרים נוספו למלאי הקיים</div>
          <button className="btn btn-primary" onClick={resetAll}>📄 תעודה חדשה</button>
        </div>
      )}
    </AppShell>
  );
};

export default DeliveryPage;
