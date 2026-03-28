import Phaser from 'phaser';
import { WebRTCManager, MicState } from '../network/WebRTCManager';

export class MicButton {
  private scene: Phaser.Scene;
  private button: Phaser.GameObjects.Image;
  private webrtc: WebRTCManager | null = null;
  private muted = true;
  private messageText: Phaser.GameObjects.Text | null = null;
  private hasRequestedPermission = false;

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

  private showMessage(text: string, color: string = '#ff6b6b', durationMs: number = 3000): void {
    // Remove existing message
    if (this.messageText) {
      this.messageText.destroy();
    }

    const { width, height } = this.scene.scale;
    this.messageText = this.scene.add.text(width / 2, height - 140, text, {
      fontSize: '14px',
      color: color,
      backgroundColor: '#1a1a2e',
      padding: { x: 12, y: 8 },
      fontFamily: 'Arial',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(250);

    // Auto-dismiss after duration
    this.scene.time.delayedCall(durationMs, () => {
      if (this.messageText) {
        this.messageText.destroy();
        this.messageText = null;
      }
    });
  }

  private setButtonState(state: 'active' | 'muted' | 'denied' | 'loading'): void {
    switch (state) {
      case 'active':
        this.button.setTexture('mic-on');
        this.button.setTint(0x00ff00); // Green
        this.button.clearTint();
        break;
      case 'muted':
        this.button.setTexture('mic-off');
        this.button.setTint(0xff6b6b); // Red
        break;
      case 'denied':
        this.button.setTexture('mic-off');
        this.button.setTint(0x888888); // Gray
        break;
      case 'loading':
        this.button.setTexture('mic-off');
        this.button.setTint(0xffff00); // Yellow
        // Add pulse effect
        this.scene.tweens.add({
          targets: this.button,
          alpha: 0.5,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
        break;
    }
  }

  private async toggle(): Promise<void> {
    // Lazy-bind to the scene's webrtc manager
    if (!this.webrtc) {
      const roomScene = this.scene as any;
      if (roomScene.webrtc) {
        this.webrtc = roomScene.webrtc;
      }
    }

    if (!this.webrtc) {
      this.showMessage('음성 기능을 사용할 수 없습니다', '#ff6b6b');
      return;
    }

    // Show permission explanation before first request
    if (!this.hasRequestedPermission && this.webrtc.micState === 'prompt') {
      this.showMessage('마이크 권한이 필요합니다. 허용해 주세요.', '#00b4d8', 2000);
      this.hasRequestedPermission = true;
    }

    try {
      // Show loading state
      this.setButtonState('loading');

      // Ensure mic is acquired on first toggle
      if (!this.muted || this.webrtc.micState === 'prompt') {
        await this.webrtc.acquireMic();
      }

      // Stop loading animation
      this.scene.tweens.killTweensOf(this.button);
      this.button.setAlpha(1);

      // Toggle mute
      this.muted = this.webrtc.toggleMute();
      this.setButtonState(this.muted ? 'muted' : 'active');

    } catch (error) {
      // Stop loading animation
      this.scene.tweens.killTweensOf(this.button);
      this.button.setAlpha(1);

      const micState = this.webrtc.micState;

      if (micState === 'denied') {
        this.setButtonState('denied');
        this.showMessage(
          '마이크 권한이 필요합니다\n설정에서 마이크 권한을 허용해 주세요',
          '#ff6b6b',
          5000
        );
      } else if (micState === 'no-device') {
        this.setButtonState('denied');
        this.showMessage(
          '마이크를 찾을 수 없습니다\n마이크가 연결되어 있는지 확인해 주세요',
          '#ff6b6b',
          5000
        );
      } else {
        this.setButtonState('denied');
        this.showMessage(
          '마이크 접근 실패\n' + (error instanceof Error ? error.message : '알 수 없는 오류'),
          '#ff6b6b',
          4000
        );
      }

      console.error('[MicButton] Failed to acquire mic:', error);
    }
  }

  destroy(): void {
    if (this.messageText) {
      this.messageText.destroy();
    }
    this.scene.tweens.killTweensOf(this.button);
    this.button.destroy();
  }
}
