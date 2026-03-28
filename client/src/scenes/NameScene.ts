import Phaser from 'phaser';

export class NameScene extends Phaser.Scene {
  private inputElement!: HTMLInputElement;
  private errorText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'NameScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x16213e);

    // Title
    this.add
      .text(width / 2, height / 3 - 40, 'Study Office', {
        fontSize: '48px',
        color: '#f9c74f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(width / 2, height / 3 + 10, 'Enter your nickname', {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Create HTML input element
    this.createInputElement(width, height);

    // Enter button
    const button = this.add
      .rectangle(width / 2, height / 2 + 60, 200, 50, 0x4a90d9)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, height / 2 + 60, 'ENTER', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Error text (hidden initially)
    this.errorText = this.add
      .text(width / 2, height / 2 + 120, '', {
        fontSize: '16px',
        color: '#e63946',
      })
      .setOrigin(0.5);

    // Button click
    button.on('pointerdown', () => this.handleSubmit());

    // Enter key
    this.input.keyboard?.on('keydown-ENTER', () => this.handleSubmit());

    // Focus input
    setTimeout(() => this.inputElement?.focus(), 100);
  }

  private createInputElement(width: number, height: number): void {
    // Create HTML input element
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.placeholder = 'Your nickname...';
    this.inputElement.maxLength = 12;
    this.inputElement.style.cssText = `
      position: absolute;
      left: ${width / 2 - 150}px;
      top: ${height / 2}px;
      width: 300px;
      height: 40px;
      font-size: 18px;
      padding: 8px 12px;
      border: 2px solid #4a90d9;
      border-radius: 8px;
      background: #1a1a2e;
      color: #ffffff;
      text-align: center;
      outline: none;
      transition: border-color 0.3s;
    `;

    // Focus effect
    this.inputElement.addEventListener('focus', () => {
      this.inputElement.style.borderColor = '#f9c74f';
    });

    this.inputElement.addEventListener('blur', () => {
      this.inputElement.style.borderColor = '#4a90d9';
    });

    // Append to DOM
    document.body.appendChild(this.inputElement);

    // Store reference for cleanup
    this.events.once('shutdown', () => {
      this.inputElement?.remove();
    });
  }

  private handleSubmit(): void {
    const nickname = this.inputElement?.value.trim();

    if (!nickname) {
      this.showError('Please enter a nickname');
      return;
    }

    if (nickname.length < 2) {
      this.showError('Nickname must be at least 2 characters');
      return;
    }

    // Store nickname
    localStorage.setItem('playerNickname', nickname);

    // Clean up input
    this.inputElement?.remove();

    // Go to lobby
    this.scene.start('LobbyScene');
  }

  private showError(message: string): void {
    this.errorText.setText(message);
    this.time.delayedCall(3000, () => {
      this.errorText.setText('');
    });
  }
}
