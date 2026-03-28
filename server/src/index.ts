import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { RoomManager } from './RoomManager';
import { SignalingHandler } from './SignalingHandler';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

// Broadcast room stats every 5 seconds
setInterval(() => {
  const stats = roomManager.getRoomStats();
  roomManager.getAllSockets().forEach((socket) => {
    socket.emit('room-stats', stats);
  });
}, 5000);

io.on('connection', (socket) => {
  console.log(`[Server] Connected: ${socket.id}`);

  // Send room stats immediately on connect
  socket.emit('room-stats', roomManager.getRoomStats());

  socket.on('join-room', ({ roomId }: { roomId: string }) => {
    roomManager.join(socket, roomId);
    // Broadcast updated stats
    io.emit('room-stats', roomManager.getRoomStats());
  });

  socket.on('leave-room', ({ roomId }: { roomId: string }) => {
    roomManager.leave(socket, roomId);
    // Broadcast updated stats
    io.emit('room-stats', roomManager.getRoomStats());
  });

  socket.on('player-move', ({ x, y }: { x: number; y: number }) => {
    roomManager.updatePosition(socket, x, y);
  });

  // WebRTC signaling
  SignalingHandler.register(socket, roomManager);

  socket.on('disconnect', () => {
    console.log(`[Server] Disconnected: ${socket.id}`);
    roomManager.disconnectAll(socket);
    // Broadcast updated stats
    io.emit('room-stats', roomManager.getRoomStats());
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] Listening on http://localhost:${PORT}`);
});
