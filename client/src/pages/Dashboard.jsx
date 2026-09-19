import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useMachines } from '../hooks/useMachines';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useSpareParts } from '../hooks/useSpareParts';
import { mockPreventiveSchedules, mockUsers } from '../services/mockData';
import NotificationBell from '../components/NotificationBell';
import {
  Settings2, ClipboardList, AlertTriangle, Clock, CheckCircle2,
  TrendingUp, Users, Wrench, Activity, ArrowUpRight, Calendar, Zap, Tablet,
  Package, Play, Camera, MessageSquare, ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isTechnician = user?.role === 'technician';

  // Live Data Hooks
  const { allMachines: mockMachines } = useMachines();
  const { allWorkOrders: mockWorkOrders } = useWorkOrders();
  const { parts: mockSpareParts } = useSpareParts();

  // Global supervisor/admin stats
  const adminStats = useMemo(() => {
    const active = mockMachines.filter(m => m.status === 'active').length;
    const maintenance = mockMachines.filter(m => m.status === 'maintenance').length;
    const pending = mockWorkOrders.filter(wo => wo.status === 'pending').length;
    const inProgress = mockWorkOrders.filter(wo => wo.status === 'in_progress').length;
    const completed = mockWorkOrders.filter(wo => wo.status === 'completed').length;
    const totalDowntime = mockWorkOrders
      .filter(wo => wo.status === 'completed')
      .reduce((sum, wo) => sum + (wo.waiting_time_minutes || 0) + (wo.fixing_time_minutes || 0), 0);
    const onlineTechs = mockUsers.filter(u => u.role === 'technician' && u.online_status).length;
    const overdue = mockPreventiveSchedules.filter(ps => new Date(ps.next_due) < new Date()).length;

    return { active, maintenance, pending, inProgress, completed, totalDowntime, onlineTechs, overdue, totalMachines: mockMachines.length };
  }, [mockMachines, mockWorkOrders]);

  // Technician-only assigned work orders
  const myWorkOrders = useMemo(() => {
    return mockWorkOrders.filter(wo =>
      wo.assigned_technician === user?.id ||
      wo.technician_name === user?.name ||
      (user?.id === 'usr_006' && !wo.assigned_technician)
    );
  }, [user, mockWorkOrders]);

  const techStats = useMemo(() => {
    const pending = myWorkOrders.filter(wo => wo.status === 'pending').length;
    const inProgress = myWorkOrders.filter(wo => wo.status === 'in_progress').length;
    const completed = myWorkOrders.filter(wo => wo.status === 'completed').length;
    const avgFix = completed > 0
      ? Math.round(myWorkOrders.filter(wo => wo.status === 'completed').reduce((s, w) => s + (w.fixing_time_minutes || 0), 0) / completed)
      : 35;
    return { pending, inProgress, completed, avgFix, total: myWorkOrders.length };
  }, [myWorkOrders]);

  const recentOrders = mockWorkOrders.slice(0, 8);
  const overdueSchedules = mockPreventiveSchedules.filter(ps => new Date(ps.next_due) < new Date());

  const statusColors = { active: 'badge-success', inactive: 'badge-neutral', maintenance: 'badge-warning' };
  const woStatusColors = { pending: 'badge-warning', in_progress: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };
  const priorityColors = { critical: 'badge-danger', high: 'badge-warning', medium: 'badge-info', low: 'badge-neutral' };

  // =========================================================================
  // TECHNICIAN ROLE DASHBOARD (ONLY MY ASSIGNED WORK & SPARE PARTS TO RESTORE)
  // =========================================================================
  if (isTechnician) {
    return (
      <div className="dashboard-page" style={{ animation: 'fadeInUp 0.4s ease' }}>
        {/* Technician Header */}
        <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-warning" style={{ fontSize: 11, fontWeight: 700 }}>
                🔧 TECHNICIAN WORKSPACE
              </span>
              <span className="badge badge-success" style={{ fontSize: 11 }}>
                Online on Shop Floor
              </span>
            </div>
            <h1>My Assigned Tasks & Repairs</h1>
            <p className="page-subtitle">Welcome, <strong>{user?.name}</strong> • Showing only repairs assigned to you</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/tablet-entry')}
              style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Tablet size={18} /> Open Tablet Data Entry (Photo Proof)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/spare-parts')}
            >
              <Package size={16} /> Spare Parts & Restore
            </button>
            <NotificationBell />
          </div>
        </div>

        {/* Technician KPI Cards */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-card blue" onClick={() => navigate('/work-orders')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon blue"><Play size={22} /></div>
            <div>
              <div className="stat-value">{techStats.inProgress}</div>
              <div className="stat-label">In Progress Repairs</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-400)', marginTop: 2 }}>Actively fixing</div>
            </div>
          </div>

          <div className="stat-card amber" onClick={() => navigate('/work-orders')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon amber"><Clock size={22} /></div>
            <div>
              <div className="stat-value">{techStats.pending}</div>
              <div className="stat-label">Pending Queue</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--amber-400)', marginTop: 2 }}>Waiting for you</div>
            </div>
          </div>

          <div className="stat-card emerald" onClick={() => navigate('/work-orders')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon emerald"><CheckCircle2 size={22} /></div>
            <div>
              <div className="stat-value">{techStats.completed}</div>
              <div className="stat-label">Completed by Me</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--emerald-400)', marginTop: 2 }}>Photo verified</div>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon purple"><Wrench size={22} /></div>
            <div>
              <div className="stat-value">{techStats.avgFix}m</div>
              <div className="stat-label">Avg Fixing Time</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--purple-400)', marginTop: 2 }}>Per work order</div>
            </div>
          </div>
        </div>

        {/* Two-column layout for Technician */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          {/* Left Column: My Assigned Work Orders Queue */}
          <div className="card">
            <div className="chart-header">
              <h2 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={20} className="text-primary-400" />
                <span>My Assigned Work Orders ({myWorkOrders.length})</span>
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/work-orders')}>
                Full List <ArrowRight size={14} />
              </button>
            </div>

            {myWorkOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={40} className="text-emerald-400" style={{ margin: '0 auto 12px' }} />
                <h3>No pending tasks assigned!</h3>
                <p>You have resolved all assigned maintenance work orders.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myWorkOrders.slice(0, 6).map(wo => (
                  <div
                    key={wo.id}
                    style={{
                      padding: '16px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ color: 'var(--primary-400)', fontSize: 14 }}>{wo.id.toUpperCase()}</strong>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{wo.machine_name}</span>
                        <span className={`badge ${priorityColors[wo.priority]}`}>{wo.priority}</span>
                      </div>
                      <span className={`badge ${woStatusColors[wo.status]}`}>{wo.status.replace('_', ' ')}</span>
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {wo.issue_reported}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border-default)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Waiting: <strong>{wo.waiting_time_minutes}m</strong> {wo.fixing_time_minutes ? `• Fixed: ${wo.fixing_time_minutes}m` : ''}
                      </span>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate('/spare-parts')}
                          title="Get spare parts for this repair"
                        >
                          <Package size={13} /> Parts
                        </button>

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate('/tablet-entry')}
                          title="Open Tablet Data Entry to snap photo and complete"
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Camera size={14} /> Complete with Photo Proof
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Spare Parts to Restore */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="card">
              <div className="chart-header">
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={18} className="text-purple-400" /> Spare Parts to Restore
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/spare-parts')}>
                  View All
                </button>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Parts available in maintenance bay for your active repairs:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mockSpareParts.slice(0, 6).map(part => {
                  const isLow = part.quantity <= part.reorder_level;
                  return (
                    <div
                      key={part.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{part.part_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supplier: {part.supplier}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: isLow ? 'var(--red-400)' : 'var(--emerald-400)', fontSize: 14 }}>
                          {part.quantity} left
                        </strong>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Min: {part.reorder_level}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: 14 }}
                onClick={() => navigate('/spare-parts')}
              >
                <Package size={16} /> Manage & Restore Spare Parts
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ADMIN / SUPERVISOR / MANAGER DASHBOARD (PLANT-WIDE METRICS & ALL MACHINES)
  // =========================================================================
  return (
    <div className="dashboard-page" style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/tablet-entry')}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: 'var(--primary-300)',
              fontWeight: 700
            }}
          >
            <Tablet size={18} /> Tablet Data Entry (Tab Mode)
          </button>
          <NotificationBell />
          <button className="btn btn-primary" onClick={() => navigate('/work-orders')}>
            <ClipboardList size={16} /> New Work Order
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card blue" onClick={() => navigate('/machines')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon blue"><Settings2 size={24} /></div>
          <div>
            <div className="stat-value">{adminStats.totalMachines}</div>
            <div className="stat-label">Total Machines</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--emerald-400)', marginTop: 4 }}>
              {adminStats.active} operational
            </div>
          </div>
        </div>

        <div className="stat-card amber">
          <div className="stat-icon amber"><ClipboardList size={24} /></div>
          <div>
            <div className="stat-value">{adminStats.pending}</div>
            <div className="stat-label">Pending Tasks</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-400)', marginTop: 4 }}>
              {adminStats.inProgress} in progress
            </div>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div>
            <div className="stat-value">{adminStats.maintenance}</div>
            <div className="stat-label">Under Maintenance</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--red-400)', marginTop: 4 }}>
              {adminStats.overdue} overdue schedules
            </div>
          </div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-icon emerald"><Clock size={24} /></div>
          <div>
            <div className="stat-value">{Math.round(adminStats.totalDowntime / 60)}h</div>
            <div className="stat-label">Total Downtime</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
              This period
            </div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon purple"><Users size={24} /></div>
          <div>
            <div className="stat-value">{adminStats.onlineTechs}</div>
            <div className="stat-label">Online Technicians</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--emerald-400)', marginTop: 4 }}>
              Ready to assist
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Live Machine Status */}
        <div className="card">
          <div className="chart-header">
            <h2 className="chart-title"><Activity size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Live Machine Status</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/machines')}>View All <ArrowUpRight size={14} /></button>
          </div>
          <div className="machine-grid">
            {mockMachines.slice(0, 15).map(machine => (
              <div
                key={machine.id}
                className={`machine-tile ${machine.status}`}
                onClick={() => navigate(`/machines/${machine.id}`)}
              >
                <div className="machine-tile-header">
                  <span className="machine-tile-type">{machine.machine_type}</span>
                  <span className={`badge ${statusColors[machine.status]}`}>{machine.status}</span>
                </div>
                <div className="machine-tile-name">{machine.name}</div>
                <div className="machine-tile-location">{machine.location}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Online Technicians */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} /> Technicians
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mockUsers.filter(u => u.role === 'technician').map(tech => (
                <div key={tech.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
                  <div className="avatar avatar-sm" style={{ background: tech.avatar_color }}>
                    {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{tech.name}</div>
                  </div>
                  <div className={tech.online_status ? 'online-dot' : 'offline-dot'} />
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Maintenance */}
          {overdueSchedules.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red-400)' }}>
                <Calendar size={18} /> Overdue Maintenance
              </h3>
              {overdueSchedules.map(sch => (
                <div key={sch.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(51,65,85,0.3)', fontSize: 'var(--font-sm)' }}>
                  <div style={{ fontWeight: 600 }}>{sch.task_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>{sch.machine_name} — Due: {sch.next_due}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Work Orders */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="chart-header">
          <h2 className="chart-title"><ClipboardList size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Recent Work Orders</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/work-orders')}>View All <ArrowUpRight size={14} /></button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Machine</th>
                <th>Issue</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(wo => (
                <tr key={wo.id} onClick={() => navigate('/work-orders')} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{wo.id.toUpperCase()}</td>
                  <td>{wo.machine_name}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.issue_reported}</td>
                  <td>{wo.technician_name}</td>
                  <td><span className={`badge ${woStatusColors[wo.status]}`}>{wo.status.replace('_', ' ')}</span></td>
                  <td><span className={`badge ${priorityColors[wo.priority]}`}>{wo.priority}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>{new Date(wo.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .machine-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: var(--space-3);
        }

        .machine-tile {
          padding: var(--space-3);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          overflow: hidden;
        }

        .machine-tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .machine-tile.active::before { background: var(--emerald-500); }
        .machine-tile.maintenance::before { background: var(--amber-500); }
        .machine-tile.inactive::before { background: var(--slate-500); }

        .machine-tile:hover {
          border-color: var(--border-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .machine-tile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .machine-tile-type {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .machine-tile-name {
          font-size: var(--font-sm);
          font-weight: 600;
          margin-bottom: 2px;
        }

        .machine-tile-location {
          font-size: var(--font-xs);
          color: var(--text-muted);
        }

        @media (max-width: 1024px) {
          .dashboard-page > div:nth-child(3) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
