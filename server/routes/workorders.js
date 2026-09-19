import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import supabase from '../config/supabase.js';

const router = Router();

// GET /api/workorders
// Admin & Manager: all
// Supervisor: only orders they created (created_by)
// Technician: only orders assigned to them
router.get('/', authenticateToken, checkPermission('workorders', 'view'), async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 50 } = req.query;
    const { role, userId } = req.user;

    let query = supabase.from('work_orders').select('*', { count: 'exact' });

    // Role-based data scoping
    if (role === 'technician') {
      query = query.eq('assigned_technician', userId);
    } else if (role === 'supervisor') {
      query = query.eq('created_by', userId);
    }
    // admin and manager see all

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
router.get('/:id', authenticateToken, checkPermission('workorders', 'view'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('work_orders').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Work order not found.' });

    const { role, userId } = req.user;
    // Verify ownership for technician
    if (role === 'technician' && data.assigned_technician !== userId) {
      return res.status(403).json({ error: 'Access denied. This work order is not assigned to you.' });
    }
    // Verify ownership for supervisor
    if (role === 'supervisor' && data.created_by !== userId) {
      return res.status(403).json({ error: 'Access denied. This work order belongs to another team.' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch work order.' });
  }
});

// POST /api/workorders — Admin + Supervisor only
router.post('/', authenticateToken, checkPermission('workorders', 'create'), async (req, res) => {
  try {
    const { machine_id, assigned_technician, issue_reported, priority } = req.body;
    const { data, error } = await supabase.from('work_orders').insert({
      machine_id, assigned_technician, issue_reported,
      status: 'pending', priority: priority || 'medium',
      created_by: req.user.userId,  // track creator
    }).select().single();
    if (error) throw error;

    // Notify assigned technician via Socket.io
    const io = req.app.get('io');
    if (io && assigned_technician) {
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

// PUT /api/workorders/:id — Admin + Supervisor (own orders)
router.put('/:id', authenticateToken, checkPermission('workorders', 'edit'), async (req, res) => {
  try {
    // Supervisor can only edit their own work orders
    if (req.user.role === 'supervisor') {
      const { data: existing } = await supabase.from('work_orders').select('created_by').eq('id', req.params.id).single();
      if (existing?.created_by !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied. You can only edit work orders you created.' });
      }
    }
    const { data, error } = await supabase.from('work_orders').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update work order.' });
  }
});

// PATCH /api/workorders/:id/status — Admin, Supervisor (own), Technician (own assigned)
router.patch('/:id/status', authenticateToken, checkPermission('workorders', 'update_status'), async (req, res) => {
  try {
    const { status } = req.body;

    // Get current work order
    const { data: current } = await supabase.from('work_orders').select('*').eq('id', req.params.id).single();
    if (!current) return res.status(404).json({ error: 'Work order not found.' });

    const { role, userId } = req.user;

    // Technician: can only update their own assigned orders
    if (role === 'technician' && current.assigned_technician !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only update status of work orders assigned to you.' });
    }
    // Supervisor: can only update orders they created
    if (role === 'supervisor' && current.created_by !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only update status of work orders in your team.' });
    }

    const updates = { status };
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

// DELETE /api/workorders/:id — Admin only
router.delete('/:id', authenticateToken, checkPermission('workorders', 'delete'), async (req, res) => {
  try {
    const { error } = await supabase.from('work_orders').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Work order deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete work order.' });
  }
});

export default router;
