import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission, ALLOWED_MESSAGE_TARGETS } from '../middleware/permissions.js';
import { upload } from '../middleware/upload.js';
import supabase from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/messages/send-with-image
// Role restrictions: technician → can only message supervisor/admin
//                   supervisor → can only message technicians/admin
//                   manager → read-only (cannot send)
router.post('/send-with-image', authenticateToken, checkPermission('messages', 'send'), upload.single('image'), async (req, res) => {
  try {
    const { receiver_id, content, message_type, work_order_id } = req.body;
    const { role, userId } = req.user;

    // Check allowed targets for this role
    const allowedTargets = ALLOWED_MESSAGE_TARGETS[role] || [];
    if (allowedTargets.length > 0) {
      // Fetch receiver's role
      const { data: receiver } = await supabase
        .from('users')
        .select('role')
        .eq('id', receiver_id)
        .single();

      if (receiver && !allowedTargets.includes(receiver.role)) {
        return res.status(403).json({
          error: `As a ${role}, you can only send messages to: ${allowedTargets.join(', ')}.`,
        });
      }
    }

    let imageUrl = null;
    let imagePath = null;

    if (req.file) {
      const fileName = `${uuidv4()}-${req.file.originalname}`;
      const filePath = `issue-photos/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('machine-images')
        .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('machine-images').getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
      imagePath = filePath;
    }

    const { data: message, error } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id,
      work_order_id: work_order_id || null,
      message_type: message_type || 'chat',
      content,
      has_image: !!req.file,
      is_read: false,
    }).select().single();

    if (error) throw error;

    if (req.file && message) {
      await supabase.from('message_attachments').insert({
        message_id: message.id,
        file_name: req.file.originalname,
        file_path: imagePath,
        file_url: imageUrl,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        uploaded_by: userId,
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiver_id}`).emit('new_message', {
        ...message,
        sender_name: req.user.name,
        sender_role: role,
        image_url: imageUrl,
      });
    }

    res.status(201).json({ ...message, image_url: imageUrl });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// GET /api/messages/inbox — own messages only (always scoped to receiver_id = userId)
router.get('/inbox', authenticateToken, checkPermission('messages', 'view'), async (req, res) => {
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

// GET /api/messages/sent — own sent messages only
router.get('/sent', authenticateToken, checkPermission('messages', 'view'), async (req, res) => {
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

// GET /api/messages/message/:id — only sender or receiver can view
router.get('/message/:id', authenticateToken, checkPermission('messages', 'view'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, message_attachments(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;

    // Only sender or receiver may view (admin bypasses)
    const { userId, role } = req.user;
    if (role !== 'admin' && data.sender_id !== userId && data.receiver_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You are not part of this conversation.' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch message.' });
  }
});

// PATCH /api/messages/:id/read — only receiver can mark as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { data: msg } = await supabase.from('messages').select('receiver_id').eq('id', req.params.id).single();
    if (msg && msg.receiver_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { data, error } = await supabase.from('messages').update({ is_read: true }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read.' });
  }
});

// DELETE /api/messages/:id — sender, receiver, or admin can delete
router.delete('/:id', authenticateToken, checkPermission('messages', 'delete'), async (req, res) => {
  try {
    const { data: msg } = await supabase.from('messages').select('sender_id, receiver_id').eq('id', req.params.id).single();
    const { userId, role } = req.user;
    if (role !== 'admin' && msg?.sender_id !== userId && msg?.receiver_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You cannot delete this message.' });
    }
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
