import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { productApi, locationApi, supplierApi } from '../api';
import type { Product, Location, Supplier } from '../types';

function EditableField({ value, onSave, prefix = '', placeholder = '' }: { value: string; onSave: (v: string) => void; prefix?: string; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const commit = () => { onSave(val); setEditing(false); };
  if (editing) return (
    <input autoFocus value={val} onChange={e => setVal(e.target.value)}
      onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      style={{ width: 76, padding: '4px 6px', borderRadius: 6, border: '2px solid #C8102E', textAlign: 'center', fontSize: '0.82rem' }} />
  );
  return (
    <span onClick={() => { setVal(value); setEditing(true); }}
      style={{ padding: '3px 9px', borderRadius: 8, background: value ? '#F8FAFC' : '#FEF3C7', border: `1px solid ${value ? '#E2E8F0' : '#FDE68A'}`, fontSize: '0.82rem', fontWeight: 600, color: value ? '#1E293B' : '#D97706', cursor: 'pointer' }}>
      {prefix}{value || placeholder} ✏
    </span>
  );
}

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
    <div onClick={() => { setVal(value); setEditing(true); }} style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 8, cursor: 'pointer' }}>
      {value} <span style={{ color: '#CBD5E1', fontWeight: 400, fontSize: '0.78rem' }}>✏</span>
    </div>
  );
}

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', locationId: '', unit: 'יחידה', sku: '', price: '', minQty: '5', hasBarcode: true });

  const load = () => Promise.all([productApi.getAll(), locationApi.getAll(), supplierApi.getAll()])
    .then(([p, l, s]) => { setProducts(p.data); setLocations(l.data); setSuppliers(s.data); })
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const saveField = async (id: string, field: string, value: any) => {
    const res = await productApi.update(id, { [field]: value });
    setProducts(p => p.map(pr => pr.id === id ? res.data : pr));
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.locationId) return;
    const res = await productApi.create({ ...form, price: Number(form.price) || 0, minQty: Number(form.minQty) || 0 });
    setProducts(p => [...p, res.data]);
    setForm({ name: '', locationId: '', unit: 'יחידה', sku: '', price: '', minQty: '5', hasBarcode: true });
    setShowAdd(false);
  };

  const handleToggleActive = async (p: Product) => {
    if (p.isActive && !window.confirm(`להסיר את "${p.name}" מרשימת המוצרים הפעילים?`)) return;
    await saveField(p.id, 'isActive', !p.isActive);
  };

  const missingSku = products.filter(p => p.isActive && !p.sku).length;
  const filtered = products.filter(p => p.isActive && (!search || p.name.includes(search) || (p.sku||'').includes(search)));

  if (loading) return <AppShell title="מוצרים"><div className="spinner" style={{ marginTop: 60 }} /></AppShell>;

  return (
    <AppShell title="ניהול מוצרים">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' }}>
        <button onClick={() => navigate('/locations')} style={{ flex: '1 0 auto', padding: '9px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.76rem', fontWeight: 600, whiteSpace: 'nowrap' }}>❄️ מקררים ומקפיאים</button>
        <button onClick={() => navigate('/suppliers')} style={{ flex: '1 0 auto', padding: '9px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.76rem', fontWeight: 600, whiteSpace: 'nowrap' }}>🚚 ספקים</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{filtered.length} מוצרים{missingSku > 0 ? ` · ${missingSku} ללא מק"ט` : ''}</div>
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={() => setShowAdd(true)}>+ מוצר</button>
      </div>

      <input className="form-control" placeholder='🔍 חיפוש שם / מק"ט...' value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 14 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(p => (
          <div key={p.id} className="card" style={{ padding: '12px 14px' }}>
            <EditableName value={p.name} onSave={v => saveField(p.id, 'name', v)} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>מק"ט:</span>
              <EditableField value={p.sku} onSave={v => saveField(p.id, 'sku', v)} placeholder="הוסף" />
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>מחיר:</span>
              <EditableField value={p.price > 0 ? String(p.price) : ''} onSave={v => saveField(p.id, 'price', Number(v))} prefix="₪" placeholder="הגדר" />
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>מינימום:</span>
              <EditableField value={String(p.minQty)} onSave={v => saveField(p.id, 'minQty', Number(v) || 0)} placeholder="0" />
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>יחידת מידה:</span>
              <EditableField value={p.unit} onSave={v => saveField(p.id, 'unit', v)} placeholder="יחידה" />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="form-control" value={p.locationId} onChange={e => saveField(p.id, 'locationId', e.target.value)}
                style={{ flex: '1 1 140px', padding: '5px 8px', fontSize: '0.78rem', width: 'auto' }}>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <select className="form-control" value={p.supplierId || ''} onChange={e => saveField(p.id, 'supplierId', e.target.value)}
                style={{ flex: '1 1 140px', padding: '5px 8px', fontSize: '0.78rem', width: 'auto' }}>
                <option value="">ללא ספק</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={() => handleToggleActive(p)} style={{ marginRight: 'auto', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '5px 10px', fontSize: '0.72rem' }}>הסר</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 18 }}>מוצר חדש</div>
            <div className="form-group">
              <label>שם המוצר *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="form-group">
              <label>מיקום *</label>
              <select className="form-control" value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}>
                <option value="">בחר מיקום</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>יחידה</label>
                <input className="form-control" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>מק"ט</label>
                <input className="form-control" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>מחיר ₪</label>
                <input type="number" className="form-control" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>מינימום</label>
                <input type="number" className="form-control" value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>ביטול</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAdd}>צור מוצר</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default ProductsPage;
