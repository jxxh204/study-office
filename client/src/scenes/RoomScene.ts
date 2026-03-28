import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager';
import { WebRTCManager } from '../network/WebRTCManager';
import { Joystick } from '../ui/Joystick';
import { MicButton } from '../ui/MicButton';

const SPEED = 160;
const ROOM_W = 800;
const ROOM_H = 800;

interface PlayerData {
  x: number;
  y: number;
  dir?: string;
}

type Direction = 'down' | 'left' | 'right' | 'up';

export class RoomScene extends Phaser.Scene {
  private roomId!: string;
  private roomName!: string;
  private player!: Phaser.GameObjects.Sprite;
  private playerDir: Direction = 'down';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private remotePlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private remoteLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private remoteDirs: Map<string, Direction> = new Map();
  private socket!: SocketManager;
  private webrtc!: WebRTCManager;
  private joystick!: Joystick;
  private micButton!: MicButton;
  private lastSentX = 0;
  private lastSentY = 0;
  private lastSentDir: Direction = 'down';
  private nameLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'RoomScene' });
  }

  init(data: { roomId: string; roomName: string }): void {
    this.roomId = data.roomId;
    this.roomName = data.roomName;
  }

  create(): void {
    // Floor tiling
    for (let x = 0; x < ROOM_W; x += 32) {
      for (let y = 0; y < ROOM_H; y += 32) {
        this.add.image(x + 16, y + 16, 'floor');
      }
    }

    // Room boundary
    this.add.rectangle(ROOM_W / 2, ROOM_H / 2, ROOM_W, ROOM_H)
      .setStrokeStyle(3, 0x0f3460, 1)
      .setFillStyle(0x000000, 0);

    // Player sprite
    this.player = this.add.sprite(ROOM_W / 2, ROOM_H / 2, 'player', 1);
    this.player.play('player-idle-down');

    // Get player nickname
    const nickname = localStorage.getItem('playerNickname') || 'Player';
    this.nameLabel = this.add.text(ROOM_W / 2, ROOM_H / 2 - 32, nickname, {
      fontSize: '12px', color: '#00b4d8', fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Camera
    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // UI
    this.joystick = new Joystick(this);
    this.micButton = new MicButton(this);

    // Room title
    this.add.text(this.scale.width / 2, 16, this.roomName, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // Back button
    const backBtn = this.add.text(16, 16, '← Leave', {
      fontSize: '16px', color: '#e63946', fontFamily: 'Arial',
      backgroundColor: '#1a1a2e', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.leaveRoom());

    // Network
    this.socket = SocketManager.getInstance();
    try {
      this.socket.connect();
      this.setupSocketListeners();
      const nickname = localStorage.getItem('playerNickname') || 'Player';
      this.socket.joinRoom(this.roomId, nickname);
      this.webrtc = new WebRTCManager(this.socket);
    } catch (err) {
      console.warn('[RoomScene] Network init failed, running offline:', err);
    }

    this.events.on('shutdown', () => this.cleanup());
  }

  private setupSocketListeners(): void {
    this.socket.on('player-join', (data: { socketId: string }) => {
      this.addRemotePlayer(data.socketId);
      this.webrtc.createOffer(data.socketId);
    });

    this.socket.on('player-leave', (data: { socketId: string }) => {
      this.removeRemotePlayer(data.socketId);
      this.webrtc.closePeer(data.socketId);
    });

    this.socket.on('player-move', (data: { socketId: string; x: number; y: number; dir?: string }) => {
      this.updateRemotePlayer(data.socketId, data.x, data.y, (data.dir as Direction) || 'down');
    });

    this.socket.on('room-state', (data: { players: Record<string, PlayerData> }) => {
      Object.entries(data.players).forEach(([id, pos]) => {
        if (id !== this.socket.getSocketId()) {
          this.addRemotePlayer(id, pos.x, pos.y);
        }
      });
    });

    this.socket.on('webrtc-offer', async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      await this.webrtc.handleOffer(data.from, data.offer);
    });

    this.socket.on('webrtc-answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      await this.webrtc.handleAnswer(data.from, data.answer);
    });

    this.socket.on('webrtc-ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      await this.webrtc.handleIceCandidate(data.from, data.candidate);
    });
  }

  private addRemotePlayer(id: string, x = ROOM_W / 2, y = ROOM_H / 2): void {
    if (this.remotePlayers.has(id)) return;
    const sprite = this.add.sprite(x, y, 'remote-player', 1);
    sprite.play('remote-player-idle-down');
    this.remotePlayers.set(id, sprite);
    this.remoteDirs.set(id, 'down');

    const label = this.add.text(x, y - 32, id.slice(0, 6), {
      fontSize: '11px', color: '#e63946', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.remoteLabels.set(id, label);
  }

  private removeRemotePlayer(id: string): void {
    this.remotePlayers.get(id)?.destroy();
    this.remotePlayers.delete(id);
    this.remoteLabels.get(id)?.destroy();
    this.remoteLabels.delete(id);
    this.remoteDirs.delete(id);
  }

  private updateRemotePlayer(id: string, x: number, y: number, dir: Direction): void {
    if (!this.remotePlayers.has(id)) this.addRemotePlayer(id, x, y);
    const sprite = this.remotePlayers.get(id)!;
    const prevX = sprite.x;
    const prevY = sprite.y;
    sprite.x = x;
    sprite.y = y;

    const oldDir = this.remoteDirs.get(id) || 'down';
    const isMoving = (x !== prevX || y !== prevY);

    if (isMoving) {
      const animKey = `remote-player-walk-${dir}`;
      if (sprite.anims.currentAnim?.key !== animKey) {
        sprite.play(animKey);
      }
    } else {
      const idleKey = `remote-player-idle-${dir}`;
      if (sprite.anims.currentAnim?.key !== idleKey) {
        sprite.play(idleKey);
      }
    }
    this.remoteDirs.set(id, dir);

    const label = this.remoteLabels.get(id);
    if (label) { label.x = x; label.y = y - 32; }
  }

  private getDirection(dx: number, dy: number): Direction {
    // Pick dominant axis
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx < 0 ? 'left' : 'right';
    }
    return dy < 0 ? 'up' : 'down';
  }

  update(_time: number, delta: number): void {
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;

    const joy = this.joystick.getDirection();
    if (Math.abs(joy.dx) > 0.1 || Math.abs(joy.dy) > 0.1) {
      dx = joy.dx;
      dy = joy.dy;
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx = dx / len;
      dy = dy / len;
    }

    const dt = delta / 1000;
    this.player.x = Phaser.Math.Clamp(this.player.x + dx * SPEED * dt, 20, ROOM_W - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y + dy * SPEED * dt, 20, ROOM_H - 20);
    this.nameLabel.x = this.player.x;
    this.nameLabel.y = this.player.y - 32;

    // Animation
    const isMoving = len > 0;
    if (isMoving) {
      this.playerDir = this.getDirection(dx, dy);
      const walkKey = `player-walk-${this.playerDir}`;
      if (this.player.anims.currentAnim?.key !== walkKey) {
        this.player.play(walkKey);
      }
    } else {
      const idleKey = `player-idle-${this.playerDir}`;
      if (this.player.anims.currentAnim?.key !== idleKey) {
        this.player.play(idleKey);
      }
    }

    // Send position
    const px = Math.round(this.player.x);
    const py = Math.round(this.player.y);
    if (px !== this.lastSentX || py !== this.lastSentY || this.playerDir !== this.lastSentDir) {
      this.lastSentX = px;
      this.lastSentY = py;
      this.lastSentDir = this.playerDir;
      if (this.socket.isConnected()) this.socket.sendMove(px, py);
    }
  }

  private leaveRoom(): void {
    this.socket.leaveRoom(this.roomId);
    this.scene.start('LobbyScene');
  }

  private cleanup(): void {
    this.remotePlayers.forEach((s) => s.destroy());
    this.remotePlayers.clear();
    this.remoteLabels.forEach((l) => l.destroy());
    this.remoteLabels.clear();
    this.remoteDirs.clear();
    this.joystick.destroy();
    this.micButton.destroy();
    this.webrtc?.closeAll();
    this.socket?.removeAllListeners();
  }
}
