import Phaser from 'phaser';

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

export class LobbyScene extends Phaser.Scene {
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

      this.add.text(x, y, room.name, {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: 'Arial',
      }).setOrigin(0.5);

      card.on('pointerover', () => card.setFillStyle(room.color, 1));
      card.on('pointerout', () => card.setFillStyle(room.color, 0.8));
      card.on('pointerdown', () => {
        this.scene.start('RoomScene', { roomId: room.id, roomName: room.name });
      });
    });
  }
}
