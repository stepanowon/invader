import Phaser from 'phaser';
import { KeyBindingManager, browserKeyToPhaserKey } from '../settings/KeyBindingManager';
import { ThemeManager } from '../settings/ThemeManager';
import type { KeyBindings } from '../settings/KeyBindingManager';

interface SettingRow {
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  type: 'key' | 'theme' | 'reset';
  action?: keyof KeyBindings;
}

export class SettingsScene extends Phaser.Scene {
  private rows: SettingRow[] = [];
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

    const theme = ThemeManager.getTheme();

    // 배경색
    this.cameras.main.setBackgroundColor(theme.background);

    // 제목
    this.titleText = this.add.text(400, 40, 'SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: theme.textHighlight
    });
    this.titleText.setOrigin(0.5);

    const startY = 100;
    const rowHeight = 40;
    let currentY = startY;

    // === 키 바인딩 섹션 ===
    this.add.text(400, currentY, '[ KEY BINDINGS ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: theme.textSecondary
    }).setOrigin(0.5);
    currentY += 35;

    const keyActions: { action: keyof KeyBindings; label: string }[] = [
      { action: 'moveLeft', label: 'MOVE LEFT' },
      { action: 'moveRight', label: 'MOVE RIGHT' },
      { action: 'fire', label: 'FIRE' },
      { action: 'insertCoin', label: 'INSERT COIN' }
    ];

    keyActions.forEach((item) => {
      const label = this.add.text(180, currentY, item.label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: theme.textPrimary
      });

      const keyName = KeyBindingManager.getDisplayName(item.action);
      const value = this.add.text(520, currentY, `[ ${keyName} ]`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: theme.textScore
      });

      this.rows.push({ label, value, type: 'key', action: item.action });
      currentY += rowHeight;
    });

    currentY += 20;

    // === 테마 섹션 ===
    this.add.text(400, currentY, '[ COLOR THEME ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: theme.textSecondary
    }).setOrigin(0.5);
    currentY += 35;

    const themeLabel = this.add.text(180, currentY, 'THEME', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: theme.textPrimary
    });

    const themeValue = this.add.text(520, currentY, `< ${ThemeManager.getThemeDisplayName()} >`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: theme.textStage
    });

    this.rows.push({ label: themeLabel, value: themeValue, type: 'theme' });
    currentY += rowHeight + 30;

    // === 리셋 버튼 ===
    const resetLabel = this.add.text(180, currentY, 'RESET ALL TO DEFAULTS', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: theme.textPrimary
    });
    const resetValue = this.add.text(520, currentY, '[ ENTER ]', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: theme.textWarning
    });
    this.rows.push({ label: resetLabel, value: resetValue, type: 'reset' });

    // 안내 텍스트
    this.instructionText = this.add.text(400, 520, 'UP/DOWN: Select  |  ENTER: Change  |  LEFT/RIGHT: Theme  |  ESC: Back', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: theme.textSecondary
    });
    this.instructionText.setOrigin(0.5);

    // 테마 미리보기 힌트
    this.add.text(400, 550, '* Theme changes will apply after restarting the game', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: theme.textSecondary
    }).setOrigin(0.5);

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
    const theme = ThemeManager.getTheme();

    this.rows.forEach((row, index) => {
      if (index === this.selectedIndex) {
        row.label.setColor(theme.textHighlight);
        row.value.setColor(theme.textHighlight);
      } else {
        row.label.setColor(theme.textPrimary);
        if (row.type === 'reset') {
          row.value.setColor(theme.textWarning);
        } else if (row.type === 'theme') {
          row.value.setColor(theme.textStage);
        } else {
          row.value.setColor(theme.textScore);
        }
      }
    });
  }

  private handleNavigation(event: KeyboardEvent): void {
    const currentRow = this.rows[this.selectedIndex];

    if (event.code === 'ArrowUp') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    } else if (event.code === 'ArrowDown') {
      this.selectedIndex = Math.min(this.rows.length - 1, this.selectedIndex + 1);
      this.updateSelection();
    } else if (event.code === 'ArrowLeft') {
      // 테마 변경 (이전)
      if (currentRow.type === 'theme') {
        ThemeManager.prevTheme();
        currentRow.value.setText(`< ${ThemeManager.getThemeDisplayName()} >`);
      }
    } else if (event.code === 'ArrowRight') {
      // 테마 변경 (다음)
      if (currentRow.type === 'theme') {
        ThemeManager.nextTheme();
        currentRow.value.setText(`< ${ThemeManager.getThemeDisplayName()} >`);
      }
    } else if (event.code === 'Enter') {
      if (currentRow.type === 'reset') {
        // 모든 설정 리셋
        KeyBindingManager.resetToDefaults();
        ThemeManager.setTheme('classic');
        this.scene.restart();
      } else if (currentRow.type === 'key') {
        // 키 변경 모드
        this.isWaitingForKey = true;
        currentRow.value.setText('[ PRESS KEY ]');
        currentRow.value.setColor('#FF0000');
        this.instructionText.setText('Press any key to assign  |  ESC: Cancel');
      } else if (currentRow.type === 'theme') {
        // 테마 변경 (다음)
        ThemeManager.nextTheme();
        currentRow.value.setText(`< ${ThemeManager.getThemeDisplayName()} >`);
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
      this.instructionText.setText('UP/DOWN: Select  |  ENTER: Change  |  LEFT/RIGHT: Theme  |  ESC: Back');
      return;
    }

    const phaserKey = browserKeyToPhaserKey(event);
    const currentRow = this.rows[this.selectedIndex];

    if (phaserKey && currentRow.type === 'key' && currentRow.action) {
      KeyBindingManager.setBinding(currentRow.action, phaserKey);
      this.isWaitingForKey = false;
      this.refreshKeyDisplay();
      this.instructionText.setText('UP/DOWN: Select  |  ENTER: Change  |  LEFT/RIGHT: Theme  |  ESC: Back');
    }
  }

  private refreshKeyDisplay(): void {
    this.rows.forEach((row) => {
      if (row.type === 'key' && row.action) {
        const keyName = KeyBindingManager.getDisplayName(row.action);
        row.value.setText(`[ ${keyName} ]`);
      }
    });
    this.updateSelection();
  }
}
