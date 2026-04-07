/**
 * server/sockets/scanSocket.js
 * Handles the /scan namespace for real-time dependency analysis updates.
 */

module.exports = (io) => {
  const scanNS = io.of('/scan');

  scanNS.on('connection', (socket) => {
    // console.log(`[Socket] User connected to /scan: ${socket.id}`);

    // joinScan { scanId }
    socket.on('joinScan', ({ scanId }) => {
      if (!scanId) return;
      
      socket.join(scanId);
      // console.log(`[Socket] User joined scan progress room: ${scanId}`);
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] User disconnected from /scan: ${socket.id}`);
    });
  });
};
