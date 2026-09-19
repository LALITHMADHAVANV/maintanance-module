import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = Router();

// GET /api/spareparts
router.get('/', authenticateToken, async (req, res) => {
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

// POST /api/spareparts
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('spare_parts').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create spare part.' });
  }
});

// PUT /api/spareparts/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('spare_parts').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update spare part.' });
  }
});

// GET /api/spareparts/low-stock
router.get('/low-stock', authenticateToken, async (req, res) => {
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
