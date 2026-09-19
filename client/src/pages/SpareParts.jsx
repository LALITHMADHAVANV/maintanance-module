import { useState } from 'react';
import { mockSpareParts } from '../services/mockData';
import {
  Package, Plus, Search, AlertTriangle, Edit3, X, TrendingDown, Check
} from 'lucide-react';

export default function SpareParts() {
  const [parts, setParts] = useState(mockSpareParts);
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [formData, setFormData] = useState({
    part_name: '', quantity: '', reorder_level: '', unit_cost: '', supplier: ''
  });

  const lowStockParts = parts.filter(p => p.quantity <= p.reorder_level);

  const filtered = parts.filter(p => {
    const matchSearch = !search || p.part_name.toLowerCase().includes(search.toLowerCase()) || p.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStock = filterStock === 'all' || (filterStock === 'low' && p.quantity <= p.reorder_level) || (filterStock === 'ok' && p.quantity > p.reorder_level);
    return matchSearch && matchStock;
  });

  const openAdd = () => {
    setEditingPart(null);
    setFormData({ part_name: '', quantity: '', reorder_level: '', unit_cost: '', supplier: '' });
    setShowModal(true);
  };

  const openEdit = (part) => {
    setEditingPart(part);
    setFormData({ part_name: part.part_name, quantity: String(part.quantity), reorder_level: String(part.reorder_level), unit_cost: String(part.unit_cost), supplier: part.supplier });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPart) {
      setParts(prev => prev.map(p => p.id === editingPart.id ? { ...p, ...formData, quantity: Number(formData.quantity), reorder_level: Number(formData.reorder_level), unit_cost: Number(formData.unit_cost) } : p));
    } else {
      setParts(prev => [{ id: `sp_${Date.now()}`, ...formData, quantity: Number(formData.quantity), reorder_level: Number(formData.reorder_level), unit_cost: Number(formData.unit_cost), last_ordered: new Date().toISOString().split('T')[0] }, ...prev]);
    }
    setShowModal(false);
  };

  const onChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const totalValue = parts.reduce((sum, p) => sum + p.quantity * p.unit_cost, 0);

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1>Spare Parts</h1>
          <p className="page-subtitle">{parts.length} parts • {lowStockParts.length} low stock</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Part
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Package size={22} /></div>
          <div><div className="stat-value">{parts.length}</div><div className="stat-label">Total Parts</div></div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div><div className="stat-value">{lowStockParts.length}</div><div className="stat-label">Low Stock</div></div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald"><TrendingDown size={22} /></div>
          <div><div className="stat-value">₹{totalValue.toLocaleString()}</div><div className="stat-label">Inventory Value</div></div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginBottom: 'var(--space-6)', background: 'rgba(239,68,68,0.03)' }}>
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--red-400)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
            <AlertTriangle size={18} /> Low Stock Alerts
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {lowStockParts.map(p => (
              <span key={p.id} className="badge badge-danger" style={{ fontSize: 'var(--font-xs)' }}>
                {p.part_name}: {p.quantity}/{p.reorder_level}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={16} />
          <input className="search-input" placeholder="Search parts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field" style={{ width: 160 }} value={filterStock} onChange={e => setFilterStock(e.target.value)}>
          <option value="all">All Stock Levels</option>
          <option value="low">Low Stock Only</option>
          <option value="ok">In Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Quantity</th>
              <th>Reorder Level</th>
              <th>Unit Cost</th>
              <th>Total Value</th>
              <th>Supplier</th>
              <th>Last Ordered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(part => {
              const isLow = part.quantity <= part.reorder_level;
              return (
                <tr key={part.id}>
                  <td style={{ fontWeight: 600 }}>{part.part_name}</td>
                  <td style={{ color: isLow ? 'var(--red-400)' : 'var(--text-secondary)', fontWeight: isLow ? 700 : 400 }}>{part.quantity}</td>
                  <td>{part.reorder_level}</td>
                  <td>₹{part.unit_cost.toLocaleString()}</td>
                  <td style={{ fontWeight: 500 }}>₹{(part.quantity * part.unit_cost).toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{part.supplier}</td>
                  <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{part.last_ordered}</td>
                  <td><span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>{isLow ? 'Low Stock' : 'In Stock'}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(part)}><Edit3 size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPart ? 'Edit Part' : 'Add New Part'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group"><label>Part Name</label><input className="input-field" name="part_name" value={formData.part_name} onChange={onChange} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group"><label>Quantity</label><input className="input-field" type="number" name="quantity" value={formData.quantity} onChange={onChange} required /></div>
                <div className="input-group"><label>Reorder Level</label><input className="input-field" type="number" name="reorder_level" value={formData.reorder_level} onChange={onChange} required /></div>
              </div>
              <div className="input-group"><label>Unit Cost (₹)</label><input className="input-field" type="number" name="unit_cost" value={formData.unit_cost} onChange={onChange} required /></div>
              <div className="input-group"><label>Supplier</label><input className="input-field" name="supplier" value={formData.supplier} onChange={onChange} /></div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingPart ? 'Update' : 'Add Part'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
