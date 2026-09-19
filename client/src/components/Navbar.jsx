import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useMessaging } from '../context/MessagingContext';
import {
  LayoutDashboard, Settings2, Wrench, ClipboardList, MessageSquare,
  Package, BarChart3, LogOut, Menu, X, ChevronLeft, Bell, User, Tablet,
  Sun, Moon
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tablet-entry', icon: Tablet, label: 'Tablet Data Entry', badge: 'Shop Floor' },
  { path: '/machines', icon: Settings2, label: 'Machines' },
  { path: '/work-orders', icon: ClipboardList, label: 'Work Orders' },
  { path: '/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/spare-parts', icon: Package, label: 'Spare Parts' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Navbar({ collapsed: propCollapsed, setCollapsed: propSetCollapsed }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isLight } = useTheme();
  const { unreadCount: notifCount } = useNotifications();
  const { unreadCount: msgCount } = useMessaging();
  const navigate = useNavigate();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const collapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;
  const setCollapsed = propSetCollapsed !== undefined ? propSetCollapsed : setInternalCollapsed;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin: 'var(--primary-600)',
    manager: 'var(--purple-600)',
    supervisor: 'var(--emerald-600)',
    technician: 'var(--amber-600)',
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header hide-desktop">
        <button className="btn-icon" onClick={() => setMobileOpen(true)}>
          <Menu size={22} />
        </button>
        <span className="mobile-brand">TextileCare Pro</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-icon" onClick={toggleTheme} title={`Switch to ${isLight ? 'Dark' : 'White'} Theme`}>
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="btn-icon notification-btn" onClick={() => navigate('/messages')}>
            <Bell size={20} />
            {(notifCount + msgCount) > 0 && (
              <span className="notif-badge">{notifCount + msgCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Wrench size={collapsed ? 20 : 24} />
          </div>
          {!collapsed && (
            <div className="brand-text">
              <h2>TextileCare</h2>
              <span>Pro Maintenance</span>
            </div>
          )}
          <button className="collapse-btn hide-mobile" onClick={() => setCollapsed(!collapsed)}>
            <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
          <button className="close-btn hide-desktop" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.path === '/tablet-entry' ? 'nav-item-tablet' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="nav-pill-badge">{item.badge}</span>
              )}
              {!collapsed && item.path === '/messages' && msgCount > 0 && (
                <span className="nav-badge">{msgCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar" style={{ background: user?.avatar_color || 'var(--primary-600)' }}>
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            {!collapsed && (
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-role" style={{ color: roleColors[user?.role] }}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </div>
              </div>
            )}
          </div>
          <button
            className="nav-item theme-toggle-btn"
            onClick={toggleTheme}
            style={{ marginBottom: 4, width: '100%', cursor: 'pointer' }}
            title={`Switch to ${isLight ? 'Dark' : 'White'} Theme`}
          >
            {isLight ? <Moon size={20} className="text-primary-600" /> : <Sun size={20} className="text-amber-400" />}
            {!collapsed && (
              <span style={{ fontWeight: 600 }}>
                {isLight ? 'Switch to Dark' : 'White Theme'}
              </span>
            )}
          </button>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width var(--transition-base);
          overflow: hidden;
        }

        .sidebar.collapsed {
          width: var(--sidebar-collapsed);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 99;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-5) var(--space-4);
          border-bottom: 1px solid var(--border-default);
          min-height: var(--header-height);
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--primary-600), var(--emerald-600));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .brand-text h2 {
          font-size: var(--font-base);
          font-weight: 800;
          line-height: 1.2;
          white-space: nowrap;
        }

        .brand-text span {
          font-size: var(--font-xs);
          color: var(--text-muted);
          white-space: nowrap;
        }

        .collapse-btn, .close-btn {
          margin-left: auto;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }

        .collapse-btn:hover, .close-btn:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: var(--font-sm);
          font-weight: 500;
          transition: all var(--transition-fast);
          white-space: nowrap;
          text-decoration: none;
        }

        .nav-item:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: rgba(59, 130, 246, 0.12);
          color: var(--primary-400);
          font-weight: 600;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--primary-500);
          border-radius: 0 4px 4px 0;
        }

        .nav-badge {
          margin-left: auto;
          background: var(--primary-600);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: var(--radius-full);
          min-width: 20px;
          text-align: center;
        }

        .nav-pill-badge {
          margin-left: auto;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--emerald-400);
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .nav-item-tablet {
          background: rgba(59, 130, 246, 0.05);
          border: 1px dashed rgba(59, 130, 246, 0.2);
        }

        .nav-item-tablet:hover {
          border-color: var(--primary-500);
          background: rgba(59, 130, 246, 0.12);
        }

        .sidebar-footer {
          padding: var(--space-3);
          border-top: 1px solid var(--border-default);
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          margin-bottom: var(--space-2);
        }

        .user-name {
          font-size: var(--font-sm);
          font-weight: 600;
          white-space: nowrap;
        }

        .user-role {
          font-size: var(--font-xs);
          font-weight: 500;
          text-transform: capitalize;
        }

        .logout-btn {
          color: var(--red-400) !important;
          width: 100%;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1) !important;
        }

        /* Mobile Header */
        .mobile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--header-height);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-4);
          z-index: 90;
        }

        .mobile-brand {
          font-weight: 800;
          font-size: var(--font-base);
          background: linear-gradient(135deg, var(--primary-400), var(--emerald-400));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .notification-btn {
          position: relative;
        }

        .notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--red-500);
          color: white;
          font-size: 10px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-secondary);
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform var(--transition-base);
          }

          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
