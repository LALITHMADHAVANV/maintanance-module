import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, X, Check, CheckCheck, AlertTriangle, Info, ClipboardList, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NOTIF_ICONS = {
  alert: AlertTriangle,
  assignment: ClipboardList,
  update: Info,
  schedule: Calendar,
};

const PRIORITY_COLORS = {
  critical: 'var(--red-500)',
  high: 'var(--amber-500)',
  normal: 'var(--primary-500)',
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      <button className="notif-bell-btn" onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllAsRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              notifications.slice(0, 10).map(notif => {
                const Icon = NOTIF_ICONS[notif.type] || Info;
                return (
                  <div
                    key={notif.id}
                    className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="notif-icon" style={{ color: PRIORITY_COLORS[notif.priority] || 'var(--primary-500)' }}>
                      <Icon size={18} />
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">{notif.title}</div>
                      <div className="notif-message">{notif.message}</div>
                      <div className="notif-time">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <button className="notif-clear" onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        .notif-bell-wrapper {
          position: relative;
        }

        .notif-bell-btn {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }

        .notif-bell-btn:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        .notif-count {
          position: absolute;
          top: 2px;
          right: 2px;
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
          animation: pulse-dot 2s ease infinite;
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 380px;
          max-height: 480px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          animation: slideUp 0.2s ease;
          z-index: 200;
        }

        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          border-bottom: 1px solid var(--border-default);
        }

        .notif-header h3 {
          font-size: var(--font-sm);
          font-weight: 700;
        }

        .mark-all-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--font-xs);
          color: var(--primary-400);
          transition: color var(--transition-fast);
        }

        .mark-all-btn:hover {
          color: var(--primary-300);
        }

        .notif-list {
          overflow-y: auto;
          max-height: 400px;
        }

        .notif-item {
          display: flex;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid rgba(51, 65, 85, 0.3);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .notif-item:hover {
          background: rgba(51, 65, 85, 0.3);
        }

        .notif-item.unread {
          background: rgba(59, 130, 246, 0.05);
          border-left: 3px solid var(--primary-500);
        }

        .notif-item:last-child {
          border-bottom: none;
        }

        .notif-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-content {
          flex: 1;
          min-width: 0;
        }

        .notif-title {
          font-size: var(--font-sm);
          font-weight: 600;
          line-height: 1.3;
        }

        .notif-message {
          font-size: var(--font-xs);
          color: var(--text-muted);
          line-height: 1.4;
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .notif-time {
          font-size: 11px;
          color: var(--text-disabled);
          margin-top: 2px;
        }

        .notif-clear {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          opacity: 0;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .notif-item:hover .notif-clear {
          opacity: 1;
        }

        .notif-clear:hover {
          background: rgba(239, 68, 68, 0.15);
          color: var(--red-400);
        }

        .notif-empty {
          padding: var(--space-8);
          text-align: center;
          color: var(--text-muted);
          font-size: var(--font-sm);
        }

        @media (max-width: 480px) {
          .notif-dropdown {
            width: calc(100vw - 24px);
            right: -12px;
          }
        }
      `}</style>
    </div>
  );
}
