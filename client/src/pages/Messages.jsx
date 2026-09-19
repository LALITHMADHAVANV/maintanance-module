import { useState } from 'react';
import { useMessaging } from '../context/MessagingContext';
import { useAuth } from '../context/AuthContext';
import { mockUsers } from '../services/mockData';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare, Send, Search, Filter, Inbox, SendHorizonal, Trash2, X,
  Image, Camera, Check, CheckCheck, AlertTriangle, Clock, User
} from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const { messages, sendMessage, markAsRead, deleteMessage, getInbox, getSent, unreadCount } = useMessaging();
  const [activeTab, setActiveTab] = useState('inbox');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [composeForm, setComposeForm] = useState({
    receiver_id: '', content: '', message_type: 'chat', photo: null
  });

  const inbox = getInbox();
  const sent = getSent();
  const currentList = activeTab === 'inbox' ? inbox : sent;

  const filtered = currentList.filter(m => {
    const matchSearch = !search ||
      m.content.toLowerCase().includes(search.toLowerCase()) ||
      m.sender_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || m.message_type === filterType;
    return matchSearch && matchType;
  });

  const typeIcons = {
    assignment: { icon: '📋', color: 'var(--primary-400)' },
    update: { icon: '📝', color: 'var(--emerald-400)' },
    alert: { icon: '⚠️', color: 'var(--red-400)' },
    chat: { icon: '💬', color: 'var(--slate-400)' },
  };

  const handleSend = () => {
    if (!composeForm.receiver_id || !composeForm.content) return;
    const receiver = mockUsers.find(u => u.id === composeForm.receiver_id);
    sendMessage({
      receiver_id: composeForm.receiver_id,
      receiver_name: receiver?.name,
      content: composeForm.content,
      message_type: composeForm.message_type,
      has_image: !!composeForm.photo,
      image_url: composeForm.photo,
    });
    setShowCompose(false);
    setComposeForm({ receiver_id: '', content: '', message_type: 'chat', photo: null });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setComposeForm(prev => ({ ...prev, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1>Messages</h1>
          <p className="page-subtitle">{unreadCount} unread messages</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
          <Send size={16} /> Compose
        </button>
      </div>

      {/* Tabs & Filters */}
      <div className="filter-bar">
        <div className="tabs">
          <button className={`tab ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')}>
            <Inbox size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Inbox {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button className={`tab ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveTab('sent')}>
            <SendHorizonal size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Sent
          </button>
        </div>
        <div className="search-wrapper" style={{ flex: 1, maxWidth: 280 }}>
          <Search size={16} />
          <input className="search-input" placeholder="Search messages..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field" style={{ width: 150 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="assignment">Assignments</option>
          <option value="update">Updates</option>
          <option value="alert">Alerts</option>
          <option value="chat">Chat</option>
        </select>
      </div>

      {/* Message List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} />
            <h3>No messages</h3>
          </div>
        ) : (
          filtered.map(msg => (
            <div
              key={msg.id}
              className="msg-row"
              onClick={() => { setSelectedMsg(msg); if (activeTab === 'inbox') markAsRead(msg.id); }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 20px',
                borderBottom: '1px solid rgba(51,65,85,0.3)', cursor: 'pointer',
                background: !msg.is_read && activeTab === 'inbox' ? 'rgba(59,130,246,0.04)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div className="avatar avatar-sm" style={{ background: mockUsers.find(u => u.id === (activeTab === 'inbox' ? msg.sender_id : msg.receiver_id))?.avatar_color || 'var(--primary-600)', marginTop: 2 }}>
                {(activeTab === 'inbox' ? msg.sender_name : (mockUsers.find(u => u.id === msg.receiver_id)?.name || 'U'))?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: !msg.is_read ? 700 : 500, fontSize: 'var(--font-sm)' }}>
                    {activeTab === 'inbox' ? msg.sender_name : (mockUsers.find(u => u.id === msg.receiver_id)?.name || 'Unknown')}
                  </span>
                  <span style={{ fontSize: 11, color: typeIcons[msg.message_type]?.color }}>{typeIcons[msg.message_type]?.icon} {msg.message_type}</span>
                  {!msg.is_read && activeTab === 'inbox' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-500)' }} />}
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {msg.content}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                  {msg.has_image && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}><Image size={12} /> Photo</span>}
                </div>
              </div>
              <button className="btn-icon" style={{ opacity: 0.3, marginTop: 4 }} onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMsg && (
        <div className="modal-overlay" onClick={() => setSelectedMsg(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar" style={{ background: mockUsers.find(u => u.id === selectedMsg.sender_id)?.avatar_color || 'var(--primary-600)' }}>
                  {selectedMsg.sender_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedMsg.sender_name}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    {selectedMsg.sender_role} • {formatDistanceToNow(new Date(selectedMsg.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedMsg(null)}><X size={20} /></button>
            </div>
            <span className={`badge ${selectedMsg.message_type === 'alert' ? 'badge-danger' : selectedMsg.message_type === 'assignment' ? 'badge-info' : 'badge-neutral'}`} style={{ marginBottom: 'var(--space-4)' }}>
              {typeIcons[selectedMsg.message_type]?.icon} {selectedMsg.message_type}
            </span>
            <p style={{ fontSize: 'var(--font-base)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>{selectedMsg.content}</p>
            {selectedMsg.image_url && (
              <img src={selectedMsg.image_url} alt="Attachment" style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }} />
            )}
            {selectedMsg.work_order_id && (
              <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Related Work Order: <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>{selectedMsg.work_order_id.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Message</h2>
              <button className="btn-icon" onClick={() => setShowCompose(false)}><X size={20} /></button>
            </div>
            <div className="input-group">
              <label>To</label>
              <select className="select-field" value={composeForm.receiver_id} onChange={e => setComposeForm(prev => ({ ...prev, receiver_id: e.target.value }))}>
                <option value="">Select recipient...</option>
                {mockUsers.filter(u => u.id !== user?.id).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Type</label>
              <select className="select-field" value={composeForm.message_type} onChange={e => setComposeForm(prev => ({ ...prev, message_type: e.target.value }))}>
                <option value="chat">Chat</option>
                <option value="assignment">Assignment</option>
                <option value="update">Update</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <div className="input-group">
              <label>Message</label>
              <textarea className="input-field" rows={4} value={composeForm.content} onChange={e => setComposeForm(prev => ({ ...prev, content: e.target.value }))} placeholder="Type your message..." />
            </div>
            {/* Photo upload */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-4)' }}>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                <Camera size={14} /> Camera
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                <Image size={14} /> File
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
            </div>
            {composeForm.photo && (
              <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
                <img src={composeForm.photo} alt="Attachment" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => setComposeForm(prev => ({ ...prev, photo: null }))}><X size={14} /></button>
              </div>
            )}
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSend} disabled={!composeForm.receiver_id || !composeForm.content}>
              <Send size={16} /> Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
