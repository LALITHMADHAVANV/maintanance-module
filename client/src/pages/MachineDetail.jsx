import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockMachines, mockWorkOrders, mockPreventiveSchedules, mockExpenses, mockTransfers } from '../services/mockData';
import {
  ArrowLeft, Settings2, MapPin, Calendar, Tag, Clock, DollarSign,
  Wrench, Image, ClipboardList, TrendingUp, ArrowUpDown, CheckCircle2
} from 'lucide-react';

export default function MachineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const machine = mockMachines.find(m => m.id === id);
  const workOrders = mockWorkOrders.filter(wo => wo.machine_id === id);
  const schedules = mockPreventiveSchedules.filter(ps => ps.machine_id === id);
  const expenses = mockExpenses.filter(ex => ex.machine_id === id);
  const transfers = mockTransfers.filter(tr => tr.machine_id === id);

  const stats = useMemo(() => ({
    totalWorkOrders: workOrders.length,
    completed: workOrders.filter(wo => wo.status === 'completed').length,
    totalCost: expenses.reduce((sum, e) => sum + e.amount, 0),
    avgFixTime: workOrders.filter(wo => wo.fixing_time_minutes).length > 0
      ? Math.round(workOrders.filter(wo => wo.fixing_time_minutes).reduce((s, wo) => s + wo.fixing_time_minutes, 0) / workOrders.filter(wo => wo.fixing_time_minutes).length)
      : 0,
  }), [workOrders, expenses]);

  const statusColors = { active: 'badge-success', inactive: 'badge-neutral', maintenance: 'badge-warning' };
  const woStatusColors = { pending: 'badge-warning', in_progress: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };

  if (!machine) {
    return (
      <div className="empty-state">
        <h3>Machine not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/machines')}>Back to Machines</button>
      </div>
    );
  }

  // Placeholder issue photos
  const issuePhotos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400', desc: 'Thread jam — bobbin area', date: '2024-06-15', by: 'Anil Mehta' },
    { id: 2, url: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400', desc: 'After repair — running smooth', date: '2024-06-15', by: 'Ramesh Patel' },
    { id: 3, url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400', desc: 'Belt wear detected', date: '2024-06-10', by: 'Sunita Devi' },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/machines')}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>{machine.name}</h1>
            <span className={`badge ${statusColors[machine.status]}`}>{machine.status}</span>
          </div>
          <p className="page-subtitle">{machine.brand} {machine.model} • {machine.id.toUpperCase()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card blue">
          <div className="stat-icon blue"><ClipboardList size={22} /></div>
          <div><div className="stat-value">{stats.totalWorkOrders}</div><div className="stat-label">Work Orders</div></div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald"><CheckCircle2 size={22} /></div>
          <div><div className="stat-value">{stats.completed}</div><div className="stat-label">Completed</div></div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><Clock size={22} /></div>
          <div><div className="stat-value">{stats.avgFixTime}m</div><div className="stat-label">Avg Fix Time</div></div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><DollarSign size={22} /></div>
          <div><div className="stat-value">₹{stats.totalCost.toLocaleString()}</div><div className="stat-label">Total Cost</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {['overview', 'work-orders', 'photos', 'maintenance', 'expenses', 'transfers'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Machine Specifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {[
              { icon: Tag, label: 'Type', value: machine.machine_type },
              { icon: Settings2, label: 'Brand', value: machine.brand },
              { icon: Tag, label: 'Model', value: machine.model },
              { icon: MapPin, label: 'Location', value: machine.location },
              { icon: Calendar, label: 'Purchase Date', value: machine.purchase_date },
              { icon: Tag, label: 'ID', value: machine.id.toUpperCase() },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                <item.icon size={18} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{item.label}</div>
                  <div style={{ fontWeight: 600 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'work-orders' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Issue</th><th>Technician</th><th>Status</th><th>Wait</th><th>Fix</th><th>Cost</th><th>Date</th></tr>
            </thead>
            <tbody>
              {workOrders.map(wo => (
                <tr key={wo.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{wo.id.toUpperCase()}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.issue_reported}</td>
                  <td>{wo.technician_name}</td>
                  <td><span className={`badge ${woStatusColors[wo.status]}`}>{wo.status.replace('_', ' ')}</span></td>
                  <td>{wo.waiting_time_minutes}m</td>
                  <td>{wo.fixing_time_minutes ? `${wo.fixing_time_minutes}m` : '—'}</td>
                  <td>{wo.cost ? `₹${wo.cost}` : '—'}</td>
                  <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{new Date(wo.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {workOrders.length === 0 && <div className="empty-state"><p>No work orders for this machine</p></div>}
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="image-grid">
          {issuePhotos.map(photo => (
            <div key={photo.id} className="image-card">
              <img src={photo.url} alt={photo.desc} loading="lazy" />
              <div className="image-overlay">
                <div style={{ fontWeight: 600 }}>{photo.desc}</div>
                <div style={{ opacity: 0.7 }}>{photo.by} • {photo.date}</div>
              </div>
            </div>
          ))}
          {issuePhotos.length === 0 && <div className="empty-state"><Image size={48} /><p>No issue photos</p></div>}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Task</th><th>Frequency</th><th>Last Completed</th><th>Next Due</th><th>Status</th></tr></thead>
            <tbody>
              {schedules.map(sch => {
                const overdue = new Date(sch.next_due) < new Date();
                return (
                  <tr key={sch.id}>
                    <td style={{ fontWeight: 600 }}>{sch.task_name}</td>
                    <td><span className="badge badge-info">{sch.frequency}</span></td>
                    <td>{sch.last_completed}</td>
                    <td>{sch.next_due}</td>
                    <td><span className={`badge ${overdue ? 'badge-danger' : 'badge-success'}`}>{overdue ? 'Overdue' : 'On Track'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {schedules.length === 0 && <div className="empty-state"><p>No preventive schedules</p></div>}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td>{exp.date}</td>
                  <td><span className="badge badge-info">{exp.expense_type}</span></td>
                  <td>{exp.description}</td>
                  <td style={{ fontWeight: 600 }}>₹{exp.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && <div className="empty-state"><p>No recorded expenses</p></div>}
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Date</th><th>From</th><th>To</th><th>Notes</th></tr></thead>
            <tbody>
              {transfers.map(tr => (
                <tr key={tr.id}>
                  <td>{tr.transfer_date}</td>
                  <td>{tr.from_location}</td>
                  <td>{tr.to_location}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{tr.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transfers.length === 0 && <div className="empty-state"><p>No transfer records</p></div>}
        </div>
      )}
    </div>
  );
}
