import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import supabase from '../config/supabase.js';

const router = Router();

// GET /api/spareparts — all roles can view
router.get('/', authenticateToken, checkPermission('spareparts', 'view'), async (req, res) => {
  try {
    const { search, stock } = req.query;
    let query = supabase.from('spare_parts').select('*');
    if (search) query = query.or(`part_name.ilike.%${search}%,supplier.ilike.%${search}%`);
    query = query.order('part_name');
    const { data, error } = await query;
    if (error) throw error;

    let result = data || [];
    if (stock === 'low') result = result.filter(p => p.quantity <= p.reorder_level);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch spare parts.' });
  }
});

// POST /api/spareparts — Admin only
router.post('/', authenticateToken, checkPermission('spareparts', 'create'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('spare_parts').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create spare part.' });
  }
});

// PUT /api/spareparts/:id — Admin only
router.put('/:id', authenticateToken, checkPermission('spareparts', 'edit'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('spare_parts').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update spare part.' });
  }
});

// PATCH /api/spareparts/:id/use — Admin, Supervisor, Technician can use/deduct parts
router.patch('/:id/use', authenticateToken, checkPermission('spareparts', 'use'), async (req, res) => {
  try {
    const { quantity_used, machine_id, notes } = req.body;
    if (!quantity_used || quantity_used < 1) {
      return res.status(400).json({ error: 'quantity_used must be at least 1.' });
    }

    // Fetch current stock
    const { data: part, error: fetchErr } = await supabase.from('spare_parts').select('*').eq('id', req.params.id).single();
    if (fetchErr || !part) return res.status(404).json({ error: 'Spare part not found.' });

    if (part.quantity < quantity_used) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${part.quantity}, Requested: ${quantity_used}.` });
    }

    const newQuantity = part.quantity - quantity_used;
    const { data, error } = await supabase
      .from('spare_parts')
      .update({ quantity: newQuantity })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    // Log the usage
    await supabase.from('spare_part_usage').insert({
      spare_part_id: req.params.id,
      quantity_used,
      machine_id: machine_id || null,
      used_by: req.user.userId,
      notes: notes || null,
    }).select();

    res.json({ ...data, quantity_used, message: `Successfully deducted ${quantity_used} units. Remaining: ${newQuantity}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deduct spare part.' });
  }
});

// POST /api/spareparts/:id/restock — Admin & Supervisor can restock
router.post('/:id/restock', authenticateToken, checkPermission('spareparts', 'restock'), async (req, res) => {
  try {
    const { quantity_received, received_from, notes, photo_url } = req.body;
    if (!quantity_received || quantity_received < 1) {
      return res.status(400).json({ error: 'quantity_received must be at least 1.' });
    }

    // Fetch current stock
    const { data: part, error: fetchErr } = await supabase.from('spare_parts').select('*').eq('id', req.params.id).single();
    if (fetchErr || !part) return res.status(404).json({ error: 'Spare part not found.' });

    const quantity_before = part.quantity;
    const quantity_after = quantity_before + quantity_received;

    // Update spare_parts
    const { data: updatedPart, error: updateErr } = await supabase
      .from('spare_parts')
      .update({ 
        quantity: quantity_after,
        last_restocked_date: new Date().toISOString(),
        last_restocked_by: req.user.userId,
        restock_count: part.restock_count + 1
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    // Insert restock_history
    await supabase.from('restock_history').insert({
      part_id: req.params.id,
      quantity_received,
      quantity_before,
      quantity_after,
      received_from: received_from || null,
      received_by: req.user.userId,
      notes: notes || null,
      photo_url: photo_url || null,
    });

    res.json({ success: true, part: updatedPart, message: 'Parts restocked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to restock spare part.' });
  }
});

// GET /api/spareparts/:id/restock-history — All roles can view
router.get('/:id/restock-history', authenticateToken, checkPermission('spareparts', 'view'), async (req, res) => {
  try {
    // We join with the users table to get the name of the person who received it
    const { data, error } = await supabase
      .from('restock_history')
      .select('*, users!received_by(name, role)')
      .eq('part_id', req.params.id)
      .order('received_date', { ascending: false });
    
    if (error) throw error;
    
    // Map data to match frontend requirements
    const history = (data || []).map(record => ({
      ...record,
      received_by_name: record.users?.name || 'Unknown User'
    }));

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch restock history.' });
  }
});

// DELETE /api/spareparts/:id — Admin only
router.delete('/:id', authenticateToken, checkPermission('spareparts', 'delete'), async (req, res) => {
  try {
    const { error } = await supabase.from('spare_parts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Spare part deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete spare part.' });
  }
});

// GET /api/spareparts/low-stock — all roles who can view
router.get('/low-stock', authenticateToken, checkPermission('spareparts', 'view'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('spare_parts').select('*');
    if (error) throw error;
    const lowStock = (data || []).filter(p => p.quantity <= p.reorder_level);
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low stock items.' });
  }
});

export default router;
