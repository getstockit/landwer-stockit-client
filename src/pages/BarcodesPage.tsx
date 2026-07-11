import React, { useEffect, useRef, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { barcodeApi } from '../api';

function drawBarcode(canvas: HTMLCanvasElement, code: string, direction: 'in' | 'out') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = direction === 'in' ? '#F0FDF4' : '#FEF2F2';
  ctx.fillRect(0, 0, W, H);
  const barCount = code.length * 9 + 18;
  const barW = Math.max(1, Math.floor((W - 24) / barCount));
  const startX = Math.floor((W - barW * barCount) / 2);
  const barH = H - 28;
  ctx.fillStyle = direction === 'in' ? '#15803D' : '#B91C1C';
  [0, 2].forEach(b => ctx.fillRect(startX + b * barW, 6, barW, barH));
  Array.from(code).forEach((ch, ci) => {
    const bits = ch.charCodeAt(0);
    for (let b = 0; b < 7; b++) if ((bits >> b) & 1) ctx.fillRect(startX + (ci * 9 + b + 3) * barW, 6, barW - 1, barH);
  });
  [0, 2, 4].forEach(b => ctx.fillRect(startX + (code.length * 9 + 3 + b) * barW, 6, barW, barH));
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = direction === 'in' ? '#14532D' : '#7F1D1D';
  ctx.fillText(code, W / 2, H - 6);
}

interface Pair { locId: string; locName: string; inCode: string; outCode: string; }

const BarcodesPage: React.FC = () => {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    barcodeApi.getAll().then(r => {
      const bcs = r.data;
      const map: Record<string, { in?: string; out?: string; name?: string }> = {};
      bcs.forEach((bc: any) => {
        if (!map[bc.locationId]) map[bc.locationId] = { name: bc.location?.name };
        if (bc.direction === 'in') map[bc.locationId].in = bc.code;
        else map[bc.locationId].out = bc.code;
      });
      setPairs(Object.entries(map).filter(([,v]) => v.in && v.out).map(([id,v]) => ({ locId: id, locName: v.name || id, inCode: v.in!, outCode: v.out! })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    pairs.forEach(p => {
      const cIn = canvasRefs.current[`${p.locId}-in`];
      const cOut = canvasRefs.current[`${p.locId}-out`];
      if (cIn) drawBarcode(cIn, p.inCode, 'in');
      if (cOut) drawBarcode(cOut, p.outCode, 'out');
    });
  }, [pairs]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const cards = pairs.map(p => {
      const imgIn = canvasRefs.current[`${p.locId}-in`]?.toDataURL() || '';
      const imgOut = canvasRefs.current[`${p.locId}-out`]?.toDataURL() || '';
      return `<div class="card"><div class="loc">${p.locName}</div><div class="row">
        <div class="box in"><div class="lbl">▼ כניסה</div>${imgIn?`<img src="${imgIn}">`:p.inCode}</div>
        <div class="box out"><div class="lbl">▲ יציאה</div>${imgOut?`<img src="${imgOut}">`:p.outCode}</div>
      </div></div>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>ברקודים לנדוור</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial;padding:14px;direction:rtl}
h1{text-align:center;font-size:16px;margin-bottom:14px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{border:1.5px solid #CBD5E1;border-radius:8px;padding:11px;page-break-inside:avoid}
.loc{font-size:12px;font-weight:700;margin-bottom:8px}.row{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.box{border-radius:6px;padding:7px;text-align:center}.in{background:#F0FDF4;border:1px solid #86EFAC}
.out{background:#FEF2F2;border:1px solid #FCA5A5}.lbl{font-size:9px;font-weight:700;margin-bottom:4px}
.in .lbl{color:#15803D}.out .lbl{color:#B91C1C}img{width:100%}</style></head>
<body><h1>☕ Stock-It לנדוור — ברקודי מיקומים</h1><div class="grid">${cards}</div>
<script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  if (loading) return <AppShell title="ברקודים"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  return (
    <AppShell title="ברקודים">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{pairs.length} מיקומים</div>
        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }} onClick={handlePrint}>🖨 הדפס הכל</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pairs.map(p => (
          <div key={p.locId} className="card">
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>{p.locName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803D', marginBottom: 4 }}>▼ כניסה</div>
                <canvas ref={el => { canvasRefs.current[`${p.locId}-in`] = el; }} width={150} height={68} style={{ width: '100%', height: 'auto' }} />
              </div>
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#B91C1C', marginBottom: 4 }}>▲ יציאה</div>
                <canvas ref={el => { canvasRefs.current[`${p.locId}-out`] = el; }} width={150} height={68} style={{ width: '100%', height: 'auto' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
};

export default BarcodesPage;
