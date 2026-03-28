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

io.on('connection', (socket) => {
  console.log(`[Server] Connected: ${socket.id}`);

  socket.on('join-room', ({ roomId }: { roomId: string }) => {
    roomManager.join(socket, roomId);
  });

  socket.on('leave-room', ({ roomId }: { roomId: string }) => {
    roomManager.leave(socket, roomId);
  });

  socket.on('player-move', ({ x, y }: { x: number; y: number }) => {
    roomManager.updatePosition(socket, x, y);
  });

  // WebRTC signaling
  SignalingHandler.register(socket, roomManager);

  socket.on('disconnect', () => {
    console.log(`[Server] Disconnected: ${socket.id}`);
    roomManager.disconnectAll(socket);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] Listening on http://localhost:${PORT}`);
});
