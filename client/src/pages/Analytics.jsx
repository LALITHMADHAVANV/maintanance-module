import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { getDowntimeData, getCostData, getPerformanceData, getBrandComparisonData, mockWorkOrders, mockMachines, mockExpenses } from '../services/mockData';
import { BarChart3, Clock, DollarSign, TrendingUp, Download, Filter, ShieldOff } from 'lucide-react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
      padding: '10px 14px', boxShadow: 'var(--shadow-lg)', fontSize: 'var(--font-xs)'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: p.color }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('downtime');
  const [period, setPeriod] = useState('month');
  const { can, role, isSupervisor, isAdmin, isManager } = usePermission();
  const { user } = useAuth();
  const canExport = can('analytics', 'export');

  const downtimeData = useMemo(() => getDowntimeData(), []);
  const costData = useMemo(() => getCostData(), []);
  const performanceData = useMemo(() => getPerformanceData(), []);
  const brandData = useMemo(() => getBrandComparisonData(), []);

  // Machine type distribution
  const typeDistribution = useMemo(() => {
    const counts = {};
    mockMachines.forEach(m => { counts[m.machine_type] = (counts[m.machine_type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, []);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts = { completed: 0, in_progress: 0, pending: 0, cancelled: 0 };
    mockWorkOrders.forEach(wo => { counts[wo.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value }));
  }, []);

  // Monthly expenses
  const monthlyExpenses = useMemo(() => {
    const months = {};
    mockExpenses.forEach(e => {
      const month = e.date.substring(0, 7);
      months[month] = (months[month] || 0) + e.amount;
    });
    return Object.entries(months).map(([name, amount]) => ({ name, amount })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="page-subtitle">
            {isSupervisor ? 'Your team\'s machine performance, costs, and maintenance insights' : 'Machine performance, costs, and maintenance insights'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="select-field" style={{ width: 130 }} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          {canExport && <button className="btn btn-ghost"><Download size={16} /> Export</button>}
        </div>
      </div>

      {/* Role scope banner */}
      {isSupervisor && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
          marginBottom: 16, borderRadius: 'var(--radius-md)',
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <ShieldOff size={16} style={{ color: 'var(--emerald-500)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            <strong>Supervisor view</strong> — Analytics are scoped to your team’s machines and work orders. Export is available to Admins and Managers only.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { key: 'downtime', icon: Clock, label: 'Downtime' },
          { key: 'cost', icon: DollarSign, label: 'Cost Analysis' },
          { key: 'performance', icon: TrendingUp, label: 'Performance' },
          { key: 'overview', icon: BarChart3, label: 'Overview' },
        ].map(tab => (
          <button key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            <tab.icon size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Downtime Tab */}
      {activeTab === 'downtime' && (
        <div>
          <div className="chart-container" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="chart-header">
              <h3 className="chart-title">Downtime by Machine Type (hours)</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={downtimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="single-needle" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="double-needle" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overlock" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bartack" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="other" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">Downtime Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={downtimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="single-needle" stackId="1" stroke="#3b82f6" fill="rgba(59,130,246,0.2)" />
                <Area type="monotone" dataKey="double-needle" stackId="1" stroke="#10b981" fill="rgba(16,185,129,0.2)" />
                <Area type="monotone" dataKey="overlock" stackId="1" stroke="#f59e0b" fill="rgba(245,158,11,0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cost Analysis Tab */}
      {activeTab === 'cost' && (
        <div>
          <div className="chart-container" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="chart-header">
              <h3 className="chart-title">Monthly Maintenance Costs (₹)</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="parts" fill="#3b82f6" name="Parts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="labor" fill="#10b981" name="Labor" radius={[4, 4, 0, 0]} />
                <Bar dataKey="service" fill="#f59e0b" name="Service" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">Expense History</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Amount (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Uptime by Machine Type (%)</h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={performanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="uptime" fill="#10b981" radius={[0, 4, 4, 0]} name="Uptime %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Brand Reliability Comparison</h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={brandData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar name="Reliability %" dataKey="reliability" stroke="#3b82f6" fill="rgba(59,130,246,0.2)" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container" style={{ marginTop: 'var(--space-6)' }}>
            <div className="chart-header">
              <h3 className="chart-title">Average Repair Time by Type (minutes)</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgRepairTime" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Repair (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">Machine Type Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                  dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b' }}>
                  {typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">Work Order Status</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                  dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#64748b' }}>
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-header">
              <h3 className="chart-title">Breakdowns by Machine Type</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="breakdowns" fill="#ef4444" radius={[4, 4, 0, 0]} name="Breakdowns" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
