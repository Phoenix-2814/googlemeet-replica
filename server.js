// server.js
// Custom Express + Socket.io server that works with Next.js
// Run with `npm start` (see package.json)

const express = require('express');
const next = require('next');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Render provides TLS, allow any origin for simple demo
      methods: ['GET', 'POST'],
    },
  });

  // Simple signalling logic: rooms are identified by meetingId (UUID)
  const roomMap = {};

  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      // Initialize room entry if needed
      if (!roomMap[roomId]) roomMap[roomId] = [];
      roomMap[roomId].push(socket.id);
      // Notify existing participants about the new user
      socket.to(roomId).emit('user-joined', socket.id);
      // Send current participants list to the joining socket
      socket.emit('room-data', { roomId, participants: roomMap[roomId] });
    });

    socket.on('signal', ({ roomId, payload }) => {
      // Forward signalling data to other peers in the same room
      socket.to(roomId).emit('signal', { from: socket.id, payload });
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id);
      // Remove socket from any rooms it was part of
      for (const [roomId, participants] of Object.entries(roomMap)) {
        const idx = participants.indexOf(socket.id);
        if (idx !== -1) {
          participants.splice(idx, 1);
          // Notify remaining participants that someone left
          socket.to(roomId).emit('user-left', socket.id);
          if (participants.length === 0) delete roomMap[roomId];
        }
      }
    });
  });

  // Admin API to list active rooms
  server.get('/api/rooms', (req, res) => {
    const activeRooms = Object.keys(roomMap);
    res.json({ rooms: activeRooms });
  });

  // Let Next handle all other routes
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

