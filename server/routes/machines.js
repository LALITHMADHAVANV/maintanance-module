import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission, DataScope } from '../middleware/permissions.js';
import supabase from '../config/supabase.js';

const router = Router();

// GET /api/machines
// Admin & Manager: all machines
// Supervisor: all (no supervisor_id column yet — return all for now)
// Technician: only machines linked to their assigned work orders
router.get('/', authenticateToken, checkPermission('machines', 'view'), async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 50 } = req.query;
    const { role, userId } = req.user;

    // For technicians — only return machines from their assigned work orders
    if (role === 'technician') {
      const { data: wos } = await supabase
        .from('work_orders')
        .select('machine_id')
        .eq('assigned_technician', userId);
      const machineIds = [...new Set((wos || []).map(wo => wo.machine_id))];
      if (machineIds.length === 0) {
        return res.json({ data: [], total: 0, page: 1, limit: Number(limit) });
      }
      let query = supabase.from('machines').select('*', { count: 'exact' }).in('id', machineIds);
      if (type) query = query.eq('machine_type', type);
      if (status) query = query.eq('status', status);
      if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
      const { data, error, count } = await query;
      if (error) throw error;
      return res.json({ data, total: count, page: 1, limit: Number(limit) });
    }

    // Admin / Manager / Supervisor — full list
    let query = supabase.from('machines').select('*', { count: 'exact' });
    if (type) query = query.eq('machine_type', type);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch machines.' });
  }
});

// GET /api/machines/:id — all roles can view, but technician only if it's their assigned machine
router.get('/:id', authenticateToken, checkPermission('machines', 'view'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('machines').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Machine not found.' });

    // Technician: verify they have a work order for this machine
    if (req.user.role === 'technician') {
      const { data: wos } = await supabase
        .from('work_orders')
        .select('id')
        .eq('machine_id', req.params.id)
        .eq('assigned_technician', req.user.userId)
        .limit(1);
      if (!wos || wos.length === 0) {
        return res.status(403).json({ error: 'Access denied. This machine is not assigned to you.' });
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch machine.' });
  }
});

// POST /api/machines — Admin only
router.post('/', authenticateToken, checkPermission('machines', 'create'), async (req, res) => {
  try {
    const { name, machine_type, location, purchase_date, status, brand, model } = req.body;
    const { data, error } = await supabase.from('machines').insert({
      name, machine_type, location, purchase_date, status: status || 'active', brand, model
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create machine.' });
  }
});

// PUT /api/machines/:id — Admin only
router.put('/:id', authenticateToken, checkPermission('machines', 'edit'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('machines').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update machine.' });
  }
});

// DELETE /api/machines/:id — Admin only
router.delete('/:id', authenticateToken, checkPermission('machines', 'delete'), async (req, res) => {
  try {
    const { error } = await supabase.from('machines').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Machine deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete machine.' });
  }
});

// GET /api/machines/:id/issue-photos — all roles who can view the machine
router.get('/:id/issue-photos', authenticateToken, checkPermission('machines', 'view'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machine_issue_photos')
      .select('*')
      .eq('machine_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issue photos.' });
  }
});

export default router;
