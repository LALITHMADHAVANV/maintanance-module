import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = Router();

// GET /api/analytics/downtime
router.get('/downtime', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('work_orders')
      .select('machine_id, waiting_time_minutes, fixing_time_minutes, created_at, status')
      .eq('status', 'completed');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch downtime data.' });
  }
});

// GET /api/analytics/cost
router.get('/cost', authenticateToken, async (req, res) => {
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
    const { data: machines } = await supabase.from('machines').select('*');
    const { data: workOrders } = await supabase.from('work_orders').select('*').eq('status', 'completed');
    res.json({ machines: machines || [], workOrders: workOrders || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch performance data.' });
  }
});

// GET /api/analytics/reports
router.get('/reports', authenticateToken, async (req, res) => {
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
