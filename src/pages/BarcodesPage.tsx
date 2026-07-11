import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import AppShell from '../components/layout/AppShell';
import { barcodeApi } from '../api';

interface Pair { locId: string; locName: string; inCode: string; outCode: string; }

const BarcodesPage: React.FC = () => {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const svgRefs = useRef<Record<string, SVGSVGElement | null>>({});

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

  // Render real, camera-scannable CODE128 barcodes — this is the part that
  // actually matters: the previous version drew fake bars on a canvas that
  // looked like a barcode but no scanner could ever read. JsBarcode produces
  // a standard CODE128 symbol that any barcode reader (including the phone
  // camera scanner in the Scan page) can decode correctly.
  useEffect(() => {
    pairs.forEach(p => {
      const svgIn  = svgRefs.current[`${p.locId}-in`];
      const svgOut = svgRefs.current[`${p.locId}-out`];
      if (svgIn) {
        JsBarcode(svgIn, p.inCode, {
          format: 'CODE128', lineColor: '#15803D', width: 3, height: 80,
          displayValue: true, fontSize: 16, margin: 8, background: 'transparent',
        });
      }
      if (svgOut) {
        JsBarcode(svgOut, p.outCode, {
          format: 'CODE128', lineColor: '#B91C1C', width: 3, height: 80,
          displayValue: true, fontSize: 16, margin: 8, background: 'transparent',
        });
      }
    });
  }, [pairs]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const cards = pairs.map(p => {
      const svgIn  = svgRefs.current[`${p.locId}-in`]?.outerHTML  || '';
      const svgOut = svgRefs.current[`${p.locId}-out`]?.outerHTML || '';
      return `<div class="card"><div class="loc">${p.locName}</div><div class="row">
        <div class="box in"><div class="lbl">▼ כניסה</div><div class="shortcode">${p.inCode}</div>${svgIn}</div>
        <div class="box out"><div class="lbl">▲ יציאה</div><div class="shortcode">${p.outCode}</div>${svgOut}</div>
      </div></div>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>ברקודים לנדוור</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial;padding:14px;direction:rtl}
h1{text-align:center;font-size:18px;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.card{border:2px solid #CBD5E1;border-radius:10px;padding:16px;page-break-inside:avoid}
.card:nth-child(4n){page-break-after:always}
.loc{font-size:16px;font-weight:700;margin-bottom:12px}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.box{border-radius:8px;padding:10px;text-align:center;background:#fff}.in{border:1.5px solid #86EFAC}
.out{border:1.5px solid #FCA5A5}.lbl{font-size:12px;font-weight:700;margin-bottom:6px}
.shortcode{font-size:28px;font-weight:800;letter-spacing:1px;margin-bottom:6px}
.in .lbl,.in .shortcode{color:#15803D}.out .lbl,.out .shortcode{color:#B91C1C}svg{max-width:100%}</style></head>
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
      <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: 16, lineHeight: 1.5 }}>
        הדפס דף אחד לכל מקרר/מקפיא ותלה אותו לידו. <strong>באנדרואיד</strong> — צלם את הברקוד בעמוד "סריקה". <strong>באייפון</strong> — הקלד את הקוד הקצר שמופיע מעל הברקוד (למשל 3I).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pairs.map(p => (
          <div key={p.locId} className="card">
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>{p.locName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#fff', border: '1.5px solid #86EFAC', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803D', marginBottom: 4 }}>▼ כניסה</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803D', marginBottom: 4, letterSpacing: 1 }}>{p.inCode}</div>
                <svg ref={el => { svgRefs.current[`${p.locId}-in`] = el; }} style={{ width: '100%' }} />
              </div>
              <div style={{ background: '#fff', border: '1.5px solid #FCA5A5', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#B91C1C', marginBottom: 4 }}>▲ יציאה</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#B91C1C', marginBottom: 4, letterSpacing: 1 }}>{p.outCode}</div>
                <svg ref={el => { svgRefs.current[`${p.locId}-out`] = el; }} style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
};

export default BarcodesPage;
