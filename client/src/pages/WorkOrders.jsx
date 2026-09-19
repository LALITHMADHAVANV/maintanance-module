import { useState, useCallback, useMemo } from 'react';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useSpecialists } from '../hooks/useSpecialists';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useMachines } from '../hooks/useMachines';
import { mockUsers, PROBLEM_TYPES } from '../services/mockData';
import {
  ClipboardList, Plus, Search, Filter, X, Play, CheckCircle2, XCircle,
  Clock, Timer, DollarSign, AlertTriangle, Camera, Send, UserCheck, ShieldOff, Eye
} from 'lucide-react';

export default function WorkOrders() {
  const { user } = useAuth();
  const { can, role, isTechnician, isSupervisor, isManager, isAdmin, canManageWorkOrders } = usePermission();

  const canCreate = can('workorders', 'create');
  const canDelete = can('workorders', 'delete');
  const isReadOnly = isManager; // Managers view all but cannot create/edit/delete

  const {
    workOrders, search, setSearch, filterStatus, setFilterStatus,
    filterPriority, setFilterPriority, addWorkOrder, updateStatus,
    updateWorkOrder, deleteWorkOrder, stats: globalStats
  } = useWorkOrders();
  const { allMachines: machines } = useMachines();
  const { findSpecialists, problemTypes } = useSpecialists();

  // Role-based order scoping
  const displayedOrders = useMemo(() => {
    if (isAdmin || isManager) return workOrders; // see all
    if (isTechnician) {
      return workOrders.filter(wo =>
        wo.assigned_technician === user?.id ||
        wo.technician_name === user?.name ||
        (user?.id === 'usr_006' && !wo.assigned_technician)
      );
    }
    if (isSupervisor) {
      // Supervisor sees orders they created or orders for their team
      return workOrders.filter(wo =>
        wo.reported_by === user?.id ||
        wo.supervisor_id === user?.id ||
        wo.created_by === user?.id
      );
    }
    return workOrders;
  }, [workOrders, isAdmin, isManager, isTechnician, isSupervisor, user]);

  const stats = useMemo(() => {
    if (!isTechnician) return globalStats;
    const completed = displayedOrders.filter(wo => wo.status === 'completed');
    const totalCost = completed.reduce((sum, wo) => sum + (wo.cost || 0), 0);
    const avgFixingTime = completed.length > 0
      ? Math.round(completed.reduce((s, wo) => s + (wo.fixing_time_minutes || 0), 0) / completed.length)
      : 0;

    return {
      pending: displayedOrders.filter(wo => wo.status === 'pending').length,
      inProgress: displayedOrders.filter(wo => wo.status === 'in_progress').length,
      completed: completed.length,
      avgFixingTime,
      totalCost
    };
  }, [isTechnician, globalStats, displayedOrders]);

  const [showModal, setShowModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [completeModalWO, setCompleteModalWO] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    fixing_time_minutes: 45,
    cost: 350,
    action_taken: '',
    photo: null,
    photoError: false,
  });
  const [step, setStep] = useState(1); // 1=machine, 2=issue, 3=specialist, 4=confirm
  const [form, setForm] = useState({
    machine_id: '', problem_type: '', issue_detail: '', priority: 'medium',
    assigned_technician: '', photo: null,
  });
  const [matchedSpecs, setMatchedSpecs] = useState([]);

  const woStatusColors = { pending: 'badge-warning', in_progress: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };
  const priorityColors = { critical: 'badge-danger', high: 'badge-warning', medium: 'badge-info', low: 'badge-neutral' };

  const openCompleteModal = (wo) => {
    setCompleteModalWO(wo);
    setCompleteForm({
      fixing_time_minutes: wo.fixing_time_minutes || 45,
      cost: wo.cost || 350,
      action_taken: 'Replaced worn parts & adjusted needle timing. Cleaned and lubricated unit.',
      photo: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500', // Default sample proof photo
      photoError: false
    });
  };

  const handleCompleteSubmit = () => {
    if (!completeForm.photo) {
      setCompleteForm(prev => ({ ...prev, photoError: true }));
      return;
    }

    if (completeModalWO) {
      updateWorkOrder(completeModalWO.id, {
        status: 'completed',
        fixing_time_minutes: Number(completeForm.fixing_time_minutes) || 30,
        cost: Number(completeForm.cost) || 0,
        action_taken: completeForm.action_taken,
        completion_photo: completeForm.photo,
        completed_at: new Date().toISOString()
      });
      setCompleteModalWO(null);
    }
  };

  const handleCompletePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCompleteForm(prev => ({ ...prev, photo: reader.result, photoError: false }));
      reader.readAsDataURL(file);
    }
  };

  const openCreate = () => {
    setForm({ machine_id: '', problem_type: '', issue_detail: '', priority: 'medium', assigned_technician: '', photo: null });
    setStep(1);
    setMatchedSpecs([]);
    setShowModal(true);
    setSelectedWO(null);
  };

  const handleSelectProblem = (problemId) => {
    setForm(prev => ({ ...prev, problem_type: problemId }));
    const specs = findSpecialists(problemId);
    setMatchedSpecs(specs);
    setStep(3);
  };

  const handleSelectSpecialist = (techId) => {
    setForm(prev => ({ ...prev, assigned_technician: techId }));
    setStep(4);
  };

  const handleSubmitOrder = () => {
    const machine = machines.find(m => m.id === form.machine_id);
    const tech = mockUsers.find(u => u.id === form.assigned_technician);
    const problem = PROBLEM_TYPES.find(p => p.id === form.problem_type);

    addWorkOrder({
      machine_id: form.machine_id,
      machine_name: machine?.name || '',
      machine_type: machine?.machine_type || '',
      assigned_technician: form.assigned_technician,
      technician_name: tech?.name || '',
      reported_by: 'usr_003', // Current user
      reporter_name: 'Current User',
      issue_reported: `${problem?.icon || '🔧'} ${problem?.label || 'Issue'} — ${form.issue_detail || machine?.name}`,
      problem_type: form.problem_type,
      problem_category: problem?.category || 'general',
      priority: form.priority,
    });
    setShowModal(false);
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setForm(prev => ({ ...prev, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const openDetail = (wo) => {
    setSelectedWO(wo);
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1>
              {isTechnician ? 'My Assigned Work Orders'
                : isSupervisor ? 'My Team\'s Work Orders'
                : isManager ? 'All Work Orders (Read-Only)'
                : 'Work Orders'}
            </h1>
            {isTechnician && <span className="badge badge-warning" style={{ fontSize: 11, fontWeight: 700 }}>Technician Queue</span>}
            {isSupervisor && <span className="badge badge-success" style={{ fontSize: 11, fontWeight: 700 }}>My Team</span>}
            {isManager && <span className="badge" style={{ fontSize: 11, fontWeight: 700, background: 'rgba(168,85,247,0.15)', color: 'var(--purple-600)' }}>Read-Only</span>}
          </div>
          <p className="page-subtitle">
            {isTechnician
              ? `Showing only tasks assigned to you (${user?.name}) • ${stats.pending} pending • ${stats.inProgress} in progress • ${stats.completed} completed`
              : `${stats.pending} pending • ${stats.inProgress} in progress • ${stats.completed} completed`
            }
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Create Work Order
          </button>
        )}
      </div>

      {/* Role context banners */}
      {isTechnician && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 'var(--space-6)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <UserCheck size={20} />
          <div style={{ fontSize: 13 }}>
            <strong>Technician View:</strong> Showing only tasks assigned to you. Complete tasks by clicking the check mark and providing a mandatory completion photo.
          </div>
        </div>
      )}
      {isSupervisor && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 'var(--space-6)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <UserCheck size={20} style={{ color: 'var(--emerald-500)' }} />
          <div style={{ fontSize: 13 }}>
            <strong>Supervisor View:</strong> Showing work orders from your team. You can create, assign, and update status on your team’s work orders.
          </div>
        </div>
      )}
      {isManager && (
        <div style={{
          background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 'var(--space-6)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <Eye size={20} style={{ color: 'var(--purple-500)' }} />
          <div style={{ fontSize: 13 }}>
            <strong>Manager View:</strong> You have full visibility of all work orders across the department. This is a read-only view — only admins and supervisors can create or modify work orders.
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid work-orders-stats" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card amber">
          <div className="stat-icon amber"><Clock size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">{isTechnician ? 'My Pending' : 'Pending'}</div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Play size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">{isTechnician ? 'My In Progress' : 'In Progress'}</div>
          </div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald"><CheckCircle2 size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">{isTechnician ? 'My Completed' : 'Completed'}</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><Timer size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.avgFixingTime}m</div>
            <div className="stat-label">Avg Fix Time</div>
          </div>
        </div>
        {!isTechnician && (
          <div className="stat-card red">
            <div className="stat-icon red"><DollarSign size={20} /></div>
            <div className="stat-info">
              <div className="stat-value">₹{stats.totalCost.toLocaleString()}</div>
              <div className="stat-label">Total Cost</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={16} />
          <input className="search-input" placeholder="Search work orders..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="select-field" style={{ width: 150 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Machine</th>
              <th>Issue</th>
              <th>Technician</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Wait</th>
              <th>Fix</th>
              <th>Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map(wo => (
              <tr key={wo.id}>
                <td style={{ fontWeight: 600, color: 'var(--primary-400)', cursor: 'pointer' }} onClick={() => openDetail(wo)}>{wo.id.toUpperCase()}</td>
                <td>{wo.machine_name}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.issue_reported}</td>
                <td>{wo.technician_name}</td>
                <td><span className={`badge ${priorityColors[wo.priority]}`}>{wo.priority}</span></td>
                <td><span className={`badge ${woStatusColors[wo.status]}`}>{wo.status.replace('_', ' ')}</span></td>
                <td style={{ fontSize: 'var(--font-xs)' }}>{wo.waiting_time_minutes}m</td>
                <td style={{ fontSize: 'var(--font-xs)' }}>{wo.fixing_time_minutes ? `${wo.fixing_time_minutes}m` : '—'}</td>
                <td style={{ fontSize: 'var(--font-xs)' }}>{wo.cost ? `₹${wo.cost}` : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {wo.status === 'pending' && (
                      <button className="btn btn-success btn-sm" onClick={() => updateStatus(wo.id, 'in_progress')} title="Start"><Play size={13} /></button>
                    )}
                    {wo.status === 'in_progress' && (
                      <button className="btn btn-primary btn-sm" onClick={() => openCompleteModal(wo)} title="Complete Task with Photo Verification"><CheckCircle2 size={13} /></button>
                    )}
                    {(wo.status === 'pending' || wo.status === 'in_progress') && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-400)' }} onClick={() => updateStatus(wo.id, 'cancelled')} title="Cancel"><XCircle size={13} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayedOrders.length === 0 && (
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>No assigned work orders found</h3>
          <p>{isTechnician ? 'You have no assigned tasks matching current filters.' : 'Adjust filters or create a new work order'}</p>
        </div>
      )}

      {/* Create Work Order Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>Create Work Order</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-6)' }}>
              {['Machine', 'Problem', 'Specialist', 'Confirm'].map((s, i) => (
                <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step > i ? 'var(--primary-600)' : step === i + 1 ? 'var(--primary-600)' : 'var(--slate-700)',
                    color: 'white', fontSize: 'var(--font-xs)', fontWeight: 700,
                    transition: 'all var(--transition-fast)'
                  }}>{i + 1}</div>
                  <div style={{ fontSize: 11, color: step === i + 1 ? 'var(--primary-400)' : 'var(--text-muted)' }}>{s}</div>
                </div>
              ))}
            </div>

            {/* Step 1: Select Machine */}
            {step === 1 && (
              <div>
                <div className="input-group">
                  <label>Select Machine</label>
                  <select className="select-field" value={form.machine_id} onChange={e => { setForm(prev => ({ ...prev, machine_id: e.target.value })); if (e.target.value) setStep(2); }}>
                    <option value="">Choose a machine...</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name} — {m.brand} ({m.location})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Select Problem Type */}
            {step === 2 && (
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12, display: 'block' }}>What's the problem?</label>

                {/* Photo capture */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-4)' }}>
                  <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                    <Camera size={16} /> Take Photo
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} style={{ display: 'none' }} />
                  </label>
                  <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                    📁 Upload File
                    <input type="file" accept="image/*" onChange={handlePhotoCapture} style={{ display: 'none' }} />
                  </label>
                </div>

                {form.photo && (
                  <div style={{ marginBottom: 'var(--space-4)', position: 'relative' }}>
                    <img src={form.photo} alt="Issue" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => setForm(prev => ({ ...prev, photo: null }))}><X size={14} /></button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {problemTypes.map(pt => (
                    <button key={pt.id} onClick={() => handleSelectProblem(pt.id)}
                      style={{
                        padding: '12px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
                        background: form.problem_type === pt.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                        borderColor: form.problem_type === pt.id ? 'var(--primary-500)' : 'var(--border-default)',
                        transition: 'all var(--transition-fast)', textAlign: 'center', cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{pt.icon}</div>
                      <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600 }}>{pt.label}</div>
                    </button>
                  ))}
                </div>

                <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                  <label>Additional Details</label>
                  <textarea className="input-field" rows={2} value={form.issue_detail} onChange={e => setForm(prev => ({ ...prev, issue_detail: e.target.value }))} placeholder="Describe the issue..." />
                </div>

                <div className="input-group" style={{ marginTop: 'var(--space-3)' }}>
                  <label>Priority</label>
                  <select className="select-field" value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <button className="btn btn-ghost" style={{ marginTop: 'var(--space-3)' }} onClick={() => setStep(1)}>← Back</button>
              </div>
            )}

            {/* Step 3: Select Specialist */}
            {step === 3 && (
              <div>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                  {matchedSpecs.length > 0 ? `Found ${matchedSpecs.length} specialist(s) for this issue:` : 'No specialists found for this category. Choose any technician:'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(matchedSpecs.length > 0 ? matchedSpecs : mockUsers.filter(u => u.role === 'technician')).map((spec, i) => (
                    <button key={spec.id} onClick={() => handleSelectSpecialist(spec.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--space-4)',
                        border: `1px solid ${form.assigned_technician === spec.id ? 'var(--primary-500)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-md)', background: form.assigned_technician === spec.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                        transition: 'all var(--transition-fast)', cursor: 'pointer', textAlign: 'left', width: '100%',
                      }}
                    >
                      <div className="avatar" style={{ background: spec.avatar_color }}>
                        {spec.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {spec.name}
                          {i === 0 && matchedSpecs.length > 0 && <span className="badge badge-success" style={{ fontSize: 10 }}>⭐ Best Match</span>}
                        </div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                          {spec.expertise_level && `${spec.expertise_level.charAt(0).toUpperCase() + spec.expertise_level.slice(1)} • `}
                          {spec.machines_handled ? `${spec.machines_handled} repairs` : spec.role}
                        </div>
                      </div>
                      <div className={spec.online_status ? 'online-dot' : 'offline-dot'} />
                    </button>
                  ))}
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 'var(--space-3)' }} onClick={() => setStep(2)}>← Back</button>
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <div>
                <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)' }}>Order Summary</h3>
                  {[
                    { label: 'Machine', value: machines.find(m => m.id === form.machine_id)?.name },
                    { label: 'Problem', value: PROBLEM_TYPES.find(p => p.id === form.problem_type)?.label },
                    { label: 'Priority', value: form.priority },
                    { label: 'Technician', value: mockUsers.find(u => u.id === form.assigned_technician)?.name },
                    { label: 'Details', value: form.issue_detail || '—' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.3)', fontSize: 'var(--font-sm)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                      <span style={{ fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                  {form.photo && (
                    <img src={form.photo} alt="Issue" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-3)' }} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
                  <button className="btn btn-success" style={{ flex: 1 }} onClick={handleSubmitOrder}>
                    <Send size={16} /> Create Work Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Work Order Detail Modal */}
      {selectedWO && (
        <div className="modal-overlay" onClick={() => setSelectedWO(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedWO.id.toUpperCase()}</h2>
              <button className="btn-icon" onClick={() => setSelectedWO(null)}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { label: 'Machine', value: selectedWO.machine_name },
                { label: 'Issue', value: selectedWO.issue_reported },
                { label: 'Technician', value: selectedWO.technician_name },
                { label: 'Status', value: selectedWO.status },
                { label: 'Priority', value: selectedWO.priority },
                { label: 'Waiting Time', value: `${selectedWO.waiting_time_minutes} minutes` },
                { label: 'Fixing Time', value: selectedWO.fixing_time_minutes ? `${selectedWO.fixing_time_minutes} minutes` : 'N/A' },
                { label: 'Cost', value: selectedWO.cost ? `₹${selectedWO.cost}` : 'N/A' },
                { label: 'Created', value: new Date(selectedWO.created_at).toLocaleString() },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.3)', fontSize: 'var(--font-sm)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}

              {/* Completion Photo Proof in Detail View */}
              {selectedWO.completion_photo && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <label style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--emerald-400)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <CheckCircle2 size={14} /> Technician Completion Proof Photo
                  </label>
                  <img
                    src={selectedWO.completion_photo}
                    alt="Completion Proof"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Complete Work Order Modal (Mandatory Technician Photo Verification) */}
      {completeModalWO && (
        <div className="modal-overlay" onClick={() => setCompleteModalWO(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h2>Complete Work Order</h2>
                <span className="text-muted text-xs">Technician Verification & Proof</span>
              </div>
              <button className="btn-icon" onClick={() => setCompleteModalWO(null)}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="card" style={{ background: 'var(--bg-input)', padding: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Order & Machine:</div>
                <strong style={{ fontSize: 'var(--font-md)' }}>{completeModalWO.id.toUpperCase()} — {completeModalWO.machine_name}</strong>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{completeModalWO.issue_reported}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isTechnician ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label>Fixing Time (Minutes)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={completeForm.fixing_time_minutes}
                    onChange={e => setCompleteForm(prev => ({ ...prev, fixing_time_minutes: e.target.value }))}
                  />
                </div>
                {!isTechnician && (
                  <div className="input-group">
                    <label>Repair / Parts Cost (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={completeForm.cost}
                      onChange={e => setCompleteForm(prev => ({ ...prev, cost: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Corrective Action Taken</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={completeForm.action_taken}
                  onChange={e => setCompleteForm(prev => ({ ...prev, action_taken: e.target.value }))}
                  placeholder="Details of repair done..."
                />
              </div>

              {/* MANDATORY TECHNICIAN COMPLETION PHOTO */}
              <div className="input-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Mandatory Completion Photo (Proof of Fix)</span>
                  <span className="badge badge-danger" style={{ fontSize: 10 }}>* Required</span>
                </label>

                {completeForm.photoError && !completeForm.photo && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    fontSize: 12,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <AlertTriangle size={14} />
                    <span>Technician photo is required to complete this work order.</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <label className="btn btn-ghost" style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                    <Camera size={16} /> Take Photo
                    <input type="file" accept="image/*" capture="environment" onChange={handleCompletePhotoCapture} style={{ display: 'none' }} />
                  </label>
                  <label className="btn btn-ghost" style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                    📁 Upload File
                    <input type="file" accept="image/*" onChange={handleCompletePhotoCapture} style={{ display: 'none' }} />
                  </label>
                </div>

                {completeForm.photo ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={completeForm.photo}
                      alt="Completion Preview"
                      style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid #10b981' }}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: 'white' }}
                      onClick={() => setCompleteForm(prev => ({ ...prev, photo: null }))}
                    >
                      <X size={14} />
                    </button>
                    <span style={{
                      position: 'absolute', bottom: 6, left: 6,
                      background: '#10b981', color: 'white',
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)'
                    }}>
                      ✅ Proof Attached
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    <span className="text-muted text-xs" style={{ width: '100%' }}>Or choose a sample proof photo:</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11 }}
                      onClick={() => setCompleteForm(prev => ({ ...prev, photo: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500', photoError: false }))}
                    >
                      ✅ Stitch Fix
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11 }}
                      onClick={() => setCompleteForm(prev => ({ ...prev, photo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500', photoError: false }))}
                    >
                      ✅ Motor Serviced
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 'var(--space-2)' }}>
                <button className="btn btn-ghost" onClick={() => setCompleteModalWO(null)}>Cancel</button>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={handleCompleteSubmit}>
                  <CheckCircle2 size={16} /> Complete & Close Work Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
