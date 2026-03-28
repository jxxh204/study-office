import Phaser from 'phaser';
import { WebRTCManager } from '../network/WebRTCManager';

export class MicButton {
  private scene: Phaser.Scene;
  private button: Phaser.GameObjects.Image;
  private webrtc: WebRTCManager | null = null;
  private muted = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.button = scene.add.image(width - 50, height - 90, 'mic-off')
      .setScrollFactor(0)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });

    this.button.on('pointerdown', () => this.toggle());
  }

  setWebRTC(webrtc: WebRTCManager): void {
    this.webrtc = webrtc;
  }

  private async toggle(): Promise<void> {
    // Lazy-bind to the scene's webrtc manager
    if (!this.webrtc) {
      const roomScene = this.scene as any;
      if (roomScene.webrtc) {
        this.webrtc = roomScene.webrtc;
      }
    }

    if (this.webrtc) {
      // Ensure mic is acquired on first toggle
      if (!this.webrtc.muted && this.muted) {
        await this.webrtc.acquireMic();
      }
      this.muted = this.webrtc.toggleMute();
    } else {
      this.muted = !this.muted;
    }

    this.button.setTexture(this.muted ? 'mic-off' : 'mic-on');
  }

  destroy(): void {
    this.button.destroy();
  }
}
