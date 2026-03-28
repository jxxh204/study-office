import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager';

interface RoomInfo {
  id: string;
  name: string;
  color: number;
}

const ROOMS: RoomInfo[] = [
  { id: 'focus-room', name: '🎯 Focus Room', color: 0x0f3460 },
  { id: 'chill-room', name: '☕ Chill Room', color: 0x533483 },
  { id: 'collab-room', name: '🤝 Collab Room', color: 0xe94560 },
];

const MAX_PLAYERS = 10;

export class LobbyScene extends Phaser.Scene {
  private socket!: SocketManager;
  private roomCountTexts: Map<string, Phaser.GameObjects.Text> = new Map();

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, 80, 'Study Office', {
      fontSize: '32px',
      color: '#e0e0e0',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.add.text(width / 2, 130, 'Choose a room to join', {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const cardWidth = 320;
    const cardHeight = 100;
    const startY = 220;
    const gap = 24;

    ROOMS.forEach((room, i) => {
      const y = startY + i * (cardHeight + gap);
      const x = width / 2;

      const card = this.add.rectangle(x, y, cardWidth, cardHeight, room.color, 0.8)
        .setStrokeStyle(2, 0xffffff, 0.2)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, y - 10, room.name, {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: 'Arial',
      }).setOrigin(0.5);

      // Player count text (starts at 0/10)
      const countText = this.add.text(x, y + 20, '0/10 online', {
        fontSize: '14px',
        color: '#aaaaaa',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.roomCountTexts.set(room.id, countText);

      card.on('pointerover', () => card.setFillStyle(room.color, 1));
      card.on('pointerout', () => card.setFillStyle(room.color, 0.8));
      card.on('pointerdown', () => {
        this.scene.start('RoomScene', { roomId: room.id, roomName: room.name });
      });
    });

    // Connect to socket and listen for room stats
    this.socket = SocketManager.getInstance();
    try {
      this.socket.connect();
      this.socket.on('room-stats', (stats: Record<string, number>) => {
        this.updateRoomCounts(stats);
      });
    } catch (err) {
      console.warn('[LobbyScene] Socket connection failed:', err);
    }

    this.events.once('shutdown', () => {
      this.socket?.off('room-stats');
    });
  }

  private updateRoomCounts(stats: Record<string, number>): void {
    ROOMS.forEach((room) => {
      const count = stats[room.id] || 0;
      const text = this.roomCountTexts.get(room.id);
      if (text) {
        text.setText(`${count}/${MAX_PLAYERS} online`);
        // Color based on occupancy
        if (count === 0) {
          text.setColor('#888888');
        } else if (count >= MAX_PLAYERS * 0.7) {
          text.setColor('#e63946'); // Almost full - red
        } else {
          text.setColor('#2dc653'); // Available - green
        }
      }
    });
  }
}
