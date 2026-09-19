export function setupSocketHandlers(io) {
  // Track online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    const userId = socket.handshake.auth?.userId;
    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.join(`user_${userId}`);
      io.emit('user_online', { userId, online: true });
    }

    // Join room (e.g., work order room)
    socket.on('join_room', ({ room }) => {
      socket.join(room);
      console.log(`📋 ${socket.id} joined room: ${room}`);
    });

    // Leave room
    socket.on('leave_room', ({ room }) => {
      socket.leave(room);
    });

    // Send message
    socket.on('send_message', (data) => {
      const { receiver_id } = data;
      if (receiver_id) {
        io.to(`user_${receiver_id}`).emit('new_message', {
          ...data,
          id: `msg_${Date.now()}`,
          created_at: new Date().toISOString(),
        });
      }
    });

    // Work order status update
    socket.on('work_order_update', (data) => {
      io.emit('work_order_status_change', data);
    });

    // Alert broadcast
    socket.on('alert', (data) => {
      io.emit('notification', {
        ...data,
        id: `notif_${Date.now()}`,
        type: 'alert',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    });

    // Machine status update
    socket.on('machine_status_update', (data) => {
      io.emit('machine_status_change', data);
    });

    // Typing indicator
    socket.on('typing', ({ receiver_id, isTyping }) => {
      io.to(`user_${receiver_id}`).emit('user_typing', {
        userId: socket.handshake.auth?.userId,
        isTyping,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      if (userId) {
        onlineUsers.delete(userId);
        io.emit('user_online', { userId, online: false });
      }
    });
  });

  // Log connected users periodically
  setInterval(() => {
    if (onlineUsers.size > 0) {
      console.log(`📡 Online users: ${onlineUsers.size}`);
    }
  }, 60000);
}
