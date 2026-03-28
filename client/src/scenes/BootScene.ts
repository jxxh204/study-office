import Phaser from 'phaser';

const FRAME_W = 32;
const FRAME_H = 48;
const COLS = 4;
const ROWS = 4;

// Directions: 0=down, 1=left, 2=right, 3=up
type Dir = 0 | 1 | 2 | 3;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.generateCharacterSheet('player', 0x4a90d9);   // blue shirt
    this.generateCharacterSheet('remote-player', 0xe63946); // red shirt

    // Floor tile
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
    // Create animations for both player types
    this.createAnimations('player');
    this.createAnimations('remote-player');
    this.scene.start('LobbyScene');
  }

  /** Draw a single character frame */
  private drawCharFrame(g: Phaser.GameObjects.Graphics, ox: number, oy: number, dir: Dir, frame: number, shirtColor: number): void {
    const cx = ox + FRAME_W / 2; // center x

    // --- Hair (top of head) ---
    g.fillStyle(0x333333, 1);
    if (dir === 3) {
      // facing up: hair covers entire head top
      g.fillEllipse(cx, oy + 10, 18, 14);
    } else {
      g.fillEllipse(cx, oy + 7, 18, 10);
    }

    // --- Head ---
    g.fillStyle(0xffdbac, 1);
    g.fillEllipse(cx, oy + 12, 16, 14);

    // --- Eyes ---
    if (dir !== 3) { // no eyes when facing up
      g.fillStyle(0x333333, 1);
      if (dir === 0) { // down — centered eyes
        g.fillRect(cx - 4, oy + 12, 2, 3);
        g.fillRect(cx + 2, oy + 12, 2, 3);
      } else if (dir === 1) { // left
        g.fillRect(cx - 5, oy + 12, 2, 3);
        g.fillRect(cx - 1, oy + 12, 2, 3);
      } else { // right
        g.fillRect(cx + 1, oy + 12, 2, 3);
        g.fillRect(cx + 4, oy + 12, 2, 3);
      }
    }

    // --- Body / shirt ---
    g.fillStyle(shirtColor, 1);
    g.fillRect(cx - 7, oy + 20, 14, 14);

    // --- Arms ---
    const armSwing = (frame % 2 === 0) ? 0 : (frame === 1 ? 2 : -2);
    g.fillStyle(shirtColor, 1);
    g.fillRect(cx - 10, oy + 20 + armSwing, 3, 10);
    g.fillRect(cx + 7, oy + 20 - armSwing, 3, 10);

    // --- Hands ---
    g.fillStyle(0xffdbac, 1);
    g.fillRect(cx - 10, oy + 29 + armSwing, 3, 3);
    g.fillRect(cx + 7, oy + 29 - armSwing, 3, 3);

    // --- Legs ---
    g.fillStyle(0x2c3e6b, 1);
    const legOffset = [0, 3, 0, -3][frame]; // walking cycle
    g.fillRect(cx - 5, oy + 34, 4, 12);
    g.fillRect(cx + 1, oy + 34, 4, 12);

    // Leg movement based on frame
    if (frame === 1 || frame === 3) {
      // Shift legs to simulate walking
      if (dir === 0 || dir === 3) {
        // vertical walk: legs shift horizontally
        g.fillStyle(0x16213e, 1); // clear with bg color hack — just overdraw offset
        g.fillStyle(0x2c3e6b, 1);
        g.fillRect(cx - 5 + legOffset, oy + 34, 4, 12);
        g.fillRect(cx + 1 - legOffset, oy + 34, 4, 12);
      } else {
        // horizontal walk: legs shift vertically
        g.fillStyle(0x2c3e6b, 1);
        g.fillRect(cx - 5, oy + 34 + Math.abs(legOffset), 4, 12 - Math.abs(legOffset));
        g.fillRect(cx + 1, oy + 34 - legOffset + 2, 4, 12);
      }
    }

    // --- Shoes ---
    g.fillStyle(0x1a1a2e, 1);
    const shoeY = oy + 44;
    g.fillRect(cx - 6, shoeY, 5, 3);
    g.fillRect(cx + 1, shoeY, 5, 3);
  }

  /** Generate a full spritesheet texture for a character */
  private generateCharacterSheet(key: string, shirtColor: number): void {
    const sheetW = COLS * FRAME_W;
    const sheetH = ROWS * FRAME_H;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const ox = col * FRAME_W;
        const oy = row * FRAME_H;
        this.drawCharFrame(g, ox, oy, row as Dir, col, shirtColor);
      }
    }

    g.generateTexture(key, sheetW, sheetH);
    g.destroy();

    // Add spritesheet frames to texture manager
    const tex = this.textures.get(key);
    tex.add(0, 0, 0, 0, sheetW, sheetH); // full frame (already exists as frame 0)

    // Add individual frames: frame index = row * COLS + col
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        // Frame indices 1..16 (0 is the full sheet)
        tex.add(idx + 1, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
      }
    }
  }

  /** Create walk and idle animations for a character key */
  private createAnimations(key: string): void {
    const dirs = ['down', 'left', 'right', 'up'];

    dirs.forEach((dir, row) => {
      const startFrame = row * COLS + 1; // +1 because frame 0 is full sheet

      // Walk animation (4 frames)
      this.anims.create({
        key: `${key}-walk-${dir}`,
        frames: [
          { key, frame: startFrame },
          { key, frame: startFrame + 1 },
          { key, frame: startFrame + 2 },
          { key, frame: startFrame + 3 },
        ],
        frameRate: 8,
        repeat: -1,
      });

      // Idle animation (single frame — first frame of that direction)
      this.anims.create({
        key: `${key}-idle-${dir}`,
        frames: [{ key, frame: startFrame }],
        frameRate: 1,
        repeat: 0,
      });
    });
  }
}
