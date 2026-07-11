import React, { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { supplierApi, productApi } from '../api';
import type { Supplier, Product } from '../types';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

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

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', orderDay: '1', alertEnabled: true });

  const load = () => Promise.all([supplierApi.getAll(), productApi.getAll()])
    .then(([s, p]) => { setSuppliers(s.data); setProducts(p.data); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const saveField = async (id: string, field: string, value: any) => {
    const res = await supplierApi.update(id, { [field]: value });
    setSuppliers(ss => ss.map(s => s.id === id ? res.data : s));
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const res = await supplierApi.create({ ...form, orderDay: Number(form.orderDay) });
    setSuppliers(ss => [...ss, res.data]);
    setForm({ name: '', orderDay: '1', alertEnabled: true });
    setShowAdd(false);
  };

  const handleRemove = async (s: Supplier) => {
    if (!window.confirm(`להסיר את הספק "${s.name}"?`)) return;
    await supplierApi.remove(s.id);
    setSuppliers(ss => ss.filter(x => x.id !== s.id));
  };

  if (loading) return <AppShell title="ספקים"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  return (
    <AppShell title="ניהול ספקים">
      <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: '0.78rem' }}>
        💡 כדי לשייך מוצר לספק — היכנס/י לעמוד "מוצרים" ובחר/י ספק מהרשימה הנפתחת בכל מוצר.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{suppliers.length} ספקים</div>
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={() => setShowAdd(true)}>+ ספק</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suppliers.map(s => {
          const supplierProducts = products.filter(p => p.isActive && p.supplierId === s.id);
          const isOpen = expanded === s.id;
          return (
            <div key={s.id} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <EditableName value={s.name} onSave={v => saveField(s.id, 'name', v)} />
                <button onClick={() => handleRemove(s)} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '5px 10px', fontSize: '0.72rem' }}>הסר</button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>יום הזמנה:</span>
                <select className="form-control" value={s.orderDay} onChange={e => saveField(s.id, 'orderDay', Number(e.target.value))}
                  style={{ padding: '5px 8px', fontSize: '0.78rem', width: 'auto' }}>
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>יום {d}</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748B' }}>
                  <input type="checkbox" checked={s.alertEnabled} onChange={e => saveField(s.id, 'alertEnabled', e.target.checked)} />
                  התראה יום לפני
                </label>
              </div>
              <button onClick={() => setExpanded(isOpen ? null : s.id)} style={{ background: 'none', border: 'none', color: '#C8102E', fontSize: '0.78rem', fontWeight: 700, padding: 0 }}>
                {isOpen ? '▲ הסתר' : '▼ הצג'} מוצרים ({supplierProducts.length})
              </button>
              {isOpen && (
                <div style={{ marginTop: 10, borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                  {supplierProducts.length === 0 && <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>אין עדיין מוצרים משויכים לספק זה</div>}
                  {supplierProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.82rem', borderBottom: '1px solid #F8FAFC' }}>
                      <span>{p.name}</span>
                      <span style={{ color: p.quantity <= p.minQty ? '#DC2626' : '#64748B', fontWeight: 600 }}>{p.quantity} {p.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {suppliers.length === 0 && <div className="empty-state"><div className="empty-icon">🚚</div><h3 style={{ color: '#64748B' }}>עדיין אין ספקים</h3></div>}
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 18 }}>ספק חדש</div>
            <div className="form-group">
              <label>שם הספק *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="לדוגמה: תנובה" autoFocus />
            </div>
            <div className="form-group">
              <label>יום הזמנה קבוע</label>
              <select className="form-control" value={form.orderDay} onChange={e => setForm(f => ({ ...f, orderDay: e.target.value }))}>
                {DAY_NAMES.map((d, i) => <option key={i} value={i}>יום {d}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 16 }}>
              <input type="checkbox" checked={form.alertEnabled} onChange={e => setForm(f => ({ ...f, alertEnabled: e.target.checked }))} />
              קבל/י התראה יום לפני יום ההזמנה
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>ביטול</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAdd}>צור ספק</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default SuppliersPage;
