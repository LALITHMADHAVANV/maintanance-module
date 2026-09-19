import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import supabase from '../config/supabase.js';

const router = Router();

// GET /api/analytics/downtime
// Admin & Manager: all data | Supervisor: scoped to their work orders | Technician: 403
router.get('/downtime', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user;

    // Technician gets own performance — not full downtime analytics
    if (role === 'technician') {
      const { data, error } = await supabase
        .from('work_orders')
        .select('machine_id, waiting_time_minutes, fixing_time_minutes, created_at, status, assigned_technician')
        .eq('status', 'completed')
        .eq('assigned_technician', userId);
      if (error) throw error;
      return res.json(data || []);
    }

    let query = supabase
      .from('work_orders')
      .select('machine_id, waiting_time_minutes, fixing_time_minutes, created_at, status')
      .eq('status', 'completed');

    // Supervisor: scoped to their created work orders
    if (role === 'supervisor') {
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch downtime data.' });
  }
});

// GET /api/analytics/cost
// Technician: not allowed (403)
router.get('/cost', authenticateToken, checkPermission('analytics', 'view'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cost data.' });
  }
});

// GET /api/analytics/performance
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user;

    // Technician: only their own performance
    if (role === 'technician') {
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('*')
        .eq('assigned_technician', userId)
        .eq('status', 'completed');
      return res.json({ machines: [], workOrders: workOrders || [], scope: 'personal' });
    }

    const { data: machines } = await supabase.from('machines').select('*');
    let woQuery = supabase.from('work_orders').select('*').eq('status', 'completed');

    if (role === 'supervisor') {
      woQuery = woQuery.eq('created_by', userId);
    }

    const { data: workOrders } = await woQuery;
    res.json({ machines: machines || [], workOrders: workOrders || [], scope: role });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch performance data.' });
  }
});

// GET /api/analytics/reports — Admin & Manager only (full summary)
router.get('/reports', authenticateToken, checkPermission('analytics', 'view'), async (req, res) => {
  try {
    const { data: machines } = await supabase.from('machines').select('*');
    const { data: workOrders } = await supabase.from('work_orders').select('*');
    const { data: expenses } = await supabase.from('maintenance_expenses').select('*');
    const { data: spareParts } = await supabase.from('spare_parts').select('*');

    res.json({
      totalMachines: machines?.length || 0,
      totalWorkOrders: workOrders?.length || 0,
      completedOrders: workOrders?.filter(wo => wo.status === 'completed').length || 0,
      totalExpenses: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      lowStockParts: spareParts?.filter(p => p.quantity <= p.reorder_level).length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

export default router;
