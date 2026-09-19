import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMachines } from '../hooks/useMachines';
import { usePermission } from '../hooks/usePermission';
import { MACHINE_TYPES, LOCATIONS, BRANDS } from '../services/mockData';
import {
  Settings2, Plus, Search, Filter, Edit3, Trash2, X, MapPin, Calendar, Tag, ShieldOff
} from 'lucide-react';

export default function Machines() {
  const navigate = useNavigate();
  const { can, isAdmin, isManager, isTechnician, role } = usePermission();
  const {
    machines, search, setSearch, filterType, setFilterType,
    filterStatus, setFilterStatus, addMachine, updateMachine, deleteMachine, stats
  } = useMachines();

  const canCreate = can('machines', 'create');
  const canEdit   = can('machines', 'edit');
  const canDelete = can('machines', 'delete');
  const [showModal, setShowModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [formData, setFormData] = useState({
    name: '', machine_type: 'sewing', location: LOCATIONS[0],
    brand: '', model: '', purchase_date: '', status: 'active'
  });

  const statusColors = { active: 'badge-success', inactive: 'badge-neutral', maintenance: 'badge-warning' };

  const openAdd = () => {
    setEditingMachine(null);
    setFormData({ name: '', machine_type: 'sewing', location: LOCATIONS[0], brand: '', model: '', purchase_date: '', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (machine) => {
    setEditingMachine(machine);
    setFormData({ ...machine });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMachine) {
      updateMachine(editingMachine.id, formData);
    } else {
      addMachine(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this machine?')) {
      deleteMachine(id);
    }
  };

  const onChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Role Banner */}
      {!isAdmin && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
          marginBottom: 16, borderRadius: 'var(--radius-md)',
          background: isManager ? 'rgba(168,85,247,0.06)' : 'rgba(16,185,129,0.06)',
          border: `1px solid ${isManager ? 'rgba(168,85,247,0.2)' : 'rgba(16,185,129,0.2)'}`,
        }}>
          <ShieldOff size={16} style={{ color: isManager ? 'var(--purple-500)' : 'var(--emerald-500)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            <strong style={{ textTransform: 'capitalize' }}>{role} view</strong> —
            {isTechnician ? ' Showing machines linked to your assigned work orders.' : ' Viewing all machines.'}
            {!canCreate && ' Machine creation and editing is restricted to Admins.'}
          </span>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Machines</h1>
          <p className="page-subtitle">{stats.total} machines • {stats.active} active • {stats.maintenance} in maintenance</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Machine
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={16} />
          <input className="search-input" placeholder="Search machines..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field" style={{ width: 160 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {MACHINE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select className="select-field" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Machine Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Machine</th>
              <th>Type</th>
              <th>Brand / Model</th>
              <th>Location</th>
              <th>Purchase Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {machines.map(machine => (
              <tr key={machine.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)', flexShrink: 0 }}>
                      <Settings2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => navigate(`/machines/${machine.id}`)}>
                        {machine.name}
                      </div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{machine.id.toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-info">{machine.machine_type}</span></td>
                <td>
                  <div style={{ fontWeight: 500 }}>{machine.brand}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{machine.model}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                    <MapPin size={14} /> {machine.location}
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>{machine.purchase_date}</td>
                <td><span className={`badge ${statusColors[machine.status]}`}>{machine.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/machines/${machine.id}`)}
                      title="View details"
                    >
                      View
                    </button>
                    {canEdit && (
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(machine)} title="Edit machine">
                        <Edit3 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--red-400)' }}
                        onClick={() => handleDelete(machine.id)}
                        title="Delete machine"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {machines.length === 0 && (
        <div className="empty-state">
          <Settings2 size={48} />
          <h3>No machines found</h3>
          <p>Try adjusting your filters or add a new machine</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>{editingMachine ? 'Edit Machine' : 'Add New Machine'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Machine Name</label>
                <input className="input-field" name="name" value={formData.name} onChange={onChange} placeholder="e.g. Sewing Machine 26" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Type</label>
                  <select className="select-field" name="machine_type" value={formData.machine_type} onChange={onChange}>
                    {MACHINE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select className="select-field" name="status" value={formData.status} onChange={onChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Location</label>
                <select className="select-field" name="location" value={formData.location} onChange={onChange}>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Brand</label>
                  <input className="input-field" name="brand" value={formData.brand} onChange={onChange} placeholder="e.g. Juki" />
                </div>
                <div className="input-group">
                  <label>Model</label>
                  <input className="input-field" name="model" value={formData.model} onChange={onChange} placeholder="e.g. DDL-8700" />
                </div>
              </div>
              <div className="input-group">
                <label>Purchase Date</label>
                <input className="input-field" type="date" name="purchase_date" value={formData.purchase_date} onChange={onChange} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingMachine ? 'Update Machine' : 'Add Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
