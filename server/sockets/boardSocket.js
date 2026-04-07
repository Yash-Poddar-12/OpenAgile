/**
 * server/sockets/boardSocket.js
 * Handles the /board namespace for real-time Kanban updates.
 */
module.exports = (io) => {
  const boardNS = io.of('/board');

  boardNS.on('connection', (socket) => {
    // console.log(`[Socket] User connected to /board: ${socket.id}`);

    // joinProject { projectId, user: { userId, name, role } }
    socket.on('joinProject', ({ projectId, user }) => {
      if (!projectId) return;
      
      socket.join(projectId);
      socket.data.user = user;
      // console.log(`[Socket] User ${user?.name} joined project room: ${projectId}`);
      
      // Notify others in the room
      socket.to(projectId).emit('userJoined', {
        userId: user?.userId,
        name: user?.name,
        role: user?.role
      });
    });

    // leaveProject { projectId, userId }
    socket.on('leaveProject', ({ projectId, userId }) => {
      if (!projectId) return;
      
      socket.leave(projectId);
      // Notify others
      boardNS.to(projectId).emit('userLeft', { userId });
    });

    socket.on('disconnecting', () => {
      // Notify all rooms the socket was in
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit('userLeft', { userId: socket.data.user?.userId });
        }
      });
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
};
