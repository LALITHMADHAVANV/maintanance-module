import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessagingProvider } from './context/MessagingContext';
import { NotificationProvider } from './context/NotificationContext';
import { usePermission } from './hooks/usePermission';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import MachineDetail from './pages/MachineDetail';
import WorkOrders from './pages/WorkOrders';
import Messages from './pages/Messages';
import SpareParts from './pages/SpareParts';
import Analytics from './pages/Analytics';
import TabletEntry from './pages/TabletEntry';
import './App.css';

// ─── Auth gate: redirect to login if not authenticated ───────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ─── Role gate: redirect to home if role not allowed for this path ────────────
function RoleProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!allowedRoles || allowedRoles.includes(user?.role)) {
    return children;
  }

  // Access denied — show brief message and redirect to home
  return (
    <Navigate
      to="/"
      replace
      state={{
        accessDenied: true,
        from: location.pathname,
        role: user?.role,
        required: allowedRoles,
      }}
    />
  );
}

// ─── Access Denied Banner (shown on home page after redirect) ─────────────────
function AccessDeniedBanner() {
  const location = useLocation();
  const state = location.state;
  const [visible, setVisible] = useState(true);

  if (!state?.accessDenied || !visible) return null;

  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 20px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <span style={{ color: 'var(--red-600)', fontSize: 'var(--font-sm)' }}>
        🔒 Access denied to <strong>{state.from}</strong>.
        Your role (<strong>{state.role}</strong>) does not have permission to view this page.
        Required: <strong>{state.required?.join(', ')}</strong>.
      </span>
      <button
        onClick={() => setVisible(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}
      >×</button>
    </div>
  );
}

// ─── App Layout (authenticated shell) ────────────────────────────────────────
function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <AccessDeniedBanner />
        <Routes>
          {/* All roles — dashboard (content differs by role) */}
          <Route path="/" element={<Dashboard />} />

          {/* Admin, Manager, Supervisor only — Machines */}
          <Route path="/machines" element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager', 'supervisor']}>
              <Machines />
            </RoleProtectedRoute>
          } />
          <Route path="/machines/:id" element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager', 'supervisor', 'technician']}>
              <MachineDetail />
            </RoleProtectedRoute>
          } />

          {/* All roles — Work Orders */}
          <Route path="/work-orders" element={<WorkOrders />} />

          {/* Admin, Supervisor, Technician — Tablet Entry */}
          <Route path="/tablet-entry" element={
            <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'technician']}>
              <TabletEntry />
            </RoleProtectedRoute>
          } />
          <Route path="/tab" element={<Navigate to="/tablet-entry" replace />} />
          <Route path="/tab-entry" element={<Navigate to="/tablet-entry" replace />} />

          {/* All roles — Messages (content filtered by role) */}
          <Route path="/messages" element={<Messages />} />

          {/* All roles — Spare Parts (actions differ by role) */}
          <Route path="/spare-parts" element={<SpareParts />} />

          {/* Admin, Manager, Supervisor only — Analytics */}
          <Route path="/analytics" element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager', 'supervisor']}>
              <Analytics />
            </RoleProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <MessagingProvider>
            <NotificationProvider>
              <AppLayout />
            </NotificationProvider>
          </MessagingProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
