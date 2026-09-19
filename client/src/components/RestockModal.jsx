import { useState } from 'react';
import { X, CheckCircle2, TrendingUp, Search } from 'lucide-react';

export default function RestockModal({ part, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState(part?.supplier || '');
  const [notes, setNotes] = useState('');

  const numQuantity = Number(quantity);
  const isValid = numQuantity > 0;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    
    onConfirm({
      quantity_received: numQuantity,
      received_from: supplier,
      notes,
    });
  };

  if (!part) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <h2>Restock Parts</h2>
            <span className="text-muted text-xs">Inventory Update</span>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ background: 'var(--bg-input)', marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selected Spare Part:</div>
            <strong style={{ fontSize: 18 }}>{part.part_name}</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13 }}>
              <span>Current Stock: <strong style={{ color: part.quantity <= part.reorder_level ? 'var(--red-500)' : 'inherit'}}>{part.quantity} units</strong></span>
              <span>Reorder Level: <strong>{part.reorder_level}</strong></span>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label>Quantity Received <span style={{ color: 'var(--red-500)' }}>*</span></label>
            <input 
              type="number" 
              className="input-field" 
              style={{ fontSize: 18, fontWeight: 600 }}
              value={quantity} 
              onChange={e => setQuantity(e.target.value)}
              min="1"
              required
              autoFocus
            />
          </div>
          
          {isValid && (
             <div style={{ 
               padding: 12, 
               background: 'rgba(16,185,129,0.08)', 
               border: '1px solid rgba(16,185,129,0.2)', 
               borderRadius: 8, 
               marginBottom: 16,
               display: 'flex',
               alignItems: 'center',
               gap: 8,
               color: 'var(--emerald-600)',
               fontSize: 14
             }}>
               <TrendingUp size={18} />
               <span>
                 Stock will update from <strong>{part.quantity}</strong> to <strong>{part.quantity + numQuantity}</strong> units.
               </span>
             </div>
          )}

          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label>Received From (Supplier)</label>
            <input 
              type="text" 
              className="input-field" 
              value={supplier} 
              onChange={e => setSupplier(e.target.value)}
              placeholder="e.g. ABC Manufacturing"
            />
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label>Notes / Condition</label>
            <textarea 
              className="input-field" 
              style={{ minHeight: 80, resize: 'vertical' }}
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Good condition, 2 boxes arrived damaged..."
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="btn btn-success" 
              style={{ flex: 1 }}
              disabled={!isValid}
            >
              <CheckCircle2 size={16} /> Complete Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
