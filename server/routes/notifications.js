import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// In-memory notifications store (would use Supabase in production)
let notifications = [];

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
  const userNotifs = notifications.filter(n => n.user_id === req.user.userId || !n.user_id);
  res.json(userNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

// GET /api/notifications/unread
router.get('/unread', authenticateToken, (req, res) => {
  const unread = notifications.filter(n =>
    (n.user_id === req.user.userId || !n.user_id) && !n.is_read
  );
  res.json({ count: unread.length, notifications: unread });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticateToken, (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.is_read = true;
    res.json(notif);
  } else {
    res.status(404).json({ error: 'Notification not found.' });
  }
});

// POST /api/notifications/alert
router.post('/alert', authenticateToken, (req, res) => {
  const { title, message, priority, user_id } = req.body;
  const notif = {
    id: `notif_${Date.now()}`,
    type: 'alert',
    title,
    message,
    priority: priority || 'normal',
    user_id: user_id || null,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  notifications.unshift(notif);

  // Broadcast via Socket.io
  const io = req.app.get('io');
  if (io) {
    if (user_id) {
      io.to(`user_${user_id}`).emit('notification', notif);
    } else {
      io.emit('notification', notif);
    }
  }

  res.status(201).json(notif);
});

export default router;
