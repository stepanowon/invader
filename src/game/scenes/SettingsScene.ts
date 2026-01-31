import Phaser from 'phaser';
import { KeyBindingManager, browserKeyToPhaserKey } from '../settings/KeyBindingManager';
import type { KeyBindings } from '../settings/KeyBindingManager';

interface KeyBindingRow {
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  action: keyof KeyBindings;
}

export class SettingsScene extends Phaser.Scene {
  private rows: KeyBindingRow[] = [];
  private selectedIndex: number = 0;
  private isWaitingForKey: boolean = false;
  private instructionText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    this.rows = [];
    this.selectedIndex = 0;
    this.isWaitingForKey = false;

    // 배경색
    this.cameras.main.setBackgroundColor('#000000');

    // 제목
    this.titleText = this.add.text(400, 50, 'KEY SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#FFFF00'
    });
    this.titleText.setOrigin(0.5);

    // 키 바인딩 표시
    const actions: { action: keyof KeyBindings; label: string }[] = [
      { action: 'moveLeft', label: 'MOVE LEFT' },
      { action: 'moveRight', label: 'MOVE RIGHT' },
      { action: 'fire', label: 'FIRE' },
      { action: 'insertCoin', label: 'INSERT COIN' }
    ];

    const startY = 150;
    const rowHeight = 50;

    actions.forEach((item, index) => {
      const y = startY + index * rowHeight;

      const label = this.add.text(200, y, item.label, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#FFFFFF'
      });

      const keyName = KeyBindingManager.getDisplayName(item.action);
      const value = this.add.text(500, y, `[ ${keyName} ]`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#00FF00'
      });

      this.rows.push({ label, value, action: item.action });
    });

    // 리셋 버튼
    const resetY = startY + actions.length * rowHeight + 30;
    const resetLabel = this.add.text(200, resetY, 'RESET TO DEFAULTS', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#FFFFFF'
    });
    const resetValue = this.add.text(500, resetY, '[ ENTER ]', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#FF6600'
    });
    this.rows.push({ label: resetLabel, value: resetValue, action: 'moveLeft' }); // 임시 action

    // 안내 텍스트
    this.instructionText = this.add.text(400, 450, 'UP/DOWN: Select  |  ENTER: Change Key  |  ESC: Back', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888'
    });
    this.instructionText.setOrigin(0.5);

    // 선택 표시 업데이트
    this.updateSelection();

    // 키 입력 처리
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (this.isWaitingForKey) {
        this.handleKeyAssignment(event);
      } else {
        this.handleNavigation(event);
      }
    });
  }

  private updateSelection(): void {
    this.rows.forEach((row, index) => {
      if (index === this.selectedIndex) {
        row.label.setColor('#FFFF00');
        row.value.setColor('#FFFF00');
      } else {
        row.label.setColor('#FFFFFF');
        // 마지막 행(리셋)은 다른 색
        if (index === this.rows.length - 1) {
          row.value.setColor('#FF6600');
        } else {
          row.value.setColor('#00FF00');
        }
      }
    });
  }

  private handleNavigation(event: KeyboardEvent): void {
    if (event.code === 'ArrowUp') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    } else if (event.code === 'ArrowDown') {
      this.selectedIndex = Math.min(this.rows.length - 1, this.selectedIndex + 1);
      this.updateSelection();
    } else if (event.code === 'Enter') {
      if (this.selectedIndex === this.rows.length - 1) {
        // 리셋
        KeyBindingManager.resetToDefaults();
        this.refreshKeyDisplay();
      } else {
        // 키 변경 모드
        this.isWaitingForKey = true;
        this.rows[this.selectedIndex].value.setText('[ PRESS KEY ]');
        this.rows[this.selectedIndex].value.setColor('#FF0000');
        this.instructionText.setText('Press any key to assign  |  ESC: Cancel');
      }
    } else if (event.code === 'Escape') {
      this.scene.start('TitleScene');
    }
  }

  private handleKeyAssignment(event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      // 취소
      this.isWaitingForKey = false;
      this.refreshKeyDisplay();
      this.instructionText.setText('UP/DOWN: Select  |  ENTER: Change Key  |  ESC: Back');
      return;
    }

    const phaserKey = browserKeyToPhaserKey(event);
    if (phaserKey && this.selectedIndex < this.rows.length - 1) {
      const action = this.rows[this.selectedIndex].action;
      KeyBindingManager.setBinding(action, phaserKey);
      this.isWaitingForKey = false;
      this.refreshKeyDisplay();
      this.instructionText.setText('UP/DOWN: Select  |  ENTER: Change Key  |  ESC: Back');
    }
  }

  private refreshKeyDisplay(): void {
    this.rows.forEach((row, index) => {
      if (index < this.rows.length - 1) {
        const keyName = KeyBindingManager.getDisplayName(row.action);
        row.value.setText(`[ ${keyName} ]`);
      }
    });
    this.updateSelection();
  }
}
