import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import supabase from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/messages/send-with-image
router.post('/send-with-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { receiver_id, content, message_type, work_order_id } = req.body;
    let imageUrl = null;
    let imagePath = null;

    // Upload image to Supabase Storage
    if (req.file) {
      const fileName = `${uuidv4()}-${req.file.originalname}`;
      const filePath = `issue-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('machine-images')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('machine-images').getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
      imagePath = filePath;
    }

    // Create message
    const { data: message, error } = await supabase.from('messages').insert({
      sender_id: req.user.userId,
      receiver_id,
      work_order_id: work_order_id || null,
      message_type: message_type || 'chat',
      content,
      has_image: !!req.file,
      is_read: false,
    }).select().single();

    if (error) throw error;

    // Create attachment if image
    if (req.file && message) {
      await supabase.from('message_attachments').insert({
        message_id: message.id,
        file_name: req.file.originalname,
        file_path: imagePath,
        file_url: imageUrl,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        uploaded_by: req.user.userId,
      });
    }

    // Notify via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiver_id}`).emit('new_message', {
        ...message,
        sender_name: req.user.name,
        sender_role: req.user.role,
        image_url: imageUrl,
      });
    }

    res.status(201).json({ ...message, image_url: imageUrl });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// GET /api/messages/inbox
router.get('/inbox', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, message_attachments(*)')
      .eq('receiver_id', req.user.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inbox.' });
  }
});

// GET /api/messages/sent
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, message_attachments(*)')
      .eq('sender_id', req.user.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sent messages.' });
  }
});

// GET /api/messages/message/:id
router.get('/message/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, message_attachments(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch message.' });
  }
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('messages').update({ is_read: true }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read.' });
  }
});

// DELETE /api/messages/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.from('messages').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// POST /api/messages/find-specialist
router.post('/find-specialist', authenticateToken, async (req, res) => {
  try {
    const { problem_category } = req.body;
    const { data: skills, error } = await supabase
      .from('specialist_skills')
      .select('*, users:user_id(id, name, email, phone, role, online_status)')
      .eq('skill_category', problem_category)
      .order('expertise_level', { ascending: false });

    if (error) throw error;
    res.json(skills || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to find specialists.' });
  }
});

// GET /api/messages/machine/:machineId/issue-photos
router.get('/machine/:machineId/issue-photos', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machine_issue_photos')
      .select('*')
      .eq('machine_id', req.params.machineId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issue photos.' });
  }
});

export default router;
