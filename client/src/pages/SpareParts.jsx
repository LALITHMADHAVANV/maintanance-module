import { useState } from 'react';
import { useSpareParts } from '../hooks/useSpareParts';
import { mockMachines } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import RestockModal from '../components/RestockModal';
import RestockHistoryModal from '../components/RestockHistoryModal';
import { formatDistanceToNow } from 'date-fns';
import {
  Package, Plus, Search, AlertTriangle, Edit3, X, TrendingDown,
  Wrench, CheckCircle2, TrendingUp, History
} from 'lucide-react';

export default function SpareParts() {
  const { user } = useAuth();
  const { can } = usePermission();
  const isTechnician = user?.role === 'technician';
  const canRestock = can('spareparts', 'restock');

  const { parts, loading, addPart, updatePart, restockPart, getRestockHistory, usePart } = useSpareParts();

  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  
  const [restockModalPart, setRestockModalPart] = useState(null);
  
  const [historyModalPart, setHistoryModalPart] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [formData, setFormData] = useState({
    part_name: '', quantity: '', reorder_level: '', unit_cost: '', supplier: ''
  });

  // Technician Restore / Issue Modal State
  const [restoreModalPart, setRestoreModalPart] = useState(null);
  const [restoreQty, setRestoreQty] = useState(1);
  const [restoreMachineId, setRestoreMachineId] = useState(mockMachines[0]?.id || 'mch_001');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  const openRestoreModal = (part) => {
    setRestoreModalPart(part);
    setRestoreQty(1);
    setRestoreMachineId(mockMachines[0]?.id || 'mch_001');
  };

  const openRestockModal = (part) => {
    setRestockModalPart(part);
  };
  
  const openHistoryModal = async (part) => {
    setHistoryModalPart(part);
    setHistoryLoading(true);
    const data = await getRestockHistory(part.id);
    setHistoryData(data);
    setHistoryLoading(false);
  };

  const handleRestockSubmit = async (data) => {
    await restockPart(restockModalPart.id, data);
    showToast(`✅ Successfully restocked ${data.quantity_received} units of ${restockModalPart.part_name}!`);
    setRestockModalPart(null);
  };

  const handleRestoreSubmit = (e) => {
    e.preventDefault();
    if (!restoreModalPart) return;

    if (restoreModalPart.quantity < restoreQty) {
      alert(`Only ${restoreModalPart.quantity} units available!`);
      return;
    }

    const targetMachine = mockMachines.find(m => m.id === restoreMachineId);

    // Call hook to use part (mock deduction)
    usePart(restoreModalPart.id, restoreQty);

    showToast(`✅ Successfully issued ${restoreQty}x ${restoreModalPart.part_name} to restore ${targetMachine?.name || 'Machine'}!`);
    setRestoreModalPart(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = { 
      ...formData, 
      quantity: Number(formData.quantity), 
      reorder_level: Number(formData.reorder_level), 
      unit_cost: Number(formData.unit_cost) 
    };

    if (editingPart) {
      await updatePart(editingPart.id, dataToSave);
      showToast('Part updated successfully.');
    } else {
      await addPart(dataToSave);
      showToast('Part added successfully.');
    }
    setShowModal(false);
  };

  const onChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const totalValue = parts.reduce((sum, p) => sum + p.quantity * p.unit_cost, 0);

  if (loading && parts.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #059669, #10b981)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-xl)',
          fontWeight: 700,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1>{isTechnician ? 'Spare Parts to Restore' : 'Spare Parts Inventory'}</h1>
            {isTechnician && (
              <span className="badge badge-warning" style={{ fontSize: 11, fontWeight: 700 }}>
                Technician Bay
              </span>
            )}
          </div>
          <p className="page-subtitle">
            {isTechnician
              ? `Select parts to use and restore machines • ${parts.length} parts in inventory • ${lowStockParts.length} low stock items`
              : `${parts.length} parts • ${lowStockParts.length} low stock`
            }
          </p>
        </div>
        {!isTechnician && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Part
          </button>
        )}
      </div>

      {isTechnician && (
        <div style={{
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <Wrench size={20} className="text-purple-400" />
          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
            <strong>Technician Parts Access:</strong> Click <strong>"Use / Restore"</strong> on any spare part below to deduct stock and assign it directly to the machine you are repairing on the floor.
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Package size={22} /></div>
          <div><div className="stat-value">{parts.length}</div><div className="stat-label">Available Parts</div></div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div><div className="stat-value">{lowStockParts.length}</div><div className="stat-label">Low Stock Alerts</div></div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald"><TrendingDown size={22} /></div>
          <div><div className="stat-value">₹{totalValue.toLocaleString()}</div><div className="stat-label">Stock Value</div></div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginBottom: 'var(--space-6)', background: 'rgba(239,68,68,0.03)' }}>
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--red-400)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
            <AlertTriangle size={18} /> Low Stock Alerts
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {lowStockParts.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-panel)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.part_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stock: <strong style={{ color: 'var(--red-500)' }}>{p.quantity}</strong> / {p.reorder_level}</div>
                </div>
                {canRestock && (
                  <button className="btn btn-primary btn-sm" onClick={() => openRestockModal(p)} style={{ fontSize: 12, padding: '4px 10px', height: 28 }}>
                    Quick Restock
                  </button>
                )}
              </div>
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
              <th>Quantity Available</th>
              <th>Status</th>
              {!isTechnician && <th>Last Restocked</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(part => {
              const isLow = part.quantity <= part.reorder_level;
              return (
                <tr key={part.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{part.part_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Reorder level: {part.reorder_level} • Supplier: {part.supplier}
                    </div>
                  </td>
                  <td style={{ color: isLow ? 'var(--red-500)' : 'var(--text-primary)', fontWeight: 700, fontSize: 'var(--font-lg)' }}>
                    {part.quantity}
                  </td>
                  <td>
                    {isLow ? (
                       <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><TrendingDown size={12}/> Low Stock</span>
                    ) : (
                       <span className="badge badge-success"><CheckCircle2 size={12}/> In Stock</span>
                    )}
                  </td>
                  {!isTechnician && (
                    <td>
                      {part.last_restocked_date ? (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {formatDistanceToNow(new Date(part.last_restocked_date), { addSuffix: true })}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {part.restock_count} total restocks
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Never restocked</span>
                      )}
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openRestoreModal(part)}
                        title="Use part to restore machine"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                      >
                        <Wrench size={13} /> {isTechnician ? 'Use' : 'Issue'}
                      </button>
                      
                      {canRestock && (
                        <button 
                          className="btn btn-success btn-sm" 
                          onClick={() => openRestockModal(part)} 
                          title="Restock Parts"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                        >
                          <TrendingUp size={13} /> Restock
                        </button>
                      )}

                      {!isTechnician && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => openHistoryModal(part)} title="Restock History">
                            <History size={16} className="text-muted" />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(part)} title="Edit Part Settings">
                            <Edit3 size={16} className="text-muted" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Restock & History Modals */}
      {restockModalPart && (
        <RestockModal 
          part={restockModalPart} 
          onClose={() => setRestockModalPart(null)} 
          onConfirm={handleRestockSubmit} 
        />
      )}
      
      {historyModalPart && (
        <RestockHistoryModal 
          part={historyModalPart}
          history={historyData}
          loading={historyLoading}
          onClose={() => setHistoryModalPart(null)}
        />
      )}

      {/* Technician Restore / Issue Modal */}
      {restoreModalPart && (
        <div className="modal-overlay" onClick={() => setRestoreModalPart(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h2>Use Part to Restore Machine</h2>
                <span className="text-muted text-xs">Technician Part Issue & Deduction</span>
              </div>
              <button className="btn-icon" onClick={() => setRestoreModalPart(null)}><X size={20} /></button>
            </div>

            <form onSubmit={handleRestoreSubmit}>
              <div className="card" style={{ background: 'var(--bg-input)', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selected Spare Part:</div>
                <strong style={{ fontSize: 16 }}>{restoreModalPart.part_name}</strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13 }}>
                  <span>Current Stock: <strong>{restoreModalPart.quantity} units</strong></span>
                  <span>Unit Cost: <strong>₹{restoreModalPart.unit_cost}</strong></span>
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label>Machine to Restore</label>
                <select
                  className="select-field"
                  value={restoreMachineId}
                  onChange={e => setRestoreMachineId(e.target.value)}
                >
                  {mockMachines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.location} ({m.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label>Quantity to Issue / Deduct</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRestoreQty(q => Math.max(1, q - 1))}
                    style={{ width: 44, height: 44, fontSize: 20, fontWeight: 800 }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="input-field"
                    style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                    value={restoreQty}
                    min="1"
                    max={restoreModalPart.quantity}
                    onChange={e => setRestoreQty(Math.max(1, Math.min(restoreModalPart.quantity, Number(e.target.value))))}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRestoreQty(q => Math.min(restoreModalPart.quantity, q + 1))}
                    style={{ width: 44, height: 44, fontSize: 20, fontWeight: 800 }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setRestoreModalPart(null)}>Cancel</button>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  <CheckCircle2 size={16} /> Confirm Stock Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Modal (Admin / Supervisor) */}
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
