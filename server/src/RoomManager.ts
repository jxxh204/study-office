import { Socket } from 'socket.io';

interface PlayerState {
  x: number;
  y: number;
  roomId: string;
}

export class RoomManager {
  // roomId → Set of socket ids
  private rooms: Map<string, Set<string>> = new Map();
  // socketId → PlayerState
  private players: Map<string, PlayerState> = new Map();
  // socketId → Socket ref
  private sockets: Map<string, Socket> = new Map();

  join(socket: Socket, roomId: string): void {
    this.sockets.set(socket.id, socket);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    const room = this.rooms.get(roomId)!;

    // Send existing players to the joiner
    const playersInRoom: Record<string, { x: number; y: number }> = {};
    room.forEach((id) => {
      const p = this.players.get(id);
      if (p) playersInRoom[id] = { x: p.x, y: p.y };
    });
    socket.emit('room-state', { players: playersInRoom });

    // Notify existing players
    room.forEach((id) => {
      this.sockets.get(id)?.emit('player-join', { socketId: socket.id });
    });

    room.add(socket.id);
    socket.join(roomId);
    this.players.set(socket.id, { x: 400, y: 400, roomId });

    console.log(`[Room] ${socket.id} joined ${roomId} (${room.size} players)`);
  }

  leave(socket: Socket, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.delete(socket.id);
    socket.leave(roomId);

    // Notify remaining
    room.forEach((id) => {
      this.sockets.get(id)?.emit('player-leave', { socketId: socket.id });
    });

    this.players.delete(socket.id);
    if (room.size === 0) this.rooms.delete(roomId);

    console.log(`[Room] ${socket.id} left ${roomId}`);
  }

  updatePosition(socket: Socket, x: number, y: number): void {
    const player = this.players.get(socket.id);
    if (!player) return;

    player.x = x;
    player.y = y;

    // Broadcast to others in same room
    const room = this.rooms.get(player.roomId);
    if (!room) return;

    room.forEach((id) => {
      if (id !== socket.id) {
        this.sockets.get(id)?.emit('player-move', { socketId: socket.id, x, y });
      }
    });
  }

  disconnectAll(socket: Socket): void {
    const player = this.players.get(socket.id);
    if (player) {
      this.leave(socket, player.roomId);
    }
    this.sockets.delete(socket.id);
  }

  getRoomForSocket(socketId: string): string | null {
    return this.players.get(socketId)?.roomId ?? null;
  }

  isInSameRoom(id1: string, id2: string): boolean {
    const r1 = this.getRoomForSocket(id1);
    const r2 = this.getRoomForSocket(id2);
    return r1 !== null && r1 === r2;
  }
}
