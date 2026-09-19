import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = Router();

// GET /api/workorders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 50 } = req.query;
    let query = supabase.from('work_orders').select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (search) query = query.or(`issue_reported.ilike.%${search}%`);

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch work orders.' });
  }
});

// GET /api/workorders/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('work_orders').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch work order.' });
  }
});

// POST /api/workorders
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { machine_id, assigned_technician, issue_reported, priority } = req.body;
    const { data, error } = await supabase.from('work_orders').insert({
      machine_id, assigned_technician, issue_reported,
      status: 'pending', priority: priority || 'medium',
    }).select().single();
    if (error) throw error;

    // Notify via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${assigned_technician}`).emit('notification', {
        id: `notif_${Date.now()}`,
        type: 'assignment',
        title: 'New Task Assigned',
        message: issue_reported,
        priority: priority || 'medium',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create work order.' });
  }
});

// PUT /api/workorders/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('work_orders').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update work order.' });
  }
});

// PATCH /api/workorders/:id/status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const updates = { status };

    // Get current work order
    const { data: current } = await supabase.from('work_orders').select('*').eq('id', req.params.id).single();

    if (status === 'in_progress' && current && !current.started_at) {
      updates.started_at = new Date().toISOString();
      updates.waiting_time_minutes = Math.round((Date.now() - new Date(current.created_at).getTime()) / 60000);
    }

    if (status === 'completed' && current) {
      updates.completed_at = new Date().toISOString();
      if (current.started_at) {
        updates.fixing_time_minutes = Math.round((Date.now() - new Date(current.started_at).getTime()) / 60000);
      }
    }

    const { data, error } = await supabase.from('work_orders').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;

    // Broadcast status update
    const io = req.app.get('io');
    if (io) {
      io.emit('work_order_update', { workOrderId: req.params.id, status, ...updates });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// DELETE /api/workorders/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.from('work_orders').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Work order deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete work order.' });
  }
});

export default router;
