import React, { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { locationApi, barcodeApi } from '../api';
import type { Location, LocationType } from '../types';

const TYPE_LABEL: Record<LocationType, string> = { fridge: '❄️ מקרר', freezer: '🧊 מקפיא', warehouse: '📦 מחסן' };

function EditableName({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const commit = () => { if (val.trim()) onSave(val.trim()); setEditing(false); };
  if (editing) return (
    <input autoFocus value={val} onChange={e => setVal(e.target.value)}
      onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value); setEditing(false); } }}
      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '2px solid #C8102E', fontSize: '0.9rem', fontWeight: 700 }} />
  );
  return (
    <div onClick={() => { setVal(value); setEditing(true); }} style={{ fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
      {value} <span style={{ color: '#CBD5E1', fontWeight: 400, fontSize: '0.78rem' }}>✏</span>
    </div>
  );
}

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ name: string; type: LocationType; hasBarcode: boolean }>({ name: '', type: 'fridge', hasBarcode: true });
  const [regenerating, setRegenerating] = useState(false);

  const load = () => locationApi.getAll().then(r => setLocations(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const saveField = async (id: string, field: string, value: any) => {
    const res = await locationApi.update(id, { [field]: value });
    setLocations(ls => ls.map(l => l.id === id ? res.data : l));
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const res = await locationApi.create(form);
    setLocations(ls => [...ls, res.data]);
    setForm({ name: '', type: 'fridge', hasBarcode: true });
    setShowAdd(false);
  };

  const handleRemove = async (l: Location) => {
    if (!window.confirm(`להסיר את "${l.name}"? (ניתן רק אם אין מוצרים פעילים במיקום הזה)`)) return;
    setError('');
    try { await locationApi.remove(l.id); setLocations(ls => ls.filter(x => x.id !== l.id)); }
    catch (e: any) { setError(e.response?.data?.error || 'שגיאה במחיקה'); }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try { await barcodeApi.regenerate(); alert('הברקודים עודכנו! עכשיו כדאי להיכנס לעמוד "ברקודים" ולהדפיס מחדש.'); }
    finally { setRegenerating(false); }
  };

  if (loading) return <AppShell title="מקררים ומקפיאים"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  return (
    <AppShell title="מקררים ומקפיאים">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{locations.length} מיקומים</div>
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={() => setShowAdd(true)}>+ מיקום</button>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: '0.78rem' }}>
        ⚠️ כל שינוי כאן (הוספה/הסרה) ממספר מחדש את הברקודים אוטומטית. אחרי שינויים — היכנס/י לעמוד "ברקודים" והדפס/י מחדש את המדבקות שהשתנו.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {locations.map(l => (
          <div key={l.id} className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <EditableName value={l.name} onSave={v => saveField(l.id, 'name', v)} />
              <button onClick={() => handleRemove(l)} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '5px 10px', fontSize: '0.72rem' }}>הסר</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="form-control" value={l.type} onChange={e => saveField(l.id, 'type', e.target.value)}
                style={{ padding: '5px 8px', fontSize: '0.78rem', width: 'auto' }}>
                <option value="fridge">❄️ מקרר</option>
                <option value="freezer">🧊 מקפיא</option>
                <option value="warehouse">📦 מחסן</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748B' }}>
                <input type="checkbox" checked={l.hasBarcode !== false} onChange={e => saveField(l.id, 'hasBarcode', e.target.checked)} />
                עם ברקוד סריקה
              </label>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleRegenerate} disabled={regenerating}>
        {regenerating ? 'מעדכן...' : '🔄 עדכן מספור ברקודים עכשיו'}
      </button>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 18 }}>מיקום חדש</div>
            <div className="form-group">
              <label>שם המיקום *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="לדוגמה: מקרר 9 — ירקות" autoFocus />
            </div>
            <div className="form-group">
              <label>סוג</label>
              <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as LocationType }))}>
                <option value="fridge">❄️ מקרר</option>
                <option value="freezer">🧊 מקפיא</option>
                <option value="warehouse">📦 מחסן</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 16 }}>
              <input type="checkbox" checked={form.hasBarcode} onChange={e => setForm(f => ({ ...f, hasBarcode: e.target.checked }))} />
              עם ברקוד סריקה (בטל אם זה מיקום ללא מעקב, כמו בצקים/לחמים)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>ביטול</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAdd}>צור מיקום</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default LocationsPage;
