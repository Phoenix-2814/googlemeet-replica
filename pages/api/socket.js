// pages/api/socket.js
// Vercel serverless function that upgrades the underlying HTTP server to a Socket.io server.
// The client connects with: io({ path: '/api/socket' })

import { Server } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

let io; // singleton per Vercel instance

export default function handler(req, res) {
  if (!io) {
    const httpServer = res.socket.server;
    io = new Server(httpServer, {
      path: '/api/socket',
      cors: {
        origin: '*', // Vercel provides HTTPS, allow any origin for demo
        methods: ['GET', 'POST'],
      },
    });

    const roomMap = {};

    io.on('connection', (socket) => {
      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        if (!roomMap[roomId]) roomMap[roomId] = [];
        roomMap[roomId].push(socket.id);
        socket.to(roomId).emit('user-joined', socket.id);
        socket.emit('room-data', { roomId, participants: roomMap[roomId] });
      });

      socket.on('signal', ({ roomId, payload }) => {
        socket.to(roomId).emit('signal', { from: socket.id, payload });
      });

      socket.on('disconnect', () => {
        for (const [roomId, participants] of Object.entries(roomMap)) {
          const idx = participants.indexOf(socket.id);
          if (idx !== -1) {
            participants.splice(idx, 1);
            socket.to(roomId).emit('user-left', socket.id);
            if (participants.length === 0) delete roomMap[roomId];
          }
        }
      });
    });
  }
  // End the response; the socket server runs in the background.
  res.status(200).end();
}
