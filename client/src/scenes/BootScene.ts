import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Generate placeholder textures as colored rectangles/circles
    const playerGfx = this.make.graphics({ x: 0, y: 0 }, false);
    playerGfx.fillStyle(0x00b4d8, 1);
    playerGfx.fillCircle(20, 20, 20);
    playerGfx.generateTexture('player', 40, 40);
    playerGfx.destroy();

    const remoteGfx = this.make.graphics({ x: 0, y: 0 }, false);
    remoteGfx.fillStyle(0xe63946, 1);
    remoteGfx.fillCircle(20, 20, 20);
    remoteGfx.generateTexture('remote-player', 40, 40);
    remoteGfx.destroy();

    const floorGfx = this.make.graphics({ x: 0, y: 0 }, false);
    floorGfx.fillStyle(0x16213e, 1);
    floorGfx.fillRect(0, 0, 32, 32);
    floorGfx.lineStyle(1, 0x0f3460, 0.3);
    floorGfx.strokeRect(0, 0, 32, 32);
    floorGfx.generateTexture('floor', 32, 32);
    floorGfx.destroy();

    // Mic icons
    const micOnGfx = this.make.graphics({ x: 0, y: 0 }, false);
    micOnGfx.fillStyle(0x2dc653, 1);
    micOnGfx.fillRoundedRect(0, 0, 56, 56, 28);
    micOnGfx.fillStyle(0xffffff, 1);
    micOnGfx.fillRect(22, 12, 12, 20);
    micOnGfx.fillRoundedRect(18, 12, 20, 24, 10);
    micOnGfx.generateTexture('mic-on', 56, 56);
    micOnGfx.destroy();

    const micOffGfx = this.make.graphics({ x: 0, y: 0 }, false);
    micOffGfx.fillStyle(0xe63946, 1);
    micOffGfx.fillRoundedRect(0, 0, 56, 56, 28);
    micOffGfx.fillStyle(0xffffff, 1);
    micOffGfx.fillRect(22, 12, 12, 20);
    micOffGfx.fillRoundedRect(18, 12, 20, 24, 10);
    micOffGfx.lineStyle(3, 0xffffff, 1);
    micOffGfx.lineBetween(12, 44, 44, 12);
    micOffGfx.generateTexture('mic-off', 56, 56);
    micOffGfx.destroy();

    // Joystick textures
    const joyBaseGfx = this.make.graphics({ x: 0, y: 0 }, false);
    joyBaseGfx.fillStyle(0xffffff, 0.15);
    joyBaseGfx.fillCircle(60, 60, 60);
    joyBaseGfx.generateTexture('joy-base', 120, 120);
    joyBaseGfx.destroy();

    const joyThumbGfx = this.make.graphics({ x: 0, y: 0 }, false);
    joyThumbGfx.fillStyle(0xffffff, 0.5);
    joyThumbGfx.fillCircle(25, 25, 25);
    joyThumbGfx.generateTexture('joy-thumb', 50, 50);
    joyThumbGfx.destroy();
  }

  create(): void {
    this.scene.start('LobbyScene');
  }
}
