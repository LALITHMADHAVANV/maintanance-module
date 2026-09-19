import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = Router();

// GET /api/specialists
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, online_status')
      .eq('role', 'technician');
    if (error) throw error;

    // Enrich with skills
    const { data: skills } = await supabase.from('specialist_skills').select('*');
    const enriched = data.map(tech => ({
      ...tech,
      skills: (skills || []).filter(s => s.user_id === tech.id),
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch specialists.' });
  }
});

// PUT /api/specialists/:id/skills
router.put('/:id/skills', authenticateToken, async (req, res) => {
  try {
    const { skills } = req.body;
    // Delete existing and re-insert
    await supabase.from('specialist_skills').delete().eq('user_id', req.params.id);
    if (skills && skills.length > 0) {
      const { error } = await supabase.from('specialist_skills').insert(
        skills.map(s => ({ user_id: req.params.id, ...s }))
      );
      if (error) throw error;
    }
    res.json({ message: 'Skills updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update skills.' });
  }
});

export default router;
