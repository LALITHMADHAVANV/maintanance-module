import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = Router();

// GET /api/machines
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 50 } = req.query;
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

// GET /api/machines/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('machines').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Machine not found.' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch machine.' });
  }
});

// POST /api/machines
router.post('/', authenticateToken, async (req, res) => {
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

// PUT /api/machines/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('machines').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update machine.' });
  }
});

// DELETE /api/machines/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.from('machines').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Machine deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete machine.' });
  }
});

// GET /api/machines/:id/issue-photos
router.get('/:id/issue-photos', authenticateToken, async (req, res) => {
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
