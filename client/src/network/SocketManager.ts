import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(): void {
    if (this.socket?.connected) return;
    this.socket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket!.id);
    });
    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }

  getSocketId(): string {
    return this.socket?.id ?? '';
  }

  joinRoom(roomId: string): void {
    this.socket?.emit('join-room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('leave-room', { roomId });
  }

  sendMove(x: number, y: number): void {
    this.socket?.emit('player-move', { x, y });
  }

  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  removeAllListeners(): void {
    // Remove game-specific listeners but keep connection ones
    const events = ['player-join', 'player-leave', 'player-move', 'room-state',
      'webrtc-offer', 'webrtc-answer', 'webrtc-ice-candidate'];
    events.forEach((e) => this.socket?.off(e));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
