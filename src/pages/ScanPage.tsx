import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import AppShell from '../components/layout/AppShell';
import { barcodeApi, movementApi } from '../api';
import type { Product, Location } from '../types';

interface ScanResult { direction: 'in' | 'out'; location: Location; products: Product[]; }

const SCANNER_ELEMENT_ID = 'barcode-camera-region';

// Camera-based scanning only works reliably inside the native Android APK
// (via Capacitor's WebView, with the permission fix documented in
// MOBILE_INSTALL.md). On iOS, Safari refuses camera access for PWAs running
// in standalone mode (installed via "Add to Home Screen") — this is a known,
// unresolved WebKit limitation (bugs.webkit.org #185448), not something we
// can fix from app code. So on every platform except native Android, we
// fall back to typing the short code printed under each barcode instead.
function isNativeAndroidApp(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.getPlatform?.() === 'android';
}

const ScanPage: React.FC = () => {
  const supportsCamera = isNativeAndroidApp();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ name: string; qty: number; dir: 'in'|'out' } | null>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lookingUpRef = useRef(false); // guards against firing multiple lookups for the same camera frame burst

  // Stop the camera whenever we leave the "scanning" state — covers both
  // a successful scan and the component unmounting (navigating away).
  const stopCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* already stopped */ }
      try { scannerRef.current.clear(); } catch { /* no-op */ }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => () => { stopCamera(); }, []);

  const startCamera = async () => {
    setCameraError(''); setError(''); setSuccess(null);
    setCameraActive(true);
    // Wait one tick so the camera container div is actually in the DOM before html5-qrcode looks for it.
    await new Promise(r => setTimeout(r, 50));
    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128],
        verbose: false,
      });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' }, // back camera
        { fps: 10, qrbox: { width: 260, height: 140 } },
        lookupCode,
        () => { /* per-frame "nothing found" callback — expected constantly, ignore */ }
      );
    } catch (e: any) {
      setCameraActive(false);
      setCameraError(
        e?.message?.includes('Permission')
          ? 'לא ניתנה הרשאת מצלמה — אשר גישה למצלמה בדפדפן ונסה שוב'
          : 'לא ניתן לפתוח את המצלמה. ודא שהאפליקציה פתוחה ב-HTTPS ושיש מצלמה זמינה.'
      );
    }
  };

  const lookupCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    if (lookingUpRef.current) return;
    lookingUpRef.current = true;
    await stopCamera();
    setLoading(true);
    try {
      const res = await barcodeApi.lookup(code);
      setResult(res.data);
      setManualCode('');
    } catch {
      setError(`קוד לא מוכר: ${code}`);
    } finally {
      setLoading(false);
      lookingUpRef.current = false;
    }
  };

  const handleManualSubmit = () => lookupCode(manualCode);

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

  const reset = async () => {
    await stopCamera();
    setResult(null); setSelected(null); setQty(''); setError(''); setSuccess(null); setCameraError('');
  };

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
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setSuccess(null); }}>סריקה נוספת</button>
        </div>
      )}

      {/* STEP 1 — scan or type code */}
      {!result && !success && !cameraActive && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>{supportsCamera ? '📷' : '⌨️'}</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
            {supportsCamera ? 'סרוק ברקוד מקרר/מקפיא' : 'הזן את הקוד מהמדבקה'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: 24 }}>ירוק = כניסה · אדום = יציאה</div>

          {supportsCamera ? (
            <button className="btn btn-primary" style={{ width: '100%', padding: 15, fontSize: '1rem' }} onClick={startCamera}>
              📷 פתח מצלמה וסרוק
            </button>
          ) : (
            <>
              <input
                ref={codeInputRef}
                autoFocus
                className="form-control"
                placeholder="לדוגמה: 3I"
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') handleManualSubmit(); }}
                style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}
              />
              <button className="btn btn-primary" style={{ width: '100%', padding: 15, fontSize: '1rem' }} onClick={handleManualSubmit} disabled={!manualCode.trim()}>
                ✓ אישור קוד
              </button>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: 10 }}>
                הקוד מודפס מתחת לברקוד בעמוד "ברקודים"
              </div>
            </>
          )}

          {cameraError && <div className="alert alert-danger" style={{ marginTop: 14 }}>{cameraError}</div>}
          {error && <div className="alert alert-danger" style={{ marginTop: 14 }}>{error}</div>}
        </div>
      )}

      {/* Camera view while actively scanning */}
      {cameraActive && (
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 10, color: '#64748B' }}>
            כוון את המצלמה אל הברקוד...
          </div>
          <div id={SCANNER_ELEMENT_ID} style={{ borderRadius: 12, overflow: 'hidden' }} />
          <button onClick={reset} style={{ marginTop: 14, padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontWeight: 600 }}>
            ✕ ביטול סריקה
          </button>
        </div>
      )}

      {loading && !result && !cameraActive && (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div className="spinner" />
          <div style={{ marginTop: 12, color: '#94A3B8', fontSize: '0.85rem' }}>מאתר מיקום...</div>
        </div>
      )}

      {/* STEP 2 — select product */}
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

      {/* STEP 3 — quantity + confirm */}
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

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={reset}
              style={{ padding: '15px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}
            >
              ✕ ביטול
            </button>
            <button
              className="btn" style={{ flex: 1, background: dirColor, color: '#fff', padding: 15, fontSize: '1rem' }}
              onClick={handleConfirm} disabled={loading || !qty || Number(qty) <= 0}
            >
              {loading ? 'שומר...' : `${result.direction === 'in' ? '✓ אישור כניסה' : '✓ אישור יציאה'} — ${qty || 0} ${selected.unit}`}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default ScanPage;
