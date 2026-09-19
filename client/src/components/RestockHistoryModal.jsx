import { useState, useEffect } from 'react';
import { X, History, Box, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RestockHistoryModal({ part, history, loading, onClose }) {
  if (!part) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={20} className="text-primary-500" />
            <div>
              <h2>Restock History</h2>
              <span className="text-muted text-xs">{part.part_name}</span>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p className="text-muted">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-input)', borderRadius: 8 }}>
            <Box size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
            <p className="text-muted">No restocking history found for this part.</p>
          </div>
        ) : (
          <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)' }}>
                <tr>
                  <th>Date</th>
                  <th>Quantity Received</th>
                  <th>Stock Change</th>
                  <th>Supplier</th>
                  <th>Received By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{new Date(record.received_date).toLocaleDateString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(record.received_date), { addSuffix: true })}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        +{record.quantity_received}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{record.quantity_before}</span>
                        <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontWeight: 600 }}>{record.quantity_after}</span>
                      </div>
                    </td>
                    <td>
                      {record.received_from ? (
                        <span style={{ fontSize: 13 }}>{record.received_from}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>Unspecified</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{record.received_by_name}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
