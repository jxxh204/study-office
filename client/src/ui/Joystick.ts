import Phaser from 'phaser';

const RADIUS = 60;
const THUMB_RADIUS = 25;

export class Joystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Image;
  private thumb: Phaser.GameObjects.Image;
  private dragging = false;
  private _dx = 0;
  private _dy = 0;
  private pointerId: number | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    const cx = 90;
    const cy = height - 110;

    this.base = scene.add.image(cx, cy, 'joy-base')
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0.6);

    this.thumb = scene.add.image(cx, cy, 'joy-thumb')
      .setScrollFactor(0)
      .setDepth(201)
      .setAlpha(0.8);

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < width / 2 && pointer.y > height * 0.5) {
        this.dragging = true;
        this.pointerId = pointer.id;
        this.updateThumb(pointer);
      }
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging && pointer.id === this.pointerId) {
        this.updateThumb(pointer);
      }
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.pointerId) {
        this.dragging = false;
        this.pointerId = null;
        this._dx = 0;
        this._dy = 0;
        this.thumb.setPosition(this.base.x, this.base.y);
      }
    });
  }

  private updateThumb(pointer: Phaser.Input.Pointer): void {
    const bx = this.base.x;
    const by = this.base.y;
    let dx = pointer.x - bx;
    let dy = pointer.y - by;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }

    this.thumb.setPosition(bx + dx, by + dy);
    this._dx = dx / RADIUS;
    this._dy = dy / RADIUS;
  }

  getDirection(): { dx: number; dy: number } {
    return { dx: this._dx, dy: this._dy };
  }

  destroy(): void {
    this.base.destroy();
    this.thumb.destroy();
  }
}
