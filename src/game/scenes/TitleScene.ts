import Phaser from 'phaser';
import { PixelSpriteGenerator } from '../sprites/PixelSprites';
import { i18n } from '../i18n/Localization';
import { ScoreManager } from '../score/ScoreManager';
import { KeyBindingManager } from '../settings/KeyBindingManager';
import { ThemeManager } from '../settings/ThemeManager';

export class TitleScene extends Phaser.Scene {
  private showInsertCoin: boolean = true;
  private coinInserted: boolean = false;

  // 다국어 텍스트 참조
  private scoreTableText!: Phaser.GameObjects.Text;
  private mysteryText!: Phaser.GameObjects.Text;
  private squidPointsText!: Phaser.GameObjects.Text;
  private crabPointsText!: Phaser.GameObjects.Text;
  private octopusPointsText!: Phaser.GameObjects.Text;
  private insertCoinText!: Phaser.GameObjects.Text;

  // 컨트롤 안내 텍스트
  private controlMoveText!: Phaser.GameObjects.Text;
  private controlFireText!: Phaser.GameObjects.Text;
  private controlCoinText!: Phaser.GameObjects.Text;

  // 점수 표시 텍스트
  private recentScoreLabel!: Phaser.GameObjects.Text;
  private recentScoreValue!: Phaser.GameObjects.Text;
  private topScoresLabel!: Phaser.GameObjects.Text;
  private topScoreTexts: Phaser.GameObjects.Text[] = [];

  // 언어 변경 리스너
  private languageChangeHandler!: () => void;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    // 상태 초기화
    this.coinInserted = false;
    this.showInsertCoin = true;
    this.topScoreTexts = [];

    // 테마 가져오기
    const theme = ThemeManager.getTheme();

    // 배경색
    this.cameras.main.setBackgroundColor(theme.background);

    // 스프라이트 생성
    PixelSpriteGenerator.generateAllSprites(this);

    // 컨트롤 안내 (상단 중앙)
    const leftKey = KeyBindingManager.getDisplayName('moveLeft');
    const rightKey = KeyBindingManager.getDisplayName('moveRight');
    const fireKey = KeyBindingManager.getDisplayName('fire');

    this.controlMoveText = this.add.text(400, 100, `${leftKey} ${rightKey} : ${i18n.get('move')}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: theme.textHighlight
    });
    this.controlMoveText.setOrigin(0.5);

    this.controlFireText = this.add.text(400, 130, `${fireKey} : ${i18n.get('fire')}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: theme.textHighlight
    });
    this.controlFireText.setOrigin(0.5);

    this.controlCoinText = this.add.text(400, 160, `${KeyBindingManager.getDisplayName('insertCoin')} : ${i18n.get('insertCoinKey')}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: theme.textWarning
    });
    this.controlCoinText.setOrigin(0.5);

    // 키 설정 안내
    this.add.text(400, 550, 'K : KEY SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: theme.textSecondary
    }).setOrigin(0.5);

    // ===== 왼쪽: 점수표 =====
    const leftX = 200;

    this.scoreTableText = this.add.text(leftX, 220, i18n.get('scoreAdvanceTable'), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: theme.textPrimary
    });
    this.scoreTableText.setOrigin(0.5);

    // UFO = ? MYSTERY
    this.add.sprite(leftX - 50, 260, 'ufo');
    this.mysteryText = this.add.text(leftX + 10, 255, i18n.get('mystery'), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: theme.textPrimary
    });

    // Squid = 30 POINTS
    this.add.sprite(leftX - 50, 295, 'squid1');
    this.squidPointsText = this.add.text(leftX + 10, 290, i18n.getPointsText(30), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: theme.textPrimary
    });

    // Crab = 20 POINTS
    this.add.sprite(leftX - 50, 330, 'crab1');
    this.crabPointsText = this.add.text(leftX + 10, 325, i18n.getPointsText(20), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: theme.textPrimary
    });

    // Octopus = 10 POINTS
    this.add.sprite(leftX - 50, 365, 'octopus1');
    this.octopusPointsText = this.add.text(leftX + 10, 360, i18n.getPointsText(10), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: theme.textScore
    });

    // ===== 오른쪽: 최근 점수 & TOP 5 =====
    const rightX = 600;

    console.log('[TitleScene] Loading scores. Recent:', ScoreManager.getRecentScore(), 'Top:', ScoreManager.getTopScores());

    // 최근 점수
    this.recentScoreLabel = this.add.text(rightX, 220, i18n.get('recentScore'), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: theme.textWarning
    });
    this.recentScoreLabel.setOrigin(0.5);

    this.recentScoreValue = this.add.text(rightX, 250, this.formatScore(ScoreManager.getRecentScore()), {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: theme.textPrimary
    });
    this.recentScoreValue.setOrigin(0.5);

    // TOP 5
    this.topScoresLabel = this.add.text(rightX, 300, i18n.get('topScores'), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: theme.textScore
    });
    this.topScoresLabel.setOrigin(0.5);

    const topScores = ScoreManager.getTopScores();
    for (let i = 0; i < 5; i++) {
      const score = topScores[i] || 0;
      const text = this.add.text(rightX, 330 + i * 25, `${i + 1}. ${this.formatScore(score)}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: i === 0 ? theme.textHighlight : theme.textPrimary // 1등은 하이라이트
      });
      text.setOrigin(0.5);
      this.topScoreTexts.push(text);
    }

    // INSERT COIN (깜빡임)
    this.insertCoinText = this.add.text(400, 500, i18n.get('insertCoin'), {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: theme.textPrimary
    });
    this.insertCoinText.setOrigin(0.5);

    // 키 입력 대기
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      const coinKey = KeyBindingManager.getBinding('insertCoin');
      const fireKey = KeyBindingManager.getBinding('fire');

      // 코인 투입 키
      if (this.matchKey(event, coinKey) && !this.coinInserted) {
        this.coinInserted = true;
        const fireKeyDisplay = KeyBindingManager.getDisplayName('fire');
        this.insertCoinText.setText(`PRESS ${fireKeyDisplay} TO START`);
      }

      // 발사 키 (게임 시작)
      if (this.matchKey(event, fireKey) && this.coinInserted) {
        this.scene.start('GameScene');
      }

      // K 키: 설정 화면
      if (event.code === 'KeyK') {
        this.scene.start('SettingsScene');
      }
    });

    // 깜빡임 효과
    this.time.addEvent({
      delay: 500,
      callback: () => {
        this.showInsertCoin = !this.showInsertCoin;
        this.insertCoinText.setVisible(this.showInsertCoin);
      },
      loop: true
    });

    // 외부 언어 변경 리스너 등록
    this.languageChangeHandler = () => {
      this.updateTexts();
    };
    i18n.onLanguageChange(this.languageChangeHandler);
  }

  shutdown() {
    // 씬 종료 시 리스너 제거
    if (this.languageChangeHandler) {
      i18n.removeListener(this.languageChangeHandler);
    }
  }

  private formatScore(score: number): string {
    return score.toString().padStart(5, '0');
  }

  private matchKey(event: KeyboardEvent, phaserKey: string): boolean {
    const keyMap: { [key: string]: string[] } = {
      'LEFT': ['ArrowLeft'],
      'RIGHT': ['ArrowRight'],
      'UP': ['ArrowUp'],
      'DOWN': ['ArrowDown'],
      'SPACE': ['Space'],
      'ENTER': ['Enter'],
      'SHIFT': ['ShiftLeft', 'ShiftRight'],
      'CTRL': ['ControlLeft', 'ControlRight'],
      'ALT': ['AltLeft', 'AltRight'],
      'ESC': ['Escape'],
      'TAB': ['Tab'],
      'BACKSPACE': ['Backspace']
    };

    if (keyMap[phaserKey]) {
      return keyMap[phaserKey].includes(event.code);
    }

    // 알파벳 키
    if (phaserKey.length === 1 && /[A-Z]/.test(phaserKey)) {
      return event.code === `Key${phaserKey}`;
    }

    // 숫자 키
    const numNames = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const numIndex = numNames.indexOf(phaserKey);
    if (numIndex !== -1) {
      return event.code === `Digit${numIndex}`;
    }

    return false;
  }

  private updateTexts(): void {
    // 씬이나 텍스트 객체가 없으면 무시
    if (!this.scene || !this.scoreTableText || !this.scoreTableText.active) return;

    this.scoreTableText.setText(i18n.get('scoreAdvanceTable'));
    this.mysteryText.setText(i18n.get('mystery'));
    this.squidPointsText.setText(i18n.getPointsText(30));
    this.crabPointsText.setText(i18n.getPointsText(20));
    this.octopusPointsText.setText(i18n.getPointsText(10));

    // 커스텀 키 이름 사용
    const fireKeyDisplay = KeyBindingManager.getDisplayName('fire');
    const leftKeyDisplay = KeyBindingManager.getDisplayName('moveLeft');
    const rightKeyDisplay = KeyBindingManager.getDisplayName('moveRight');
    const coinKeyDisplay = KeyBindingManager.getDisplayName('insertCoin');

    if (this.coinInserted) {
      this.insertCoinText.setText(`PRESS ${fireKeyDisplay} TO START`);
    } else {
      this.insertCoinText.setText(i18n.get('insertCoin'));
    }

    // 컨트롤 안내 업데이트
    this.controlMoveText.setText(`${leftKeyDisplay} ${rightKeyDisplay} : ${i18n.get('move')}`);
    this.controlFireText.setText(`${fireKeyDisplay} : ${i18n.get('fire')}`);
    this.controlCoinText.setText(`${coinKeyDisplay} : ${i18n.get('insertCoinKey')}`);

    // 점수 라벨 업데이트
    this.recentScoreLabel.setText(i18n.get('recentScore'));
    this.topScoresLabel.setText(i18n.get('topScores'));
  }
}
